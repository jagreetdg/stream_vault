import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { config } from './config.js';
import * as fs from 'fs'; // Added for createReadStream

export const s3 = new S3Client({
  endpoint: config.s3Endpoint,
  region: config.s3Region,
  credentials: { accessKeyId: config.s3AccessKey, secretAccessKey: config.s3SecretKey },
  forcePathStyle: true,
});

export async function downloadFromS3(key, destPath) {
  const command = new GetObjectCommand({
    Bucket: config.s3Bucket,
    Key: key,
  });
  const response = await s3.send(command);
  await pipeline(response.Body, createWriteStream(destPath));
}

export async function uploadFile(sourcePath, key, contentType) {
  const fileStream = fs.createReadStream(sourcePath);
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: config.s3Bucket,
      Key: key,
      Body: fileStream,
      ContentType: contentType,
    },
  });
  await upload.done();
}

export async function deleteFromS3(key) {
  const command = new DeleteObjectCommand({
    Bucket: config.s3Bucket,
    Key: key,
  });
  await s3.send(command);
}
