import { redis } from './redis.js';
import { pool } from './db.js';
import { processJob } from './transcoder.js';

export async function runWorkerLoop() {
  console.log('Worker started, listening on transcode_queue');

  // Simple concurrency semaphore
  let running = 0;
  const MAX_CONCURRENT = parseInt(process.env.WORKER_CONCURRENCY ?? '2', 10);

  while (true) {
    if (running >= MAX_CONCURRENT) {
      await new Promise(r => setTimeout(r, 500));
      continue;
    }

    try {
      // BLPOP with 5s timeout — blocks until a job arrives
      const result = await redis.blpop('transcode_queue', 5);
      if (!result) continue; // timeout, loop again

      const [, videoId] = result;
      console.log(`Processing video: ${videoId}`);

      const { rows } = await pool.query(
        'SELECT * FROM videos WHERE id = $1', [videoId]
      );
      if (!rows.length) {
        console.warn(`Video ${videoId} not found in database.`);
        continue;
      }

      const video = rows[0];
      running++;

      processJob(videoId, video.s3_raw_key)
        .catch(err => console.error(`Transcoding failed for ${videoId}:`, err))
        .finally(() => running--);
    } catch (e) {
      console.error("Worker loop error:", e);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}
