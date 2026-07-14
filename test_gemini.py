import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

prompt = "Hello"

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
res = requests.post(url, json={
    "contents": [{"parts": [{"text": prompt}]}]
})
print("STATUS", res.status_code)
print("BODY", res.text)
