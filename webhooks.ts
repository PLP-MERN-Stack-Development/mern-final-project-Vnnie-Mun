import { Router } from 'express';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { createLogger } from '../utils/logger';
import { getRedisConnection } from '../config/redis';
import { uploadToS3, downloadWhatsAppMedia } from '../services/storageService';
import { sendWhatsAppMessage } from '../services/whatsappService';
import { recordFarmerInteraction } from '../services/reportService';

const router = Router();
const logger = createLogger('webhooks');
const connection = getRedisConnection();

// Create job queue
const imageAnalysisQueue = new Queue('image-analysis', { connection });

// WhatsApp webhook verification
router.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    logger.info('✅ Webhook verified');
    res.status(200).send(challenge);
  } else {
    logger.warn('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

// WhatsApp webhook handler
router.post('/whatsapp', async (req, res) => {
  try {
    // Acknowledge immediately
    res.sendStatus(200);

    const body = req.body;
    logger.info('Received WhatsApp webhook', { body: JSON.stringify(body) });

    // Parse webhook payload
    if (!body.entry || !body.entry[0]?.changes || !body.entry[0].changes[0]?.value) {
      logger.warn('Invalid webhook payload');
      return;
    }

    const value = body.entry[0].changes[0].value;
    const messages = value.messages;

    if (!messages || messages.length === 0) {
      logger.info('No messages in webhook');
      return;
    }

    for (const message of messages) {
      const farmerId = message.from;
      const messageType = message.type;

      logger.info(`Processing message from ${farmerId}, type: ${messageType}`);

      // Hash farmer ID for privacy
      const farmerIdHash = createHash('sha256').update(farmerId).digest('hex');

      // Record interaction
      await recordFarmerInteraction(farmerIdHash);

      // Handle image messages
      if (messageType === 'image') {
        const imageId = message.image.id;
        const caption = message.image.caption || message.text?.body || '';

        logger.info(`Image received: ${imageId}`);

        // Send acknowledgment
        await sendWhatsAppMessage(
          farmerId,
          `Asante! Tunapokea picha yako. Tunachunguza...\n\nThank you! We received your photo. Analyzing...`
        );

        try {
          // Download image from WhatsApp
          const imageBuffer = await downloadWhatsAppMedia(imageId);

          // Upload to S3
          const imageKey = `images/${uuidv4()}.jpg`;
          const imageUrl = await uploadToS3(imageKey, imageBuffer, 'image/jpeg');

          logger.info(`Image uploaded to S3: ${imageKey}`);

          // Parse crop hint from caption if present
          const cropHint = extractCropHint(caption);

          // Queue job for analysis
          await imageAnalysisQueue.add('analyze-image', {
            farmerId,
            imageUrl,
            imageS3Key: imageKey,
            cropHint,
            userMessage: caption,
          });

          logger.info(`Job queued for farmer ${farmerId.substring(0, 8)}...`);
          
        } catch (error) {
          logger.error('Error processing image:', error);
          await sendWhatsAppMessage(
            farmerId,
            `Samahani, imeshindikana kuchakata picha yako. Tafadhali jaribu tena.\n\nSorry, we couldn't process your image. Please try again.`
          );
        }
      }
      // Handle text messages
      else if (messageType === 'text') {
        const text = message.text.body.toLowerCase();

        if (text.includes('stop') || text.includes('acha')) {
          // Handle opt-out
          await sendWhatsAppMessage(
            farmerId,
            `Umesajiliwa kutoka kwa huduma. Tuma START kuendelea.\n\nYou've been unsubscribed. Send START to resume.`
          );
        } else {
          // Request image
          await sendWhatsAppMessage(
            farmerId,
            `Habari! Tuma picha ya mmea wako ulioathirika ili kukusaidia kuchunguza.\n\nHello! Send a photo of your affected crop so we can help diagnose.`
          );
        }
      }
    }

  } catch (error) {
    logger.error('Webhook error:', error);
    // Already sent 200, so just log the error
  }
});

// Helper to extract crop hint from text
function extractCropHint(text: string): string | undefined {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('nyanya') || lowerText.includes('tomato')) return 'tomato';
  if (lowerText.includes('mahindi') || lowerText.includes('maize') || lowerText.includes('corn')) return 'maize';
  if (lowerText.includes('muhogo') || lowerText.includes('cassava')) return 'cassava';
  
  return undefined;
}

export default router;