"""
SEO generator — Etsy + Shopify listing copy using Groq (free).
Generates: title, 13 tags, description opener, Shopify meta description.
Cost: ~$0.00 (Groq free tier). Called on explicit user request only.
"""
import json
from groq import Groq
from config import settings

client = Groq(api_key=settings.AI_API_KEY)
MODEL = "llama-3.3-70b-versatile"  # Best quality for copywriting

PROMPT = """You are a top-selling Etsy POD seller who specializes in SEO copywriting.
A seller needs full listing copy for this niche/product across all platforms.

Niche: "{keyword}"
Product ideas: {products}
Design angles: {angles}

Generate optimized listing copy. Rules:
- Etsy Title: 140 chars max, start with the most searched keyword, use | or , as separators, include gift angle
- Etsy Tags: Exactly 13 tags, each max 20 chars, long-tail keywords buyers actually search, NO duplicate words
- Etsy Description: Hook buyers in the first 2 sentences (visible before "read more"), mention niche, gifting occasion, customization hint
- Shopify Meta: 155 chars max, include primary keyword, buyer intent
- Pinterest Pin: 150-200 chars, visual + aspirational language, 3-5 hashtags at the end, drive click-through
- Printify Description: 3-4 sentences, focus on product quality + niche fit + gifting use case, suitable for a product listing

Return ONLY valid JSON with this exact shape:
{{
  "etsy_title": "string (max 140 chars)",
  "etsy_tags": ["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10","tag11","tag12","tag13"],
  "etsy_description": "string (2-3 sentence hook, ~200 chars)",
  "shopify_meta": "string (max 155 chars)",
  "pinterest_description": "string (150-200 chars + hashtags)",
  "printify_description": "string (3-4 sentences, product + niche fit)",
  "primary_keyword": "string (the #1 search term for this niche)"
}}

No markdown, no explanation — raw JSON only."""


def generate_seo(keyword: str, products: list[str] = None, design_angles: list[str] = None) -> dict:
    """
    Generate Etsy + Shopify SEO copy for a POD niche.
    Returns dict with: etsy_title, etsy_tags, etsy_description, shopify_meta, primary_keyword.
    """
    products_str = ", ".join(products[:3]) if products else "t-shirt, mug, tote bag"
    angles_str = "; ".join(design_angles[:3]) if design_angles else "funny, sentimental, niche identity"

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": PROMPT.format(
                keyword=keyword,
                products=products_str,
                angles=angles_str,
            )}],
            temperature=0.7,
            max_tokens=800,
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw.strip())

        # Enforce tag count and length
        tags = result.get("etsy_tags", [])
        tags = [t[:20] for t in tags][:13]
        result["etsy_tags"] = tags

        return result
    except Exception as e:
        print(f"[SEO] Failed '{keyword}': {e}")
        return {}
