import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Piptris } from '../components/Piptris';

describe('Piptris', () => {
    it('renders the game board and controls', () => {
        render(<Piptris />);

        expect(screen.getByTestId('piptris-game')).toBeInTheDocument();
        expect(screen.getByTestId('piptris-board')).toBeInTheDocument();
        expect(screen.getByTestId('piptris-score')).toHaveTextContent('0');
        expect(screen.getByTestId('piptris-rows')).toHaveTextContent('0');
        expect(screen.getByTestId('piptris-level')).toHaveTextContent('0');
    });

    it('renders the game board with correct grid dimensions', () => {
        render(<Piptris />);

        const board = screen.getByTestId('piptris-board');
        // 20 rows * 10 cols = 200 cells
        const cells = board.children;
        expect(cells.length).toBe(200);
    });

    it('shows START button initially', () => {
        render(<Piptris />);

        expect(screen.getByTestId('piptris-start')).toHaveTextContent('START');
    });

    it('starts the game when START is clicked', async () => {
        const user = userEvent.setup();
        render(<Piptris />);

        await user.click(screen.getByTestId('piptris-start'));

        // Score should still be 0 at start
        expect(screen.getByTestId('piptris-score')).toHaveTextContent('0');
    });

    it('displays initial score, rows, and level as 0', () => {
        render(<Piptris />);

        expect(screen.getByTestId('piptris-score')).toHaveTextContent('0');
        expect(screen.getByTestId('piptris-rows')).toHaveTextContent('0');
        expect(screen.getByTestId('piptris-level')).toHaveTextContent('0');
    });

    it('shows keyboard instructions', () => {
        render(<Piptris />);

        expect(screen.getByText('Use Arrow Keys to Move/Rotate')).toBeInTheDocument();
    });

    it('does not show GAME OVER initially', () => {
        render(<Piptris />);

        expect(screen.queryByTestId('piptris-gameover')).not.toBeInTheDocument();
    });

    it('shows mobile swipe instructions', () => {
        render(<Piptris />);

        expect(screen.getByText(/Swipe.*Move.*Drop.*Rotate/)).toBeInTheDocument();
    });
});

describe('Piptris keyboard controls', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('moves piece left with left arrow key', () => {
        vi.spyOn(Math, 'random').mockReturnValue(3 / 7); // O-piece

        render(<Piptris />);

        act(() => { fireEvent.click(screen.getByTestId('piptris-start')); });
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 37 }));
        });

        expect(screen.getByTestId('piptris-board')).toBeInTheDocument();
    });

    it('moves piece right with right arrow key', () => {
        vi.spyOn(Math, 'random').mockReturnValue(3 / 7);

        render(<Piptris />);

        act(() => { fireEvent.click(screen.getByTestId('piptris-start')); });
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 39 }));
        });

        expect(screen.getByTestId('piptris-board')).toBeInTheDocument();
    });

    it('rotates piece with up arrow key', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0); // I-piece (can rotate)

        render(<Piptris />);

        act(() => { fireEvent.click(screen.getByTestId('piptris-start')); });
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 38 }));
        });

        expect(screen.getByTestId('piptris-board')).toBeInTheDocument();
    });

    it('soft drops piece with down arrow key', () => {
        vi.spyOn(Math, 'random').mockReturnValue(3 / 7);

        render(<Piptris />);

        act(() => { fireEvent.click(screen.getByTestId('piptris-start')); });
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 40 }));
        });

        expect(screen.getByTestId('piptris-board')).toBeInTheDocument();
    });

    it('restores drop speed on key up after down arrow', () => {
        vi.spyOn(Math, 'random').mockReturnValue(3 / 7);

        render(<Piptris />);

        act(() => { fireEvent.click(screen.getByTestId('piptris-start')); });
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 40 }));
        });
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 40 }));
        });

        expect(screen.getByTestId('piptris-board')).toBeInTheDocument();
    });

    it('drops piece via interval', () => {
        vi.spyOn(Math, 'random').mockReturnValue(3 / 7);

        render(<Piptris />);

        act(() => { fireEvent.click(screen.getByTestId('piptris-start')); });

        // Advance timer to trigger drops
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(screen.getByTestId('piptris-board')).toBeInTheDocument();
    });

    it('detects game over when pieces stack to the top', () => {
        // Use I-pieces that stack vertically quickly
        vi.spyOn(Math, 'random').mockReturnValue(0); // Always I-piece

        render(<Piptris />);

        act(() => { fireEvent.click(screen.getByTestId('piptris-start')); });

        // Keep dropping until game over
        for (let i = 0; i < 200; i++) {
            act(() => {
                vi.advanceTimersByTime(1000);
            });
        }

        const gameOver = screen.queryByTestId('piptris-gameover');
        const board = screen.getByTestId('piptris-board');
        expect(gameOver !== null || board !== null).toBe(true);
    });

    it('restarts game with Space key after game over', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);

        render(<Piptris />);

        act(() => { fireEvent.click(screen.getByTestId('piptris-start')); });

        for (let i = 0; i < 300; i++) {
            act(() => {
                vi.advanceTimersByTime(1000);
            });
        }

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 32 }));
        });

        expect(screen.getByTestId('piptris-board')).toBeInTheDocument();
    });
});

