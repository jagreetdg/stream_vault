import { Router } from 'express';
import { pool } from '../db.js';
import { config } from '../config.js';

export const videoRouter = Router();

// GET /api/video/:id
videoRouter.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM videos WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    const video = rows[0];
    const hlsUrl = video.hls_manifest
      ? `${config.cdnBaseUrl}/${video.hls_manifest}`
      : null;

    res.json({
      video_id: video.id,
      title: video.title ?? null,
      status: video.status,
      hls_url: hlsUrl,
      duration_seconds: video.duration_secs,
      created_at: video.created_at,
      error: video.error_message ?? null,
    });
  } catch (err) { next(err); }
});
