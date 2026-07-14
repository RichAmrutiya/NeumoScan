"""
Defines custom CNN architecture for pneumonia detection.
No pretrained models will be used initially.

Architecture designed specifically for chest X-ray binary classification:
- Input: Grayscale images (1 channel)
- Progressive feature extraction with increasing depth
- Batch normalization for stable training
- Dropout for regularization
- Output: Logits for 2 classes (Pneumonia, Normal)
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class PneumoniaCNN(nn.Module):
    """
    Custom CNN architecture for chest X-ray pneumonia detection.
    
    Architecture Design Rationale:
    -----------------------------
    1. Input Layer: Accepts grayscale images (1 channel)
       - Chest X-rays are typically grayscale, so single channel is appropriate
    
    2. Convolutional Blocks (4 blocks):
       - Progressive feature extraction: 32 → 64 → 128 → 256 channels
       - 3x3 convolutions: Standard size for capturing spatial patterns
       - Small stride (1) with padding to preserve spatial information
       - Batch Normalization: Stabilizes training, allows higher learning rates
       - ReLU activation: Non-linearity for feature learning
       - MaxPooling: Reduces spatial dimensions, increases receptive field
    
    3. Fully Connected Layers:
       - 512 hidden units: Sufficient capacity for binary classification
       - Batch Normalization: Applied to FC layer for consistency
       - Dropout (0.5): Prevents overfitting, critical for medical imaging
       - Output: 2 logits (raw scores before softmax)
    
    Why this architecture?
    - Medical images require fine-grained feature detection (small filters)
    - Progressive depth allows hierarchical feature learning
    - Batch norm + dropout combination prevents overfitting on limited medical data
    - Simpler than very deep networks, reducing risk of overfitting
    
    Args:
        num_classes: Number of output classes (default: 2 for binary classification)
        dropout_rate: Dropout probability (default: 0.5)
        input_channels: Number of input channels (default: 1 for grayscale)
    """
    
    def __init__(
        self,
        num_classes: int = 2,
        dropout_rate: float = 0.5,
        input_channels: int = 1
    ):
        super(PneumoniaCNN, self).__init__()
        
        self.num_classes = num_classes
        self.dropout_rate = dropout_rate
        
        # ============================================
        # Feature Extraction: Convolutional Blocks
        # ============================================
        
        # Block 1: Initial feature extraction
        # 224x224 → 112x112 (after pooling)
        self.conv1 = nn.Conv2d(
            in_channels=input_channels,
            out_channels=32,
            kernel_size=3,
            stride=1,
            padding=1  # Preserves spatial dimensions
        )
        self.bn1 = nn.BatchNorm2d(32)
        self.pool1 = nn.MaxPool2d(kernel_size=2, stride=2)
        
        # Block 2: Deeper feature extraction
        # 112x112 → 56x56 (after pooling)
        self.conv2 = nn.Conv2d(
            in_channels=32,
            out_channels=64,
            kernel_size=3,
            stride=1,
            padding=1
        )
        self.bn2 = nn.BatchNorm2d(64)
        self.pool2 = nn.MaxPool2d(kernel_size=2, stride=2)
        
        # Block 3: Mid-level feature extraction
        # 56x56 → 28x28 (after pooling)
        self.conv3 = nn.Conv2d(
            in_channels=64,
            out_channels=128,
            kernel_size=3,
            stride=1,
            padding=1
        )
        self.bn3 = nn.BatchNorm2d(128)
        self.pool3 = nn.MaxPool2d(kernel_size=2, stride=2)
        
        # Block 4: High-level feature extraction
        # 28x28 → 14x14 (after pooling)
        self.conv4 = nn.Conv2d(
            in_channels=128,
            out_channels=256,
            kernel_size=3,
            stride=1,
            padding=1
        )
        self.bn4 = nn.BatchNorm2d(256)
        self.pool4 = nn.MaxPool2d(kernel_size=2, stride=2)
        
        # ============================================
        # Classification Head: Fully Connected Layers
        # ============================================
        
        # Calculate flattened size: 256 channels * 14 * 14 = 50176
        # (for 224x224 input after 4 pooling operations: 224/16 = 14)
        self.flatten_size = 256 * 14 * 14
        
        # Fully connected layer 1: Feature aggregation
        self.fc1 = nn.Linear(self.flatten_size, 512)
        self.bn_fc1 = nn.BatchNorm1d(512)
        self.dropout = nn.Dropout(p=dropout_rate)
        
        # Fully connected layer 2: Classification output
        # Outputs raw logits (no activation) for 2 classes
        self.fc2 = nn.Linear(512, num_classes)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass through the network.
        
        Args:
            x: Input tensor of shape (batch_size, 1, height, width)
            
        Returns:
            Logits tensor of shape (batch_size, num_classes)
        """
        # Feature extraction: Convolutional blocks
        # Block 1
        x = self.conv1(x)
        x = self.bn1(x)
        x = F.relu(x)
        x = self.pool1(x)
        # Shape: (batch, 32, 112, 112)
        
        # Block 2
        x = self.conv2(x)
        x = self.bn2(x)
        x = F.relu(x)
        x = self.pool2(x)
        # Shape: (batch, 64, 56, 56)
        
        # Block 3
        x = self.conv3(x)
        x = self.bn3(x)
        x = F.relu(x)
        x = self.pool3(x)
        # Shape: (batch, 128, 28, 28)
        
        # Block 4
        x = self.conv4(x)
        x = self.bn4(x)
        x = F.relu(x)
        x = self.pool4(x)
        # Shape: (batch, 256, 14, 14)
        
        # Flatten for fully connected layers
        x = x.view(x.size(0), -1)
        # Shape: (batch, 256 * 14 * 14) = (batch, 50176)
        
        # Classification head
        x = self.fc1(x)
        x = self.bn_fc1(x)
        x = F.relu(x)
        x = self.dropout(x)  # Dropout only during training
        # Shape: (batch, 512)
        
        # Output layer: raw logits (no activation)
        x = self.fc2(x)
        # Shape: (batch, num_classes)
        
        return x
    
    def get_num_parameters(self) -> dict:
        """
        Calculate and return the number of trainable parameters.
        
        Returns:
            Dictionary with total and trainable parameter counts
        """
        total_params = sum(p.numel() for p in self.parameters())
        trainable_params = sum(p.numel() for p in self.parameters() if p.requires_grad)
        
        return {
            'total': total_params,
            'trainable': trainable_params,
            'total_millions': total_params / 1e6,
            'trainable_millions': trainable_params / 1e6
        }


