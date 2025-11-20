import { Worker, Job } from 'bullmq';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger';
import { getRedisConnection } from './config/redis';
import { processImageAnalysis } from './services/mlService';
import { sendWhatsAppMessage } from './services/whatsappService';
import { saveReport } from './services/reportService';
import { createHash } from 'crypto';

dotenv.config();

const logger = createLogger('worker');
const connection = getRedisConnection();

interface ImageAnalysisJob {
  farmerId: string;
  imageUrl: string;
  imageS3Key: string;
  cropHint?: string;
  userMessage?: string;
  location?: { lat: number; lng: number };
}

// Process image analysis jobs
const worker = new Worker<ImageAnalysisJob>(
  'image-analysis',
  async (job: Job<ImageAnalysisJob>) => {
    const { farmerId, imageUrl, imageS3Key, cropHint, userMessage, location } = job.data;
    
    logger.info(`Processing job ${job.id} for farmer ${farmerId.substring(0, 8)}...`);

    try {
      // Call ML service for prediction
      const prediction = await processImageAnalysis(imageUrl, cropHint);
      
      logger.info(`Prediction for job ${job.id}:`, {
        disease: prediction.disease,
        confidence: prediction.confidence
      });

      // Hash farmer ID for privacy
      const farmerIdHash = createHash('sha256').update(farmerId).digest('hex');

      // Save report to database
      const report = await saveReport({
        farmerIdHash,
        imageUrl,
        imageS3Key,
        cropHint,
        userMessage,
        location,
        prediction
      });

      // Compose bilingual response
      const needsReview = prediction.confidence < parseFloat(process.env.MODEL_CONFIDENCE_THRESHOLD || '0.65');
      
      let message = `*MATOKEO YA UCHUNGUZI / DIAGNOSIS RESULTS*\n\n`;
      
      if (needsReview) {
        message += `⚠️ *Hakikisho limepungua / Low Confidence*\n\n`;
      }
      
      message += `📋 *Ugonjwa / Disease:*\n${prediction.disease_sw} / ${prediction.disease}\n\n`;
      message += `📊 *Ukali / Severity:* ${prediction.severity}\n\n`;
      message += `💊 *Ushauri / Advice:*\n\n`;
      message += `*SW:* ${prediction.advice_sw}\n\n`;
      message += `*EN:* ${prediction.advice_en}\n\n`;
      
      if (needsReview) {
        message += `\n_Mtaalamu atachukulia hii kwa uchunguzi zaidi._\n_A specialist will review this for further analysis._`;
      }
      
      message += `\n\n---\nRipoti Nambari / Report ID: ${report.reportUuid.substring(0, 8)}`;

      // Send WhatsApp response
      await sendWhatsAppMessage(farmerId, message);
      
      logger.info(`Job ${job.id} completed successfully`);
      
      return { success: true, reportId: report.id };
      
    } catch (error) {
      logger.error(`Job ${job.id} failed:`, error);
      
      // Send error message to farmer
      await sendWhatsAppMessage(
        farmerId,
        `Samahani, kumekuwa na tatizo la kiufundi. Tafadhali jaribu tena baadaye.\n\nSorry, there was a technical issue. Please try again later.`
      );
      
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 }
  }
);

worker.on('completed', (job) => {
  logger.info(`✅ Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  logger.error(`❌ Job ${job?.id} failed:`, err);
});

worker.on('error', (err) => {
  logger.error('Worker error:', err);
});

logger.info('🔧 Worker started, waiting for jobs...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing worker...');
  await worker.close();
  process.exit(0);
});