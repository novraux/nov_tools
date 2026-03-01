"""
Discover router — find, score, and manage POD niches.

Endpoints:
  GET  /discover        — list all saved niches (sorted by score)
  POST /discover/scrape — run scrape + Groq scoring, save results to DB
  DELETE /discover/{id} — archive a niche (soft delete)
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import Niche
from services.generator import generate_pod_niches
from services.scorer import score_niche
from services.sub_niche_generator import drill_niche

router = APIRouter(prefix="/discover", tags=["Discover"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def niche_to_dict(n: Niche) -> dict:
    return {
        "id": n.id,
        "keyword": n.keyword,
        "source": n.source,
        "score": n.score,
        "pod_viability": n.pod_viability,
        "competition": n.competition,
        "ip_safe": n.ip_safe,
        "velocity": n.velocity,
        "avg_interest": n.avg_interest,
        "reasoning": n.reasoning,
        "product_ideas": n.product_ideas or [],
        "scraped_at": n.scraped_at.isoformat() if n.scraped_at else None,
    }


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("")
def list_niches(db: Session = Depends(get_db)):
    """Return all non-archived niches, sorted by score descending."""
    niches = (
        db.query(Niche)
        .filter(Niche.archived == False)  # noqa: E712
        .order_by(Niche.score.desc().nullslast())
        .all()
    )
    return {"success": True, "count": len(niches), "niches": [niche_to_dict(n) for n in niches]}


from pydantic import BaseModel

class ScrapeRequest(BaseModel):
    topic: str = "standard"

class DrillRequest(BaseModel):
    keyword: str


@router.post("/drill")
def drill_niche_endpoint(req: DrillRequest):
    """Drill a broad niche into 8-10 hyper-specific sub-niches (Groq, free)."""
    if not req.keyword.strip():
        raise HTTPException(status_code=400, detail="keyword is required")
    sub_niches = drill_niche(req.keyword)
    return {"success": True, "keyword": req.keyword, "sub_niches": sub_niches}


@router.post("/scrape")
def run_scrape(req: ScrapeRequest, db: Session = Depends(get_db)):
    """
    Intelligently generate hyper-specific POD niches and score with Groq. Saves to DB.
    """
    raw_keywords = generate_pod_niches(topic=req.topic)
    saved, updated, skipped = 0, 0, 0

    for item in raw_keywords:
        kw = item["keyword"]
        scored = score_niche(kw)

        if not scored:
            skipped += 1
            continue

        # Skip low value or IP-unsafe keywords
        if scored.get("score", 0) < 4 or not scored.get("ip_safe", True):
            skipped += 1
            continue

        now = datetime.now(timezone.utc)
        existing = db.query(Niche).filter(Niche.keyword == kw).first()

        if existing:
            existing.score = scored["score"]
            existing.pod_viability = scored.get("pod_viability")
            existing.competition = scored.get("competition")
            existing.ip_safe = scored.get("ip_safe", True)
            existing.velocity = item.get("velocity", "stable")
            existing.avg_interest = item.get("avg_interest")
            existing.reasoning = scored.get("reasoning")
            existing.product_ideas = scored.get("product_ideas", [])
            existing.scraped_at = now
            updated += 1
        else:
            db.add(Niche(
                keyword=kw,
                source=item.get("source"),
                score=scored["score"],
                pod_viability=scored.get("pod_viability"),
                competition=scored.get("competition"),
                ip_safe=scored.get("ip_safe", True),
                velocity=item.get("velocity", "stable"),
                avg_interest=item.get("avg_interest"),
                reasoning=scored.get("reasoning"),
                product_ideas=scored.get("product_ideas", []),
                scraped_at=now,
            ))
            saved += 1

        db.commit()

    return {
        "success": True,
        "saved": saved,
        "updated": updated,
        "skipped": skipped,
        "total": saved + updated,
    }


@router.delete("/{niche_id}")
def archive_niche(niche_id: int, db: Session = Depends(get_db)):
    """Soft-delete a niche (sets archived=True)."""
    niche = db.query(Niche).filter(Niche.id == niche_id).first()
    if not niche:
        raise HTTPException(status_code=404, detail="Niche not found")
    niche.archived = True
    db.commit()
    return {"success": True}
