import { useState, useEffect, useCallback, useRef } from 'react';

// ═══ Types ═══════════════════════════════════════════════════════════

type ChallengeType = 'sequence' | 'binary' | 'cipher' | 'gates';
type GameStatus = 'idle' | 'playing' | 'correct' | 'wrong' | 'gameOver';

interface Challenge {
    type: ChallengeType;
    title: string;
    prompt: string;
    question: string;
    options: string[];
    correctIndex: number;
}

interface LogEntry {
    round: number;
    label: string;
    correct: boolean;
}

// ═══ Constants ═══════════════════════════════════════════════════════

const MAX_LIVES = 3;
const BASE_TIME = 30;
const TIME_STEP = 2;
const MIN_TIME = 12;
const BASE_POINTS = 100;
const STREAK_BONUS = 25;
const TIME_BONUS = 5;
const FEEDBACK_MS = 1200;
const HS_KEY = 'cypherBreach_hs';

const HEX = '0123456789ABCDEF';
const JUNK = '!@#$%^&*(){}[]|;:<>?/~';

const TYPE_LABEL: Record<ChallengeType, string> = {
    sequence: 'SEQ', binary: 'BIN', cipher: 'CIP', gates: 'LOG',
};

const DECODED_MSGS = [
    'CLEARANCE LEVEL 1: GRANTED',
    'FIREWALL ALPHA: BYPASSED',
    'ENCRYPTION KEY: EXTRACTED',
    'ROOT ACCESS: ESCALATED',
    'DATABASE: UNLOCKED',
    'CORE SYSTEMS: EXPOSED',
    'ADMIN OVERRIDE: ACTIVE',
    'NEURAL NET: BREACHED',
    'QUANTUM LOCK: CRACKED',
    'MAINFRAME: OWNED',
];

// ═══ Helpers (exported for testing) ══════════════════════════════════

export function shuffleOptions(opts: string[], ansIdx: number): { options: string[]; correctIndex: number } {
    const ans = opts[ansIdx];
    const shuffled = [...opts].sort(() => Math.random() - 0.5);
    return { options: shuffled, correctIndex: shuffled.indexOf(ans) };
}

export function makeDistractors(answer: number, count: number): number[] {
    const s = new Set<number>();
    const range = Math.max(10, Math.ceil(Math.abs(answer) * 0.4));
    let t = 0;
    while (s.size < count && t++ < 200) {
        const off = Math.floor(Math.random() * range) + 1;
        const v = answer + (Math.random() > 0.5 ? off : -off);
        if (v !== answer && v >= 0) s.add(v);
    }
    let f = 1;
    while (s.size < count) s.add(Math.abs(answer) + f++);
    return [...s].slice(0, count);
}

export function makeWordDistractors(word: string, pool: string[]): string[] {
    const sameLen = pool.filter(w => w.length === word.length && w !== word);
    const dWords = sameLen.sort(() => Math.random() - 0.5).slice(0, 3);
    while (dWords.length < 3) {
        const rw = Array.from({ length: word.length }, () =>
            String.fromCharCode(65 + Math.floor(Math.random() * 26))
        ).join('');
        if (rw !== word && !dWords.includes(rw)) dWords.push(rw);
    }
    return dWords.slice(0, 3);
}

// ═══ Challenge Generators ════════════════════════════════════════════

export function genSequence(diff: number): Challenge {
    const makers = [
        () => {
            const a = Math.floor(Math.random() * 10) + 1;
            const d = Math.floor(Math.random() * (3 + diff)) + 2;
            const s = Array.from({ length: 5 }, (_, i) => a + d * i);
            return { shown: s.slice(0, 4), answer: s[4] };
        },
        () => {
            const a = Math.floor(Math.random() * 3) + 2;
            const r = Math.floor(Math.random() * 2) + 2;
            const s = Array.from({ length: 5 }, (_, i) => a * r ** i);
            return { shown: s.slice(0, 4), answer: s[4] };
        },
        () => {
            const o = Math.floor(Math.random() * 3) + 1;
            const s = Array.from({ length: 5 }, (_, i) => (i + o) ** 2);
            return { shown: s.slice(0, 4), answer: s[4] };
        },
        () => {
            const x = Math.floor(Math.random() * 3) + 1;
            const y = Math.floor(Math.random() * 3) + x + 1;
            const s = [x, y];
            for (let i = 2; i < 6; i++) s.push(s[i - 1] + s[i - 2]);
            return { shown: s.slice(0, 5), answer: s[5] };
        },
        () => {
            const s = Array.from({ length: 6 }, (_, i) => ((i + 1) * (i + 2)) / 2);
            return { shown: s.slice(0, 5), answer: s[5] };
        },
    ];

    const pool = Math.min(makers.length, 2 + Math.floor(diff / 2));
    const { shown, answer } = makers[Math.floor(Math.random() * pool)]();
    const opts = [String(answer), ...makeDistractors(answer, 3).map(String)];
    const { options, correctIndex } = shuffleOptions(opts, 0);

    return {
        type: 'sequence',
        title: 'SEQUENCE ANALYSIS',
        prompt: 'Identify the next value in the sequence',
        question: shown.join(', ') + ', ?',
        options,
        correctIndex,
    };
}

