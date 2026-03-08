export const config = {
  databaseUrl: required('DATABASE_URL'),
  redisUrl: required('REDIS_URL'),
  s3Endpoint: required('S3_ENDPOINT'),
  s3Bucket: required('S3_BUCKET'),
  s3Region: process.env.S3_REGION ?? 'us-east-1',
  s3AccessKey: required('S3_ACCESS_KEY'),
  s3SecretKey: required('S3_SECRET_KEY'),
  ffmpegPath: process.env.FFMPEG_PATH ?? '/opt/homebrew/bin/ffmpeg', // Default to path on mac
};

function required(key) {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}
