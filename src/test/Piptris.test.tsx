import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

    // Next block preview tests
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

        // Start, then restart
        await user.click(screen.getByTestId('piptris-start'));
        await user.click(screen.getByTestId('piptris-start'));

        expect(screen.getByTestId('piptris-next-preview')).toBeInTheDocument();
        const preview = screen.getByTestId('piptris-next-preview');
        expect(preview.children.length).toBeGreaterThanOrEqual(4);
    });

    it('next preview uses deterministic shape when Math.random is seeded', async () => {
        // Force player → I (index 0 in 'IJLOSTZ') and nextTetromino → O (index 3 in 'IJLOSTZ')
        const mockRandom = vi.spyOn(Math, 'random')
            .mockReturnValueOnce(0)    // player → I
            .mockReturnValueOnce(3 / 7); // nextTetromino → O

        const user = userEvent.setup();
        render(<Piptris />);
        await user.click(screen.getByTestId('piptris-start'));

        const preview = screen.getByTestId('piptris-next-preview');
        // O-tetromino shape is 2x2 = 4 cells
        expect(preview.children.length).toBe(4);

        mockRandom.mockRestore();
    });

    describe('Math.random cleanup', () => {
        let randomSpy: ReturnType<typeof vi.spyOn>;

        beforeEach(() => {
            randomSpy = vi.spyOn(Math, 'random');
        });

        afterEach(() => {
            randomSpy.mockRestore();
        });

        it('selects different tetrominoes for player and next on each game start', async () => {
            // Force player → I (index 0 in 'IJLOSTZ', shape is 4 rows × 4 cols = 16 grid cells)
            // Force next  → Z (index 6 in 'IJLOSTZ', shape is 3 rows × 3 cols = 9 grid cells)
            randomSpy
                .mockReturnValueOnce(0)        // player → I
                .mockReturnValueOnce(6 / 7);   // next  → Z

            const user = userEvent.setup();
            render(<Piptris />);
            await user.click(screen.getByTestId('piptris-start'));

            const preview = screen.getByTestId('piptris-next-preview');
            // Z shape is 3 rows × 3 cols = 9 cells
            expect(preview.children.length).toBe(9);
        });
    });
});
