# Pip-Boy Toolkit

A Fallout-themed Pomodoro timer with authentic Pip-Boy aesthetics from the Fallout series.

![Pip-Boy Pomodoro](vault_boy.png)

## Features

- **Authentic Pip-Boy Theme**: Monochrome green CRT display with scanlines and screen curvature
- **Pomodoro Timer**: Three modes - Work (25min), Short Break (5min), Long Break (15min)
- **Retro Sound Effects**: Synthesized audio using Web Audio API
  - Button clicks
  - Continuous Geiger counter radiation sounds
  - Alarm when timer completes
- **Nuclear Finale**: Pixel art mushroom cloud explosion when session ends
- **Pure Vanilla**: No frameworks, just HTML/CSS/JavaScript

## Usage

1. Open `index.html` in your browser
2. Click anywhere to enable audio
3. Select a mode (WORK/SHORT/LONG)
4. Click **INITIALIZE** to start
5. Use **HALT** to pause, **RESET** to restart
6. Click **TEST** to preview the explosion finale

## Tech Stack

- Vanilla JavaScript (ES6 classes)
- Web Audio API for sound synthesis
- CSS3 animations and effects
- Google Fonts (VT323, Share Tech Mono)

## Files

- `index.html` - Pip-Boy UI structure
- `style.css` - Fallout theme styling with CRT effects
- `script.js` - Timer logic and sound synthesis
- `vault_boy.png` - Vault Boy thumbs-up image
- `explosion.png` - Nuclear explosion finale

## License

MIT License - Feel free to use and modify!

## Credits

Inspired by the Fallout series Pip-Boy interface. All code and assets created for this project.
