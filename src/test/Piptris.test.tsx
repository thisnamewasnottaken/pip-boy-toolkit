import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
