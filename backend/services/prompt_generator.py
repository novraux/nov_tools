import json
from groq import Groq
from config import settings

client = Groq(api_key=settings.AI_API_KEY)
MODEL = "llama-3.3-70b-versatile"

STYLE_HINTS = {
    "minimalist": "Clean, simple, minimal elements, flat 2D illustration, 2-3 color max, lots of negative space",
    "vintage":    "Retro distressed badge style, worn textures, muted earth tones (cream, rust, olive), 1970s-90s aesthetic",
    "bold":       "High contrast, large chunky typography front-and-center, strong graphic impact, black or bold primary palette",
    "funny":      "Playful humorous tone, exaggerated cartoon style, witty slogan as the hero element, casual and fun",
    "handdrawn":  "Hand-lettered text, organic slightly imperfect lines, ink sketch or watercolor feel, warm and personal",
}

KITTL_MODELS = {
    # text-heavy → Ideogram 3; illustration-heavy → FLUX 1.1 Pro; mix → DALL-E 3
    "text":         "Ideogram 3 Quality",
    "illustration": "FLUX 1.1 Pro",
    "mixed":        "DALL-E 3",
}


def generate_kittl_prompts(keyword: str, angle: str = "", style: str = "auto", count: int = 5) -> list[dict]:
    """
    Generate Etsy/Shopify POD-optimized Kittl design prompts.
    Returns a list of dicts with: prompt, style, product, kittl_model, background, focus.
    """
    style_hint = ""
    if style and style != "auto" and style in STYLE_HINTS:
        style_hint = f"\n  Style preference: {STYLE_HINTS[style]}."

    angle_hint = f"\n  Design concept/angle: {angle}." if angle else ""

    prompt = f"""You are a senior Print-on-Demand designer who sells on Etsy and Shopify.
Your job is to write Kittl AI image generation prompts that create BEST-SELLING POD designs.

POD niche: "{keyword}"{angle_hint}{style_hint}

Generate {count} Kittl-ready design prompts. Each must be optimized for what actually sells on Etsy:
- Funny and relatable sayings (for impulse buys)
- Sentimental/gifting angles (for birthdays, Mother's Day, graduation)
- Niche identity pride ("proud nurse", "dog mom life", "plant parent")
- Trending aesthetics (retro, cottagecore, dark academia, Y2K, etc.)

For each prompt, write ONE descriptive paragraph (2-4 sentences) in natural English (NOT comma lists). Describe:
1. The main visual — character, icon, or typographic element with specific details
2. Any slogan or text — write the EXACT words in quotes
3. Art style — be precise (e.g., "bold retro badge illustration", "minimal line art", "hand-lettered watercolor")
4. Color palette — 2-4 specific colors or mood (e.g., "dusty pink and sage green", "black and gold")
5. End with: product + background ("transparent background, centered, suitable for direct-to-garment t-shirt printing" OR "white background, centered, suitable for sublimation mug printing")

Also set:
- "product": what it's best for (t-shirt, mug, tote bag, hoodie, poster, sweatshirt)
- "style": one of minimalist, vintage, bold, funny, handdrawn, mixed
- "focus": "text" (slogan is the hero), "illustration" (art is the hero), or "mixed"
- "background": "transparent" (for apparel) or "white" (for mugs, posters)

The kittl_model field should be automatically determined:
- "text" focus → "Ideogram 3 Quality"
- "illustration" focus → "FLUX 1.1 Pro"
- "mixed" focus → "DALL-E 3"

Return ONLY a JSON array. Each element must have exactly these keys:
{{"prompt": "...", "style": "...", "product": "...", "focus": "text|illustration|mixed", "background": "transparent|white", "kittl_model": "..."}}

No markdown, no explanation — raw JSON array only."""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.9,
            max_tokens=3000,
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        results = json.loads(raw.strip())

        # Enforce kittl_model based on focus field if missing/wrong
        for r in results:
            focus = r.get("focus", "mixed")
            if focus == "text":
                r["kittl_model"] = KITTL_MODELS["text"]
            elif focus == "illustration":
                r["kittl_model"] = KITTL_MODELS["illustration"]
            else:
                r["kittl_model"] = KITTL_MODELS["mixed"]

        return results
    except Exception as e:
        print(f"[PromptGenerator] Failed: {e}")
        return []