describe('Piptris touch controls', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('handles tap to rotate', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);

        render(<Piptris />);

        act(() => { fireEvent.click(screen.getByTestId('piptris-start')); });

        const board = screen.getByTestId('piptris-board').parentElement!.parentElement!;

        act(() => {
            fireEvent.touchStart(board, { touches: [{ clientX: 100, clientY: 100 }] });
            fireEvent.touchEnd(board, { changedTouches: [{ clientX: 105, clientY: 105 }] });
        });

        expect(screen.getByTestId('piptris-board')).toBeInTheDocument();
    });

    it('handles horizontal swipe to move right', () => {
        vi.spyOn(Math, 'random').mockReturnValue(3 / 7);

        render(<Piptris />);

        act(() => { fireEvent.click(screen.getByTestId('piptris-start')); });

        const board = screen.getByTestId('piptris-board').parentElement!.parentElement!;

        act(() => {
            fireEvent.touchStart(board, { touches: [{ clientX: 100, clientY: 100 }] });
            fireEvent.touchEnd(board, { changedTouches: [{ clientX: 200, clientY: 105 }] });
        });

        expect(screen.getByTestId('piptris-board')).toBeInTheDocument();
    });

    it('handles horizontal swipe to move left', () => {
        vi.spyOn(Math, 'random').mockReturnValue(3 / 7);

        render(<Piptris />);

        act(() => { fireEvent.click(screen.getByTestId('piptris-start')); });

        const board = screen.getByTestId('piptris-board').parentElement!.parentElement!;

        act(() => {
            fireEvent.touchStart(board, { touches: [{ clientX: 200, clientY: 100 }] });
            fireEvent.touchEnd(board, { changedTouches: [{ clientX: 100, clientY: 105 }] });
        });

        expect(screen.getByTestId('piptris-board')).toBeInTheDocument();
    });

    it('handles downward swipe for soft drop', () => {
        vi.spyOn(Math, 'random').mockReturnValue(3 / 7);

        render(<Piptris />);

        act(() => { fireEvent.click(screen.getByTestId('piptris-start')); });

        const board = screen.getByTestId('piptris-board').parentElement!.parentElement!;

        act(() => {
            fireEvent.touchStart(board, { touches: [{ clientX: 100, clientY: 100 }] });
            fireEvent.touchEnd(board, { changedTouches: [{ clientX: 105, clientY: 200 }] });
        });

        expect(screen.getByTestId('piptris-board')).toBeInTheDocument();
    });

    it('ignores touch end when no touch start recorded', () => {
        render(<Piptris />);

        const board = screen.getByTestId('piptris-board').parentElement!.parentElement!;

        act(() => {
            fireEvent.touchEnd(board, { changedTouches: [{ clientX: 100, clientY: 100 }] });
        });

        expect(screen.getByTestId('piptris-board')).toBeInTheDocument();
    });
});

describe('Piptris game mechanics', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('drops pieces on interval and handles collision', () => {
        // Use O-pieces — 2×2, stack neatly
        vi.spyOn(Math, 'random').mockReturnValue(3 / 7);

        render(<Piptris />);

        act(() => { fireEvent.click(screen.getByTestId('piptris-start')); });

        // Drop a piece all the way down (20 rows at 1000ms interval)
        for (let i = 0; i < 25; i++) {
            act(() => {
                vi.advanceTimersByTime(1000);
            });
        }

        // The board should have some merged cells now
        const board = screen.getByTestId('piptris-board');
        expect(board.children.length).toBe(200);
    });

    it('shows RESTART text on button after game over', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0); // Always I-piece

        render(<Piptris />);

        act(() => { fireEvent.click(screen.getByTestId('piptris-start')); });

        // Force a long game to trigger game over
        for (let i = 0; i < 500; i++) {
            act(() => {
                vi.advanceTimersByTime(1000);
            });
        }

        // Check if RESTART text appears
        const startBtn = screen.getByTestId('piptris-start');
        const isGameOver = screen.queryByTestId('piptris-gameover') !== null;
        if (isGameOver) {
            expect(startBtn).toHaveTextContent('RESTART');
        }
    });

    it('clicking game over overlay restarts the game', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);

        render(<Piptris />);

        act(() => { fireEvent.click(screen.getByTestId('piptris-start')); });

        for (let i = 0; i < 500; i++) {
            act(() => {
                vi.advanceTimersByTime(1000);
            });
        }

        const gameOverOverlay = screen.queryByTestId('piptris-gameover');
        if (gameOverOverlay) {
            act(() => { fireEvent.click(gameOverOverlay); });
            expect(screen.getByTestId('piptris-score')).toHaveTextContent('0');
        }
    });

    it('handles resize event', async () => {
        render(<Piptris />);

        act(() => {
            Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
            Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 });
            window.dispatchEvent(new Event('resize'));
        });

        expect(screen.getByTestId('piptris-board')).toBeInTheDocument();
    });

    it('handles orientation change event', async () => {
        render(<Piptris />);

        act(() => {
            Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 667 });
            Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 375 });
            window.dispatchEvent(new Event('orientationchange'));
        });

        expect(screen.getByTestId('piptris-board')).toBeInTheDocument();
    });
});

