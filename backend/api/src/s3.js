import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from './config.js';

export const s3 = new S3Client({
  endpoint: config.s3Endpoint,
  region: config.s3Region,
  credentials: { accessKeyId: config.s3AccessKey, secretAccessKey: config.s3SecretKey },
  forcePathStyle: true, // required for MinIO
});

export async function presignedPutUrl(key, contentType) {
  const command = new PutObjectCommand({
    Bucket: config.s3Bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn: config.presignedUrlExpirySeconds });
}
