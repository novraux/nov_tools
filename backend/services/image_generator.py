"""
Image generator — DALL-E 3 (OpenAI) and Gemini 2.0 Flash Image (Google).
Cost: ~$0.04/img (DALL-E), free quota (Gemini Flash). Only called when user clicks Generate.
Returns base64 PNG bytes for the caller to upload to R2 or save directly.
"""
import base64
import time
from openai import OpenAI
from google import genai
from google.genai import types as genai_types
from config import settings

_openai_client: OpenAI | None = None
_gemini_client: genai.Client | None = None


def _get_openai() -> OpenAI | None:
    if not settings.OPENAI_API_KEY:
        return None
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _openai_client


def _get_gemini() -> genai.Client | None:
    if not settings.GOOGLE_AI_KEY:
        return None
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = genai.Client(api_key=settings.GOOGLE_AI_KEY)
    return _gemini_client


def generate_dalle(prompt: str, size: str = "1024x1024") -> dict:
    """
    Generate an image with DALL-E 3.
    Returns {"image_b64": str} on success or {"error": str} on failure.
    """
    client = _get_openai()
    if not client:
        return {"error": "OPENAI_API_KEY not configured"}

    print(f"[DALL-E] Generating {size} image...")
    t0 = time.time()
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            n=1,
            size=size,
            response_format="b64_json",
            quality="standard",
        )
        b64 = response.data[0].b64_json
        print(f"[DALL-E] Done in {time.time() - t0:.1f}s")
        return {"image_b64": b64}
    except Exception as e:
        print(f"[DALL-E] Failed after {time.time() - t0:.1f}s: {e}")
        return {"error": str(e)}


def generate_gemini(prompt: str, size: str = "1024x1024") -> dict:
    """
    Generate an image with Gemini 2.0 Flash (native image output).
    Free-tier model, works with a standard AI Studio API key.
    Returns {"image_b64": str} on success or {"error": str} on failure.
    """
    client = _get_gemini()
    if not client:
        return {"error": "GOOGLE_AI_KEY not configured"}

    print(f"[Gemini Flash] Generating {size} image...")
    t0 = time.time()
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp-image-generation",
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            ),
        )
        for part in response.candidates[0].content.parts:
            if part.inline_data:
                b64 = base64.b64encode(part.inline_data.data).decode()
                print(f"[Gemini Flash] Done in {time.time() - t0:.1f}s")
                return {"image_b64": b64}
        print(f"[Gemini Flash] No image part in response after {time.time() - t0:.1f}s")
        return {"error": "Gemini returned no image in response"}
    except Exception as e:
        msg = str(e)
        print(f"[Gemini Flash] Failed after {time.time() - t0:.1f}s: {msg}")
        if "429" in msg or "RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower():
            return {"error": "Gemini image generation requires billing enabled on your Google AI Studio project. Visit https://aistudio.google.com to enable it, then retry."}
        if "400" in msg and "billed" in msg.lower():
            return {"error": "Gemini image generation requires a paid Google AI Studio account. Visit https://aistudio.google.com to upgrade."}
        return {"error": msg}
