<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';
  import { pollVideoStatus, type VideoStatus } from '$lib/api';
  import VideoPlayer from '$lib/components/VideoPlayer.svelte';

  const videoId = $page.params.id;
  let status: VideoStatus | null = null;
  let stopPolling: (() => void) | null = null;

  onMount(() => {
    if (videoId) {
      stopPolling = pollVideoStatus(videoId, (s) => {
        status = s;
      });
    }
  });

  onDestroy(() => {
    stopPolling?.();
  });
</script>

<div class="watch-layout">
  <div class="player-container">
    {#if !status}
      <div class="loading glass-panel">
        <div class="spinner"></div>
        <p>Connecting to stream...</p>
      </div>
    {:else if status.status === 'ready' && status.hls_url}
      <VideoPlayer src={status.hls_url} autoplay={true} />
    {:else if status.status === 'error'}
      <div class="error-panel glass-panel">
        <span class="icon">💔</span>
        <h3>Processing Failed</h3>
        <p>{status.error || 'The video could not be processed.'}</p>
      </div>
    {:else}
      <div class="processing-panel glass-panel">
        <div class="processing-animation">
          <div class="bar"></div><div class="bar"></div><div class="bar"></div>
        </div>
        <h2>{status.status === 'queued' ? 'Waiting in Queue' : 'Processing Stream'}</h2>
        <p class="subtitle">Just a moment! The stream will start automatically.</p>
        {#if status.status === 'processing'}
          <div class="status-indicator">
            <span class="dot pulse"></span>
            <span>Transcoding engine active</span>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <div class="meta-container glass-panel">
    <div class="info-header">
      <h2>Video {videoId}</h2>
      {#if status?.status === 'ready'}
        <span class="badge success">Ready</span>
      {:else if status?.status === 'processing'}
        <span class="badge warning pulse">Processing</span>
      {:else if status?.status === 'queued'}
        <span class="badge neutral">Queued</span>
      {/if}
    </div>
    
    <div class="info-details">
      {#if status?.created_at}
        <p><strong>Uploaded:</strong> {new Date(status.created_at).toLocaleString()}</p>
      {/if}
      {#if status?.duration_seconds}
        <p><strong>Duration:</strong> {Math.floor(status.duration_seconds / 60)}:{String(Math.floor(status.duration_seconds % 60)).padStart(2, '0')}</p>
      {/if}
    </div>

    <div class="share-section">
      <h3>Share</h3>
      <div class="input-group">
        <input readonly value={typeof window !== 'undefined' ? window.location.href : ''} on:click={(e) => e.currentTarget.select()} />
      </div>
    </div>
  </div>
</div>

<style>
  .watch-layout {
    display: grid;
    grid-template-columns: 1fr 350px;
    gap: 2rem;
    height: calc(100vh - 120px);
    align-items: start;
  }

  @media (max-width: 1024px) {
    .watch-layout {
      grid-template-columns: 1fr;
      height: auto;
    }
  }

  .player-container {
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .loading, .error-panel, .processing-panel {
    aspect-ratio: 16 / 9;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255,255,255,0.1);
    border-top-color: var(--accent-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin { 100% { transform: rotate(360deg); } }

  .icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .error-panel h3 { color: var(--error-color); margin-bottom: 0.5rem; }
  .error-panel p { color: var(--text-secondary); }

  .processing-animation {
    display: flex;
    gap: 6px;
    height: 40px;
    align-items: flex-end;
    margin-bottom: 2rem;
  }

  .processing-animation .bar {
    width: 8px;
    background: var(--accent-color);
    border-radius: 4px;
    animation: equalize 1s ease-in-out infinite;
  }

  .processing-animation .bar:nth-child(1) { height: 40%; animation-delay: 0s; }
  .processing-animation .bar:nth-child(2) { height: 100%; animation-delay: 0.2s; }
  .processing-animation .bar:nth-child(3) { height: 60%; animation-delay: 0.4s; }

  @keyframes equalize {
    0%, 100% { height: 30%; }
    50% { height: 100%; box-shadow: 0 0 10px var(--accent-color); }
  }

  .processing-panel h2 {
    font-size: 1.8rem;
    background: linear-gradient(90deg, #fff, #a5b4fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
  }

  .processing-panel .subtitle {
    color: var(--text-secondary);
    margin-bottom: 2rem;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(16, 185, 129, 0.1);
    padding: 0.5rem 1rem;
    border-radius: 20px;
    color: var(--success-color);
    font-size: 0.9rem;
    font-weight: 500;
  }

  .dot {
    width: 8px;
    height: 8px;
    background: currentColor;
    border-radius: 50%;
  }

  .pulse {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% { opacity: 1; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
    70% { opacity: 0.7; box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
    100% { opacity: 1; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }

  .meta-container {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 1rem;
  }

  .info-header h2 {
    font-size: 1.2rem;
    margin: 0;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .badge.success { background: rgba(16, 185, 129, 0.2); color: #34d399; }
  .badge.warning { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
  .badge.neutral { background: rgba(156, 163, 175, 0.2); color: #9ca3af; }

  .info-details p {
    color: var(--text-secondary);
    font-size: 0.95rem;
    margin-bottom: 0.5rem;
  }

  .info-details strong {
    color: var(--text-primary);
  }

  .share-section h3 {
    font-size: 1rem;
    margin-bottom: 0.75rem;
    color: var(--text-primary);
  }

  .input-group input {
    width: 100%;
    padding: 0.75rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: rgba(0,0,0,0.3);
    color: var(--text-primary);
    font-size: 0.9rem;
  }
</style>
