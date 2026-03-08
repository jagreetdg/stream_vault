import { Router } from 'express';
import { nanoid } from 'nanoid';
import { pool } from '../db.js';
import { presignedPutUrl } from '../s3.js';
import { redis } from '../redis.js';
import { config } from '../config.js';

export const uploadRouter = Router();

const ALLOWED_TYPES = new Set([
  'video/mp4', 'video/quicktime', 'video/webm',
  'video/x-matroska', 'video/avi', 'video/x-msvideo', 'video/x-ms-wmv',
]);

// POST /api/upload/init
uploadRouter.post('/init', async (req, res, next) => {
  try {
    const { filename, file_size, content_type } = req.body;

    if (!filename || !file_size || !content_type)
      return res.status(400).json({ error: 'Missing required fields' });
    if (file_size > config.maxUploadSize)
      return res.status(413).json({ error: 'File exceeds 1 GB limit' });
    if (!ALLOWED_TYPES.has(content_type))
      return res.status(415).json({ error: 'Unsupported video format' });

    const ext = filename.split('.').pop() ?? 'mp4';
    const videoId = nanoid();
    const s3Key = `raw/${videoId}/source.${ext}`;

    await pool.query(
      `INSERT INTO videos (id, status, original_name, content_type, file_size, s3_raw_key)
       VALUES ($1, 'pending', $2, $3, $4, $5)`,
      [videoId, filename, content_type, file_size, s3Key]
    );

    const uploadUrl = await presignedPutUrl(s3Key, content_type);

    res.json({
      video_id: videoId,
      upload_url: uploadUrl,
      watch_url: `/watch/${videoId}`,
      expires_in: config.presignedUrlExpirySeconds,
    });
  } catch (err) { next(err); }
});

// POST /api/upload/complete
uploadRouter.post('/complete', async (req, res, next) => {
  try {
    const { video_id } = req.body;
    if (!video_id) return res.status(400).json({ error: 'Missing video_id' });

    const { rowCount } = await pool.query(
      `UPDATE videos SET status = 'queued' WHERE id = $1 AND status = 'pending'`,
      [video_id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Video not found or already queued' });

    await redis.rpush('transcode_queue', video_id);

    res.status(202).json({
      video_id,
      status: 'queued',
      watch_url: `/watch/${video_id}`,
    });
  } catch (err) { next(err); }
});
