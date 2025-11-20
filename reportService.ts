import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';

export async function saveReport(data: any) {
  const needsReview = data.prediction.confidence < parseFloat(process.env.MODEL_CONFIDENCE_THRESHOLD || '0.65');

  const result = await query(
    `INSERT INTO reports (
      report_uuid, farmer_id_hash, image_url, image_s3_key, crop_hint, user_message,
      predicted_disease, predicted_disease_sw, confidence, severity_score,
      advice_en, advice_sw, needs_human_review
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
    [
      uuidv4(),
      data.farmerIdHash,
      data.imageUrl,
      data.imageS3Key,
      data.cropHint,
      data.userMessage,
      data.prediction.disease,
      data.prediction.disease_sw,
      data.prediction.confidence,
      data.prediction.severity === 'severe' ? 0.8 : 0.5,
      data.prediction.advice_en,
      data.prediction.advice_sw,
      needsReview
    ]
  );

  return { id: result.rows[0].id, reportUuid: result.rows[0].report_uuid };
}

export async function recordFarmerInteraction(farmerIdHash: string) {
  await query(
    `INSERT INTO farmer_interactions (farmer_id_hash, last_interaction, total_reports)
     VALUES ($1, NOW(), 1)
     ON CONFLICT (farmer_id_hash) 
     DO UPDATE SET last_interaction = NOW(), total_reports = farmer_interactions.total_reports + 1`,
    [farmerIdHash]
  );
}