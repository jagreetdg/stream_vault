-- migrations/001_create_videos.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE video_status AS ENUM (
  'pending',
  'queued', 
  'processing',
  'ready',
  'error'
);

CREATE TABLE videos (
  id            VARCHAR(21) PRIMARY KEY,        -- nanoid
  status        video_status NOT NULL DEFAULT 'pending',
  original_name VARCHAR(255) NOT NULL,
  content_type  VARCHAR(100) NOT NULL,
  file_size     BIGINT NOT NULL,
  s3_raw_key    VARCHAR(512),                   -- raw/{id}/source.{ext}
  s3_hls_prefix VARCHAR(512),                   -- hls/{id}/
  hls_manifest  VARCHAR(512),                   -- hls/{id}/index.m3u8
  duration_secs INTEGER,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ready_at      TIMESTAMPTZ
);

CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_created_at ON videos(created_at);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
