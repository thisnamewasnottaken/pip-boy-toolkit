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

### Local

1. Open `index.html` in your browser
2. Click anywhere to enable audio
3. Select a mode (WORK/SHORT/LONG)
4. Click **INITIALIZE** to start
5. Use **HALT** to pause, **RESET** to restart

### GitHub Pages

Visit: https://thisnamewasnottaken.github.io/pip-boy-toolkit/

The app is automatically deployed and updated whenever changes are pushed to the main branch.

### Test Mode

Append `#test` to the URL (e.g., locally or `https://thisnamewasnottaken.github.io/pip-boy-toolkit/#test`) to enable test features like the explosion button. Change the hash to toggle on/off dynamically.

## Tech Stack

- Vanilla JavaScript (ES6 classes)
- Web Audio API for sound synthesis
- CSS3 animations and effects
- Google Fonts (VT323, Share Tech Mono)

## Project Structure

This project follows a modular architecture to allow for easy expansion of Pip-Boy themed tools.

- `index.html` - Hub / Main Menu for the toolkit.
- `core/` - Shared assets and logic for the Pip-Boy aesthetic.
  - `css/main.css` - CRT effects, colors, and shared layout.
  - `js/main.js` - Sound synthesis and global UI behaviors.
- `tools/` - Individual toolkit modules.
  - `pomodoro/` - The Retro Pomodoro timer.
- `assets/images/` - Shared image assets (Vault Boy, etc.).
- `README.md` - You are here.

## Roadmap

The project is actively expanding. Below are the current objectives and upcoming features.

### Completed Milestones
- [x] **Modular Architecture**: Split into `core/` and `tools/` structure.
- [x] **Retro Pomodoro**: Fully functional timer with authentic CRT effects.
- [x] **Sound System**: Synthesized Geiger counter and alarm audio via Web Audio API.
- [x] **Responsive Design**: Optimized for mobile (portrait and landscape) and desktop.
- [x] **Test Mode**: URL hash-based `#test` mode for debugging finale animations.

### Upcoming Objectives
- [/] **Automated Deployment**: GitHub Actions workflow created; push to `main` to trigger.
- [ ] **Developer Experience**: Add `package.json` for local `live-server` development.

- [ ] **Module: Settings**: Browser storage persistence, toggleable test mode, and username customization.
- [ ] **Module: Vault Climate**: Dynamic weather reporting for your vault's geographic location.
- [ ] **Module: Encryption Breaker**: Authentic Fallout hacking mini-game.
- [ ] **Refinement**: Continued cross-browser testing and touch interaction polish.



## Deployment

The toolkit is optimized for GitHub Pages. Any changes pushed to the `main` branch are automatically deployed to:
https://thisnamewasnottaken.github.io/pip-boy-toolkit/

## License
MIT License - Feel free to use and modify!

## Credits
Inspired by the Fallout series Pip-Boy interface. All code and assets created for this project.
