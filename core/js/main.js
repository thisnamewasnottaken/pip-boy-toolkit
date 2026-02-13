class SoundManager {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3; // Low volume for retro feel
    this.masterGain.connect(this.ctx.destination);

    // Resume audio context on first user interaction
    document.body.addEventListener(
      "click",
      () => {
        if (this.ctx.state === "suspended") {
          this.ctx.resume();
        }
      },
      { once: true },
    );
  }

  playClick() {
    if (this.ctx.state === "suspended") this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playAlarm() {
    if (this.ctx.state === "suspended") this.ctx.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.linearRampToValueAtTime(220, t + 0.5);
    osc.frequency.linearRampToValueAtTime(110, t + 1.0);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.linearRampToValueAtTime(0, t + 2.0);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(t + 2.0);
  }

  playGeiger() {
    // Simple random click for ambience or interactions
    if (this.ctx.state === "suspended") this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.value = 100 + Math.random() * 50;

    // Increased volume for audibility
    gain.gain.value = 0.4;
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.02);
  }

  startRadiation() {
    if (this.radiationTimer) return;

    const loop = () => {
      // Random interval between clicks (e.g., 200ms to 1500ms for ambient feel)
      const delay = Math.random() * 1300 + 200;
      this.playGeiger();
      this.radiationTimer = setTimeout(loop, delay);
    };
    loop();
  }

  stopRadiation() {
    if (this.radiationTimer) {
      clearTimeout(this.radiationTimer);
      this.radiationTimer = null;
    }
  }
}

// Global initialization for shared UI behaviors
document.addEventListener("DOMContentLoaded", () => {
  // SoundManager is shared across tools if they need it
  window.pipSound = new SoundManager();

  // Add hover radiation sounds to all buttons (shared behavior)
  const initHoverSounds = () => {
    document.querySelectorAll("button, .status-item").forEach((btn) => {
      if (!btn.dataset.hvSound) {
        btn.addEventListener("mouseenter", () => window.pipSound.startRadiation());
        btn.addEventListener("mouseleave", () => window.pipSound.stopRadiation());
        btn.dataset.hvSound = "true";
      }
    });
  };

  initHoverSounds();

  // Observe for new buttons being added to the DOM
  const observer = new MutationObserver(() => initHoverSounds());
  observer.observe(document.body, { childList: true, subtree: true });
});
