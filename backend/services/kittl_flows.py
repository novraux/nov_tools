"""
Kittl Flows generator — correct implementation of how Kittl Flows works.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW KITTL FLOWS ACTUALLY WORKS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. BASE DESIGN (master artboard)
   → You paste the base prompt into Kittl's AI Image generator
   → Kittl generates the actual artwork: layout, decorations, icon, colors, typography
   → This is your "master design"

2. VARIANT AI IMAGE BOARDS (each board connected to the base)
   → Each variant board is visually connected to the base artboard in Kittl Flows
   → The AI SEES the parent image as context — it knows what the design looks like
   → So the variant prompt only needs to say WHAT CHANGES (the slogan)
   → Kittl regenerates the same visual style with the new text

THEREFORE:
  - base_prompt  = full rich visual description → generates the master design
  - variant prompt = short instruction → "Same design. Change the slogan to 'X' and caption to 'Y'."

If you paste a full repeated description into each variant board, Kittl ignores the
visual context and generates a completely different design each time. Short modification
prompts is the correct Flows approach.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BACKGROUND NOTE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Background is NEVER in the prompt. After generating:
- Apparel (t-shirt/hoodie): use Kittl's AI Background Remover → export transparent PNG
- Hard goods (mug/poster): white canvas background is set in canvas settings

Cost: ~$0.00 (Groq free tier). Called only on explicit user action.
"""
import re
import json
from groq import Groq
from config import settings

client = Groq(api_key=settings.AI_API_KEY)
MODEL = "llama-3.3-70b-versatile"

# Strip any background mentions the LLM sneaks into the base prompt
_BG_PATTERNS = [
    r",?\s*on an?\s+(solid\s+)?(white|transparent|black|light|dark|colored|neutral)\s+background",
    r",?\s*set\s+against\s+an?\s+[^,\.]*background",
    r",?\s*against\s+an?\s+[^,\.]*background",
    r",?\s*(with\s+a\s+)?(solid\s+)?(white|transparent|black)\s+background",
    r",?\s*background\s+(color\s+)?is\s+[^,\.]+",
    r",?\s*background:\s*[^,\.]+",
    r",?\s*placed\s+on\s+an?\s+[^,\.]*background",
]

def _strip_background(text: str) -> str:
    """Remove background mentions from any prompt text."""
    for pattern in _BG_PATTERNS:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)
    return text.strip().rstrip(",").strip()


