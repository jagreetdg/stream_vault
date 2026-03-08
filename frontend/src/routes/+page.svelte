<script lang="ts">
  import { initUpload, uploadToS3, completeUpload } from '$lib/api';
  import UploadZone from '$lib/components/UploadZone.svelte';
  import ProgressBar from '$lib/components/ProgressBar.svelte';

  type UploadState = 
    | { phase: 'idle' }
    | { phase: 'uploading'; progress: number; filename: string }
    | { phase: 'done'; watchUrl: string; shareUrl: string }
    | { phase: 'error'; message: string };

  let state: UploadState = { phase: 'idle' };
  const MAX_SIZE = 10 * 1024 * 1024 * 1024; // Increased to 10GB logically for a nice feeling, even though limits apply on backend

  async function handleFile(file: File) {
    if (file.size > MAX_SIZE) {
      state = { phase: 'error', message: 'File exceeds absolute limit.' };
      return;
    }

    state = { phase: 'uploading', progress: 0, filename: file.name };

    try {
      const { video_id, upload_url, watch_url } = await initUpload(
        file.name, file.size, file.type
      );

      await uploadToS3(upload_url, file, (pct) => {
        state = { phase: 'uploading', progress: pct, filename: file.name };
      });

      await completeUpload(video_id);

      const shareUrl = `${window.location.origin}/watch/${video_id}`;
      state = { phase: 'done', watchUrl: watch_url, shareUrl };
    } catch (e: any) {
      state = { phase: 'error', message: e.message };
    }
  }
</script>

<div class="page-container glass-panel">
  <div class="header-section">
    <h2>Secure & Instant Streaming</h2>
    <p>Upload a video and share it instantly. Viewers can watch even before the upload finishes processing.</p>
  </div>

  <div class="upload-section">
    {#if state.phase === 'idle'}
      <UploadZone on:file={(e) => handleFile(e.detail)} />

    {:else if state.phase === 'uploading'}
      <div class="uploading-state">
        <div class="icon-pulse">↑</div>
        <h3>Uploading {state.filename}</h3>
        <ProgressBar value={state.progress} />
        <span class="progress-text">{state.progress.toFixed(0)}%</span>
      </div>

    {:else if state.phase === 'done'}
      <div class="done-state">
        <div class="success-icon">✓</div>
        <h2>Upload Complete!</h2>
        <p>Your video is processing, but you can share it right now.</p>
        
        <div class="share-box">
          <label for="share">Shareable Link</label>
          <div class="input-group">
            {#if state.phase === 'done'}
              {@const doneState = state}
              <input id="share" readonly value={doneState.shareUrl} on:click={(e) => e.currentTarget.select()} />
              <button class="copy-btn" on:click={() => navigator.clipboard.writeText(doneState.shareUrl)}>Copy</button>
            {/if}
          </div>
        </div>
        
        <a href={state.watchUrl} class="watch-btn">Go to Video</a>
      </div>

    {:else if state.phase === 'error'}
      <div class="error-state">
        <div class="error-icon">✗</div>
        <h3>Upload Failed</h3>
        <p>{state.message}</p>
        <button class="retry-btn" on:click={() => state = { phase: 'idle' }}>Try Again</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .page-container {
    padding: 3rem;
    max-width: 800px;
    margin: 4rem auto;
    text-align: center;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .header-section {
    margin-bottom: 3rem;
  }

  .header-section h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .header-section p {
    color: var(--text-secondary);
    font-size: 1.1rem;
    max-width: 500px;
    margin: 0 auto;
    line-height: 1.6;
  }

  .upload-section {
    min-height: 300px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /* Uploading State */
  .uploading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 2rem;
  }

  .icon-pulse {
    font-size: 3rem;
    color: var(--accent-color);
    animation: bounce 2s infinite;
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  .progress-text {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--accent-color);
  }

  /* Done State */
  .done-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .success-icon {
    font-size: 4rem;
    color: var(--success-color);
    background: rgba(16, 185, 129, 0.1);
    width: 100px;
    height: 100px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .done-state h2 {
    color: var(--text-primary);
  }

  .share-box {
    width: 100%;
    max-width: 400px;
    text-align: left;
    margin-top: 1rem;
  }

  .share-box label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .input-group {
    display: flex;
    gap: 0.5rem;
  }

  .input-group input {
    flex: 1;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: rgba(0,0,0,0.5);
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.2s;
  }

  .input-group input:focus {
    border-color: var(--accent-color);
  }

  .copy-btn, .retry-btn, .watch-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    border: none;
    background: var(--accent-color);
    color: white;
    font-weight: 600;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .copy-btn:hover, .retry-btn:hover, .watch-btn:hover {
    background: var(--accent-hover);
  }

  .watch-btn {
    margin-top: 1.5rem;
    width: 100%;
    max-width: 400px;
    padding: 1rem;
    font-size: 1.1rem;
    background: linear-gradient(135deg, var(--accent-color), #818cf8);
  }

  /* Error State */
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .error-icon {
    font-size: 4rem;
    color: var(--error-color);
    background: rgba(239, 68, 68, 0.1);
    width: 100px;
    height: 100px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
