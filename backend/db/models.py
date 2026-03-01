from sqlalchemy import Column, Integer, String, Float, Boolean, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base


class Niche(Base):
    __tablename__ = "niches"

    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String, unique=True, index=True, nullable=False)
    source = Column(String, default="google")

    # Groq scoring
    score = Column(Float, nullable=True)           # 0–10 overall POD score
    pod_viability = Column(Float, nullable=True)   # 0–10 product viability
    competition = Column(String, nullable=True)    # low / medium / high
    ip_safe = Column(Boolean, default=True)
    product_ideas = Column(JSON, nullable=True)    # ["mugs", "tees", ...]
    reasoning = Column(Text, nullable=True)        # one-sentence explanation

    # Trend data
    velocity = Column(String, nullable=True)       # rising / stable / declining
    avg_interest = Column(Integer, nullable=True)  # Google Trends 0–100

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    scraped_at = Column(DateTime(timezone=True), nullable=True)

    # Management
    archived = Column(Boolean, default=False)
    
    research = relationship("NicheResearch", back_populates="niche", uselist=False)

class Design(Base):
    __tablename__ = "designs"

    id = Column(Integer, primary_key=True, index=True)
    niche_keyword = Column(String, nullable=False, index=True)
    prompt = Column(Text, nullable=False)
    provider = Column(String, nullable=False)       # dalle / gemini
    size = Column(String, default="1024x1024")
    image_b64 = Column(Text, nullable=True)         # base64 PNG fallback (when R2 not configured)
    image_url = Column(String, nullable=True)       # R2 public URL (preferred)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class NicheResearch(Base):
    __tablename__ = "niche_research"

    id = Column(Integer, primary_key=True, index=True)
    niche_id = Column(Integer, ForeignKey("niches.id"), unique=True, index=True, nullable=False)
    
    worth_it = Column(Boolean, nullable=False)
    target_audience = Column(Text, nullable=False)
    competitor_insights = Column(Text, nullable=False)
    design_angles = Column(JSON, nullable=False)

    # Feedback loop — did this niche actually sell?
    # Values: None (not listed) | 'testing' | 'sold' | 'flopped'
    outcome = Column(String, nullable=True, default=None)
    outcome_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    niche = relationship("Niche", back_populates="research")
