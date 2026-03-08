export const config = {
  databaseUrl: required('DATABASE_URL'),
  redisUrl: required('REDIS_URL'),
  s3Endpoint: required('S3_ENDPOINT'),
  s3Bucket: required('S3_BUCKET'),
  s3Region: process.env.S3_REGION ?? 'us-east-1',
  s3AccessKey: required('S3_ACCESS_KEY'),
  s3SecretKey: required('S3_SECRET_KEY'),
  cdnBaseUrl: required('CDN_BASE_URL'),
  presignedUrlExpirySeconds: 3600,
  maxUploadSize: 1 * 1024 * 1024 * 1024, // 1 GiB
  port: parseInt(process.env.PORT ?? '8080', 10),
};

function required(key) {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}
