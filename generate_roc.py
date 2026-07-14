import torch
import torch.nn.functional as F
from torch.utils.data import DataLoader
import matplotlib.pyplot as plt
from sklearn.metrics import roc_curve, auc

from Model import create_model
from src.dataset import ChestXRayDataset

# =========================
# CONFIG
# =========================
MODEL_PATH = "Model/pneumonia_detection_best.pth"
DATA_ROOT = "data/raw"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# =========================
# LOAD TEST DATA
# =========================
test_dataset = ChestXRayDataset(
    data_root=DATA_ROOT,
    split='test',
    image_size=(224, 224),
    normalize=True
)

test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False)

# =========================
# LOAD MODEL
# =========================
model = create_model(num_classes=2, input_channels=1)

checkpoint = torch.load(MODEL_PATH, map_location=device)

# handle both cases
if 'model_state_dict' in checkpoint:
    model.load_state_dict(checkpoint['model_state_dict'])
else:
    model.load_state_dict(checkpoint)

model.to(device)
model.eval()

print("Model Loaded")

# =========================
# COLLECT PREDICTIONS
# =========================
y_true = []
y_score = []

with torch.no_grad():
    for images, labels in test_loader:
        images = images.to(device)

        outputs = model(images)
        probs = F.softmax(outputs, dim=1)

        y_score.extend(probs[:, 1].cpu().numpy())  # Pneumonia prob
        y_true.extend(labels.numpy())

print("Predictions Done")

# =========================
# ROC
# =========================
fpr, tpr, _ = roc_curve(y_true, y_score)
roc_auc = auc(fpr, tpr)

print(f"AUC Score: {roc_auc:.4f}")

# =========================
# PLOT
# =========================
plt.figure()
plt.plot(fpr, tpr, label=f"AUC = {roc_auc:.4f}")
plt.plot([0, 1], [0, 1], linestyle='--')

plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")
plt.title("ROC Curve")
plt.legend()
plt.grid()

plt.savefig("roc_curve.png")
plt.show()

print("Saved as roc_curve.png")