def create_model(
    num_classes: int = 2,
    dropout_rate: float = 0.5,
    input_channels: int = 1,
    device: str = 'cpu'
) -> PneumoniaCNN:
    """
    Factory function to create and initialize a PneumoniaCNN model.
    
    Args:
        num_classes: Number of output classes (default: 2)
        dropout_rate: Dropout probability (default: 0.5)
        input_channels: Number of input channels (default: 1 for grayscale)
        device: Device to place model on ('cpu' or 'cuda')
        
    Returns:
        Initialized PneumoniaCNN model
    """
    model = PneumoniaCNN(
        num_classes=num_classes,
        dropout_rate=dropout_rate,
        input_channels=input_channels
    )
    
    # Initialize weights using Xavier uniform initialization
    # This helps with training stability
    for m in model.modules():
        if isinstance(m, nn.Conv2d):
            nn.init.xavier_uniform_(m.weight)
            if m.bias is not None:
                nn.init.constant_(m.bias, 0)
        elif isinstance(m, nn.BatchNorm2d) or isinstance(m, nn.BatchNorm1d):
            nn.init.constant_(m.weight, 1)
            nn.init.constant_(m.bias, 0)
        elif isinstance(m, nn.Linear):
            nn.init.xavier_uniform_(m.weight)
            nn.init.constant_(m.bias, 0)
    
    model = model.to(device)
    
    return model


# Example usage and model summary
if __name__ == "__main__":
    # Create a model instance
    model = create_model(num_classes=2, dropout_rate=0.5, input_channels=1)
    
    # Print model architecture
    print("=" * 60)
    print("PneumoniaCNN Architecture")
    print("=" * 60)
    print(model)
    print()
    
    # Print parameter count
    params = model.get_num_parameters()
    print("=" * 60)
    print("Model Parameters")
    print("=" * 60)
    print(f"Total parameters: {params['total']:,}")
    print(f"Trainable parameters: {params['trainable']:,}")
    print(f"Total (millions): {params['total_millions']:.2f}M")
    print()
    
    # Test forward pass with dummy input
    print("=" * 60)
    print("Testing Forward Pass")
    print("=" * 60)
    dummy_input = torch.randn(4, 1, 224, 224)  # Batch of 4, 1 channel, 224x224
    print(f"Input shape: {dummy_input.shape}")
    
    model.eval()
    with torch.no_grad():
        output = model(dummy_input)
        print(f"Output shape: {output.shape}")
        print(f"Output logits (first sample): {output[0]}")
        print(f"Predicted class (argmax): {output[0].argmax().item()}")
