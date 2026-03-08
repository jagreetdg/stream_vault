import { spawn } from 'child_process';
import { watch } from 'fs';
import { readdir, stat, rm, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { downloadFromS3, uploadFile } from './s3.js';
import { pool } from './db.js';
import { config } from './config.js';

export async function setStatus(videoId, status) {
  await pool.query('UPDATE videos SET status = $2 WHERE id = $1', [videoId, status]);
}

export async function processJob(videoId, sourceS3Key) {
  const workDir = `/tmp/sv_${videoId}`;
  await mkdir(workDir, { recursive: true });

  await setStatus(videoId, 'processing');

  try {
    // Download source from S3
    const sourcePath = join(workDir, 'source');
    await downloadFromS3(sourceS3Key, sourcePath);

    // Run FFmpeg + concurrent S3 upload
    const duration = await transcodeAndUpload(videoId, sourcePath, workDir);

    await pool.query(
      `UPDATE videos SET status = 'ready', hls_manifest = $2,
       duration_secs = $3, ready_at = NOW() WHERE id = $1`,
      [videoId, `hls/${videoId}/index.m3u8`, Math.round(duration)]
    );
  } catch (err) {
    await pool.query(
      `UPDATE videos SET status = 'error', error_message = $2 WHERE id = $1`,
      [videoId, err.message]
    );
    throw err;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function transcodeAndUpload(videoId, sourcePath, workDir) {
  const hlsPrefix = `hls/${videoId}`;
  const manifestPath = join(workDir, 'index.m3u8');

  // Start segment watcher + uploader concurrently with FFmpeg
  const uploadedSegments = new Set();
  const watcherStop = watchAndUploadSegments(workDir, hlsPrefix, uploadedSegments);

  // Spawn FFmpeg
  await new Promise((resolve, reject) => {
    const ffmpeg = spawn(config.ffmpegPath, [
      '-i', sourcePath,
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '28',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-hls_time', '2',
      '-hls_list_size', '0',
      '-hls_flags', 'independent_segments',
      '-hls_segment_type', 'mpegts',
      '-hls_segment_filename', join(workDir, 'seg%06d.ts'),
      manifestPath,
    ]);

    ffmpeg.stderr.on('data', (d) => process.stdout.write(d)); // progress logging
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });
  });

  watcherStop();

  // Upload final manifest
  await uploadFile(manifestPath, `${hlsPrefix}/index.m3u8`, 'application/x-mpegURL');

  // Parse duration from manifest
  return parseDurationFromManifest(manifestPath);
}

function watchAndUploadSegments(dir, s3Prefix, uploaded) {
  let active = true;

  const loop = async () => {
    while (active) {
      try {
        const files = await readdir(dir);
        for (const file of files) {
          if (!file.endsWith('.ts') || uploaded.has(file)) continue;
          const filePath = join(dir, file);
          const s1 = (await stat(filePath)).size;
          await new Promise(r => setTimeout(r, 100));
          const s2 = (await stat(filePath)).size;
          if (s1 === s2 && s1 > 0) {
            await uploadFile(filePath, `${s3Prefix}/${file}`, 'video/MP2T');
            uploaded.add(file);
          }
        }
      } catch (e) {
        console.error("Watcher error:", e);
      }
      await new Promise(r => setTimeout(r, 200));
    }
  };

  loop().catch(console.error);
  return () => { active = false; };
}

async function parseDurationFromManifest(manifestPath) {
  try {
    const content = await readFile(manifestPath, 'utf8');
    let totalDuration = 0;
    const lines = content.split('\\n');
    for (const line of lines) {
      if (line.startsWith('#EXTINF:')) {
        const durationStr = line.replace('#EXTINF:', '').replace(',', '');
        totalDuration += parseFloat(durationStr);
      }
    }
    return totalDuration;
  } catch (err) {
    console.error("Failed to parse duration", err);
    return 0;
  }
}
