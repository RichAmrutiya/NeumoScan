import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
res = requests.get(url)
models = res.json().get("models", [])
for m in models:
    if "generateContent" in m.get("supportedGenerationMethods", []):
        print(m["name"])
