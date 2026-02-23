import React from 'react';
import { motion } from 'motion/react';
import type { AppId } from '../App';

interface LayoutProps {
    children: React.ReactNode;
    activeApp: AppId;
    setActiveApp: (app: AppId) => void;
}

const APPS: { id: AppId; label: string }[] = [
    { id: 'timer', label: 'TIMER' },
    { id: 'weather', label: 'CLIMATE' },
    { id: 'hacking', label: 'HACKING' },
    { id: 'piptris', label: 'PIPTRIS' },
    { id: 'settings', label: 'SETTINGS' },
];

const MODULE_TITLES: Record<AppId, string> = {
    timer: 'POMODORO TIMER MODULE',
    weather: 'CLIMATE MODULE',
    hacking: 'HACKING MODULE',
    piptris: 'PIPTRIS MODULE',
    settings: 'SETTINGS MODULE',
};

export function Layout({ children, activeApp, setActiveApp }: LayoutProps) {
    return (
        <div className="h-[100dvh] w-full flex flex-col p-2 md:p-8 crt-flicker relative overflow-hidden">
            <div className="crt-overlay hidden md:block"></div>

            {/* Unified Layout Container */}
            <div className="flex flex-col md:flex-row w-full h-full flex-1 md:border-none md:rounded-none md:bg-transparent md:shadow-none border-4 border-[var(--term-color)] rounded-3xl overflow-hidden bg-black/80 relative shadow-[inset_0_0_20px_var(--term-color)] z-20">

                {/* Mobile Glare / Curve Effect */}
                <div className="md:hidden absolute inset-0 pointer-events-none rounded-3xl shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] z-10"></div>
                <div className="md:hidden absolute inset-0 pointer-events-none rounded-3xl bg-gradient-to-br from-white/5 to-transparent z-10"></div>

                {/* Mobile Top Status Bar */}
                <div className="md:hidden h-8 shrink-0 border-b-2 border-[var(--term-color)] flex items-center justify-between px-4 text-xs font-bold tracking-widest bg-[var(--term-color)]/10 z-20">
                    <span>HP 100/100</span>
                    <span>AP 90/90</span>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex flex-col justify-start gap-4 mr-8 w-64 shrink-0">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold crt-glow">ROBCO IND.</h1>
                        <p className="text-sm opacity-80">UNIFIED OPERATING SYSTEM</p>
                        <p className="text-xs opacity-60">v8.0.1</p>
                    </div>

                    <div className="flex flex-col w-full gap-2 relative z-20">
                        {APPS.map((app) => (
                            <button
                                key={app.id}
                                onClick={() => setActiveApp(app.id)}
                                className={`px-4 py-2 text-left whitespace-nowrap uppercase font-bold tracking-widest transition-all duration-200
                  ${activeApp === app.id
                                        ? 'bg-term text-[var(--term-bg)] border-chunky-thin'
                                        : 'border border-[var(--term-color)] opacity-70 hover:opacity-100 hover:bg-[var(--term-color)] hover:text-[var(--term-bg)]'
                                    }`}
                            >
                                {activeApp === app.id && <span className="mr-2">&gt;</span>}
                                {app.label}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Main Shared Screen Area */}
                <main className="flex-1 flex flex-col relative overflow-hidden z-20 md:border-chunky md:bg-black/40 md:backdrop-blur-sm">
                    {/* Desktop Top Bar */}
                    <div className="hidden md:flex absolute top-0 left-0 w-full h-8 border-b-2 border-[var(--term-color)] items-center px-4 justify-between bg-[var(--term-color)]/10">
                        <span className="font-bold tracking-widest uppercase">{MODULE_TITLES[activeApp]}</span>
                        <span className="animate-pulse">_</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-8 md:mt-8">
                        <motion.div
                            key={activeApp}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {children}
                        </motion.div>
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <nav className="md:hidden h-16 shrink-0 border-t-2 border-[var(--term-color)] flex justify-between items-end px-2 pb-2 bg-black z-30 relative">
                    {APPS.map((app) => (
                        <button
                            key={app.id}
                            onClick={() => setActiveApp(app.id)}
                            className={`flex-1 text-[10px] font-bold tracking-tighter uppercase pb-1 transition-all h-full flex items-end justify-center
                ${activeApp === app.id
                                    ? 'text-[var(--term-color)] border-b-4 border-[var(--term-color)] opacity-100'
                                    : 'text-[var(--term-color)] opacity-50 border-b-4 border-transparent'
                                }`}
                        >
                            {app.label.substring(0, 4)}
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
}
