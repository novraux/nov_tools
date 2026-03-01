"""
Kittl Flows generator — mirrors how Kittl Flows actually works:

1. BASE PROMPT: A concrete, visual Kittl AI prompt describing the ACTUAL DESIGN
   (badge layout, exact text, colors, art style, texture — NO product mention)
2. VARIANT PROMPTS: Same visual design, swapped text/slogan per AI-chosen audience

Audiences are AI-GENERATED based on the niche — different every time.
Product type is metadata only — never appears in the Kittl prompt text.
Cost: ~$0.00 (Groq free tier).
"""
import json
from groq import Groq
from config import settings

client = Groq(api_key=settings.AI_API_KEY)
MODEL = "llama-3.3-70b-versatile"

PROMPT = """You are a Kittl AI expert who creates best-selling Etsy POD designs.

TASK: Create a Kittl Flows project for this concept:
  Niche: "{niche}"
  Design angle: "{angle}"

═══ STEP 1: BASE DESIGN PROMPT ═══
Write ONE detailed Kittl AI prompt that describes a SPECIFIC, CONCRETE graphic design:
- The exact layout (badge? ribbon banner? circular seal? stacked text block? etc.)
- The main visual elements (icon, character, frame, border)
- The EXACT hero text/slogan in quotes
- Art style (vintage stamp, retro badge, hand-lettered, minimal line art, etc.)
- 3-4 specific colors (e.g. "mustard yellow, matte black, cream white")
- Texture (keep it clean and pristine. Do NOT add distressed, worn, or grunge textures)
- CRITICAL: Do NOT mention any background in the prompt (do not ask for transparent, white, or black). Just describe the graphic itself.

CRITICAL: Do NOT mention any product (no "t-shirt", "mug", "poster" etc.).
Describe ONLY the graphic artwork itself. 2-4 sentences max.

═══ STEP 2: CHOOSE 10 AUDIENCES ═══
Based on the niche "{niche}", pick 10 specific audiences/jobs/hobbies that would
BUY this design. Be creative and niche-specific — don't always use the same generic list.
Think: who actually searches for this on Etsy?

Examples of good audiences: "ICU Nurse", "Kindergarten Teacher", "Plant Mom",
"CrossFit Girl", "Bookish Introvert", "Crazy Cat Lady", "Dog Dad",
"Firefighter Wife", "Marine Veteran", "Coffee Addict Programmer"

═══ STEP 3: 10 VARIANT PROMPTS ═══
Take the EXACT same visual design from Step 1 — same layout, style, colors, texture.
ONLY change the text/slogan to target each audience from Step 2.
Do NOT mention any product or background in the prompt. Just output the artwork description.
Each variant: 2-3 sentences max.

═══ OUTPUT FORMAT ═══
Return ONLY this JSON — no markdown:
{{
  "base_prompt": "The visual Kittl AI prompt from Step 1 (NO product mentioned)",
  "variants": [
    {{
      "audience": "The specific audience name",
      "emoji": "relevant emoji",
      "prompt": "Same design, audience-specific slogan (NO product mentioned)",
      "style": "minimalist|vintage|bold|funny|handdrawn",
      "product": "{product}",
      "focus": "text|illustration|mixed",
      "kittl_model": "Ideogram 3 Quality|FLUX 1.1 Pro|DALL-E 3"
    }},
    ...10 items
  ]
}}

kittl_model: text → "Ideogram 3 Quality", illustration → "FLUX 1.1 Pro", mixed → "DALL-E 3"
"""

KITTL_MODELS = {"text": "Ideogram 3 Quality", "illustration": "FLUX 1.1 Pro", "mixed": "DALL-E 3"}


def generate_flows(niche: str, angle: str, product: str = "t-shirt") -> dict:
    """
    Returns {{ base_prompt: str, variants: list[dict] }}.
    base_prompt = concrete visual Kittl AI prompt (the master artboard). No product mentioned.
    variants = same design, audience-specific slogans. Audiences are AI-generated per niche.
    """
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a Kittl AI design expert. You create SPECIFIC, VISUAL design prompts "
                        "that describe actual graphic artwork — layouts, exact text, colors, textures. "
                        "NEVER mention product types (t-shirt, mug, etc.) in prompts. "
                        "Output ONLY valid JSON."
                    ),
                },
                {
                    "role": "user",
                    "content": PROMPT.format(niche=niche, angle=angle, product=product),
                },
            ],
            temperature=0.9,
            max_tokens=3000,
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith("```json"): raw = raw[7:]
        if raw.startswith("```"):     raw = raw[3:]
        if raw.endswith("```"):       raw = raw[:-3]
        data = json.loads(raw.strip())

        base_prompt = data.get("base_prompt", "")
        variants = data.get("variants", [])
        if not isinstance(variants, list):
            return {"base_prompt": base_prompt, "variants": []}

        for item in variants:
            focus = item.get("focus", "mixed")
            item["kittl_model"] = KITTL_MODELS.get(focus, KITTL_MODELS["mixed"])
            item["product"] = product  # metadata only, not in prompt text

        return {"base_prompt": base_prompt, "variants": variants}
    except Exception as e:
        print(f"[KittlFlows] Failed for '{niche}'/'{angle}': {e}")
        return {"base_prompt": "", "variants": []}
