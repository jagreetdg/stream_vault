<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let disabled = false;

  const dispatch = createEventDispatcher();
  let dragging = false;
  let fileInput: HTMLInputElement;

  function handleDrop(e: DragEvent) {
    if (disabled) return;
    dragging = false;
    const file = e.dataTransfer?.files[0];
    if (file) dispatch('file', file);
  }

  function handleSelect(e: Event) {
    if (disabled) return;
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) dispatch('file', file);
  }
</script>

<div 
  class="upload-zone {dragging ? 'dragging' : ''} {disabled ? 'disabled' : ''} glass-panel"
  on:dragenter|preventDefault={() => { if(!disabled) dragging = true; }}
  on:dragleave|preventDefault={() => dragging = false}
  on:dragover|preventDefault
  on:drop|preventDefault={handleDrop}
  on:click={() => { if(!disabled) fileInput.click(); }}
  on:keydown={(e) => { if(e.key === 'Enter' && !disabled) fileInput.click(); }}
  role="button"
  tabindex="0"
>
  <input 
    type="file" 
    bind:this={fileInput} 
    on:change={handleSelect} 
    accept="video/*" 
    style="display: none;" 
  />
  
  <div class="zone-content">
    <div class="icon-wrapper">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="upload-icon"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
    </div>
    <h3>Upload a Video</h3>
    <p class="subtitle">Drag & drop your file here, or click to browse</p>
    <div class="formats">
      <span>MP4</span><span>WEBM</span><span>MKV</span><span>MOV</span>
      <span class="divider">•</span>
      <span>Max 1GB</span>
    </div>
  </div>
</div>

<style>
  .upload-zone {
    width: 100%;
    min-height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 2px dashed var(--border-color);
    border-radius: 20px;
    padding: 3rem;
    transition: all 0.3s ease;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.02);
  }

  .upload-zone:hover:not(.disabled) {
    border-color: var(--accent-color);
    background: rgba(99, 102, 241, 0.05);
    transform: translateY(-2px);
  }

  .upload-zone.dragging {
    border-color: var(--success-color);
    background: rgba(16, 185, 129, 0.05);
    transform: scale(1.02);
  }

  .upload-zone.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .zone-content {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    pointer-events: none;
  }

  .icon-wrapper {
    background: rgba(255, 255, 255, 0.05);
    padding: 1.5rem;
    border-radius: 50%;
    margin-bottom: 0.5rem;
    color: var(--accent-color);
    transition: transform 0.3s ease;
  }

  .upload-zone:hover:not(.disabled) .icon-wrapper {
    transform: scale(1.1) translateY(-5px);
    background: rgba(99, 102, 241, 0.1);
  }

  h3 {
    font-size: 1.5rem;
    margin: 0;
    color: var(--text-primary);
  }

  .subtitle {
    color: var(--text-secondary);
    font-size: 1rem;
    margin: 0;
  }

  .formats {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1rem;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
    font-weight: 500;
  }

  .formats span:not(.divider) {
    background: rgba(255, 255, 255, 0.05);
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
</style>
