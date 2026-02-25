import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock motion/react to avoid animation issues in tests
vi.mock('motion/react', () => ({
    motion: {
        div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
            const { initial: _i, animate: _a, exit: _e, transition: _t, ...rest } = props;
            return <div {...rest}>{children}</div>;
        },
    },
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Play: () => <span>▶</span>,
    Pause: () => <span>⏸</span>,
    RotateCcw: () => <span>↺</span>,
    Skull: () => <span>💀</span>,
    Thermometer: () => <span>🌡</span>,
    MapPinOff: () => <span>📍</span>,
    MapPin: () => <span>📌</span>,
    ChevronLeft: () => <span>◀</span>,
    ChevronRight: () => <span>▶</span>,
}));

// Mock recharts to avoid canvas/resize issues in jsdom
vi.mock('recharts', () => ({
    LineChart: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    ResponsiveContainer: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

describe('App', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        document.body.className = '';
    });

    it('renders with the timer app by default', () => {
        vi.stubGlobal('Audio', vi.fn(() => ({
            play: vi.fn().mockResolvedValue(undefined),
            pause: vi.fn(),
            loop: false,
            volume: 1,
            currentTime: 0,
        })));
        vi.stubGlobal('Notification', Object.assign(
            vi.fn(),
            { permission: 'default', requestPermission: vi.fn().mockResolvedValue('granted') }
        ));

        render(<App />);

        expect(screen.getByTestId('timer-container')).toBeInTheDocument();
    });

    it('applies the default green theme to the body', () => {
        vi.stubGlobal('Audio', vi.fn(() => ({
            play: vi.fn().mockResolvedValue(undefined),
            pause: vi.fn(),
            loop: false,
            volume: 1,
            currentTime: 0,
        })));
        vi.stubGlobal('Notification', Object.assign(
            vi.fn(),
            { permission: 'default', requestPermission: vi.fn().mockResolvedValue('granted') }
        ));

        render(<App />);

        expect(document.body.className).toBe('theme-green');
    });

    it('switches to settings app when SETT nav button is clicked', async () => {
        vi.stubGlobal('Audio', vi.fn(() => ({
            play: vi.fn().mockResolvedValue(undefined),
            pause: vi.fn(),
            loop: false,
            volume: 1,
            currentTime: 0,
        })));
        vi.stubGlobal('Notification', Object.assign(
            vi.fn(),
            { permission: 'default', requestPermission: vi.fn().mockResolvedValue('granted') }
        ));

        const user = userEvent.setup();
        render(<App />);

        // Click the mobile SETT nav button (first 4 chars of SETTINGS)
        const settingsButtons = screen.getAllByText('SETT');
        await user.click(settingsButtons[0]);

        expect(screen.getByText('SYSTEM SETTINGS')).toBeInTheDocument();
    });

    it('switches to hacking app when HACK nav button is clicked', async () => {
        vi.stubGlobal('Audio', vi.fn(() => ({
            play: vi.fn().mockResolvedValue(undefined),
            pause: vi.fn(),
            loop: false,
            volume: 1,
            currentTime: 0,
        })));
        vi.stubGlobal('Notification', Object.assign(
            vi.fn(),
            { permission: 'default', requestPermission: vi.fn().mockResolvedValue('granted') }
        ));

        const user = userEvent.setup();
        render(<App />);

        const hackButtons = screen.getAllByText('HACK');
        await user.click(hackButtons[0]);

        expect(screen.getByTestId('hacking-game')).toBeInTheDocument();
    });

    it('switches to piptris app when PIPT nav button is clicked', async () => {
        vi.stubGlobal('Audio', vi.fn(() => ({
            play: vi.fn().mockResolvedValue(undefined),
            pause: vi.fn(),
            loop: false,
            volume: 1,
            currentTime: 0,
        })));
        vi.stubGlobal('Notification', Object.assign(
            vi.fn(),
            { permission: 'default', requestPermission: vi.fn().mockResolvedValue('granted') }
        ));

        const user = userEvent.setup();
        render(<App />);

        const piptrisButtons = screen.getAllByText('PIPT');
        await user.click(piptrisButtons[0]);

        expect(screen.getByTestId('piptris-game')).toBeInTheDocument();
    });

    it('switches to weather app when CLIM nav button is clicked', async () => {
        vi.stubGlobal('Audio', vi.fn(() => ({
            play: vi.fn().mockResolvedValue(undefined),
            pause: vi.fn(),
            loop: false,
            volume: 1,
            currentTime: 0,
        })));
        vi.stubGlobal('Notification', Object.assign(
            vi.fn(),
            { permission: 'default', requestPermission: vi.fn().mockResolvedValue('granted') }
        ));
        vi.stubGlobal('navigator', {
            ...navigator,
            geolocation: undefined,
        });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            json: () => Promise.resolve({ hourly: null }),
        }));

        const user = userEvent.setup();
        render(<App />);

        const climButtons = screen.getAllByText('CLIM');
        await user.click(climButtons[0]);

        // Weather dashboard renders (may have resolved already)
        await waitFor(() => {
            expect(screen.getByTestId('weather-dashboard')).toBeInTheDocument();
        });
    });
});
