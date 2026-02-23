"""
Groq scorer — evaluates POD viability of a keyword using llama-3.1-8b-instant (free).
Cost: ~$0.00 (free tier). Used for every keyword before saving to DB.
"""
import json
from groq import Groq
from config import settings

client = Groq(api_key=settings.AI_API_KEY)
MODEL = "llama-3.1-8b-instant"  # free tier, fast

PROMPT = """You are an expert Print-on-Demand (POD) trend analyst specifically for Etsy, Shopify, and Redbubble.

Evaluate this keyword strictly for its potential to sell physically printed apparel, mugs, posters, or other standard POD items.
Return ONLY valid JSON, no markdown, no explanation:
{{
  "score": <integer 0-10>,
  "pod_viability": <float 0-10>,
  "competition": "<low|medium|high>",
  "ip_safe": <true|false>,
  "product_ideas": ["<pod_product1>", "<pod_product2>", "<pod_product3>"],
  "reasoning": "<one sentence max explaining specifically why it sells as POD>"
}}

Scoring guide:
- 8-10: High demand, unique phrase/niche, low competition, clearly IP safe, EXCELLENT for slapping on a t-shirt or mug.
- 5-7: Decent demand, moderate competition, likely IP safe, works okay for POD.
- 2-4: Low demand OR high competition OR IP concerns OR hard to put on a product.
- 0-1: NO POD VALUE. Reject if it's a digital download software, a brand name, licensed character, or a physical item that cannot be printed on demand (like electronics, raw materials, etc.).

Keyword: "{keyword}"
"""


def score_niche(keyword: str) -> dict | None:
    """Score a single keyword. Returns None if scoring fails."""
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": PROMPT.format(keyword=keyword)}],
            temperature=0.2,
            max_tokens=200,
        )
        raw = response.choices[0].message.content.strip()
        # Strip markdown code blocks if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())
    except Exception as e:
        print(f"[Scorer] Failed '{keyword}': {e}")
        return None
