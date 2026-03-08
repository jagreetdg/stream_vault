<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Hls from 'hls.js';

  export let src: string;
  export let autoplay = false;

  let videoEl: HTMLVideoElement;
  let hls: Hls | null = null;
  let error = '';

  onMount(() => {
    if (Hls.isSupported()) {
      hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1, // Auto quality
        abrEwmaDefaultEstimate: 500000,
      });
      hls.loadSource(src);
      hls.attachMedia(videoEl);
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          error = `Playback error: ${data.details}`;
        }
      });
      if (autoplay) {
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoEl.play().catch(() => {}); // Ignore autoplay restrictions
        });
      }
    } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      videoEl.src = src;
      if (autoplay) videoEl.play().catch(() => {});
    } else {
      error = 'Your browser does not support video playback.';
    }
  });

  onDestroy(() => {
    hls?.destroy();
  });
</script>

<div class="player-wrapper glass-panel">
  {#if error}
    <div class="error-slate">
      <span class="error-icon">⚠️</span>
      <p>{error}</p>
    </div>
  {:else}
    <!-- svelte-ignore a11y-media-has-caption -->
    <video
      bind:this={videoEl}
      controls
      playsinline
      class="video-element"
    ></video>
  {/if}
</div>

<style>
  .player-wrapper {
    width: 100%;
    aspect-ratio: 16 / 9;
    background: #000;
    overflow: hidden;
    position: relative;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  }

  .video-element {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
  }

  .error-slate {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1rem;
    color: var(--error-color);
    padding: 2rem;
    text-align: center;
  }

  .error-icon {
    font-size: 3rem;
  }
</style>