export function genBinary(diff: number): Challenge {
    const ops = [
        { sym: 'AND', fn: (a: number, b: number) => a & b },
        { sym: 'OR', fn: (a: number, b: number) => a | b },
        { sym: 'XOR', fn: (a: number, b: number) => a ^ b },
    ];
    if (diff >= 3) ops.push({ sym: 'NAND', fn: (a: number, b: number) => ~(a & b) });

    const bits = Math.min(4 + Math.floor(diff / 2), 8);
    const mask = (1 << bits) - 1;
    const op = ops[Math.floor(Math.random() * ops.length)];
    const a = Math.floor(Math.random() * (mask + 1));
    const b = Math.floor(Math.random() * (mask + 1));
    const result = op.fn(a, b) & mask;
    const bin = (n: number) => n.toString(2).padStart(bits, '0');

    const dSet = new Set<string>();
    let tries = 0;
    while (dSet.size < 3 && tries++ < 200) {
        const d = Math.floor(Math.random() * (mask + 1));
        const ds = bin(d);
        if (ds !== bin(result)) dSet.add(ds);
    }
    let fill = 1;
    while (dSet.size < 3) dSet.add(bin((result + fill++) & mask));

    const opts = [bin(result), ...[...dSet].slice(0, 3)];
    const { options, correctIndex } = shuffleOptions(opts, 0);

    return {
        type: 'binary',
        title: 'BITWISE OPS',
        prompt: `Compute the ${bits}-bit result`,
        question: `${bin(a)} ${op.sym} ${bin(b)}`,
        options,
        correctIndex,
    };
}

export function genCipher(diff: number): Challenge {
    const pools = [
        ['CAT', 'DOG', 'RUN', 'FLY', 'SPY', 'NET', 'KEY', 'BIT', 'HEX', 'BUG'],
        ['CODE', 'HACK', 'DATA', 'BYTE', 'CORE', 'LOCK', 'PORT', 'ROOT', 'SCAN', 'PING'],
        ['CRACK', 'SHELL', 'PROXY', 'STACK', 'TRACE', 'TOKEN', 'CYBER', 'PATCH', 'VIRUS', 'VAULT'],
        ['CIPHER', 'DECODE', 'BREACH', 'KERNEL', 'BINARY', 'MATRIX', 'SIGNAL', 'VECTOR', 'SOCKET', 'SHADOW'],
    ];

    const pi = Math.min(Math.floor(diff / 2), pools.length - 1);
    const pool = pools[pi];
    const word = pool[Math.floor(Math.random() * pool.length)];
    const shift = Math.floor(Math.random() * 20) + 3;
    const enc = (w: string) =>
        w.split('').map(c => String.fromCharCode(((c.charCodeAt(0) - 65 + shift) % 26) + 65)).join('');
    const encrypted = enc(word);

    const dWords = makeWordDistractors(word, pool);

    const opts = [word, ...dWords.slice(0, 3)];
    const { options, correctIndex } = shuffleOptions(opts, 0);

    return {
        type: 'cipher',
        title: 'CIPHER DECODE',
        prompt: `Caesar shift +${shift} — Decode the ciphertext`,
        question: encrypted,
        options,
        correctIndex,
    };
}

