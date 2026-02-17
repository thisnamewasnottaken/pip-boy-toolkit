document.addEventListener("DOMContentLoaded", () => {
    const usernameInput = document.getElementById("username-input");
    const testModeInput = document.getElementById("test-mode-input");
    const statusMsg = document.getElementById("status-message");

    // Helper to get settings safely
    const getSettings = () => window.pipSettings;

    // Load current values
    const loadValues = () => {
        const settings = getSettings();
        if (!settings) {
            // Retry if not initialized yet
            setTimeout(loadValues, 50);
            return;
        }
        if (usernameInput) usernameInput.value = settings.getUserName();
        if (testModeInput) testModeInput.checked = settings.isTestMode();

        const tempUnit = settings.getTempUnit();
        document.querySelectorAll(".unit-btn").forEach(btn => {
            if (btn.dataset.unit === tempUnit) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });
    };

    // Unit toggle interaction
    document.querySelectorAll(".unit-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".unit-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            if (window.pipSound) window.pipSound.playClick();
        });
    });

    // Initial load
    loadValues();

    // Input Validation (Force CAPS, Max 25 chars)
    if (usernameInput) {
        usernameInput.addEventListener("input", (e) => {
            let val = e.target.value.toUpperCase();
            val = val.replace(/[^A-Z0-9\-\s]/g, "");
            if (val.length > 25) val = val.substring(0, 25);
            e.target.value = val;
        });
    }

    // Save Action
    const saveBtn = document.getElementById("btn-save");
    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            const settings = getSettings();
            if (!settings) return;

            const newName = usernameInput.value.trim() || "VAULTDWELLER";
            const newTestMode = testModeInput.checked;
            const newTempUnit = document.querySelector(".unit-btn.active").dataset.unit;

            settings.setUserName(newName);
            settings.setTestMode(newTestMode);
            settings.setTempUnit(newTempUnit);

            // Visual Feedback
            statusMsg.innerText = "SETTINGS SAVED_";
            statusMsg.classList.add("visible");

            if (window.pipSound) window.pipSound.playClick();

            setTimeout(() => {
                statusMsg.classList.remove("visible");
            }, 2000);
        });
    }

    // Reset Action
    const resetBtn = document.getElementById("btn-reset");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            const settings = getSettings();
            if (!settings) return;

            settings.setUserName("VAULTDWELLER");
            settings.setTestMode(false);
            loadValues();

            statusMsg.innerText = "DEFAULTS RESTORED_";
            statusMsg.classList.add("visible");

            if (window.pipSound) window.pipSound.playClick();

            setTimeout(() => {
                statusMsg.classList.remove("visible");
            }, 2000);
        });
    }
});
