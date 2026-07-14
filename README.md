# 🩺 Pneumonia Detection & Region-Based Analysis using Deep Learning

An AI-powered web application that detects **Pneumonia from Chest X-ray images** using a custom **Convolutional Neural Network (CNN)**. The system provides not only disease prediction but also **Grad-CAM visual explanations**, an **AI Doctor Assistant**, and downloadable diagnostic reports, making the prediction more interpretable and user-friendly.

---

## 🚀 Features

- 🩻 Upload Chest X-ray Images
- 🤖 Pneumonia Detection using Custom CNN
- 📊 Confidence Score & Risk Level Prediction
- 🔥 Grad-CAM Heatmap for Explainable AI
- 💬 AI Doctor Assistant (Powered by Gemini)
- 📄 Downloadable Diagnostic Report (PDF)
- ⚡ Responsive and Modern User Interface
- 🔗 REST API-based Backend Integration

---

## 📷 Demo
<img width="1632" height="1078" alt="image" src="https://github.com/user-attachments/assets/a7e60dce-ece9-4057-b7a9-9235662b4d63" />

### Home Page
<img width="1661" height="1078" alt="image" src="https://github.com/user-attachments/assets/c75bae31-8a1b-4fb6-ac10-faa2fee630b8" />

### Prediction Result
<img width="1350" height="587" alt="image" src="https://github.com/user-attachments/assets/fc289d6a-e1b0-47f3-9ae0-f49fc15ca7a0" />

### Grad-CAM Visualization
<img width="1265" height="802" alt="image" src="https://github.com/user-attachments/assets/8986a3ba-b72a-4ab8-b942-453a44b15710" />

### AI Doctor Assistant
<img width="1333" height="666" alt="image" src="https://github.com/user-attachments/assets/1e899d72-93bf-4734-9bd7-c9c548d1b71a" />

### Diagnostic Report
<img width="707" height="1005" alt="image" src="https://github.com/user-attachments/assets/f0031711-c444-4b43-99f8-7590e906b4f2" />
<img width="703" height="947" alt="image" src="https://github.com/user-attachments/assets/70965b4d-32c6-4b49-bb21-99fca5b6974e" />


---

# 🏗️ System Architecture

```
                User
                  │
                  ▼
        React + TypeScript Frontend
                  │
          Upload Chest X-ray
                  │
                  ▼
             Flask Backend
                  │
     Image Preprocessing (224×224)
                  │
                  ▼
        Custom CNN (PyTorch Model)
                  │
      ┌───────────┴────────────┐
      ▼                        ▼
 Prediction             Grad-CAM Heatmap
      │                        │
      └───────────┬────────────┘
                  ▼
        AI Doctor Assistant
                  │
                  ▼
      Diagnostic Report Generation
```

---

# 🛠️ Tech Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

## Backend

- Flask
- Python

## Deep Learning

- PyTorch
- Custom CNN
- Grad-CAM

## AI

- Gemini API

## Data Processing

- NumPy
- Pandas
- Pillow (PIL)

## Machine Learning Utilities

- Scikit-learn

## Visualization

- Matplotlib

---

# 📂 Project Structure

```
project/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── app.py
│   ├── model.py
│   ├── routes.py
│   └── requirements.txt
│
├── model/
│   ├── cnn_model.pth
│   └── gradcam.py
│
├── reports/
│
├── dataset/
│
└── README.md
```

---

# 🧠 Model Architecture

Custom Convolutional Neural Network

- 4 Convolution Blocks
- Batch Normalization
- ReLU Activation
- Max Pooling
- Dropout (0.5)
- Fully Connected Layer
- Softmax Output

Input Image Size

```
224 × 224
```

Classes

- Normal
- Pneumonia

---

# 📊 Dataset

Chest X-ray Pneumonia Dataset

| Split | Images |
|--------|--------|
| Training | 8198 |
| Validation | 2342 |
| Testing | 1172 |

Total Images

```
11,712
```

---

# 📈 Model Performance

| Metric | Score |
|---------|--------|
| Accuracy | **95.22%** |
| Precision | **91.14%** |
| Recall | **91.14%** |
| F1 Score | **91.14%** |

---

# 🔥 Explainable AI

The project integrates **Grad-CAM** to highlight the infected regions of Chest X-ray images.

Benefits:

- Improves model interpretability
- Builds trust among users
- Helps understand prediction decisions
- Highlights infected lung regions

---

# 🤖 AI Doctor Assistant

The integrated AI assistant can:

- Explain prediction results
- Suggest precautions
- Provide basic medical guidance
- Answer pneumonia-related questions
- Handle unrelated questions safely

> **Note:** This assistant is for educational purposes only and does not replace professional medical advice.

---

# 📄 Report Generation

The system automatically generates a diagnostic report containing:

- Prediction Result
- Confidence Score
- Risk Level
- AI Recommendations
- Precautions
- Grad-CAM Visualization

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/Pneumonia-Detection.git
```

```bash
cd Pneumonia-Detection
```

---

## Backend Setup

```bash
cd backend
```

```bash
pip install -r requirements.txt
```

```bash
python app.py
```

---

## Frontend Setup

```bash
cd frontend
```

```bash
npm install
```

```bash
npm run dev
```

---

# 📌 Workflow

1. Upload Chest X-ray Image
2. Backend preprocesses image
3. CNN predicts disease
4. Confidence Score calculated
5. Grad-CAM heatmap generated
6. AI Doctor Assistant provides explanation
7. PDF report generated
8. User downloads report

---

# 🎯 Future Improvements

- Multi-disease Detection
- Transfer Learning (ResNet, EfficientNet)
- Mobile Application
- Cloud Deployment
- Electronic Health Record (EHR) Integration
- Personalized Medical Recommendations

---

# 👨‍💻 Author

**Rich Amrutiya**

M.Tech Computer Science  
Indian Institute of Technology Madras

GitHub:
https://github.com/RichAmrutiya

LinkedIn:
*(Add your LinkedIn URL here)*

---

# ⭐ If you found this project useful, don't forget to star the repository!