export function genGates(diff: number): Challenge {
    const gates = [
        { n: 'AND', f: (a: number, b: number) => a & b },
        { n: 'OR', f: (a: number, b: number) => a | b },
        { n: 'XOR', f: (a: number, b: number) => a ^ b },
        { n: 'NAND', f: (a: number, b: number) => (a & b) ? 0 : 1 },
    ];

    if (diff >= 2) {
        const g1 = gates[Math.floor(Math.random() * 3)];
        const g2 = gates[Math.floor(Math.random() * 3)];
        const a = Math.random() > 0.5 ? 1 : 0;
        const b = Math.random() > 0.5 ? 1 : 0;
        const c = Math.random() > 0.5 ? 1 : 0;
        const r = g2.f(g1.f(a, b), c);

        return {
            type: 'gates',
            title: 'LOGIC GATES',
            prompt: 'Evaluate the compound gate circuit',
            question: `A=${a}  B=${b}  C=${c}\n(A ${g1.n} B) ${g2.n} C = ?`,
            options: ['0', '1'],
            correctIndex: r,
        };
    }

    const g = gates[Math.floor(Math.random() * gates.length)];
    const a = Math.random() > 0.5 ? 1 : 0;
    const b = Math.random() > 0.5 ? 1 : 0;
    const r = g.f(a, b);

    return {
        type: 'gates',
        title: 'LOGIC GATES',
        prompt: 'Evaluate the gate output',
        question: `A=${a}  B=${b}\nA ${g.n} B = ?`,
        options: ['0', '1'],
        correctIndex: r,
    };
}

export function generateChallenge(round: number): Challenge {
    const diff = Math.floor((round - 1) / 3);
    const gen = [
        () => genSequence(diff),
        () => genBinary(diff),
        () => genCipher(diff),
        () => genGates(diff),
    ];
    return gen[Math.floor(Math.random() * gen.length)]();
}

export function genMemLine(): string {
    const addr = '0x' + Array.from({ length: 4 }, () => HEX[Math.floor(Math.random() * 16)]).join('');
    const data = Array.from({ length: 12 }, () =>
        Math.random() > 0.4 ? HEX[Math.floor(Math.random() * 16)] : JUNK[Math.floor(Math.random() * JUNK.length)]
    ).join('');
    return `${addr} ${data}`;
}

function getTimeForRound(round: number): number {
    return Math.max(MIN_TIME, BASE_TIME - (round - 1) * TIME_STEP);
}

// ═══ Component ═══════════════════════════════════════════════════════

