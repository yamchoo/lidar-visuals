export class PerformanceMonitor {
  constructor() {
    this.fps = 0;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fpsUpdateInterval = 500;
    this.element = null;

    this.createDisplay();
  }

  createDisplay() {
    this.element = document.createElement('div');
    this.element.id = 'performance-monitor';
    this.element.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: #0f0;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      border-radius: 4px;
      z-index: 1000;
      display: none;
    `;
    document.body.appendChild(this.element);
  }

  update() {
    this.frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - this.lastTime;

    if (elapsed >= this.fpsUpdateInterval) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastTime = currentTime;

      this.updateDisplay();
    }
  }

  updateDisplay() {
    if (this.element && this.element.style.display !== 'none') {
      this.element.textContent = `FPS: ${this.fps}`;
    }
  }

  show() {
    if (this.element) {
      this.element.style.display = 'block';
    }
  }

  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  toggle() {
    if (this.element) {
      const isVisible = this.element.style.display !== 'none';
      if (isVisible) {
        this.hide();
      } else {
        this.show();
      }
    }
  }

  getFPS() {
    return this.fps;
  }
}
