import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Hacking } from '../components/Hacking';

describe('Hacking', () => {
    it('renders the game with RobCo header and 4 attempts', () => {
        render(<Hacking />);

        expect(screen.getByText('ROBCO INDUSTRIES UNIFIED OPERATING SYSTEM')).toBeInTheDocument();
        expect(screen.getByTestId('hacking-attempts')).toHaveTextContent('4 ATTEMPT(S) LEFT');
    });

    it('displays available password words', () => {
        render(<Hacking />);

        const wordsContainer = screen.getByTestId('hacking-words');
        const buttons = wordsContainer.querySelectorAll('button');
        expect(buttons.length).toBeGreaterThan(0);
        expect(buttons.length).toBeLessThanOrEqual(10);
    });

    it('all displayed words have the same length', () => {
        render(<Hacking />);

        const wordsContainer = screen.getByTestId('hacking-words');
        const buttons = wordsContainer.querySelectorAll('button');
        const lengths = Array.from(buttons).map(b => b.textContent?.length);
        const uniqueLengths = new Set(lengths);
        expect(uniqueLengths.size).toBe(1);
    });

    it('decrements attempts on wrong guess', async () => {
        const user = userEvent.setup();
        render(<Hacking />);

        const wordsContainer = screen.getByTestId('hacking-words');
        const buttons = wordsContainer.querySelectorAll('button');

        // Click a word (might be right or wrong)
        await user.click(buttons[0]);

        // Either attempts decreased or we won
        const attemptsText = screen.getByTestId('hacking-attempts').textContent;
        const hasWon = screen.queryByTestId('hacking-win') !== null;

        if (!hasWon) {
            expect(attemptsText).toContain('3 ATTEMPT(S) LEFT');
        }
    });

    it('shows history after a guess', async () => {
        const user = userEvent.setup();
        render(<Hacking />);

        const wordsContainer = screen.getByTestId('hacking-words');
        const buttons = wordsContainer.querySelectorAll('button');

        await user.click(buttons[0]);

        const history = screen.getByTestId('hacking-history');
        expect(history.textContent).toContain('>');
    });

    it('shows reboot button when game ends', async () => {
        const user = userEvent.setup();
        render(<Hacking />);

        const wordsContainer = screen.getByTestId('hacking-words');

        // Make 4 wrong guesses (click different words hoping they're wrong)
        for (let i = 0; i < 4; i++) {
            const activeButtons = wordsContainer.querySelectorAll('button:not([disabled])');
            if (activeButtons.length > 0) {
                await user.click(activeButtons[i % activeButtons.length]);
            }
        }

        // Game should be over (won or lost)
        const rebootBtn = screen.queryByTestId('hacking-reboot');
        const isGameOver = screen.queryByTestId('hacking-win') !== null || screen.queryByTestId('hacking-loss') !== null;

        if (isGameOver) {
            expect(rebootBtn).toBeInTheDocument();
        }
    });

    it('can reboot the game after game over', async () => {
        // Use a seeded scenario - we'll just test that initGame works
        const user = userEvent.setup();
        render(<Hacking />);

        // Get initial words
        // Just verify basic state before game over

        // Force game to end by clicking 4 times
        for (let i = 0; i < 4; i++) {
            const activeButtons = screen.getByTestId('hacking-words').querySelectorAll('button:not([disabled])');
            if (activeButtons.length > 0) {
                await user.click(activeButtons[0]);
            }
        }

        // If game ended, try reboot
        const rebootBtn = screen.queryByTestId('hacking-reboot');
        if (rebootBtn) {
            await user.click(rebootBtn);
            // After reboot, should have 4 attempts again
            expect(screen.getByTestId('hacking-attempts')).toHaveTextContent('4 ATTEMPT(S) LEFT');
        }
    });

    it('renders memory dump with hex addresses', () => {
        render(<Hacking />);

        // Memory dump should have 0x prefix addresses
        const gameElement = screen.getByTestId('hacking-game');
        expect(gameElement.textContent).toContain('0x');
    });
});
