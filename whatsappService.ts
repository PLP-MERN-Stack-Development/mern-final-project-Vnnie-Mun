import axios from 'axios';
import { createLogger } from '../utils/logger';

const logger = createLogger('whatsapp');

const WHATSAPP_API_URL = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v18.0'}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
const USE_MOCK = process.env.USE_MOCK_WHATSAPP === 'true';

export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  if (USE_MOCK) {
    logger.info(`[MOCK] Sending message to ${to}: ${text.substring(0, 50)}...`);
    return;
  }

  try {
    await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    logger.info(`Message sent to ${to}`);
  } catch (error) {
    logger.error('WhatsApp send error:', error);
    throw error;
  }
}