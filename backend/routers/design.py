from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import Design
from services.image_generator import generate_dalle, generate_gemini
from services.r2 import upload_image_b64
from services.prompt_generator import generate_kittl_prompts
from services.style_analyzer import analyze_style

router = APIRouter(prefix="/design", tags=["Design"])


class GenerateRequest(BaseModel):
    niche_keyword: str
    prompt: str
    provider: str = "dalle"
    size: str = "1024x1024"


class PromptRequest(BaseModel):
    niche_keyword: str
    angle: str = ""
    style: str = "auto"
    count: int = 5


class StyleAnalysisRequest(BaseModel):
    image_b64: str          # base64-encoded image, no data URI prefix
    mime_type: str = "image/jpeg"


@router.post("/analyze-style")
def analyze_reference_style(req: StyleAnalysisRequest):
    """Analyze a reference POD image and return style tags, colors, and a replication prompt."""
    if not req.image_b64:
        raise HTTPException(status_code=400, detail="image_b64 is required")
    result = analyze_style(req.image_b64, req.mime_type)
    if not result:
        raise HTTPException(status_code=502, detail="Style analysis failed. Please try again.")
    return {"success": True, "analysis": result}


def design_to_dict(d: Design) -> dict:
    return {
        "id": d.id,
        "niche_keyword": d.niche_keyword,
        "prompt": d.prompt,
        "provider": d.provider,
        "size": d.size,
        "image_b64": d.image_b64,
        "image_url": d.image_url,
        "created_at": d.created_at.isoformat() if d.created_at else None,
    }


@router.post("/prompts")
def generate_prompts(req: PromptRequest):
    """Generate Kittl-ready design prompts using Groq (free, no image generation)."""
    prompts = generate_kittl_prompts(req.niche_keyword, req.angle, req.style, req.count)
    if not prompts:
        raise HTTPException(status_code=502, detail="Failed to generate prompts. Please try again.")
    return {"success": True, "prompts": prompts}


@router.post("/generate")
def generate_design(req: GenerateRequest, db: Session = Depends(get_db)):
    if req.provider == "dalle":
        result = generate_dalle(req.prompt, req.size)
    elif req.provider == "gemini":
        result = generate_gemini(req.prompt, req.size)
    else:
        raise HTTPException(status_code=400, detail="Provider must be 'dalle' or 'gemini'")

    if "error" in result:
        raise HTTPException(status_code=502, detail=result["error"])

    image_b64 = result["image_b64"]

    # Upload to R2 if configured; fall back to storing base64 in DB
    image_url = upload_image_b64(image_b64, prefix=f"designs/{req.niche_keyword}")
    stored_b64 = None if image_url else image_b64

    design = Design(
        niche_keyword=req.niche_keyword,
        prompt=req.prompt,
        provider=req.provider,
        size=req.size,
        image_b64=stored_b64,
        image_url=image_url,
    )
    db.add(design)
    db.commit()
    db.refresh(design)

    # Always return b64 in the response so the UI renders immediately,
    # even when the DB only stores the URL
    response_design = design_to_dict(design)
    if image_url and not response_design["image_b64"]:
        response_design["image_b64"] = image_b64

    return {"success": True, "design": response_design}


@router.get("/list")
def list_designs(niche: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Design).order_by(Design.created_at.desc())
    if niche:
        q = q.filter(Design.niche_keyword == niche)
    designs = q.limit(20).all()
    return {"success": True, "count": len(designs), "designs": [design_to_dict(d) for d in designs]}
