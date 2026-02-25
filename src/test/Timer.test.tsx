import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { Timer } from '../components/Timer';

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
    Play: () => <span data-testid="icon-play">▶</span>,
    Pause: () => <span data-testid="icon-pause">⏸</span>,
    RotateCcw: () => <span data-testid="icon-reset">↺</span>,
    Skull: () => <span data-testid="icon-skull">💀</span>,
}));

describe('Timer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // Mock Audio
        vi.stubGlobal('Audio', vi.fn(() => ({
            play: vi.fn().mockResolvedValue(undefined),
            pause: vi.fn(),
            loop: false,
            volume: 1,
            currentTime: 0,
        })));
        // Mock Notification API
        vi.stubGlobal('Notification', Object.assign(
            vi.fn(),
            { permission: 'default', requestPermission: vi.fn().mockResolvedValue('granted') }
        ));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('renders with initial work mode and 25:00 display', () => {
        render(<Timer />);

        expect(screen.getByTestId('timer-mode')).toHaveTextContent('WORK CYCLE');
        expect(screen.getByTestId('timer-display')).toHaveTextContent('25:00');
    });

    it('renders with debug mode showing 00:05', () => {
        render(<Timer debugMode={true} />);

        expect(screen.getByTestId('timer-display')).toHaveTextContent('00:05');
    });

    it('starts and shows PAUSE button', () => {
        render(<Timer />);

        const toggleBtn = screen.getByTestId('timer-toggle');
        expect(toggleBtn).toHaveTextContent('START');

        act(() => { fireEvent.click(toggleBtn); });
        expect(toggleBtn).toHaveTextContent('PAUSE');
    });

    it('counts down when active', () => {
        render(<Timer />);

        act(() => { fireEvent.click(screen.getByTestId('timer-toggle')); });

        act(() => { vi.advanceTimersByTime(1000); });
        expect(screen.getByTestId('timer-display')).toHaveTextContent('24:59');

        act(() => { vi.advanceTimersByTime(2000); });
        expect(screen.getByTestId('timer-display')).toHaveTextContent('24:57');
    });

    it('pauses when PAUSE is clicked', () => {
        render(<Timer />);
        const toggleBtn = screen.getByTestId('timer-toggle');

        // Start
        act(() => { fireEvent.click(toggleBtn); });
        act(() => { vi.advanceTimersByTime(2000); });
        expect(screen.getByTestId('timer-display')).toHaveTextContent('24:58');

        // Pause
        act(() => { fireEvent.click(toggleBtn); });

        // Should not advance
        act(() => { vi.advanceTimersByTime(5000); });
        expect(screen.getByTestId('timer-display')).toHaveTextContent('25:00');
    });

    it('resets the timer', () => {
        render(<Timer />);

        // Start and advance
        act(() => { fireEvent.click(screen.getByTestId('timer-toggle')); });
        act(() => { vi.advanceTimersByTime(3000); });

        // Reset
        act(() => { fireEvent.click(screen.getByTestId('timer-reset')); });
        expect(screen.getByTestId('timer-display')).toHaveTextContent('25:00');
    });

    it('resets the timer when in break mode', () => {
        render(<Timer debugMode={true} />);

        // Switch to break mode
        act(() => { fireEvent.click(screen.getByTestId('timer-break-mode')); });
        expect(screen.getByTestId('timer-mode')).toHaveTextContent('BREAK CYCLE');

        // Start and advance
        act(() => { fireEvent.click(screen.getByTestId('timer-toggle')); });
        act(() => { vi.advanceTimersByTime(1000); });

        // Reset in break mode
        act(() => { fireEvent.click(screen.getByTestId('timer-reset')); });
        expect(screen.getByTestId('timer-display')).toHaveTextContent('00:03');
    });

    it('switches between work and break modes', () => {
        render(<Timer />);

        expect(screen.getByTestId('timer-mode')).toHaveTextContent('WORK CYCLE');

        act(() => { fireEvent.click(screen.getByTestId('timer-break-mode')); });
        expect(screen.getByTestId('timer-mode')).toHaveTextContent('BREAK CYCLE');
        expect(screen.getByTestId('timer-display')).toHaveTextContent('05:00');

        act(() => { fireEvent.click(screen.getByTestId('timer-work-mode')); });
        expect(screen.getByTestId('timer-mode')).toHaveTextContent('WORK CYCLE');
        expect(screen.getByTestId('timer-display')).toHaveTextContent('25:00');
    });

    it('shows alert when timer reaches zero in debug mode', () => {
        render(<Timer debugMode={true} />);

        // Debug mode: work = 5 seconds
        act(() => { fireEvent.click(screen.getByTestId('timer-toggle')); });

        // Advance to completion
        act(() => { vi.advanceTimersByTime(5000); });

        // Alert should appear
        expect(screen.getByTestId('timer-alert')).toBeInTheDocument();
        expect(screen.getByText('CYCLE COMPLETE')).toBeInTheDocument();
    });

    it('dismisses alert and switches to break mode', () => {
        render(<Timer debugMode={true} />);

        act(() => { fireEvent.click(screen.getByTestId('timer-toggle')); });
        act(() => { vi.advanceTimersByTime(5000); });

        // Click alert to dismiss
        act(() => { fireEvent.click(screen.getByTestId('timer-alert')); });

        // Should now be in break mode
        expect(screen.getByTestId('timer-mode')).toHaveTextContent('BREAK CYCLE');
        expect(screen.getByTestId('timer-display')).toHaveTextContent('00:03');
    });

    it('dismisses alert after break and switches back to work mode', () => {
        render(<Timer debugMode={true} />);

        // Complete work cycle
        act(() => { fireEvent.click(screen.getByTestId('timer-toggle')); });
        act(() => { vi.advanceTimersByTime(5000); });
        act(() => { fireEvent.click(screen.getByTestId('timer-alert')); });

        // Now in break mode — start and complete break cycle
        expect(screen.getByTestId('timer-mode')).toHaveTextContent('BREAK CYCLE');
        act(() => { fireEvent.click(screen.getByTestId('timer-toggle')); });
        act(() => { vi.advanceTimersByTime(3000); });

        // Alert should appear for break completion
        expect(screen.getByTestId('timer-alert')).toBeInTheDocument();
        expect(screen.getByText('BREAK OVER')).toBeInTheDocument();

        // Dismiss to switch back to work mode
        act(() => { fireEvent.click(screen.getByTestId('timer-alert')); });
        expect(screen.getByTestId('timer-mode')).toHaveTextContent('WORK CYCLE');
        expect(screen.getByTestId('timer-display')).toHaveTextContent('00:05');
    });

    describe('element visibility', () => {
        it('renders all core timer elements', () => {
            render(<Timer />);

            // Mode label and time display
            expect(screen.getByTestId('timer-mode')).toBeInTheDocument();
            expect(screen.getByTestId('timer-display')).toBeInTheDocument();

            // Control buttons
            expect(screen.getByTestId('timer-toggle')).toBeInTheDocument();
            expect(screen.getByTestId('timer-reset')).toBeInTheDocument();

            // Mode selectors
            expect(screen.getByTestId('timer-work-mode')).toBeInTheDocument();
            expect(screen.getByTestId('timer-break-mode')).toBeInTheDocument();
        });

        it('has correct initial text content for all elements', () => {
            render(<Timer />);

            expect(screen.getByTestId('timer-mode')).toHaveTextContent('WORK CYCLE');
            expect(screen.getByTestId('timer-display')).toHaveTextContent('25:00');
            expect(screen.getByTestId('timer-toggle')).toHaveTextContent('START');
            expect(screen.getByTestId('timer-reset')).toHaveTextContent('RESET');
            expect(screen.getByTestId('timer-work-mode')).toHaveTextContent('POMODORO (25M)');
            expect(screen.getByTestId('timer-break-mode')).toHaveTextContent('SHORT BREAK (5M)');
        });

        it('renders the timer container', () => {
            render(<Timer />);
            expect(screen.getByTestId('timer-container')).toBeInTheDocument();
        });
    });

    describe('background timing', () => {
        it('corrects timer when page becomes visible after being hidden', () => {
            render(<Timer debugMode={true} />);

            // Start timer (debug mode: work = 5s)
            act(() => { fireEvent.click(screen.getByTestId('timer-toggle')); });
            expect(screen.getByTestId('timer-display')).toHaveTextContent('00:05');

            // Advance fake system clock by 3s without running the interval
            // (simulates browser throttling the interval while backgrounded)
            act(() => { vi.setSystemTime(Date.now() + 3000); });

            // Page becomes visible again — handler should correct timeLeft
            act(() => {
                Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
                document.dispatchEvent(new Event('visibilitychange'));
            });

            expect(screen.getByTestId('timer-display')).toHaveTextContent('00:02');
        });

        it('triggers alert when page becomes visible and timer has already expired', () => {
            render(<Timer debugMode={true} />);

            // Start timer (debug mode: work = 5s)
            act(() => { fireEvent.click(screen.getByTestId('timer-toggle')); });

            // Advance system clock past the full duration without running intervals
            act(() => { vi.setSystemTime(Date.now() + 6000); });

            // Page becomes visible — remaining time is negative, should trigger completion
            act(() => {
                Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
                document.dispatchEvent(new Event('visibilitychange'));
            });

            expect(screen.getByTestId('timer-alert')).toBeInTheDocument();
            expect(screen.getByText('CYCLE COMPLETE')).toBeInTheDocument();
        });

        it('sends a notification when timer completes and permission is granted', () => {
            Object.defineProperty(Notification, 'permission', { value: 'granted', configurable: true });
            render(<Timer debugMode={true} />);

            act(() => { fireEvent.click(screen.getByTestId('timer-toggle')); });
            act(() => { vi.advanceTimersByTime(5000); });

            expect(Notification).toHaveBeenCalledWith('Pip-Boy Timer', expect.objectContaining({ body: 'CYCLE COMPLETE' }));
        });

        it('sends BREAK OVER notification when break timer completes', () => {
            Object.defineProperty(Notification, 'permission', { value: 'granted', configurable: true });
            render(<Timer debugMode={true} />);

            // Complete work cycle and dismiss
            act(() => { fireEvent.click(screen.getByTestId('timer-toggle')); });
            act(() => { vi.advanceTimersByTime(5000); });
            act(() => { fireEvent.click(screen.getByTestId('timer-alert')); });

            // Now in break mode - start and complete break
            act(() => { fireEvent.click(screen.getByTestId('timer-toggle')); });
            act(() => { vi.advanceTimersByTime(3000); });

            expect(Notification).toHaveBeenCalledWith('Pip-Boy Timer', expect.objectContaining({ body: 'BREAK OVER' }));
        });

        it('requests notification permission when timer starts', () => {
            render(<Timer />);

            act(() => { fireEvent.click(screen.getByTestId('timer-toggle')); });

            expect(Notification.requestPermission).toHaveBeenCalled();
        });

        it('ramps up audio volume over time after timer completes', () => {
            const mockAudio = {
                play: vi.fn().mockResolvedValue(undefined),
                pause: vi.fn(),
                loop: false,
                volume: 1,
                currentTime: 0,
            };
            vi.stubGlobal('Audio', vi.fn(() => mockAudio));
            Object.defineProperty(Notification, 'permission', { value: 'granted', configurable: true });

            render(<Timer debugMode={true} />);

            // Start and complete the timer
            act(() => { fireEvent.click(screen.getByTestId('timer-toggle')); });
            act(() => { vi.advanceTimersByTime(5000); });

            // After completion, volume is set to 0.1
            expect(mockAudio.volume).toBe(0.1);

            // Advance by 10 seconds to trigger volume ramp interval
            act(() => { vi.advanceTimersByTime(10000); });

            // Volume should have increased
            expect(mockAudio.volume).toBeCloseTo(0.2, 1);
        });
    });
});
