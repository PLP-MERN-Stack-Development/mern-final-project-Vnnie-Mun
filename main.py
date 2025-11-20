from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, List
import logging
import os
from datetime import datetime

from .model import load_model, predict_from_url, predict_from_bytes
from .advice import get_disease_advice

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Crop Doctor ML Service",
    description="Image classification service for crop disease diagnosis",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model on startup
@app.on_event("startup")
async def startup_event():
    logger.info("Loading ML model...")
    try:
        load_model()
        logger.info("✅ Model loaded successfully")
    except Exception as e:
        logger.error(f"❌ Failed to load model: {e}")
        # Continue anyway for demo purposes


class PredictionRequest(BaseModel):
    image_url: HttpUrl
    crop_hint: Optional[str] = None


class Prediction(BaseModel):
    class_id: int
    crop: str
    disease: str
    disease_sw: str
    confidence: float
    severity: str
    advice_en: str
    advice_sw: str


class PredictionResponse(BaseModel):
    predictions: List[Prediction]
    processing_ms: int
    timestamp: str


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ml-inference",
        "timestamp": datetime.utcnow().isoformat(),
        "model_loaded": True  # TODO: actual check
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict_from_url_endpoint(request: PredictionRequest):
    """Predict disease from image URL"""
    try:
        start_time = datetime.utcnow()
        
        logger.info(f"Predicting from URL: {request.image_url}")
        
        # Get predictions
        predictions = await predict_from_url(str(request.image_url), request.crop_hint)
        
        # Enrich with advice
        enriched_predictions = []
        for pred in predictions:
            advice = get_disease_advice(pred['disease'])
            enriched_predictions.append(Prediction(
                class_id=pred['class_id'],
                crop=pred['crop'],
                disease=pred['disease'],
                disease_sw=pred.get('disease_sw', pred['disease']),
                confidence=pred['confidence'],
                severity=pred.get('severity', 'moderate'),
                advice_en=advice['en'],
                advice_sw=advice['sw']
            ))
        
        processing_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        return PredictionResponse(
            predictions=enriched_predictions,
            processing_ms=processing_ms,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/upload", response_model=PredictionResponse)
async def predict_from_upload(
    file: UploadFile = File(...),
    crop_hint: Optional[str] = Form(None)
):
    """Predict disease from uploaded image"""
    try:
        start_time = datetime.utcnow()
        
        # Read image bytes
        image_bytes = await file.read()
        
        logger.info(f"Predicting from upload: {file.filename}, size: {len(image_bytes)} bytes")
        
        # Get predictions
        predictions = await predict_from_bytes(image_bytes, crop_hint)
        
        # Enrich with advice
        enriched_predictions = []
        for pred in predictions:
            advice = get_disease_advice(pred['disease'])
            enriched_predictions.append(Prediction(
                class_id=pred['class_id'],
                crop=pred['crop'],
                disease=pred['disease'],
                disease_sw=pred.get('disease_sw', pred['disease']),
                confidence=pred['confidence'],
                severity=pred.get('severity', 'moderate'),
                advice_en=advice['en'],
                advice_sw=advice['sw']
            ))
        
        processing_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        return PredictionResponse(
            predictions=enriched_predictions,
            processing_ms=processing_ms,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "AI Crop Doctor ML Inference",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "predict_url": "/predict",
            "predict_upload": "/predict/upload",
            "docs": "/docs"
        }
    }