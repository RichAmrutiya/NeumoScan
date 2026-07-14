import torch
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
from pathlib import Path
import argparse

from src.model import PneumoniaCNN


def load_model(checkpoint_path, device):
    model = PneumoniaCNN()
    checkpoint = torch.load(checkpoint_path, map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device)
    model.eval()
    return model


def preprocess_image(image_path, image_size=224):
    transform = transforms.Compose([
        transforms.Grayscale(num_output_channels=1),
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.5], std=[0.5])
    ])
    
    image = Image.open(image_path)
    image = transform(image)
    image = image.unsqueeze(0)  # add batch dimension
    return image


def predict(image_path, checkpoint, device):
    model = load_model(checkpoint, device)
    image = preprocess_image(image_path).to(device)

    with torch.no_grad():
        outputs = model(image)
        probs = F.softmax(outputs, dim=1)
        predicted_class = torch.argmax(probs, dim=1).item()
        confidence = probs[0][predicted_class].item()

    class_names = {0: "Pneumonia", 1: "Normal"}

    print(f"\nPrediction: {class_names[predicted_class]}")
    print(f"Confidence: {confidence * 100:.2f}%\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True, help="Path to input X-ray image")
    parser.add_argument("--checkpoint", required=True, help="Path to model checkpoint")
    parser.add_argument("--device", default="cpu", help="cpu or cuda")

    args = parser.parse_args()

    device = torch.device(args.device if torch.cuda.is_available() else "cpu")

    predict(args.image, args.checkpoint, device)