# Agent Hand-off: Pip-Boy Toolkit Modules

This file contains the specific prompts and context required for different agents to implement the next three features.

---

## Agent 1: Vault Climate Module
**Prompt**:
```text
Implement the "Vault Climate" module for the Pip-Boy Toolkit.
Location: tools/vault-climate/

Key Requirements:
1. Use the Open-Meteo API (keyless) to fetch weather based on the browser's Geolocation.
2. If geolocation is denied, fallback to London (Vault x44) coordinates: 51.5074, -0.1278.
3. Map weather conditions to Fallout flavor:
   - Clear -> "High Visibility"
   - Rain/Thunderstorm -> "Rad-Storm"
   - Fog -> "Smog/Dust"
4. Display Temperature (switching between C/F from settings), Humidity, and a "Radiation Level" (mapped from UV index 0-11).
5. UI: Strictly follow the Pip-Boy CRT aesthetic using `../../core/css/main.css`. Reference `tools/pomodoro/index.html` for layout structure.
6. Security: Do NOT use any API keys.
```

---

## Agent 2: Wasteland Rover Mini-Game
**Prompt**:
```text
Implement the "Wasteland Rover" mini-game for the Pip-Boy Toolkit.
Location: tools/wasteland-rover/

Key Requirements:
1. Build a side-scrolling infinite runner using HTML5 Canvas and pure JavaScript.
2. Obstacles: Rad-roaches, rocks, and craters.
3. Mechanics: Space/Tap to jump. Increasing speed over time.
4. Assets: Generate Pip-Boy themed pixel art for the rover and obstacles (monochrome green/amber).
5. Scoring: Track distance and save "High Score" to LocalStorage.
6. UI: Integrate with `../../core/css/main.css`. Ensure it works in both portrait and landscape.
```

---

## Agent 3: Encryption Breaker Hacking Game
**Prompt**:
```text
Implement the "Encryption Breaker" hacking module for the Pip-Boy Toolkit.
Location: tools/encryption-breaker/

Key Requirements:
1. Recreate the Fallout terminal hacking mini-game.
2. Mechanics: 
   - Grid of random symbols and words.
   - 1 correct password, others give "Likeness X/Y" feedback.
   - 4 attempts before lockout. 
   - Bracket pairs (e.g., <...>) reset attempts or remove duds.
3. Sound: Use Web Audio API (see `core/js/main.js`) to synthesize mechanical keyboard typing sounds.
4. UI: Text-heavy CRT terminal style. Must feel authentic to the fallout series.
```
