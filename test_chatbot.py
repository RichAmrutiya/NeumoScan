import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"API Key loaded: {api_key[:10] if api_key else 'None'}...")

res = requests.post("http://127.0.0.1:8082/api/ai-assistant", json={
    "question": "What does this result mean?",
    "prediction": "pneumonia",
    "confidence": 0.95,
    "riskLevel": "high",
    "hasHeatmap": True
})

print(res.status_code)
print(res.text)
