"""
Competitor checker — uses Groq to estimate market saturation and surface
the top buyer search queries for a keyword, giving a fast Go/No-Go signal.
Cost: ~$0.00 (Groq free tier). Called only on explicit user action.
"""
import json
from groq import Groq
from config import settings

client = Groq(api_key=settings.AI_API_KEY)
MODEL = "llama-3.3-70b-versatile"

PROMPT = """You are a senior Etsy marketplace analyst specializing in Print-on-Demand.

Analyze this Etsy keyword for a POD seller: "{keyword}"

Return ONLY valid JSON — no markdown, no explanation:
{{
  "saturation_level": "<low|medium|high|very_high>",
  "saturation_score": <integer 1-10, where 10 = extremely saturated>,
  "go_no_go": "<go|proceed_with_caution|no_go>",
  "reasoning": "<2 sentences: why this saturation level, what the opportunity is>",
  "top_buyer_queries": [
    "<exact search phrase buyers use 1>",
    "<exact search phrase buyers use 2>",
    "<exact search phrase buyers use 3>",
    "<exact search phrase buyers use 4>",
    "<exact search phrase buyers use 5>"
  ],
  "winning_angle": "<1 sentence: the sub-niche or angle most likely to succeed with low competition>",
  "avg_price_range": "<e.g. $18-$28>",
  "best_products": ["<product1>", "<product2>", "<product3>"]
}}

Saturation guide:
- low (1-3): Under 10k competing listings, clear buyer demand, easy to rank
- medium (4-6): 10k-50k listings, need strong differentiation, sub-niching helps  
- high (7-8): 50k-200k listings, only proceed with very specific angle
- very_high (9-10): 200k+ listings, extremely hard to rank, avoid unless sub-niche found

Top buyer queries must be EXACT phrases someone would type into Etsy search.
"""


def check_competitor(keyword: str) -> dict | None:
    """Analyze keyword competition and surface top buyer queries."""
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an Etsy marketplace analyst. Output strictly valid JSON."
                },
                {
                    "role": "user",
                    "content": PROMPT.format(keyword=keyword)
                }
            ],
            temperature=0.4,
            max_tokens=700,
        )

        raw = response.choices[0].message.content.strip()
        if raw.startswith("```json"):
            raw = raw[7:]
        if raw.startswith("```"):
            raw = raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]

        return json.loads(raw.strip())

    except Exception as e:
        print(f"[CompetitorChecker] Failed '{keyword}': {e}")
        return None
