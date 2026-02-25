import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Skull } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TimerProps {
    debugMode?: boolean;
}

export function Timer({ debugMode = false }: TimerProps) {
    const getWorkTime = useCallback(() => debugMode ? 5 : 25 * 60, [debugMode]);
    const getBreakTime = useCallback(() => debugMode ? 3 : 5 * 60, [debugMode]);

    const [timeLeft, setTimeLeft] = useState(getWorkTime());
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'work' | 'break'>('work');
    const [showAnimation, setShowAnimation] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const volumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const endTimeRef = useRef<number | null>(null);

    useEffect(() => {
        audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        audioRef.current.loop = true;
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (volumeIntervalRef.current) {
                clearInterval(volumeIntervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isActive) {
            setTimeLeft(mode === 'work' ? getWorkTime() : getBreakTime());
        }
    }, [debugMode, isActive, mode, getWorkTime, getBreakTime]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            endTimeRef.current = null;
            setShowAnimation(true);

            if (audioRef.current) {
                audioRef.current.volume = 0.1;
                audioRef.current.play().catch(e => console.log("Audio play failed", e));

                volumeIntervalRef.current = setInterval(() => {
                    if (audioRef.current && audioRef.current.volume < 1.0) {
                        audioRef.current.volume = Math.min(1.0, audioRef.current.volume + 0.1);
                    }
                }, 10000);
            }

            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Pip-Boy Timer', {
                    body: mode === 'work' ? 'CYCLE COMPLETE' : 'BREAK OVER',
                    icon: '/pip-boy-toolkit/favicon.ico',
                });
            }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && endTimeRef.current !== null) {
                const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
                setTimeLeft(Math.max(0, remaining));
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const toggleTimer = () => {
        if (!isActive) {
            endTimeRef.current = Date.now() + timeLeft * 1000;
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        } else {
            endTimeRef.current = null;
        }
        setIsActive(!isActive);
    };
    const resetTimer = () => {
        setIsActive(false);
        endTimeRef.current = null;
        setTimeLeft(mode === 'work' ? getWorkTime() : getBreakTime());
    };

    const stopAlert = () => {
        setShowAnimation(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        if (volumeIntervalRef.current) {
            clearInterval(volumeIntervalRef.current);
        }

        if (mode === 'work') {
            setMode('break');
            setTimeLeft(getBreakTime());
        } else {
            setMode('work');
            setTimeLeft(getWorkTime());
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center justify-center h-full relative overflow-hidden" data-testid="timer-container">
            <AnimatePresence>
                {showAnimation && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        onClick={stopAlert}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50 cursor-pointer"
                        data-testid="timer-alert"
                    >
                        <motion.div
                            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                        >
                            <Skull size={120} className="text-[var(--term-color)] mb-4" />
                        </motion.div>
                        <h2 className="text-4xl font-bold uppercase tracking-widest text-center crt-glow animate-pulse">
                            {mode === 'work' ? 'CYCLE COMPLETE' : 'BREAK OVER'}
                        </h2>
                        <p className="mt-4 text-xl uppercase tracking-widest">
                            TAP TO ACKNOWLEDGE
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/*
              Mobile landscape: horizontal layout — timer left, controls right
              Portrait + desktop: vertical centered layout
            */}
            <div className="landscape:flex landscape:lg:block landscape:items-center landscape:gap-6 landscape:w-full landscape:justify-center contents lg:contents">
                {/* Timer display + mode label */}
                <div className="text-center shrink-0">
                    <h2 className="text-lg lg:text-2xl font-bold uppercase tracking-widest mb-1 lg:mb-2" data-testid="timer-mode">
                        {mode === 'work' ? 'WORK CYCLE' : 'BREAK CYCLE'}
                    </h2>
                    <div className="text-5xl lg:text-9xl font-mono font-bold tracking-tighter crt-glow" data-testid="timer-display">
                        {formatTime(timeLeft)}
                    </div>
                </div>

                {/* Controls group */}
                <div className="flex flex-col items-center gap-2 lg:gap-4 mt-3 lg:mt-8 landscape:mt-0 shrink-0">
                    {/* Start/Pause + Reset */}
                    <div className="flex gap-2 lg:gap-4">
                        <button
                            onClick={toggleTimer}
                            className="p-2 lg:p-4 border-chunky-thin hover:bg-[var(--term-color)] hover:text-[var(--term-bg)] transition-colors flex items-center gap-1.5 uppercase font-bold text-xs lg:text-base"
                            data-testid="timer-toggle"
                        >
                            {isActive ? <Pause size={16} className="lg:w-6 lg:h-6" /> : <Play size={16} className="lg:w-6 lg:h-6" />}
                            {isActive ? 'PAUSE' : 'START'}
                        </button>
                        <button
                            onClick={resetTimer}
                            className="p-2 lg:p-4 border-chunky-thin hover:bg-[var(--term-color)] hover:text-[var(--term-bg)] transition-colors flex items-center gap-1.5 uppercase font-bold text-xs lg:text-base"
                            data-testid="timer-reset"
                        >
                            <RotateCcw size={16} className="lg:w-6 lg:h-6" />
                            RESET
                        </button>
                    </div>

                    {/* Mode selectors */}
                    <div className="flex gap-2 lg:gap-4">
                        <button
                            onClick={() => { setMode('work'); setTimeLeft(getWorkTime()); setIsActive(false); endTimeRef.current = null; }}
                            className={`px-2 lg:px-6 py-1.5 lg:py-2 border-b-2 uppercase font-bold text-[10px] lg:text-base ${mode === 'work' ? 'border-[var(--term-color)]' : 'border-transparent opacity-50'}`}
                            data-testid="timer-work-mode"
                        >
                            POMODORO (25M)
                        </button>
                        <button
                            onClick={() => { setMode('break'); setTimeLeft(getBreakTime()); setIsActive(false); endTimeRef.current = null; }}
                            className={`px-2 lg:px-6 py-1.5 lg:py-2 border-b-2 uppercase font-bold text-[10px] lg:text-base ${mode === 'break' ? 'border-[var(--term-color)]' : 'border-transparent opacity-50'}`}
                            data-testid="timer-break-mode"
                        >
                            SHORT BREAK (5M)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
