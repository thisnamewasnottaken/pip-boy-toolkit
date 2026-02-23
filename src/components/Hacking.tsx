import { useState, useEffect, useCallback } from 'react';

const WORDS = [
    'FALLOUT', 'VAULT', 'PIPBOY', 'RADS', 'WASTELAND', 'GHOUL', 'MUTANT',
    'ENCLAVE', 'NUKA', 'CAPS', 'STIMPAK', 'RADAWAY', 'FUSION', 'CORE', 'POWER',
    'ARMOR', 'LASER', 'PLASMA', 'RIFLE', 'PISTOL', 'MELEE', 'SNEAK',
    'LOCKPICK', 'SCIENCE', 'REPAIR', 'MEDICINE', 'SPEECH', 'BARTER', 'SURVIVAL',
];

const HEX_CHARS = '0123456789ABCDEF';
const GARBAGE_CHARS = '!@#$%^&*()_+-=[]{}|;:\'",./<>?~`';

interface MemoryLine {
    hex: string;
    chars: string;
}

export function Hacking() {
    const [words, setWords] = useState<string[]>([]);
    const [password, setPassword] = useState('');
    const [attempts, setAttempts] = useState(4);
    const [history, setHistory] = useState<{ word: string; match: number }[]>([]);
    const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
    const [memoryDump, setMemoryDump] = useState<MemoryLine[]>([]);

    const initGame = useCallback(() => {
        const targetLength = Math.floor(Math.random() * 4) + 5;
        const validWords = WORDS.filter(w => w.length === targetLength);

        const shuffled = [...validWords].sort(() => 0.5 - Math.random());
        const selectedWords = shuffled.slice(0, Math.min(10, shuffled.length));

        const pwd = selectedWords[Math.floor(Math.random() * selectedWords.length)];

        setWords(selectedWords);
        setPassword(pwd);
        setAttempts(4);
        setHistory([]);
        setStatus('playing');

        const dump: MemoryLine[] = [];
        let wordIndex = 0;
        for (let i = 0; i < 16; i++) {
            const hex = '0x' + Array.from({ length: 4 }, () => HEX_CHARS[Math.floor(Math.random() * 16)]).join('');
            let chars = '';

            for (let j = 0; j < 12; j++) {
                if (wordIndex < selectedWords.length && Math.random() > 0.8 && chars.length + selectedWords[wordIndex].length <= 12) {
                    chars += selectedWords[wordIndex];
                    j += selectedWords[wordIndex].length - 1;
                    wordIndex++;
                } else {
                    chars += GARBAGE_CHARS[Math.floor(Math.random() * GARBAGE_CHARS.length)];
                }
            }
            dump.push({ hex, chars });
        }
        setMemoryDump(dump);
    }, []);

    useEffect(() => {
        initGame();
    }, [initGame]);

    const handleGuess = (guess: string) => {
        if (status !== 'playing') return;

        let matchCount = 0;
        for (let i = 0; i < guess.length; i++) {
            if (guess[i] === password[i]) matchCount++;
        }

        const newHistory = [...history, { word: guess, match: matchCount }];
        setHistory(newHistory);

        if (matchCount === password.length) {
            setStatus('won');
        } else {
            const newAttempts = attempts - 1;
            setAttempts(newAttempts);
            if (newAttempts === 0) setStatus('lost');
        }
    };

    return (
        <div className="h-full flex flex-col font-mono" data-testid="hacking-game">
            <div className="mb-4">
                <h2 className="text-2xl font-bold uppercase tracking-widest">ROBCO INDUSTRIES UNIFIED OPERATING SYSTEM</h2>
                <p className="opacity-80">COPYRIGHT 2075-2077 ROBCO INDUSTRIES</p>
                <p className="opacity-80">-Server 1-</p>
            </div>

            <div className="mb-6">
                <p className="font-bold uppercase tracking-widest mb-2" data-testid="hacking-attempts">
                    {attempts} ATTEMPT(S) LEFT: {'█ '.repeat(attempts)}
                </p>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-hidden">
                {/* Memory Dump Area */}
                <div className="border-chunky-thin p-4 bg-black/50 overflow-y-auto font-mono text-sm md:text-base leading-relaxed">
                    {memoryDump.map((line, i) => (
                        <div key={i} className="flex gap-4 mb-1">
                            <span className="opacity-50">{line.hex}</span>
                            <span className="tracking-widest break-all">
                                {line.chars.split('').map((char, j) => (
                                    <span key={j}>{char}</span>
                                ))}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Interaction Area */}
                <div className="flex flex-col gap-4">
                    <div className="border-chunky-thin p-4 bg-black/50 flex-1 overflow-y-auto">
                        <h3 className="font-bold uppercase tracking-widest mb-4 border-b border-[var(--term-color)]/30 pb-2">AVAILABLE PASSWORDS</h3>
                        <div className="grid grid-cols-2 gap-2" data-testid="hacking-words">
                            {words.map((word, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleGuess(word)}
                                    disabled={status !== 'playing'}
                                    className="text-left hover:bg-[var(--term-color)] hover:text-[var(--term-bg)] px-2 py-1 uppercase tracking-widest transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[var(--term-color)]"
                                    data-testid={`hacking-word-${i}`}
                                >
                                    {word}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="border-chunky-thin p-4 bg-black/50 h-48 overflow-y-auto flex flex-col justify-end" data-testid="hacking-history">
                        {history.map((h, i) => (
                            <div key={i} className="uppercase tracking-widest mb-1">
                                &gt; {h.word}
                                <br />
                                &gt; Entry denied ({h.match}/{password.length} correct)
                            </div>
                        ))}
                        {status === 'won' && (
                            <div className="uppercase tracking-widest mt-2 animate-pulse font-bold" data-testid="hacking-win">
                                &gt; Exact match!
                                <br />
                                &gt; Please wait while system is accessed...
                            </div>
                        )}
                        {status === 'lost' && (
                            <div className="uppercase tracking-widest mt-2 text-red-500 font-bold animate-pulse" data-testid="hacking-loss">
                                &gt; TERMINAL LOCKED
                                <br />
                                &gt; PLEASE CONTACT ADMINISTRATOR
                            </div>
                        )}
                        {status !== 'playing' && (
                            <button
                                onClick={initGame}
                                className="mt-4 border border-[var(--term-color)] px-4 py-2 uppercase tracking-widest hover:bg-[var(--term-color)] hover:text-[var(--term-bg)] w-fit"
                                data-testid="hacking-reboot"
                            >
                                REBOOT SYSTEM
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
