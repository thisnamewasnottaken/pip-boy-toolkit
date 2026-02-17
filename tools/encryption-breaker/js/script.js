/**
 * Encryption Breaker - Hacking Mini-game
 * Recreates the Fallout terminal hacking experience.
 */

class HackingGame {
    constructor() {
        this.words = [
            "ACCESS", "ALARM", "BLOCK", "BREAK", "CACHE", "CHIPS", "CLEAR", "CLOCK", "CLOUD",
            "CODES", "CRACK", "DATA", "DEBUG", "ERROR", "FILES", "FLASH", "FORCE", "GATES",
            "INDEX", "INPUT", "LOGIC", "MODEM", "NODES", "PATCH", "PHASE", "PIXEL", "POWER",
            "PROXY", "QUERY", "RESET", "ROTOR", "SCAN", "SCRAP", "SHIFT", "SPACE", "STACK",
            "STORE", "TRACE", "TRACK", "VALVE", "VAULT", "WAVES", "WRITE"
        ];

        this.symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?/";
        this.brackets = [
            ['<', '>'],
            ['[', ']'],
            ['{', '}'],
            ['(', ')']
        ];

        this.bracketPairs = []; // { pair, startIdx, endIdx }
        this.maxAttempts = 4;
        this.attemptsLeft = 4;
        this.wordLength = 5;
        this.wordCount = 12;
        this.password = "";
        this.wordPositions = []; // { word, startIdx, endIdx }
        this.dudWords = [];
        this.gridSize = 408; // 17 lines * 12 chars per column * 2 columns
        this.charsPerLine = 12;
        this.linesPerColumn = 17;

        this.init();
    }

    init() {
        this.setupGame();
        this.render();
        this.attachEventListeners();
    }

    setupGame() {
        this.isWin = false;
        this.isLocked = false;
        this.attemptsLeft = this.maxAttempts;
        this.updateAttemptsUI();
        this.bracketPairs = [];

        // Reset UI if restarting
        document.querySelector('.terminal-container').style.display = 'flex';
        document.getElementById('win-screen').style.display = 'none';

        const footerDesc = document.querySelector('.function-description');
        if (footerDesc) {
            footerDesc.textContent = "HACKING: Isolate the correct password. Pair matching brackets to clear duds or reset attempts.";
            footerDesc.classList.remove('flicker-text');
        }

        // Select random words
        const selectedWords = this.getRandomWords(this.wordCount);
        this.password = selectedWords[Math.floor(Math.random() * selectedWords.length)];
        this.dudWords = selectedWords.filter(w => w !== this.password);

        console.log("Password:", this.password);
    }

    getRandomWords(count) {
        const shuffled = [...this.words].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    render() {
        const col1 = document.getElementById('col-1');
        const col2 = document.getElementById('col-2');
        col1.innerHTML = '';
        col2.innerHTML = '';

        const totalChars = this.linesPerColumn * this.charsPerLine * 2;
        const gridChars = this.generateGridChars(totalChars);

        this.renderColumn(col1, gridChars.slice(0, totalChars / 2), 0);
        this.renderColumn(col2, gridChars.slice(totalChars / 2), totalChars / 2);
    }

    generateGridChars(totalSize) {
        let grid = Array(totalSize).fill(null).map(() => this.symbols[Math.floor(Math.random() * this.symbols.length)]);

        // Place words
        const wordsToPlace = [this.password, ...this.dudWords];
        for (const word of wordsToPlace) {
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 100) {
                const pos = Math.floor(Math.random() * (totalSize - word.length));
                const segment = grid.slice(pos, pos + word.length);
                if (segment.every(char => typeof char === 'string')) {
                    for (let i = 0; i < word.length; i++) {
                        grid[pos + i] = { char: word[i], word: word, isWord: true };
                    }
                    placed = true;
                }
                attempts++;
            }
        }

        // Place bracket pairs on remaining lines
        for (let i = 0; i < totalSize; i += this.charsPerLine) {
            // Check if this line has a word. If not (or even if it does, but we find space), add a bracket pair.
            const lineIdx = i;
            const lineEnd = i + this.charsPerLine;
            const line = grid.slice(lineIdx, lineEnd);

            // Find a range of symbols that could be a bracket pair
            const symbolIndices = [];
            line.forEach((item, idx) => {
                if (typeof item === 'string') symbolIndices.push(idx);
            });

            if (symbolIndices.length >= 2 && Math.random() > 0.4) {
                const startInLine = symbolIndices[0];
                const endInLine = symbolIndices[symbolIndices.length - 1];
                const length = endInLine - startInLine + 1;

                if (length >= 2) {
                    const pairSet = this.brackets[Math.floor(Math.random() * this.brackets.length)];
                    const bracketId = `bracket-${i}`;

                    grid[lineIdx + startInLine] = { char: pairSet[0], bracketId, isBracket: true, isStart: true };
                    grid[lineIdx + endInLine] = { char: pairSet[1], bracketId, isBracket: true, isEnd: true };

                    // Fill middle chars with bracket info so they highlight together
                    for (let j = startInLine + 1; j < endInLine; j++) {
                        if (typeof grid[lineIdx + j] === 'string') {
                            grid[lineIdx + j] = { char: grid[lineIdx + j], bracketId, isBracket: true };
                        }
                    }
                }
            }
        }

        return grid;
    }

