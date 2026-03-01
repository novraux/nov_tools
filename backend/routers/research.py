from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from db.database import get_db
from db.models import Niche, NicheResearch
from services.researcher import analyze_niche
from services.seo_generator import generate_seo

router = APIRouter(prefix="/research", tags=["Research"])


class KeywordResearchRequest(BaseModel):
    keyword: str


class SeoRequest(BaseModel):
    keyword: str
    products: list[str] = []
    design_angles: list[str] = []

def research_to_dict(r: NicheResearch) -> dict:
    return {
        "id": r.id,
        "niche_id": r.niche_id,
        "worth_it": r.worth_it,
        "target_audience": r.target_audience,
        "competitor_insights": r.competitor_insights,
        "design_angles": r.design_angles,
        "created_at": r.created_at.isoformat() if r.created_at else None
    }

@router.post("/seo")
def generate_listing_seo(req: SeoRequest):
    """Generate Etsy + Shopify SEO copy for a niche (Groq, free)."""
    result = generate_seo(req.keyword, req.products, req.design_angles)
    if not result:
        raise HTTPException(status_code=502, detail="SEO generation failed. Please try again.")
    return {"success": True, "seo": result}


@router.post("/by-keyword")
def run_keyword_research(req: KeywordResearchRequest):
    """Run deep Claude analysis on any keyword — no DB niche required."""
    result = analyze_niche(req.keyword)
    return {
        "success": True,
        "research": {
            "id": None,
            "niche_id": None,
            "worth_it": result.get("worth_it", False),
            "target_audience": result.get("target_audience", ""),
            "competitor_insights": result.get("competitor_insights", ""),
            "design_angles": result.get("design_angles", []),
            "created_at": None,
        }
    }


@router.get("/{niche_id}")
def get_niche_research(niche_id: int, db: Session = Depends(get_db)):
    research = db.query(NicheResearch).filter(NicheResearch.niche_id == niche_id).first()
    if not research:
        return {"success": True, "research": None}
    return {"success": True, "research": research_to_dict(research)}

@router.post("/{niche_id}")
def run_niche_research(niche_id: int, db: Session = Depends(get_db)):
    niche = db.query(Niche).filter(Niche.id == niche_id).first()
    if not niche:
        raise HTTPException(status_code=404, detail="Niche not found")
        
    if niche.score is None or niche.score < 7:
        raise HTTPException(status_code=400, detail="Score must be >= 7 for deep analysis")

    # Run Analysis
    result = analyze_niche(niche.keyword)
    
    existing = db.query(NicheResearch).filter(NicheResearch.niche_id == niche_id).first()
    now = datetime.now(timezone.utc)
    
    if existing:
        existing.worth_it = result.get("worth_it", False)
        existing.target_audience = result.get("target_audience", "")
        existing.competitor_insights = result.get("competitor_insights", "")
        existing.design_angles = result.get("design_angles", [])
        existing.created_at = now
        db.commit()
        db.refresh(existing)
        return {"success": True, "research": research_to_dict(existing)}
    else:
        new_research = NicheResearch(
            niche_id=niche_id,
            worth_it=result.get("worth_it", False),
            target_audience=result.get("target_audience", ""),
            competitor_insights=result.get("competitor_insights", ""),
            design_angles=result.get("design_angles", []),
            created_at=now
        )
        db.add(new_research)
        db.commit()
        db.refresh(new_research)
        return {"success": True, "research": research_to_dict(new_research)}
