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
    };

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

            settings.setUserName(newName);
            settings.setTestMode(newTestMode);

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
