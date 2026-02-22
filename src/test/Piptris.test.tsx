import { describe, it, expect } from 'vitest';
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
