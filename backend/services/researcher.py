"""
Groq researcher — deep POD niche analysis using llama-3.3-70b-versatile (free).
Cost: ~$0.00 (free tier). Called only on explicit user action (score >= 7 gate or Event Radar).
Replaces Anthropic Claude Haiku.
"""
import json
from groq import Groq
from config import settings

client = Groq(api_key=settings.AI_API_KEY)
MODEL = "llama-3.3-70b-versatile"  # free, high-quality reasoning


PROMPT = """You are an expert Print-on-Demand (POD) niche researcher specializing in Etsy and Shopify.

Analyze the POD niche: "{keyword}"

Return ONLY valid JSON — no markdown, no explanation outside the JSON object:
{{
  "worth_it": <true|false>,
  "target_audience": "<2-3 sentences: who buys this, their motivation, when they buy>",
  "competitor_insights": "<2-3 sentences: how saturated the niche is, what top sellers do, what gaps exist>",
  "design_angles": [
    "<specific, actionable design concept 1>",
    "<specific, actionable design concept 2>",
    "<specific, actionable design concept 3>",
    "<specific, actionable design concept 4>",
    "<specific, actionable design concept 5>"
  ]
}}

Scoring criteria for worth_it:
- true: Clear buyer intent, gift or occasion-driven, low-to-medium competition, safe IP, easy to put on a mug/shirt/poster
- false: Too broad, dominated by big brands, IP risk, no obvious product angle, or digital-only niche

Design angles must be specific and Kittl/POD-ready (e.g. "Funny ICU nurse night shift coffee mug quote", not just "nurse design").
"""


def analyze_niche(keyword: str) -> dict:
    """Deep POD niche analysis via Groq. Returns structured dict."""
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert Print-on-Demand niche analyst. Output strictly valid JSON with no markdown formatting."
                },
                {
                    "role": "user",
                    "content": PROMPT.format(keyword=keyword)
                }
            ],
            temperature=0.6,
            max_tokens=800,
        )

        raw = response.choices[0].message.content.strip()

        # Strip markdown code blocks if present
        if raw.startswith("```json"):
            raw = raw[7:]
        if raw.startswith("```"):
            raw = raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]

        return json.loads(raw.strip())

    except Exception as e:
        print(f"[Researcher] Failed '{keyword}': {e}")
        return {
            "worth_it": False,
            "target_audience": "Analysis failed — please try again.",
            "competitor_insights": "Analysis failed — please try again.",
            "design_angles": []
        }
