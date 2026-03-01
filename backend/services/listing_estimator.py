"""
Listing URL estimator — paste a competitor Etsy listing URL → Groq estimates
review velocity, sales tier, price positioning, and whether the niche is worth entering.
Cost: ~$0.00 (Groq free tier). Called only on explicit user action.
No Etsy scraping — Groq works from the URL slug alone + general market knowledge.
"""
import json, re
from groq import Groq
from config import settings

client = Groq(api_key=settings.AI_API_KEY)
MODEL = "llama-3.3-70b-versatile"

PROMPT = """You are an Etsy marketplace expert who can estimate a listing's performance from its URL slug.

Etsy listing URL: "{url}"
Extracted slug/title: "{slug}"

Based on the product title/slug, estimate this listing's market position and whether a seller should enter this niche.

Return ONLY valid JSON — no markdown, no explanation:
{{
  "listing_title": "<clean human-readable title extracted from the slug>",
  "niche": "<the core POD niche this belongs to>",
  "sales_tier": "<low (0-50 sales) | medium (50-500) | high (500-5000) | top_seller (5000+)>",
  "estimated_monthly_sales": "<e.g. '80-150 units/month' or 'unknown'>",
  "price_positioning": "<budget ($12-18) | mid-range ($18-28) | premium ($28-45) | luxury ($45+)>",
  "review_velocity": "<slow (1-2/week) | moderate (5-15/week) | fast (20+/week)>",
  "competition_verdict": "<easy_entry | moderate_competition | tough_market | avoid>",
  "enter_niche": <true|false>,
  "reasoning": "<2 sentences: why enter or avoid, what edge a new seller needs>",
  "suggested_angle": "<1 specific sub-niche or design angle that could outperform this listing>"
}}

Base estimates on: keyword specificity (more specific = less competition), typical Etsy POD market knowledge, and niche saturation patterns.
"""

def _extract_slug(url: str) -> str:
    """Pull the listing title slug from an Etsy URL."""
    # Match /listing/XXXXXXX/some-title-slug or just use the path
    m = re.search(r'/listing/\d+/([^/?#]+)', url)
    if m:
        return m.group(1).replace('-', ' ')
    # Fall back to last path segment
    path = url.rstrip('/').split('/')[-1].split('?')[0]
    return path.replace('-', ' ')


def estimate_listing(url: str) -> dict | None:
    """Estimate a competitor Etsy listing's performance from its URL."""
    slug = _extract_slug(url)
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "You are an Etsy market analyst. Output strictly valid JSON."},
                {"role": "user",   "content": PROMPT.format(url=url, slug=slug)}
            ],
            temperature=0.4,
            max_tokens=700,
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith("```json"): raw = raw[7:]
        if raw.startswith("```"):     raw = raw[3:]
        if raw.endswith("```"):       raw = raw[:-3]
        return json.loads(raw.strip())
    except Exception as e:
        print(f"[ListingEstimator] Failed for '{url}': {e}")
        return None