PROMPT = """You are an expert Etsy POD designer who uses Kittl Flows to create product design series.

You understand how Kittl Flows works:
- The BASE PROMPT generates the master artboard design (the actual artwork)
- Each VARIANT is an AI Image board connected to the base — it inherits the visual context
- Because the AI sees the parent image, variant prompts only need to specify the TEXT CHANGE
- Short variant prompts = visually consistent series; repeated full descriptions = inconsistent mess

TASK: Create a Kittl Flows project for:
  Niche: "{niche}"
  Design angle: "{angle}"
  Product: {product}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — BASE DESIGN PROMPT (the master artboard)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write a RICH, DETAILED Kittl AI prompt that describes a specific print-ready graphic design.
This gets pasted into the first AI Image board to generate the master artwork.

MANDATORY elements:

① LAYOUT — pick one specific format:
   Circular badge with wreath border | Vintage oval with vine frame |
   Rectangular label with corner swashes | Shield crest with banner scroll |
   Postage stamp with serrated edge | Stacked type block with rule lines

② DECORATIVE BORDER — describe in detail:
   ✓ "an outer ring of hand-drawn roses, wildflowers, and sage green leaves"
   ✓ "an elaborate laurel wreath of eucalyptus branches with small berries"
   ✓ "a double ornamental ring with small star separators and corner flourishes"

③ CENTRAL VISUAL — one specific, detailed element:
   ✓ "a small globe illustration with delicate continents and a tiny leaf accent"
   ✓ "a steaming coffee mug with heavy-lidded cartoon eyes and curling steam"
   ✓ "a nurse's caduceus staff wrapped in ivy vines and small blossoms"

④ HERO TEXT — exact slogan in double quotes, 3–7 words, punchy and specific:
   ✓ "Love Your Planet" | "Running On Caffeine and Spite" | "ICU Nurse: Sleep Is A Myth"
   ✗ "Nurse Life" | "Coffee Lover" (too generic)

⑤ CAPTION TEXT — small supporting line in double quotes, 2–4 words:
   "Save The Future" | "Since Day One" | "and proud of it" | "Level: Expert"

⑥ TYPOGRAPHY STYLE:
   "multi-line brush script with thick-to-thin strokes" |
   "bold vintage slab serif with inline white rule" |
   "retro Americana outlined block letters"

⑦ COLOR PALETTE — 3 specific named colors:
   "teal, sage green, and warm cream" | "dusty rose, burgundy, and ivory" |
   "navy blue, mustard yellow, and off-white"

⑧ ILLUSTRATION STYLE:
   "vintage botanical illustration" | "bold ink stamp" | "hand-lettered folk art"

CRITICAL — NEVER mention: background color, product type (t-shirt/mug/etc.)
Write 3–5 sentences.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — GENERATE 10 SLOGANS FOR 10 AUDIENCES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pick 10 hyper-specific audiences within the "{niche}" world.
For each, write ONE punchy hero slogan (3–7 words) and ONE short caption (2–4 words).

Great slogans are identity-driven and specific:
  ✓ "ICU Nurse: Sleep? Never Heard Of It" + caption "Night Shift Life"
  ✓ "Retired Teacher: Done Raising Other People's Kids" + caption "Class Dismissed"
  ✓ "Kindergarten Teacher Powered By Coffee" + caption "and Glitter"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — 10 VARIANT PROMPTS (SHORT — Kittl Flows format)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For each audience, write a SHORT variant prompt. In Kittl Flows, the AI Image board
is visually connected to the base — it already knows what the design looks like.
So the variant prompt ONLY specifies what text changes.

Use this exact format:
"Keep the same design. Replace the main text with '[HERO SLOGAN]' and the caption with '[CAPTION]'."

That is the COMPLETE variant prompt. Do not add visual descriptions — the Kittl AI sees the parent design.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY this JSON — no markdown, no explanation:
{{
  "base_prompt": "Full 3-5 sentence Kittl AI prompt for the master artboard",
  "variants": [
    {{
      "audience": "Hyper-specific audience name",
      "emoji": "one emoji",
      "slogan": "The hero slogan for this audience",
      "caption": "The short caption",
      "prompt": "Keep the same design. Replace the main text with '[SLOGAN]' and the caption with '[CAPTION]'.",
      "style": "minimalist|vintage|bold|funny|handdrawn",
      "product": "{product}",
      "focus": "text|illustration|mixed",
      "kittl_model": "Ideogram 3 Quality|FLUX 1.1 Pro|DALL-E 3"
    }}
  ]
}}

kittl_model rules:
  "text" focus         → "Ideogram 3 Quality"   (badge layouts with readable typography)
  "illustration" focus → "FLUX 1.1 Pro"          (icon/character-heavy, minimal text)
  "mixed" focus        → "DALL-E 3"              (text + detailed illustration)
"""

KITTL_MODELS = {
    "text": "Ideogram 3 Quality",
    "illustration": "FLUX 1.1 Pro",
    "mixed": "DALL-E 3",
}


def generate_flows(niche: str, angle: str, product: str = "t-shirt") -> dict:
    """
    Returns { base_prompt: str, variants: list[dict] }.

    base_prompt = full rich Kittl AI prompt for the master artboard.
    variants    = short "change the text to X" prompts for each connected AI Image board.

    This mirrors real Kittl Flows: the variant boards are visually connected to the base,
    so short modification prompts produce consistent variants. Full repeated descriptions
    would generate completely new designs each time (wrong).
    """
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a Kittl Flows expert for Etsy POD. "
                        "You write: (1) a rich full design description for the base artboard, "
                        "and (2) SHORT modification prompts for each variant board — just the text change, "
                        "because variant boards inherit the visual context of the parent. "
                        "NEVER mention background color. NEVER mention product type in prompts. "
                        "Output ONLY valid JSON."
                    ),
                },
                {
                    "role": "user",
                    "content": PROMPT.format(niche=niche, angle=angle, product=product),
                },
            ],
            temperature=0.85,
            max_tokens=4000,
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith("```json"):
            raw = raw[7:]
        if raw.startswith("```"):
            raw = raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        data = json.loads(raw.strip())

        base_prompt = _strip_background(data.get("base_prompt", ""))
        variants = data.get("variants", [])
        if not isinstance(variants, list):
            return {"base_prompt": base_prompt, "variants": []}

        for item in variants:
            # Strip background from base prompt only — variant prompts are intentionally short
            if "prompt" in item:
                item["prompt"] = _strip_background(item["prompt"])
            focus = item.get("focus", "mixed")
            item["kittl_model"] = KITTL_MODELS.get(focus, KITTL_MODELS["mixed"])
            item["product"] = product

        return {"base_prompt": base_prompt, "variants": variants}
    except Exception as e:
        print(f"[KittlFlows] Failed for '{niche}'/'{angle}': {e}")
        return {"base_prompt": "", "variants": []}
