document.addEventListener("DOMContentLoaded", () => {
    const settings = window.pipSettings;
    const usernameInput = document.getElementById("username-input");
    const testModeInput = document.getElementById("test-mode-input");
    const statusMsg = document.getElementById("status-message");

    // Load current values
    const loadValues = () => {
        usernameInput.value = settings.getUserName();
        testModeInput.checked = settings.isTestMode();
    };

    // Initial load
    // Small delay to ensure core main.js has initialized settings
    setTimeout(loadValues, 50);

    // Input Validation (Force CAPS, Max 25 chars)
    usernameInput.addEventListener("input", (e) => {
        let val = e.target.value.toUpperCase();

        // Simple sanitization: Allow A-Z, 0-9, spaces, hyphens
        val = val.replace(/[^A-Z0-9\-\s]/g, "");

        // Max Length enforcement
        if (val.length > 25) {
            val = val.substring(0, 25);
        }

        e.target.value = val;
    });

    // Save Action
    document.getElementById("btn-save").addEventListener("click", () => {
        const newName = usernameInput.value.trim() || "VAULTDWELLER";
        const newTestMode = testModeInput.checked;

        settings.setUserName(newName);
        settings.setTestMode(newTestMode);

        // Visual Feedback
        statusMsg.innerText = "SETTINGS SAVED_";
        statusMsg.classList.add("visible");

        // Play sound if available
        if (window.pipSound) window.pipSound.playClick();

        setTimeout(() => {
            statusMsg.classList.remove("visible");
        }, 2000);
    });

    // Reset Action
    document.getElementById("btn-reset").addEventListener("click", () => {
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
});
