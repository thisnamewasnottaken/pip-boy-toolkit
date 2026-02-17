/**
 * Wasteland Rover - Mini-Game for Pip-Boy Toolkit
 * RE-DESIGN: Dino-inspired mechanics
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const distanceEl = document.getElementById('distance');
const highScoreEl = document.getElementById('high-score');
const overlay = document.getElementById('game-overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMessage = document.getElementById('overlay-message');
const restartBtn = document.getElementById('restart-btn');
const nukeImg = document.getElementById('nuke-explosion');

// Game State
let gameState = 'START'; // START, PLAYING, GAMEOVER
let distance = 0;
let highScore = parseInt(localStorage.getItem('wasteland-rover-high-score')) || 0;
let speed = 3.5;
let frameCount = 0;
let obstacles = [];
let clouds = [];
let particles = [];
let gameTime = 0;

// Constants
const GRAVITY = 0.6;
const JUMP_FORCE = -10; // Base jump
const MAX_JUMP_FORCE = -15; // Max hold jump
const GROUND_Y = 0.85; // % of canvas height
const PIXEL_SIZE = 4;
const START_SPEED = 3.5;
const MAX_SPEED = 12;
const SPEED_ACCEL = 0.001;

// Colors
const PIP_GREEN = '#14f40b';
const PIP_DIM = '#0a4f07';

// Input State
const keys = {
    space: false,
    down: false
};

// Pixel Art Data
const ROVER_ART = [
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0],
    [0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0]
];

const ROVER_DUCK_ART = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0],
    [0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0]
];

const ROACH_ART = [
    [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0]
];

const FLY_ART = [
    [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
];

const CLOUD_ART = [
    [0, 0, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 0]
];

function drawPixelArt(ctx, art, x, y, size, color) {
    ctx.fillStyle = color;
    for (let row = 0; row < art.length; row++) {
        for (let col = 0; col < art[row].length; col++) {
            if (art[row][col]) {
                ctx.fillRect(x + col * size, y + row * size, size, size);
            }
        }
    }
}

class Rover {
    constructor() {
        this.reset();
    }

    reset() {
        this.width = 16 * PIXEL_SIZE;
        this.height = 16 * PIXEL_SIZE;
        this.x = 50;
        this.y = canvas.height * GROUND_Y - this.height;
        this.vy = 0;
        this.jumpTimer = 0;
        this.isJumping = false;
        this.isDucking = false;
        this.onGround = true;
    }

    update() {
        // Jumping Logic (Variable Height)
        if (keys.space && this.onGround && !this.isDucking) {
            this.vy = JUMP_FORCE;
            this.onGround = false;
            this.isJumping = true;
            this.jumpTimer = 0;
            if (window.pipSound) window.pipSound.playClick();
        }

        if (keys.space && this.isJumping && this.jumpTimer < 15) {
            this.vy -= 0.6; // Add upward force while holding
            this.jumpTimer++;
        }

        if (!keys.space) {
            this.isJumping = false;
        }

        // Ducking Logic
        if (keys.down && this.onGround) {
            this.isDucking = true;
            this.height = 10 * PIXEL_SIZE; // Reduced height
        } else {
            this.isDucking = false;
            this.height = 16 * PIXEL_SIZE;
        }

        // Physics
        this.vy += GRAVITY;
        this.y += this.vy;

        // Ground Collision
        const ground = canvas.height * GROUND_Y - this.height;
        if (this.y > ground) {
            this.y = ground;
            this.vy = 0;
            this.onGround = true;
            this.isJumping = false;
        }
    }

    draw() {
        const art = this.isDucking ? ROVER_DUCK_ART : ROVER_ART;
        // Adjust Y for ducking to keep feet on ground
        let drawY = this.y;
        if (this.isDucking) {
            // Duck art has empty top rows, so we draw it at same Y effectively
            drawY = canvas.height * GROUND_Y - (16 * PIXEL_SIZE);
        }
        drawPixelArt(ctx, art, this.x, drawY, PIXEL_SIZE, PIP_GREEN);
    }

    getHitbox() {
        return {
            x: this.x + 10,
            y: this.y + 10,
            width: this.width - 20,
            height: this.height - 15
        };
    }
}

class Obstacle {
    constructor() {
        // 0 = Ground (Roach), 1 = Low Air (Fly), 2 = High Air (Fly)
        // Probability changes with score
        let rand = Math.random();

        // At start, mostly ground. Later, mix in flies.
        if (distance < 200) {
            this.type = 'ROACH';
            this.yOffset = 0;
        } else {
            if (rand < 0.6) {
                this.type = 'ROACH';
                this.yOffset = 0;
            } else if (rand < 0.8) {
                this.type = 'FLY_LOW'; // Must jump or duck?
                this.yOffset = 30;
            } else {
                this.type = 'FLY_HIGH'; // Walk under or duck
                this.yOffset = 60;
            }
        }

        this.art = (this.type === 'ROACH') ? ROACH_ART : FLY_ART;
        this.width = this.art[0].length * PIXEL_SIZE;
        this.height = this.art.length * PIXEL_SIZE;
        this.x = canvas.width;

        // Y position relative to ground
        this.y = (canvas.height * GROUND_Y) - this.height - this.yOffset;
    }

    update() {
        this.x -= speed;
    }

    draw() {
        drawPixelArt(ctx, this.art, this.x, this.y, PIXEL_SIZE, PIP_GREEN);
    }

    getHitbox() {
        // forgiving hitbox
        return {
            x: this.x + 5,
            y: this.y + 5,
            width: this.width - 10,
            height: this.height - 10
        };
    }
}

class Cloud {
    constructor() {
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height * 0.5);
        this.speed = speed * 0.2 + Math.random() * 0.5;
    }

    update() {
        this.x -= this.speed;
    }

    draw() {
        drawPixelArt(ctx, CLOUD_ART, this.x, this.y, PIXEL_SIZE, PIP_DIM);
    }
}

const rover = new Rover();

function resize() {
    const container = document.getElementById('canvas-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    rover.reset();
}

window.addEventListener('resize', resize);
resize();

// Input Handling
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (gameState !== 'PLAYING') {
            e.preventDefault(); // prevent scroll
            startGame();
        } else {
            e.preventDefault(); // prevent scroll
            keys.space = true;
        }
    }
    if (e.code === 'ArrowDown') {
        e.preventDefault();
        keys.down = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') keys.space = false;
    if (e.code === 'ArrowDown') keys.down = false;
});

// Touch controls
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState !== 'PLAYING') {
        startGame();
    } else {
        // Top half jump, bottom half duck? 
        // Simple tap = jump, hold behavior is implied by duration
        keys.space = true;
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.space = false;
});

restartBtn.addEventListener('click', startGame);

function startGame() {
    gameState = 'PLAYING';
    distance = 0;
    speed = START_SPEED;
    obstacles = [];
    clouds = [];
    overlay.classList.add('hidden');
    nukeImg.classList.add('hidden');
    nukeImg.classList.remove('active');
    rover.reset();
    gameTime = Date.now();
    loop();
}

function gameOver() {
    gameState = 'GAMEOVER';

    // Nuke Effect
    nukeImg.classList.remove('hidden');
    // Trigger reflow
    void nukeImg.offsetWidth;
    nukeImg.classList.add('active');

    // Show overlay after a delay to let explosion play
    setTimeout(() => {
        overlay.classList.remove('hidden');
        overlayTitle.innerText = 'MISSION FAILED';
        overlayMessage.innerText = `DISTANCE COVERED: ${Math.floor(distance)}m`;

        if (window.pipSound) window.pipSound.playAlarm();

        if (distance > highScore) {
            highScore = Math.floor(distance);
            localStorage.setItem('wasteland-rover-high-score', highScore);
            highScoreEl.innerText = String(highScore).padStart(5, '0') + 'm';
        }
    }, 1000);
}

// Fixed Update Loop for consistency
function update() {
    if (gameState === 'PLAYING') {
        frameCount++;
        distance += speed * 0.05;

        // Acceleration
        if (speed < MAX_SPEED) {
            speed += SPEED_ACCEL;
        }

        distanceEl.innerText = String(Math.floor(distance)).padStart(5, '0') + 'm';

        // Spawn Obstacles
        // Min distance variance based on speed
        if (obstacles.length === 0 ||
            (canvas.width - obstacles[obstacles.length - 1].x > (400 + Math.random() * 400))) {

            // Random chance to spawn based on speed density
            if (Math.random() < 0.02 + (speed * 0.001)) {
                obstacles.push(new Obstacle());
            }
        }

        // Spawn Clouds
        if (Math.random() < 0.005) {
            clouds.push(new Cloud());
        }

        rover.update();

        // Background
        clouds.forEach(c => c.update());
        clouds = clouds.filter(c => c.x + 100 > 0);

        // Obstacles
        obstacles.forEach(obs => obs.update());
        obstacles = obstacles.filter(obs => obs.x + obs.width > 0);

        // Collision
        const roverBox = rover.getHitbox();
        for (let obs of obstacles) {
            const obsBox = obs.getHitbox();
            if (
                roverBox.x < obsBox.x + obsBox.width &&
                roverBox.x + roverBox.width > obsBox.x &&
                roverBox.y < obsBox.y + obsBox.height &&
                roverBox.y + roverBox.height > obsBox.y
            ) {
                gameOver();
                return;
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ground
    ctx.strokeStyle = PIP_GREEN;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * GROUND_Y);
    ctx.lineTo(canvas.width, canvas.height * GROUND_Y);
    ctx.stroke();

    // Clouds (Background)
    clouds.forEach(c => c.draw());

    // Entities
    obstacles.forEach(obs => obs.draw());
    rover.draw();
}

function loop() {
    if (gameState === 'PLAYING') {
        update();
        draw();
        requestAnimationFrame(loop);
    } else if (gameState === 'GAMEOVER') {
        // Draw one last time to show collision
        draw();
    } else {
        // Start screen
        rover.draw();
    }
}

// Initial draw
resize();
rover.draw();
highScoreEl.innerText = String(highScore).padStart(5, '0') + 'm';