export function Hacking() {
    const [status, setStatus] = useState<GameStatus>('idle');
    const [round, setRound] = useState(0);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(MAX_LIVES);
    const [streak, setStreak] = useState(0);
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [log, setLog] = useState<LogEntry[]>([]);
    const [highScore, setHighScore] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [memLines, setMemLines] = useState<string[]>([]);
    const [breached, setBreached] = useState(0);

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const feedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load high score on mount
    useEffect(() => {
        try {
            const v = localStorage.getItem(HS_KEY);
            if (v) setHighScore(parseInt(v, 10) || 0);
        } catch { /* localStorage unavailable */ }
        setMemLines(Array.from({ length: 8 }, genMemLine));
    }, []);

    // Timer tick
    useEffect(() => {
        if (status !== 'playing' || timeLeft <= 0) return;
        timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [status, timeLeft]);

    // Timer expiry
    useEffect(() => {
        if (status !== 'playing' || timeLeft > 0 || !challenge) return;
        setLog(prev => [...prev, { round, label: TYPE_LABEL[challenge.type], correct: false }]);
        setStreak(0);
        setSelected(null);
        const newLives = lives - 1;
        setLives(newLives);
        setStatus(newLives <= 0 ? 'gameOver' : 'wrong');
    }, [status, timeLeft, challenge, round, lives]);

    // Auto-advance after correct/wrong feedback.
    // Intentionally depends only on `status` — we capture `round` at the moment the
    // feedback status is set (which is the current round), and the timeout fires once
    // per status transition.  Adding `round` would re-trigger on the advance itself.
    useEffect(() => {
        if (status !== 'correct' && status !== 'wrong') return;
        feedbackRef.current = setTimeout(() => {
            const next = round + 1;
            setRound(next);
            setChallenge(generateChallenge(next));
            setTimeLeft(getTimeForRound(next));
            setSelected(null);
            setStatus('playing');
            setMemLines(Array.from({ length: 8 }, genMemLine));
        }, FEEDBACK_MS);
        return () => { if (feedbackRef.current) clearTimeout(feedbackRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    // Save high score
    useEffect(() => {
        if (score > highScore && score > 0) {
            setHighScore(score);
            try { localStorage.setItem(HS_KEY, String(score)); } catch { /* */ }
        }
    }, [score, highScore]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (feedbackRef.current) clearTimeout(feedbackRef.current);
        };
    }, []);

    const startGame = useCallback(() => {
        if (feedbackRef.current) clearTimeout(feedbackRef.current);
        if (timerRef.current) clearTimeout(timerRef.current);
        const c = generateChallenge(1);
        setRound(1);
        setScore(0);
        setLives(MAX_LIVES);
        setStreak(0);
        setBreached(0);
        setLog([]);
        setSelected(null);
        setChallenge(c);
        setTimeLeft(getTimeForRound(1));
        setMemLines(Array.from({ length: 8 }, genMemLine));
        setStatus('playing');
    }, []);

    const handleAnswer = useCallback((index: number) => {
        if (status !== 'playing' || !challenge) return;
        if (timerRef.current) clearTimeout(timerRef.current);
        setSelected(index);

        const correct = index === challenge.correctIndex;
        setLog(prev => [...prev, { round, label: TYPE_LABEL[challenge.type], correct }]);

        if (correct) {
            const newStreak = streak + 1;
            setStreak(newStreak);
            setBreached(prev => prev + 1);
            const pts = BASE_POINTS + newStreak * STREAK_BONUS + timeLeft * TIME_BONUS;
            setScore(prev => prev + pts);
            setStatus('correct');
        } else {
            setStreak(0);
            const newLives = lives - 1;
            setLives(newLives);
            setStatus(newLives <= 0 ? 'gameOver' : 'wrong');
        }
    }, [status, challenge, round, streak, timeLeft, lives]);

    const timerPct = challenge ? (timeLeft / getTimeForRound(round)) * 100 : 0;

    // ─── Render ─────────────────────────────────────────────────────

    return (
        <div className="h-full flex flex-col font-mono" data-testid="hacking-game">
            {/* Header */}
            <div className="mb-2 lg:mb-4">
                <h2 className="text-lg lg:text-2xl font-bold uppercase tracking-widest">CYPHER BREACH v2.0</h2>
                <p className="text-xs lg:text-sm opacity-60">NEURAL INTRUSION FRAMEWORK</p>
            </div>

            {/* Status Bar */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs lg:text-sm font-bold uppercase tracking-widest" data-testid="hacking-status-bar">
                <span data-testid="hacking-round">NODE: {status === 'idle' ? '–' : round}</span>
                <span data-testid="hacking-score">SCORE: {score}</span>
                <span data-testid="hacking-high-score">HI: {Math.max(score, highScore)}</span>
                <span data-testid="hacking-lives">{'♥'.repeat(lives)}{'♡'.repeat(MAX_LIVES - lives)}</span>
                {streak > 1 && <span data-testid="hacking-streak" className="animate-pulse">⚡×{streak}</span>}
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col lg:flex-row gap-3 lg:gap-6 overflow-hidden min-h-0">
                {/* Challenge Panel */}
                <div className="flex-1 flex flex-col border-chunky-thin p-3 lg:p-6 bg-black/50 overflow-y-auto scrollbar-hide">
                    {/* IDLE */}
                    {status === 'idle' && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 lg:gap-6 text-center" data-testid="hacking-intro">
                            <div className="text-4xl lg:text-6xl font-bold animate-pulse" aria-hidden="true">⟨/⟩</div>
                            <div className="space-y-2 max-w-md">
                                <p className="text-sm lg:text-base opacity-80">
                                    Breach security nodes by solving algorithmic challenges:
                                    sequences, bitwise ops, ciphers, and logic gates.
                                </p>
                                <p className="text-xs opacity-50">
                                    +100 pts per breach • ⚡ streak bonus • ⏱ time bonus
                                </p>
                            </div>
                            <button
                                onClick={startGame}
                                className="border-2 border-[var(--term-color)] px-8 py-3 uppercase tracking-widest font-bold hover:bg-[var(--term-color)] hover:text-[var(--term-bg)] transition-colors"
                                data-testid="hacking-start"
                            >
                                INITIATE BREACH
                            </button>
                        </div>
                    )}

                    {/* PLAYING / FEEDBACK */}
                    {(status === 'playing' || status === 'correct' || status === 'wrong') && challenge && (
                        <div className="flex-1 flex flex-col" data-testid="hacking-challenge">
                            <div className="mb-2 lg:mb-4 border-b border-[var(--term-color)]/30 pb-2">
                                <h3 className="font-bold tracking-widest text-sm lg:text-lg">{challenge.title}</h3>
                                <p className="text-xs lg:text-sm opacity-70">{challenge.prompt}</p>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center gap-4 lg:gap-6">
                                <div
                                    className="text-lg lg:text-2xl font-bold tracking-wider text-center px-2 whitespace-pre-line"
                                    data-testid="hacking-question"
                                >
                                    {challenge.question}
                                </div>

                                <div
                                    className="grid grid-cols-2 gap-2 lg:gap-3 w-full max-w-md"
                                    data-testid="hacking-options"
                                >
                                    {challenge.options.map((opt, i) => {
                                        let cls = 'border-2 border-[var(--term-color)] px-3 py-3 lg:px-4 lg:py-4 uppercase tracking-widest font-bold transition-colors text-sm lg:text-base text-center break-all';
                                        if (selected !== null) {
                                            if (i === challenge.correctIndex) {
                                                cls += ' bg-[var(--term-color)] text-[var(--term-bg)]';
                                            } else if (i === selected) {
                                                cls += ' opacity-30 line-through';
                                            } else {
                                                cls += ' opacity-30';
                                            }
                                        } else {
                                            cls += ' hover:bg-[var(--term-color)] hover:text-[var(--term-bg)]';
                                        }
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => handleAnswer(i)}
                                                disabled={status !== 'playing'}
                                                className={cls}
                                                data-testid={`hacking-option-${i}`}
                                            >
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>

                                {status === 'correct' && (
                                    <p className="text-sm font-bold animate-pulse tracking-widest" data-testid="hacking-feedback-correct">
                                        ✓ NODE {round} BREACHED
                                    </p>
                                )}
                                {status === 'wrong' && (
                                    <p className="text-sm font-bold text-red-500 animate-pulse tracking-widest" data-testid="hacking-feedback-wrong">
                                        ✗ INTRUSION DETECTED
                                    </p>
                                )}
                            </div>

                            {/* Timer Bar */}
                            <div className="mt-3" data-testid="hacking-timer">
                                <div className="flex justify-between text-xs mb-1 tracking-widest">
                                    <span>TIMEOUT</span>
                                    <span>{timeLeft}s</span>
                                </div>
                                <div className="h-2 border border-[var(--term-color)]/50 bg-black/50">
                                    <div
                                        className="h-full transition-all duration-1000"
                                        style={{
                                            width: `${timerPct}%`,
                                            backgroundColor: 'var(--term-color)',
                                            opacity: timerPct < 30 ? 1 : 0.7,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* GAME OVER */}
                    {status === 'gameOver' && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center" data-testid="hacking-game-over">
                            <div className="text-3xl lg:text-5xl font-bold text-red-500 animate-pulse">CONNECTION LOST</div>
                            <div className="space-y-1 text-sm">
                                <p className="tracking-widest">NODES BREACHED: {breached}</p>
                                <p className="tracking-widest font-bold">FINAL SCORE: {score}</p>
                                {score >= highScore && score > 0 && (
                                    <p className="tracking-widest animate-pulse" data-testid="hacking-new-hs">★ NEW HIGH SCORE ★</p>
                                )}
                            </div>
                            <button
                                onClick={startGame}
                                className="border-2 border-[var(--term-color)] px-8 py-3 uppercase tracking-widest font-bold hover:bg-[var(--term-color)] hover:text-[var(--term-bg)] transition-colors"
                                data-testid="hacking-restart"
                            >
                                REBOOT SYSTEM
                            </button>
                        </div>
                    )}
                </div>

                {/* Side Panel */}
                <div className="lg:w-72 flex flex-col gap-3 overflow-hidden min-h-0">
                    {/* Breach Log */}
                    <div className="border-chunky-thin p-3 bg-black/50 overflow-y-auto scrollbar-hide flex-1 min-h-0 max-h-32 lg:max-h-none" data-testid="hacking-log">
                        <h4 className="text-xs font-bold tracking-widest mb-2 border-b border-[var(--term-color)]/30 pb-1">BREACH LOG</h4>
                        {log.length === 0 && <p className="text-xs opacity-40">No entries...</p>}
                        {[...log].reverse().map((e, i) => (
                            <div key={i} className="text-xs tracking-widest mb-0.5">
                                &gt; N{e.round} [{e.label}] {e.correct ? '✓' : '✗'}
                            </div>
                        ))}
                    </div>

                    {/* Memory Dump */}
                    <div className="border-chunky-thin p-3 bg-black/50 overflow-y-auto scrollbar-hide flex-1 min-h-0 max-h-28 lg:max-h-none" data-testid="hacking-memory">
                        <h4 className="text-xs font-bold tracking-widest mb-2 border-b border-[var(--term-color)]/30 pb-1">MEMORY DUMP</h4>
                        {breached > 0 && DECODED_MSGS.slice(0, Math.min(breached, DECODED_MSGS.length)).map((msg, i) => (
                            <div key={`d-${i}`} className="text-[10px] lg:text-xs tracking-wider font-mono mb-0.5 font-bold">
                                &gt; {msg}
                            </div>
                        ))}
                        {memLines.map((line, i) => (
                            <div key={i} className="text-[10px] lg:text-xs opacity-40 tracking-wider font-mono break-all mb-0.5">{line}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
