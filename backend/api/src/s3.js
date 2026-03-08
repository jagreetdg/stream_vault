import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from './config.js';

// Internal client for server-side S3 operations
export const s3 = new S3Client({
  endpoint: config.s3Endpoint,
  region: config.s3Region,
  credentials: { accessKeyId: config.s3AccessKey, secretAccessKey: config.s3SecretKey },
  forcePathStyle: true,
});

// Public client for generating browser-facing presigned URLs
// Uses the public endpoint so the signature matches the host the browser will use
const s3Public = new S3Client({
  endpoint: config.s3PublicEndpoint || config.s3Endpoint,
  region: config.s3Region,
  credentials: { accessKeyId: config.s3AccessKey, secretAccessKey: config.s3SecretKey },
  forcePathStyle: true,
});

export async function presignedPutUrl(key, contentType) {
  const command = new PutObjectCommand({
    Bucket: config.s3Bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3Public, command, { expiresIn: config.presignedUrlExpirySeconds });
}
