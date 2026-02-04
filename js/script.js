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

class RetroTimer {
  constructor() {
    this.timeLeft = 25 * 60;
    this.timerId = null;
    this.isRunning = false;
    this.sound = new SoundManager();

    // DOM Elements
    this.timeDisplay = document.getElementById("time-display");
    this.modeText = document.getElementById("mode-text");
    this.vaultBoy = document.getElementById("vault-boy");
    this.explosion = document.getElementById("explosion");
    this.testBtn = document.getElementById("btn-test");

    // Bind buttons
    document.getElementById("btn-start").addEventListener("click", () => {
      this.sound.playClick();
      this.start();
    });
    document.getElementById("btn-pause").addEventListener("click", () => {
      this.sound.playClick();
      this.pause();
    });
    document.getElementById("btn-reset").addEventListener("click", () => {
      this.sound.playClick();
      this.reset();
    });

    document.getElementById("btn-test").addEventListener("click", () => {
      this.finish();
    });

    document.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.sound.playClick();
        this.setMode(e.target);
      });
    });

    // Add hover radiation sounds (continuous while hovering)
    document.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("mouseenter", () => this.sound.startRadiation());
      btn.addEventListener("mouseleave", () => this.sound.stopRadiation());
    });

    this.updateDisplay();

    // Test mode toggle based on URL hash - call on load to handle initial hash
    window.addEventListener("load", () => this.toggleTestMode());
    window.addEventListener("hashchange", () => this.toggleTestMode());

    // Set initial title
    document.title = "Pip-Boy Toolkit - Timer";
  }

  toggleTestMode() {
    const isTestMode = window.location.hash === "#test";
    this.testBtn.style.display = isTestMode ? "inline-block" : "none";
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.modeText.innerText = "RUNNING_SEQUENCE...";
    document.title = "Pip-Boy Toolkit - Timer: Running";

    this.timerId = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        this.updateDisplay();
      } else {
        this.finish();
      }
    }, 1000);
  }

  pause() {
    if (!this.isRunning) return;
    clearInterval(this.timerId);
    this.isRunning = false;
    this.modeText.innerText = "SEQUENCE_PAUSED";
    this.sound.stopRadiation();
    document.title = "Pip-Boy Toolkit - Timer: Paused";
  }

  reset() {
    this.pause();
    // Reset based on current active mode
    const activeMode = document.querySelector(".mode-btn.active").dataset.mode;
    if (activeMode === "work") this.timeLeft = 25 * 60;
    if (activeMode === "short") this.timeLeft = 5 * 60;
    if (activeMode === "long") this.timeLeft = 15 * 60;

    this.modeText.innerText = "STANDBY";
    this.resetVisuals();
    this.updateDisplay();
    document.title = "Pip-Boy Toolkit - Timer";
  }

  setMode(btn) {
    document
      .querySelectorAll(".mode-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const mode = btn.dataset.mode;
    this.pause();

    if (mode === "work") this.timeLeft = 25 * 60;
    if (mode === "short") this.timeLeft = 5 * 60;
    if (mode === "long") this.timeLeft = 15 * 60;

    this.resetVisuals();
    this.updateDisplay();
  }

  finish() {
    this.pause();
    this.modeText.innerText = "SEQUENCE_COMPLETE";
    this.sound.playAlarm();
    this.triggerFinale();
    document.title = "Pip-Boy Toolkit - Timer: Complete";

    // Reset to STANDBY after 5 seconds
    setTimeout(() => {
      this.modeText.innerText = "STANDBY";
      document.title = "Pip-Boy Toolkit - Timer";
    }, 5000);
  }

  triggerFinale() {
    // Hide Vault Boy, Show Explosion
    this.vaultBoy.classList.add("hidden");
    this.explosion.classList.remove("hidden");

    // Add fake shake effect
    document.body.style.animation =
      "shake 0.5s cubic-bezier(.36,.07,.19,.97) both infinite";

    setTimeout(() => {
      // Stop shake
      document.body.style.animation = "";
      this.resetVisuals();
    }, 3000);
  }

  resetVisuals() {
    this.vaultBoy.classList.remove("hidden");
    this.explosion.classList.add("hidden");
    document.body.style.animation = "";
  }

  updateDisplay() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    this.timeDisplay.innerText = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
}

// Add shake keyframes dynamically
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}`;
document.head.appendChild(styleSheet);

// Initialize
const app = new RetroTimer();
