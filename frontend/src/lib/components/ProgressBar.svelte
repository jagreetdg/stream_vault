<script lang="ts">
  export let value: number = 0;
  export let max: number = 100;
  
  $: percentage = Math.min(Math.max((value / max) * 100, 0), 100);
</script>

<div class="progress-container">
  <div class="progress-bar">
    <div 
      class="progress-fill" 
      style="width: {percentage}%"
    >
      <div class="progress-glow"></div>
    </div>
  </div>
</div>

<style>
  .progress-container {
    width: 100%;
    padding: 0.5rem 0;
  }

  .progress-bar {
    width: 100%;
    height: 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-color), #818cf8);
    border-radius: 6px;
    transition: width 0.3s ease-out;
    position: relative;
    overflow: hidden;
  }

  .progress-glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg, 
      transparent, 
      rgba(255, 255, 255, 0.4), 
      transparent
    );
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
</style>
