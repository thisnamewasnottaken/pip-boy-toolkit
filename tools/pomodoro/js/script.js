class PomodoroTimer {
    constructor() {
        this.timeLeft = 25 * 60;
        this.timerId = null;
        this.isRunning = false;
        this.sound = window.pipSound; // Use shared SoundManager

        // Description for each mode
        this.modeDescriptions = {
            work: "Pomodoro technique: 25 minute work sessions with breaks.",
            short: "Short break: 5 minutes to recharge between sessions.",
            long: "Long break: 15 minutes for extended rest and recovery."
        };

        // DOM Elements
        this.timeDisplay = document.getElementById("time-display");
        this.modeText = document.getElementById("mode-text");
        this.descriptionText = document.getElementById("function-description");
        this.vaultBoy = document.getElementById("vault-boy");
        this.explosion = document.getElementById("explosion");
        this.testBtn = document.getElementById("btn-test");
        this.btnStart = document.getElementById("btn-start");

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

        this.updateDisplay();

        // Test mode toggle
        this.initTestMode();

        // Set initial title
        document.title = "Pip-Boy Toolkit - Timer";
    }

    initTestMode() {
        const updateTestVisibility = () => {
            const isSettingsTestMode = window.pipSettings && window.pipSettings.isTestMode();
            const isHashTestMode = window.location.hash === "#test";

            if (isSettingsTestMode || isHashTestMode) {
                this.testBtn.style.display = "inline-block";
            } else {
                this.testBtn.style.display = "none";
            }
        };

        // Initial check
        updateTestVisibility();

        // Listen for changes
        window.addEventListener("pip-settings-changed", updateTestVisibility);
        window.addEventListener("hashchange", updateTestVisibility);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.modeText.innerText = "RUNNING_SEQUENCE...";
        document.title = "Pip-Boy Toolkit - Timer: Running";
        this.btnStart.disabled = true;

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
        this.btnStart.disabled = false;
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
        this.btnStart.disabled = false;
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
        this.updateDescription(mode);
    }

    updateDescription(mode) {
        if (this.functionDescription && this.modeDescriptions[mode]) {
            this.functionDescription.innerText = this.modeDescriptions[mode];
        }
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
            this.btnStart.disabled = false;
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

// Add shake keyframes dynamically if not in CSS
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}`;
document.head.appendChild(styleSheet);

// Initialize when DOM and Shared logic are ready
document.addEventListener("DOMContentLoaded", () => {
    // Small delay to ensure SoundManager is initialized in main.js
    setTimeout(() => {
        window.app = new PomodoroTimer();
    }, 100);
});
