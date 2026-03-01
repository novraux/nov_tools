"""
Style analyzer — uses Groq vision (llama-3.2-11b-vision-preview) to extract
design style, color palette, and keywords from a reference image.
Cost: ~$0.00 (free tier). Called only on explicit user upload action.
"""
import base64
import json
from groq import Groq
from config import settings

client = Groq(api_key=settings.AI_API_KEY)
VISION_MODEL = "llama-3.2-11b-vision-preview"

SYSTEM = "You are a professional Print-on-Demand design analyst. Output strictly valid JSON, no markdown."

PROMPT = """Analyze this design image as a POD (Print-on-Demand) expert.

Return ONLY a JSON object — no markdown, no extra text:
{
  "style_tags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>"],
  "color_palette": ["<hex or color name 1>", "<hex or color name 2>", "<hex or color name 3>"],
  "mood": "<one word: funny|sentimental|bold|minimal|vintage|playful|inspirational>",
  "design_type": "<text-heavy|illustration-heavy|mixed>",
  "kittl_model": "<Ideogram 3 Quality|FLUX 1.1 Pro|DALL-E 3>",
  "keywords": ["<etsy search keyword 1>", "<etsy search keyword 2>", "<etsy search keyword 3>", "<etsy search keyword 4>", "<etsy search keyword 5>"],
  "replication_prompt": "<A single descriptive paragraph you could paste into Kittl to recreate this design style — mention colors, art style, typography style, and mood. Do NOT copy any text or trademarked content.>"
}

Rules for kittl_model:
- text-heavy → "Ideogram 3 Quality"  
- illustration-heavy → "FLUX 1.1 Pro"
- mixed → "DALL-E 3"
"""


def analyze_style(image_b64: str, mime_type: str = "image/jpeg") -> dict | None:
    """
    Analyze a reference image and extract POD style metadata.
    image_b64: base64-encoded image string (without data URI prefix)
    """
    try:
        response = client.chat.completions.create(
            model=VISION_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{image_b64}"
                            }
                        },
                        {
                            "type": "text",
                            "text": PROMPT
                        }
                    ]
                }
            ],
            temperature=0.3,
            max_tokens=800,
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
        print(f"[StyleAnalyzer] Failed: {e}")
        return None
