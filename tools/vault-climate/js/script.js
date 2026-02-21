document.addEventListener("DOMContentLoaded", () => {
    const locationName = document.getElementById("location-name");
    const coordinates = document.getElementById("coordinates");
    const weatherCondition = document.getElementById("weather-condition");
    const temperatureDisplay = document.getElementById("temperature");
    const tempUnitDisplay = document.getElementById("temp-unit");
    const humidityDisplay = document.getElementById("humidity");
    const radiationLevel = document.getElementById("radiation-level");

    const FALLBACK_COORDS = { lat: 51.5074, lon: -0.1278, name: "VAULT X44 (LONDON)" };

    const getTempUnit = () => {
        if (window.pipSettings) return window.pipSettings.getTempUnit();
        try {
            const stored = localStorage.getItem("pip-boy-settings");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && typeof parsed === "object") return parsed.tempUnit || "C";
            }
        } catch (e) {}
        return "C";
    };

    const mapWeatherToFallout = (code) => {
        // WMO Weather interpretation codes
        if (code === 0) return "HIGH VISIBILITY";
        if (code >= 1 && code <= 3) return "HIGH VISIBILITY";
        if (code === 45 || code === 48) return "SMOG/DUST";
        if (code >= 51 && code <= 99) return "RAD-STORM";
        return "UNKNOWN ANOMALY";
    };

    const mapUVToRadiation = (uv) => {
        if (uv <= 2) return "ZERO";
        if (uv <= 5) return "LOW";
        if (uv <= 7) return "MEDIUM";
        if (uv <= 10) return "HIGH";
        return "DEADLY";
    };

    const fetchCity = async (lat, lon) => {
        try {
            const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`;
            const response = await fetch(url);
            if (!response.ok) return null;
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                return data.results[0].name;
            }
        } catch (e) {
            console.warn("City fetch failed", e);
        }
        return null; // Return null if failed or not found
    };

    const updateUI = async (data, lat, lon, isFallback = false) => {
        const unit = getTempUnit();

        // Location Logic — fallback location is set before fetch in initialize()
        if (!isFallback) {
            const latInt = Math.abs(Math.trunc(lat));
            const lonInt = Math.abs(Math.trunc(lon));
            const vaultNum = `${latInt}${lonInt}`;

            let cityName = "WASTELAND";
            const fetchedCity = await fetchCity(lat, lon);
            if (fetchedCity) cityName = fetchedCity.toUpperCase();

            locationName.innerText = `VAULT ${vaultNum} (${cityName})`;
            coordinates.innerText = `[${lat.toFixed(4)}, ${lon.toFixed(4)}]`;
        }

        weatherCondition.innerText = mapWeatherToFallout(data.current.weather_code);

        let temp = data.current.temperature_2m;
        if (unit === "F") {
            temp = (temp * 9 / 5) + 32;
        }

        temperatureDisplay.innerText = Math.round(temp);
        tempUnitDisplay.innerHTML = `&deg;${unit}`;

        // Gauge Logic
        const humidity = Math.round(data.current.relative_humidity_2m);
        humidityDisplay.innerText = `${humidity}%`;

        const humidityGauge = document.getElementById("humidity-gauge");
        if (humidityGauge) {
            humidityGauge.style.width = `${Math.min(humidity, 100)}%`;
        }

        const maxUV = data.daily.uv_index_max[0];
        radiationLevel.innerText = mapUVToRadiation(maxUV);

        const radGauge = document.getElementById("radiation-gauge");
        if (radGauge) {
            // Map 0-11 to 0-100%
            let radPercent = (maxUV / 11) * 100;
            if (radPercent > 100) radPercent = 100;
            radGauge.style.width = `${radPercent}%`;

            // Dangerous levels (UV > 7 is Very High)
            if (maxUV > 7) {
                radGauge.classList.add("danger");
                radiationLevel.style.color = "var(--pip-amber)";
            } else {
                radGauge.classList.remove("danger");
                radiationLevel.style.color = "inherit";
            }
        }

        if (window.pipSound) window.pipSound.playClick();
    };

    const fetchWeather = async (lat, lon, isFallback = false, attempt = 1) => {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&daily=uv_index_max&timezone=auto`;
            const response = await fetch(url);
            if (!response.ok) throw new Error("Network failure");
            const data = await response.json();
            await updateUI(data, lat, lon, isFallback);
        } catch (error) {
            if (attempt < 3) {
                console.warn(`Weather fetch attempt ${attempt} failed, retrying...`, error);
                await new Promise(r => setTimeout(r, 200 * attempt));
                return fetchWeather(lat, lon, isFallback, attempt + 1);
            }
            console.error("Weather fetch error (all attempts failed):", error);
            weatherCondition.innerText = "DATA CORRUPTED";
        }
    };

    const setFallbackLocation = () => {
        locationName.innerText = FALLBACK_COORDS.name;
        coordinates.innerText = `[${FALLBACK_COORDS.lat.toFixed(4)}, ${FALLBACK_COORDS.lon.toFixed(4)}]`;
    };

    const initialize = () => {
        // Set the unit display immediately from settings (before any async fetch)
        const unit = getTempUnit();
        tempUnitDisplay.innerHTML = `&deg;${unit}`;

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchWeather(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    console.warn("Geolocation denied, using fallback:", error.message);
                    setFallbackLocation();
                    fetchWeather(FALLBACK_COORDS.lat, FALLBACK_COORDS.lon, true);
                }
            );
        } else {
            setFallbackLocation();
            fetchWeather(FALLBACK_COORDS.lat, FALLBACK_COORDS.lon, true);
        }
    };

    // Listen for settings changes to update unit display
    window.addEventListener("pip-settings-changed", () => {
        // Re-run initialization to refresh current temp with new unit
        initialize();
    });

    initialize();
});