    renderColumn(container, charData, startOffset) {
        for (let l = 0; l < this.linesPerColumn; l++) {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'terminal-line';

            const addr = document.createElement('span');
            addr.className = 'hex-addr';
            addr.textContent = `0x${(0xF724 + startOffset + l * this.charsPerLine).toString(16).toUpperCase()} `;
            lineDiv.appendChild(addr);

            for (let c = 0; c < this.charsPerLine; c++) {
                const data = charData[l * this.charsPerLine + c];
                const span = document.createElement('span');
                span.className = 'char-span';

                if (typeof data === 'string') {
                    span.textContent = data;
                } else {
                    span.textContent = data.char;
                    if (data.isWord) {
                        span.dataset.word = data.word;
                        span.classList.add('word-char');
                    } else if (data.isBracket) {
                        span.dataset.bracketId = data.bracketId;
                        span.classList.add('bracket-char');
                        if (data.isStart) span.dataset.isStart = "true";
                    }
                }

                lineDiv.appendChild(span);
            }
            container.appendChild(lineDiv);
        }
    }

    updateAttemptsUI() {
        document.getElementById('attempts-left').textContent = this.attemptsLeft;
        const blocks = "█ ".repeat(this.attemptsLeft) + "░ ".repeat(this.maxAttempts - this.attemptsLeft);
        document.getElementById('attempt-blocks').textContent = blocks;
    }

    calculateLikeness(guess) {
        let likeness = 0;
        for (let i = 0; i < guess.length; i++) {
            if (guess[i] === this.password[i]) {
                likeness++;
            }
        }
        return likeness;
    }

    logMessage(msg) {
        const log = document.getElementById('output-log');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        log.appendChild(entry);

        let i = 0;
        const type = () => {
            if (i < msg.length) {
                entry.textContent += msg[i];
                i++;
                if (window.pipSound) window.pipSound.playGeiger(); // Use geiger for faster clicks
                setTimeout(type, 20);
            } else {
                log.scrollTop = log.scrollHeight;
            }
        };
        type();
    }