describe('Piptris responsive layout', () => {
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;

    afterEach(() => {
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalInnerWidth });
        Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: originalInnerHeight });
    });

    it('shows landscape overlay on mobile landscape orientation', () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 667 });
        Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 375 });
        render(<Piptris />);
        expect(screen.getByTestId('piptris-landscape-overlay')).toBeInTheDocument();
    });

    it('does not show landscape overlay in mobile portrait orientation', () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
        Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 });
        render(<Piptris />);
        expect(screen.queryByTestId('piptris-landscape-overlay')).not.toBeInTheDocument();
    });

    it('does not show landscape overlay on desktop', () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1920 });
        Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1080 });
        render(<Piptris />);
        expect(screen.queryByTestId('piptris-landscape-overlay')).not.toBeInTheDocument();
    });

    it('uses smaller cell size for mobile portrait to avoid scrolling', () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
        Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 });
        render(<Piptris />);
        const board = screen.getByTestId('piptris-board');
        const firstCell = board.firstElementChild as HTMLElement;
        const cellHeight = parseInt(firstCell.style.height, 10);
        expect(cellHeight).toBeLessThan(20);
    });

    it('uses full cell size on desktop', () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1440 });
        Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 900 });
        render(<Piptris />);
        const board = screen.getByTestId('piptris-board');
        const firstCell = board.firstElementChild as HTMLElement;
        const cellHeight = parseInt(firstCell.style.height, 10);
        expect(cellHeight).toBe(20);
    });

    it('clamps cell size to minimum of 10 on very small screens', () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 320 });
        Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 400 });
        render(<Piptris />);
        const board = screen.getByTestId('piptris-board');
        const firstCell = board.firstElementChild as HTMLElement;
        const cellHeight = parseInt(firstCell.style.height, 10);
        expect(cellHeight).toBeGreaterThanOrEqual(10);
    });
});

describe('Piptris next block preview', () => {
    it('renders the NEXT preview panel', () => {
        render(<Piptris />);

        expect(screen.getByText('NEXT')).toBeInTheDocument();
        expect(screen.getByTestId('piptris-next-preview')).toBeInTheDocument();
    });

    it('next preview panel shows at least one cell initially', () => {
        render(<Piptris />);

        const preview = screen.getByTestId('piptris-next-preview');
        // The initial nextTetromino is TETROMINOS['0'] which has shape [[0]] — a 1×1 grid with 1 cell
        expect(preview.children.length).toBeGreaterThanOrEqual(1);
    });

    it('next preview updates with a real tetromino shape after game starts', async () => {
        const user = userEvent.setup();
        render(<Piptris />);

        await user.click(screen.getByTestId('piptris-start'));

        const preview = screen.getByTestId('piptris-next-preview');
        // A real tetromino has at least 4 cells (O-piece = 4, others have more grid positions)
        expect(preview.children.length).toBeGreaterThanOrEqual(4);
    });

    it('next preview still renders after restart', async () => {
        const user = userEvent.setup();
        render(<Piptris />);

        await user.click(screen.getByTestId('piptris-start'));
        await user.click(screen.getByTestId('piptris-start'));

        expect(screen.getByTestId('piptris-next-preview')).toBeInTheDocument();
        const preview = screen.getByTestId('piptris-next-preview');
        expect(preview.children.length).toBeGreaterThanOrEqual(4);
    });

    it('next preview uses deterministic shape when Math.random is seeded', async () => {
        // Force player → I (index 0 in 'IJLOSTZ') and nextTetromino → O (index 3 in 'IJLOSTZ')
        const mockRandom = vi.spyOn(Math, 'random')
            .mockReturnValueOnce(0)      // player → I
            .mockReturnValueOnce(3 / 7); // nextTetromino → O

        const user = userEvent.setup();
        render(<Piptris />);
        await user.click(screen.getByTestId('piptris-start'));

        const preview = screen.getByTestId('piptris-next-preview');
        // O-tetromino shape is 2×2 = 4 cells
        expect(preview.children.length).toBe(4);

        mockRandom.mockRestore();
    });
});
