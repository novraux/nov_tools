import json
import time
from groq import Groq
from pytrends.request import TrendReq
from config import settings

client = Groq(api_key=settings.AI_API_KEY)
MODEL = "llama-3.1-8b-instant"

def generate_pod_niches() -> list[dict]:
    """
    Brainstorms 15 highly specific, currently trending Print-on-Demand design phrases or micro-niches.
    Examples: "introvert reading club", "retro national park poster", "sarcastic cat mom mug".
    Returns a list of dictionaries with keyword and source.
    """
    prompt = """You are an expert Print-on-Demand product researcher.
    Brainstorm 15 highly specific, highly creative micro-niches or design phrases that would sell exceptionally well right now on Etsy or Redbubble.
    
    CRITICAL:
    - NO broad niches like "cat lover" or "fitness". 
    - INSTEAD provide specific design styles or sayings like "retro sarcastic cat mom tee", "vintage botanicals mug", "introverted book club sweatshirt".
    - MUST be physical items (apparel, mugs, posters).
    - MUST be IP safe (no brands, no movies, no Disney).
    - THESE MUST BE CURRENTLY TRENDING HIGH-DEMAND CONCEPTS.
    
    Return ONLY a JSON list of strings. No markdown formatting.
    Example: ["funny introvert coffee mug", "cottagecore mushroom frog tote bag"]
    """
    
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8,
            max_tokens=600,
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        phrases = json.loads(raw.strip())
        
        return [
            {
                "keyword": phrase,
                "source": "groq",
                "velocity": "rising",
                "avg_interest": 80
            }
            for phrase in phrases
        ]
    except Exception as e:
        print(f"[Generator] Failed to generate niches: {e}")
        return []
