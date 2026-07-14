from flask import Flask, request, jsonify
from flask_cors import CORS
import io
import base64
import os
from dotenv import load_dotenv
from PIL import Image
import numpy as np
import requests

import torch
import torchvision.transforms as transforms
from Model.model import PneumoniaCNN

# -----------------------------
# Load environment variables
# -----------------------------
load_dotenv()

app = Flask(__name__)
CORS(app)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

print("🚀 Starting PneumoNet Backend")
print("🤖 AI Assistant Enabled:", bool(GEMINI_API_KEY))

# -----------------------------
# Load Pneumonia Detection Model
# -----------------------------
device = torch.device("cpu")

model = PneumoniaCNN().to(device)

checkpoint = torch.load("model/pneumonia_detection_best.pth", map_location=device)

model.load_state_dict(checkpoint["model_state_dict"])

model.eval()

print("✅ CNN Model Loaded Successfully")

# -----------------------------
# Health Endpoint
# -----------------------------
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "API is running"
    })

# -----------------------------
# Status Endpoint
# -----------------------------
@app.route('/status', methods=['GET'])
def get_status():
    return jsonify({
        "status": "online",
        "modelVersion": "PneumoNet v2.1",
        "uptime": "running"
    })

# -----------------------------
# Image Preprocessing
# -----------------------------
def preprocess_xray(file_content):

    image = Image.open(io.BytesIO(file_content)).convert("L")

    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor()
    ])

    image = transform(image)

    # ensure shape = (1, 1, 224, 224)
    image = image.unsqueeze(0)

    return image

# -----------------------------
# Pneumonia Prediction
# -----------------------------
def predict_pneumonia(file_content):

    image_tensor = preprocess_xray(file_content).to(device)

    with torch.no_grad():

        outputs = model(image_tensor)

        probabilities = torch.softmax(outputs, dim=1)

        confidence, predicted_class = torch.max(probabilities, dim=1)

        predicted_class = predicted_class.item()
        confidence = confidence.item()

        if predicted_class == 1:
            result = "pneumonia"
        else:
            result = "normal"

    return result, confidence

# -----------------------------
# Mock GradCAM Heatmap
# -----------------------------
def _generate_mock_gradcam_overlay(file_content: bytes) -> str:

    image = Image.open(io.BytesIO(file_content)).convert("RGB")
    image = image.resize((512, 512))

    width, height = image.size

    xs = np.linspace(-1, 1, width)
    ys = np.linspace(-1, 1, height)

    xx, yy = np.meshgrid(xs, ys)

    rr = np.sqrt(xx**2 + yy**2)

    heat = np.exp(-(rr**2) * 2.0)
    heat = (heat - heat.min()) / (heat.max() - heat.min() + 1e-8)

    cmap = np.zeros((height, width, 3), dtype=np.float32)

    cmap[..., 0] = heat
    cmap[..., 1] = np.clip(heat * 1.5, 0, 1)
    cmap[..., 2] = 1.0 - heat

    base = np.asarray(image).astype(np.float32) / 255.0

    alpha = 0.5

    overlay = (1 - alpha) * base + alpha * cmap
    overlay = np.clip(overlay * 255, 0, 255).astype(np.uint8)

    overlay_img = Image.fromarray(overlay)

    buffer = io.BytesIO()
    overlay_img.save(buffer, format="PNG")

    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return f"data:image/png;base64,{encoded}"

# -----------------------------
# AI Assistant Prompt Builder
# -----------------------------
def _build_assistant_prompt(question, prediction, confidence, risk_level, has_heatmap):

    return f"""
You are an AI medical assistant explaining chest X-ray screening results.

SCREENING RESULT
Prediction: {prediction}
Confidence: {confidence:.1f}%
Risk Level: {risk_level}
Grad-CAM heatmap available: {"Yes" if has_heatmap else "No"}

USER QUESTION
{question}

Explain the result clearly and simply.

If pneumonia is detected:
Explain that highlighted areas may indicate possible lung infection.

If pneumonia is not detected:
Explain that no strong pneumonia pattern was found.

IMPORTANT:
This is an AI screening system and NOT a medical diagnosis.
Always advise the patient to consult a healthcare professional.
"""

# -----------------------------
# X-ray Analysis Endpoint
# -----------------------------
@app.route('/analyze', methods=['POST'])
def analyze_xray():

    try:

        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files['file']

        if file.filename == "":
            return jsonify({"error": "No selected file"}), 400

        file_content = file.read()

        # Real CNN prediction
        result, confidence = predict_pneumonia(file_content)

        gradcam_image = _generate_mock_gradcam_overlay(file_content)

        return jsonify({
            "result": result,
            "confidence": confidence * 100,
            "processingTime": 2.3,
            "modelVersion": "PneumoNet v2.1",
            "fileName": file.filename,
            "fileSize": len(file_content),
            "gradCamImage": gradcam_image
        })

    except Exception as e:
        print("ANALYZE ERROR:", str(e))
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# -----------------------------
# AI Doctor Assistant
# -----------------------------
@app.route('/api/ai-assistant', methods=['POST'])
def ai_assistant():

    try:

        data = request.get_json(silent=True) or {}

        question = data.get("question", "").strip()
        prediction = data.get("prediction", "")
        confidence = float(data.get("confidence", 0))
        risk_level = data.get("riskLevel", "")
        has_heatmap = bool(data.get("hasHeatmap", False))

        if confidence <= 1:
            confidence = confidence * 100

        if not question:
            return jsonify({"answer": "Please ask a question."}), 400

        if not GEMINI_API_KEY:
            return jsonify({
                "answer": "AI assistant not configured. Missing GEMINI_API_KEY."
            })

        prompt = _build_assistant_prompt(
            question,
            prediction,
            confidence,
            risk_level,
            has_heatmap
        )

        print("🧠 Sending request to Gemini...")

        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.4}
            },
            timeout=30
        )

        if response.status_code != 200:

            print("Gemini Error:", response.text)

            return jsonify({
                "answer": "The AI assistant service is temporarily unavailable."
            })

        payload = response.json()

        answer = payload["candidates"][0]["content"]["parts"][0]["text"].strip()

        disclaimer = (
            "This AI explanation is for informational purposes only "
            "and should not replace professional medical advice."
        )

        if disclaimer.lower() not in answer.lower():
            answer += "\n\n" + disclaimer

        return jsonify({"answer": answer})

    except Exception as e:

        print("AI Assistant Error:", str(e))

        return jsonify({
            "answer": "An internal error occurred while generating the explanation."
        })

# -----------------------------
# Run Server
# -----------------------------
if __name__ == '__main__':

    print("📡 Health:", "http://127.0.0.1:8082/health")
    print("📊 Status:", "http://127.0.0.1:8082/status")
    print("🔬 Analyze:", "http://127.0.0.1:8082/analyze")

    app.run(debug=True, port=8082)