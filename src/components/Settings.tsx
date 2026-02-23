interface SettingsProps {
    theme: string;
    setTheme: (theme: string) => void;
    debugMode: boolean;
    setDebugMode: (debug: boolean) => void;
}

const THEMES = [
    { id: 'theme-green', label: 'ROBCO GREEN' },
    { id: 'theme-amber', label: 'TERMINAL AMBER' },
    { id: 'theme-white', label: 'VAULT-TEC WHITE' },
    { id: 'theme-blue', label: 'NUKA BLUE' },
];

export function Settings({ theme, setTheme, debugMode, setDebugMode }: SettingsProps) {
    return (
        <div className="h-full flex flex-col font-mono max-w-2xl mx-auto" data-testid="settings-panel">
            <div className="mb-8">
                <h2 className="text-2xl font-bold uppercase tracking-widest">SYSTEM SETTINGS</h2>
                <p className="opacity-80">CONFIGURE DISPLAY PARAMETERS</p>
            </div>

            <div className="border-chunky-thin p-6 bg-black/50 mb-8">
                <h3 className="font-bold uppercase tracking-widest mb-6 border-b border-[var(--term-color)]/30 pb-2">DISPLAY COLOR</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="settings-themes">
                    {THEMES.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            className={`p-4 text-left uppercase tracking-widest transition-colors flex items-center justify-between
                ${theme === t.id
                                    ? 'bg-[var(--term-color)] text-[var(--term-bg)] font-bold'
                                    : 'border border-[var(--term-color)] hover:bg-[var(--term-color)]/20'
                                }`}
                            data-testid={`settings-theme-${t.id}`}
                        >
                            <span>{t.label}</span>
                            {theme === t.id && <span>[ACTIVE]</span>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="border-chunky-thin p-6 bg-black/50 mb-8">
                <h3 className="font-bold uppercase tracking-widest mb-6 border-b border-[var(--term-color)]/30 pb-2">DEVELOPER OPTIONS</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <span className="font-bold uppercase tracking-widest">TEST MODE</span>
                        <p className="text-xs opacity-70 mt-1">ENABLES ACCELERATED TIMERS FOR TESTING</p>
                    </div>
                    <button
                        onClick={() => setDebugMode(!debugMode)}
                        className={`px-6 py-2 border uppercase font-bold tracking-widest transition-colors
              ${debugMode
                                ? 'bg-[var(--term-color)] text-[var(--term-bg)] border-[var(--term-color)]'
                                : 'border-[var(--term-color)] hover:bg-[var(--term-color)]/20'
                            }`}
                        data-testid="settings-debug-toggle"
                    >
                        {debugMode ? 'ENABLED' : 'DISABLED'}
                    </button>
                </div>
            </div>

            <div className="border-chunky-thin p-6 bg-black/50">
                <h3 className="font-bold uppercase tracking-widest mb-6 border-b border-[var(--term-color)]/30 pb-2">SYSTEM INFO</h3>
                <div className="space-y-2 opacity-80">
                    <div className="flex justify-between">
                        <span>OS VERSION:</span>
                        <span>ROBCO UOS v8.0.1</span>
                    </div>
                    <div className="flex justify-between">
                        <span>MEMORY:</span>
                        <span>640K RAM SYSTEM</span>
                    </div>
                    <div className="flex justify-between">
                        <span>STORAGE:</span>
                        <span>38911 BYTES FREE</span>
                    </div>
                    <div className="flex justify-between">
                        <span>NETWORK:</span>
                        <span>OFFLINE</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
