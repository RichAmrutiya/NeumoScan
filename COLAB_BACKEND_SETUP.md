# Google Colab Backend Setup Guide

This guide will help you set up your Google Colab backend to work with your React.js frontend.

## Prerequisites

- Google Colab account
- ngrok account (for public URL) or local development setup
- Python environment with required packages

## Step 1: Create Your Colab Backend

Create a new Google Colab notebook and add the following code:

### 1.1 Install Required Packages

```python
!pip install fastapi uvicorn python-multipart pillow numpy tensorflow torch torchvision
!pip install ngrok-py
```

### 1.2 Import Libraries

```python
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import io
import base64
from PIL import Image
import numpy as np
import tensorflow as tf
import torch
import torchvision.transforms as transforms
from typing import Dict, Any
import time
import os
```

### 1.3 Create FastAPI App with CORS

```python
app = FastAPI(title="Pneumonia Detection API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 1.4 Load Your AI Model

```python
# Load your trained model here
# Example for TensorFlow model:
# model = tf.keras.models.load_model('path_to_your_model.h5')

# Example for PyTorch model:
# model = torch.load('path_to_your_model.pth', map_location='cpu')
# model.eval()

# For demo purposes, we'll create a mock model
class MockPneumoniaModel:
    def predict(self, image):
        # Mock prediction - replace with your actual model
        import random
        result = random.choice(['pneumonia', 'normal'])
        confidence = random.uniform(0.7, 0.95)
        return result, confidence

model = MockPneumoniaModel()
```

### 1.5 Image Processing Function

```python
def process_image(file_content: bytes) -> np.ndarray:
    """Process uploaded image for model prediction"""
    try:
        # Open image
        image = Image.open(io.BytesIO(file_content))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize image (adjust size based on your model requirements)
        image = image.resize((224, 224))
        
        # Convert to numpy array and normalize
        image_array = np.array(image) / 255.0
        
        # Add batch dimension
        image_array = np.expand_dims(image_array, axis=0)
        
        return image_array
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")
```

### 1.6 API Endpoints

```python
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "API is running"}

@app.get("/status")
async def get_status():
    """Get server status and model information"""
    return {
        "status": "online",
        "modelVersion": "PneumoNet v2.1",
        "uptime": time.time()
    }

@app.post("/analyze")
async def analyze_xray(file: UploadFile = File(...)):
    """Analyze X-ray image for pneumonia"""
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read file content
        file_content = await file.read()
        
        # Validate file size (max 10MB)
        if len(file_content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size too large (max 10MB)")
        
        # Process image
        start_time = time.time()
        processed_image = process_image(file_content)
        
        # Make prediction
        result, confidence = model.predict(processed_image)
        processing_time = time.time() - start_time
        
        return {
            "result": result,
            "confidence": float(confidence),
            "processingTime": processing_time,
            "modelVersion": "PneumoNet v2.1",
            "fileName": file.filename,
            "fileSize": len(file_content)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
```

### 1.7 Run the Server

```python
# Run the server
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## Step 2: Make Your Backend Publicly Accessible

### Option A: Using ngrok (Recommended)

1. Install ngrok on your local machine or use it in Colab
2. In Colab, run:

```python
# Install ngrok
!pip install pyngrok

# Start ngrok tunnel
from pyngrok import ngrok
public_url = ngrok.connect(8000)
print(f"Public URL: {public_url}")
```

### Option B: Using Colab's Built-in Sharing

1. In your Colab notebook, click on "Share" in the top right
2. Change the sharing settings to "Anyone with the link"
3. Note: This method is less reliable for API endpoints

## Step 3: Configure Your Frontend

1. Copy the `env.example` file to `.env` in your React project root
2. Update the `VITE_API_URL` with your ngrok URL:

```env
VITE_API_URL=https://your-ngrok-url.ngrok.io
```

## Step 4: Test the Connection

1. Start your React development server:
```bash
npm run dev
```

2. Open your browser and check if the server status shows "AI Server Online"
3. Try uploading an X-ray image to test the full flow

## Step 5: Production Considerations

### Security Improvements

1. **Restrict CORS origins** in your Colab backend:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],  # Replace with your domain
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

2. **Add API key authentication** (optional):
```python
API_KEY = "your-secret-api-key"

@app.post("/analyze")
async def analyze_xray(file: UploadFile = File(...), api_key: str = None):
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    # ... rest of your code
```

3. **Add rate limiting** to prevent abuse

### Performance Optimizations

1. **Model caching**: Load your model once and reuse it
2. **Image optimization**: Compress images before processing
3. **Batch processing**: Process multiple images at once if needed

## Troubleshooting

### Common Issues

1. **CORS errors**: Make sure your CORS middleware is properly configured
2. **Connection refused**: Check if your ngrok tunnel is active
3. **File upload errors**: Verify file size limits and content types
4. **Model loading errors**: Ensure your model file is accessible in Colab

### Debug Tips

1. Check the browser's Network tab for API call details
2. Use the Colab terminal to see server logs
3. Test your API endpoints directly using tools like Postman

## Example Complete Colab Notebook

Here's a complete example you can copy into your Colab notebook:

```python
# Complete FastAPI Backend for Pneumonia Detection
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import io
import numpy as np
from PIL import Image
import time
import random

app = FastAPI(title="Pneumonia Detection API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock model for demonstration
class MockPneumoniaModel:
    def predict(self, image):
        result = random.choice(['pneumonia', 'normal'])
        confidence = random.uniform(0.7, 0.95)
        return result, confidence

model = MockPneumoniaModel()

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/status")
async def get_status():
    return {
        "status": "online",
        "modelVersion": "PneumoNet v2.1",
        "uptime": time.time()
    }

@app.post("/analyze")
async def analyze_xray(file: UploadFile = File(...)):
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        file_content = await file.read()
        
        if len(file_content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size too large")
        
        # Process image
        image = Image.open(io.BytesIO(file_content))
        if image.mode != 'RGB':
            image = image.convert('RGB')
        image = image.resize((224, 224))
        image_array = np.array(image) / 255.0
        image_array = np.expand_dims(image_array, axis=0)
        
        # Make prediction
        start_time = time.time()
        result, confidence = model.predict(image_array)
        processing_time = time.time() - start_time
        
        return {
            "result": result,
            "confidence": float(confidence),
            "processingTime": processing_time,
            "modelVersion": "PneumoNet v2.1",
            "fileName": file.filename,
            "fileSize": len(file_content)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# Run the server
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

This setup will give you a fully functional API that your React frontend can communicate with!
