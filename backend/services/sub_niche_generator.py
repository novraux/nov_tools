"""
Sub-niche generator — drills a broad niche into 8-10 hyper-specific POD sub-niches.
Cost: ~$0.00 (Groq free tier). Called only on explicit "Drill Down" user action.
Model: llama-3.3-70b-versatile for quality specificity.
"""
import json
from groq import Groq
from config import settings

client = Groq(api_key=settings.AI_API_KEY)
MODEL = "llama-3.3-70b-versatile"

PROMPT = """You are an expert Print-on-Demand (POD) niche strategist for Etsy and Shopify.

Your job: drill the broad niche "{keyword}" into 8-10 hyper-specific sub-niches.

Rules:
- Each sub-niche must be a COMPLETE, SPECIFIC buyer search phrase (4-7 words)
- Think: occasion + audience + emotion ("funny ICU nurse night shift coffee mug")
- Include mix of: job titles, graduation gifts, hobbies, family roles, holidays, pets
- Every sub-niche must be IP-safe and printable on a mug, shirt, or tote bag
- Avoid anything too broad (no "teacher gift"), too generic (no "nurse shirt"), or licensed

Return ONLY valid JSON array — no markdown, no explanation:
[
  {{
    "keyword": "<hyper-specific sub-niche phrase>",
    "score": <integer 1-10, POD viability>,
    "competition": "<low|medium|high>",
    "product_fit": "<best product type: mug|t-shirt|tote bag|poster|hoodie>",
    "hook": "<one punchy sentence: why this sells>"
  }}
]

Broad niche: "{keyword}"
"""


def drill_niche(keyword: str) -> list[dict]:
    """Generate hyper-specific sub-niches for a broad POD keyword."""
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a POD niche strategist. Output strictly valid JSON arrays only."
                },
                {
                    "role": "user",
                    "content": PROMPT.format(keyword=keyword)
                }
            ],
            temperature=0.75,
            max_tokens=1200,
        )

        raw = response.choices[0].message.content.strip()

        # Strip markdown code fences if present
        if raw.startswith("```json"):
            raw = raw[7:]
        if raw.startswith("```"):
            raw = raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]

        data = json.loads(raw.strip())
        # Ensure it's a list
        if isinstance(data, dict) and "sub_niches" in data:
            data = data["sub_niches"]
        return data if isinstance(data, list) else []

    except Exception as e:
        print(f"[SubNiche] Failed for '{keyword}': {e}")
        return []
