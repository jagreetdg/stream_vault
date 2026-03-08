<script>
  import '../app.css';
</script>

<main class="app-container">
  <header class="header">
    <div class="logo">
      <h1>StreamVault</h1>
    </div>
  </header>
  
  <div class="content-wrapper">
    <slot />
  </div>
</main>

<style>
  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent 40%),
                radial-gradient(circle at bottom left, rgba(16, 185, 129, 0.1), transparent 40%);
  }

  .header {
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: center;
    border-bottom: 1px solid var(--border-color);
    background: rgba(13, 15, 20, 0.8);
    backdrop-filter: blur(8px);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .logo-icon {
    font-size: 1.5rem;
  }

  .logo h1 {
    font-size: 1.25rem;
    font-weight: 700;
    background: linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }
</style>
