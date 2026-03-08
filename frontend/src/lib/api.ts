const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080';

export interface InitUploadResponse {
  video_id: string;
  upload_url: string;
  watch_url: string;
  expires_in: number;
}

export interface VideoStatus {
  video_id: string;
  title?: string;
  status: 'pending' | 'queued' | 'processing' | 'ready' | 'error';
  hls_url?: string;
  duration_seconds?: number;
  created_at: string;
  error?: string;
}

export async function initUpload(
  filename: string,
  fileSize: number,
  contentType: string,
  title?: string
): Promise<InitUploadResponse> {
  const res = await fetch(`${API_BASE}/api/upload/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, file_size: fileSize, content_type: contentType, title }),
  });
  if (!res.ok) {
    let msg = await res.text();
    try { msg = JSON.parse(msg).error || msg; } catch (e) { }
    throw new Error(msg);
  }
  return res.json();
}

export async function uploadToS3(
  url: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
    };
    xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`S3 upload failed: ${xhr.status}`));
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

export async function completeUpload(videoId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/upload/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ video_id: videoId }),
  });
  if (!res.ok) {
    let msg = await res.text();
    try { msg = JSON.parse(msg).error || msg; } catch (e) { }
    throw new Error(msg);
  }
}

export async function getVideoStatus(videoId: string): Promise<VideoStatus> {
  const res = await fetch(`${API_BASE}/api/video/${videoId}`);
  if (!res.ok) {
    let msg = await res.text();
    try { msg = JSON.parse(msg).error || msg; } catch (e) { }
    throw new Error(msg);
  }
  return res.json();
}

export function pollVideoStatus(
  videoId: string,
  onUpdate: (status: VideoStatus) => void,
  intervalMs = 2000
): () => void {
  let active = true;
  const poll = async () => {
    while (active) {
      try {
        const status = await getVideoStatus(videoId);
        onUpdate(status);
        if (status.status === 'ready' || status.status === 'error') break;
      } catch (e) {
        console.error('Poll error:', e);
      }
      await new Promise(r => setTimeout(r, intervalMs));
    }
  };
  poll();
  return () => { active = false; };
}
