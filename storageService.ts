import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';
import { createLogger } from '../utils/logger';

const logger = createLogger('storage');

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
});

export async function uploadToS3(key: string, buffer: Buffer, contentType: string): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`;
}

export async function downloadWhatsAppMedia(mediaId: string): Promise<Buffer> {
  // Mock for demo
  logger.info(`[MOCK] Downloading WhatsApp media: ${mediaId}`);
  return Buffer.from('mock-image-data');
}