import axios from 'axios';
import { createLogger } from '../utils/logger';

const logger = createLogger('ml-service');

export async function processImageAnalysis(imageUrl: string, cropHint?: string): Promise<any> {
  try {
    const response = await axios.post(`${process.env.ML_SERVICE_URL}/predict`, {
      image_url: imageUrl,
      crop_hint: cropHint
    });

    const prediction = response.data.predictions[0];
    
    return {
      disease: prediction.disease,
      disease_sw: prediction.disease_sw,
      confidence: prediction.confidence,
      severity: prediction.severity,
      advice_en: prediction.advice_en,
      advice_sw: prediction.advice_sw
    };
  } catch (error) {
    logger.error('ML service error:', error);
    throw error;
  }
}