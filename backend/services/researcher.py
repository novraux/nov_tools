import json
from anthropic import Anthropic
from config import settings

# Initialize Anthropic client if key is present
client = Anthropic(api_key=settings.ANTHROPIC_API_KEY) if settings.ANTHROPIC_API_KEY else None

def analyze_niche(keyword: str) -> dict:
    if not client:
        return {
            "worth_it": False,
            "target_audience": "API Key Missing",
            "competitor_insights": "Please configure ANTHROPIC_API_KEY in .env",
            "design_angles": []
        }

    prompt = f"""
    You are an expert Print-on-Demand (POD) niche researcher.
    Analyze the niche: "{keyword}".
    
    Provide your response as a raw JSON object with the following schema:
    {{
      "worth_it": boolean,
      "target_audience": "string describing the target audience",
      "competitor_insights": "string describing competitor landscape",
      "design_angles": ["idea 1", "idea 2", "idea 3"]
    }}
    
    Return ONLY valid JSON. No markdown formatting, no explanations outside the JSON.
    """
    
    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            temperature=0.7,
            system="You are an expert Print-on-Demand researcher. Output strictly valid JSON.",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        content = response.content[0].text.strip()
        # Remove markdown code blocks if present
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        return json.loads(content)
        
    except Exception as e:
        print(f"Failed to parse Claude response: {e}")
        return {
            "worth_it": False,
            "target_audience": "Error analyzing audience.",
            "competitor_insights": "Error analyzing competitors.",
            "design_angles": []
        }
