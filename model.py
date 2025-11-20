import torch
import torchvision.transforms as transforms
from PIL import Image
import io
import logging
import aiofiles
import httpx
from typing import List, Dict, Optional
import os

logger = logging.getLogger(__name__)

# Mock model for demo - in production, load actual trained model
MODEL = None
DEVICE = torch.device('cpu')  # Use 'cuda' if GPU available

# PlantVillage disease classes (subset for demo)
DISEASE_CLASSES = {
    0: {"crop": "tomato", "disease": "Early Blight", "disease_sw": "Ugonjwa wa Mapema"},
    1: {"crop": "tomato", "disease": "Late Blight", "disease_sw": "Ugonjwa wa Mwisho"},
    2: {"crop": "tomato", "disease": "Leaf Mold", "disease_sw": "Kuvu ya Majani"},
    3: {"crop": "tomato", "disease": "Healthy", "disease_sw": "Afya Njema"},
    4: {"crop": "maize", "disease": "Common Rust", "disease_sw": "Kutu ya Kawaida"},
    5: {"crop": "maize", "disease": "Northern Leaf Blight", "disease_sw": "Ukungu wa Kaskazini"},
    6: {"crop": "maize", "disease": "Gray Leaf Spot", "disease_sw": "Madoa ya Kijivu"},
    7: {"crop": "maize", "disease": "Healthy", "disease_sw": "Afya Njema"},
    8: {"crop": "cassava", "disease": "Mosaic Disease", "disease_sw": "Ugonjwa wa Mozaiki"},
    9: {"crop": "cassava", "disease": "Brown Streak", "disease_sw": "Mistari ya Kahawia"},
    10: {"crop": "cassava", "disease": "Healthy", "disease_sw": "Afya Njema"},
}

# Image preprocessing
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])


def load_model():
    """Load pre-trained model from checkpoint"""
    global MODEL
    
    model_path = os.getenv('MODEL_PATH', '/app/models/mobilenet_plantvillage.pth')
    
    # For demo purposes, we'll use a mock model
    # In production, load actual model:
    # MODEL = torch.load(model_path, map_location=DEVICE)
    # MODEL.eval()
    
    logger.info(f"Model initialized (demo mode)")
    MODEL = "DEMO_MODEL"  # Placeholder


def preprocess_image(image_bytes: bytes) -> torch.Tensor:
    """Preprocess image for inference"""
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        return transform(image).unsqueeze(0)
    except Exception as e:
        logger.error(f"Image preprocessing error: {e}")
        raise ValueError(f"Invalid image format: {e}")


async def download_image(url: str) -> bytes:
    """Download image from URL"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=30.0)
            response.raise_for_status()
            return response.content
    except Exception as e:
        logger.error(f"Image download error: {e}")
        raise ValueError(f"Failed to download image: {e}")


def mock_inference(image_tensor: torch.Tensor, crop_hint: Optional[str] = None) -> List[Dict]:
    """
    Mock inference for demo purposes
    In production, replace with actual model inference
    """
    import random
    
    # Filter classes by crop hint if provided
    if crop_hint:
        filtered_classes = {k: v for k, v in DISEASE_CLASSES.items() if v['crop'] == crop_hint.lower()}
        if not filtered_classes:
            filtered_classes = DISEASE_CLASSES
    else:
        filtered_classes = DISEASE_CLASSES
    
    # Simulate predictions
    class_ids = list(filtered_classes.keys())
    
    # Top prediction
    top_class = random.choice(class_ids)
    top_confidence = random.uniform(0.55, 0.95)
    
    # Determine severity based on disease type
    disease_name = filtered_classes[top_class]['disease']
    if 'Healthy' in disease_name:
        severity = 'none'
        severity_score = 0.0
    elif 'Blight' in disease_name or 'Rust' in disease_name:
        severity = 'severe'
        severity_score = random.uniform(0.7, 0.9)
    else:
        severity = 'moderate'
        severity_score = random.uniform(0.4, 0.7)
    
    predictions = [{
        'class_id': top_class,
        'crop': filtered_classes[top_class]['crop'],
        'disease': filtered_classes[top_class]['disease'],
        'disease_sw': filtered_classes[top_class]['disease_sw'],
        'confidence': round(top_confidence, 4),
        'severity': severity,
        'severity_score': round(severity_score, 4)
    }]
    
    # Add 2 more predictions with lower confidence
    remaining = [cid for cid in class_ids if cid != top_class]
    for cid in random.sample(remaining, min(2, len(remaining))):
        conf = random.uniform(0.05, top_confidence - 0.1)
        predictions.append({
            'class_id': cid,
            'crop': filtered_classes[cid]['crop'],
            'disease': filtered_classes[cid]['disease'],
            'disease_sw': filtered_classes[cid]['disease_sw'],
            'confidence': round(conf, 4),
            'severity': 'moderate',
            'severity_score': round(random.uniform(0.3, 0.6), 4)
        })
    
    return predictions


async def predict_from_url(image_url: str, crop_hint: Optional[str] = None) -> List[Dict]:
    """Predict disease from image URL"""
    logger.info(f"Predicting from URL: {image_url}")
    
    # Download image
    image_bytes = await download_image(image_url)
    
    # Preprocess
    image_tensor = preprocess_image(image_bytes)
    
    # Inference
    if MODEL == "DEMO_MODEL":
        predictions = mock_inference(image_tensor, crop_hint)
    else:
        # Real inference:
        # with torch.no_grad():
        #     outputs = MODEL(image_tensor.to(DEVICE))
        #     probabilities = torch.nn.functional.softmax(outputs, dim=1)
        #     top_probs, top_classes = torch.topk(probabilities, 3)
        #     predictions = [...]
        predictions = mock_inference(image_tensor, crop_hint)
    
    logger.info(f"Prediction complete: {predictions[0]['disease']} ({predictions[0]['confidence']:.2%})")
    
    return predictions


async def predict_from_bytes(image_bytes: bytes, crop_hint: Optional[str] = None) -> List[Dict]:
    """Predict disease from image bytes"""
    logger.info(f"Predicting from bytes (size: {len(image_bytes)})")
    
    # Preprocess
    image_tensor = preprocess_image(image_bytes)
    
    # Inference
    if MODEL == "DEMO_MODEL":
        predictions = mock_inference(image_tensor, crop_hint)
    else:
        predictions = mock_inference(image_tensor, crop_hint)
    
    logger.info(f"Prediction complete: {predictions[0]['disease']} ({predictions[0]['confidence']:.2%})")
    
    return predictions