    attachEventListeners() {
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('char-span')) {
                const preview = document.getElementById('current-selection');
                const word = e.target.dataset.word;
                const bracketId = e.target.dataset.bracketId;

                document.querySelectorAll('.word-highlight').forEach(el => el.classList.remove('word-highlight'));

                if (word) {
                    preview.textContent = word;
                    document.querySelectorAll(`.char-span[data-word="${word}"]`).forEach(el => el.classList.add('word-highlight'));
                } else if (bracketId && e.target.dataset.isStart) {
                    document.querySelectorAll(`.char-span[data-bracket-id="${bracketId}"]`).forEach(el => el.classList.add('word-highlight'));

                    // Construct preview for bracket pair
                    let pairStr = "";
                    document.querySelectorAll(`.char-span[data-bracket-id="${bracketId}"]`).forEach(el => pairStr += el.textContent);
                    preview.textContent = pairStr;
                } else {
                    preview.textContent = e.target.textContent;
                }
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('char-span')) {
                document.querySelectorAll('.word-highlight').forEach(el => el.classList.remove('word-highlight'));
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('char-span')) {
                const word = e.target.dataset.word;
                const bracketId = e.target.dataset.bracketId;

                if (word) {
                    this.handleWordClick(word);
                } else if (bracketId && e.target.dataset.isStart) {
                    this.handleBracketClick(bracketId);
                }
            }
        });

        // Global Key Listener for Win/Loss states
        document.addEventListener('keydown', (e) => {
            if (this.isLocked || this.isWin) {
                if (e.code === 'Space') {
                    // Reset Game
                    this.init();
                } else if (e.code === 'Escape') {
                    // Go to Menu
                    window.location.href = '../../index.html';
                }
            }
        });
    }

    handleWordClick(word) {
        if (this.attemptsLeft <= 0 || this.isWin) return;

        this.logMessage(`> ${word}`);

        if (word === this.password) {
            this.handleWin();
        } else {
            this.attemptsLeft--;
            this.updateAttemptsUI();
            this.logMessage("> ENTRY DENIED.");
            this.logMessage(`> LIKENESS=${this.calculateLikeness(word)}`);

            if (this.attemptsLeft <= 0) {
                this.handleLockout();
            }
        }
    }

    handleWin() {
        this.isWin = true;
        this.logMessage("> EXACT MATCH!");
        this.logMessage("> PLEASE WAIT...");
        this.logMessage("> ACCESS GRANTED");

        // Play success sound sequence
        if (window.pipSound) {
            window.pipSound.playClick();
            setTimeout(() => window.pipSound.playAlarm(), 500);
        }

        setTimeout(() => {
            document.querySelector('.terminal-container').style.display = 'none';
            const winScreen = document.getElementById('win-screen');
            winScreen.style.display = 'flex';

            // Update Footer
            const footerDesc = document.querySelector('.function-description');
            if (footerDesc) {
                footerDesc.textContent = "EXACT MATCH ! ACCESS GRANTED ! SPACE TO HACK AGAIN. ESC TO RETURN TO MENU";
                footerDesc.classList.add('flicker-text');
            }
        }, 1200);
    }

    handleLockout() {
        this.isLocked = true;
        this.logMessage("> TERMINAL LOCKED");
        this.logMessage("> CONTACT SUPERVISOR");
        this.logMessage(" ");
        this.logMessage("[PRESS SPACE TO RETRY]");
        this.logMessage("[PRESS ESC FOR MENU]");
    }

    handleBracketClick(bracketId) {
        if (this.attemptsLeft <= 0 || this.isWin) return;
        // Use bracketId to identify used pairs
        const startBracket = document.querySelector(`.char-span[data-bracket-id="${bracketId}"][data-is-start="true"]`);
        if (!startBracket || startBracket.dataset.used) return;

        startBracket.dataset.used = "true";
        startBracket.style.opacity = "0.5";

        let fullStr = "";
        document.querySelectorAll(`.char-span[data-bracket-id="${bracketId}"]`).forEach(el => fullStr += el.textContent);
        this.logMessage(`> ${fullStr}`);

        // Randomly choose: Reset attempts or remove dud
        if (this.attemptsLeft < this.maxAttempts && Math.random() > 0.5) {
            this.attemptsLeft = this.maxAttempts;
            this.updateAttemptsUI();
            this.logMessage("> ATTEMPTS RESET.");
        } else {
            this.removeDud();
        }
    }

    removeDud() {
        if (this.dudWords.length === 0) return;

        const index = Math.floor(Math.random() * this.dudWords.length);
        const dud = this.dudWords[index];
        this.dudWords.splice(index, 1);

        // Replace dud in UI with dots
        document.querySelectorAll(`.char-span[data-word="${dud}"]`).forEach(el => {
            el.textContent = ".";
            el.classList.remove('word-char');
            delete el.dataset.word;
        });

        this.logMessage("> DUD REMOVED.");
    }
}

// Start the game
window.addEventListener('DOMContentLoaded', () => {
    new HackingGame();
});
