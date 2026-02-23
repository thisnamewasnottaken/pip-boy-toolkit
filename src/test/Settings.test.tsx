import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Settings } from '../components/Settings';

describe('Settings', () => {
    const defaultProps = {
        theme: 'theme-green',
        setTheme: vi.fn(),
        debugMode: false,
        setDebugMode: vi.fn(),
    };

    it('renders settings panel with all sections', () => {
        render(<Settings {...defaultProps} />);

        expect(screen.getByText('SYSTEM SETTINGS')).toBeInTheDocument();
        expect(screen.getByText('DISPLAY COLOR')).toBeInTheDocument();
        expect(screen.getByText('DEVELOPER OPTIONS')).toBeInTheDocument();
        expect(screen.getByText('SYSTEM INFO')).toBeInTheDocument();
    });

    it('displays all four theme options', () => {
        render(<Settings {...defaultProps} />);

        expect(screen.getByText('ROBCO GREEN')).toBeInTheDocument();
        expect(screen.getByText('TERMINAL AMBER')).toBeInTheDocument();
        expect(screen.getByText('VAULT-TEC WHITE')).toBeInTheDocument();
        expect(screen.getByText('NUKA BLUE')).toBeInTheDocument();
    });

    it('marks the active theme with [ACTIVE]', () => {
        render(<Settings {...defaultProps} />);

        const greenButton = screen.getByTestId('settings-theme-theme-green');
        expect(greenButton.textContent).toContain('[ACTIVE]');

        // Others should not have [ACTIVE]
        const amberButton = screen.getByTestId('settings-theme-theme-amber');
        expect(amberButton.textContent).not.toContain('[ACTIVE]');
    });

    it('calls setTheme when a theme button is clicked', async () => {
        const setTheme = vi.fn();
        const user = userEvent.setup();
        render(<Settings {...defaultProps} setTheme={setTheme} />);

        await user.click(screen.getByTestId('settings-theme-theme-amber'));
        expect(setTheme).toHaveBeenCalledWith('theme-amber');
    });

    it('shows debug mode as DISABLED by default', () => {
        render(<Settings {...defaultProps} />);

        expect(screen.getByTestId('settings-debug-toggle')).toHaveTextContent('DISABLED');
    });

    it('shows debug mode as ENABLED when active', () => {
        render(<Settings {...defaultProps} debugMode={true} />);

        expect(screen.getByTestId('settings-debug-toggle')).toHaveTextContent('ENABLED');
    });

    it('calls setDebugMode when toggle is clicked', async () => {
        const setDebugMode = vi.fn();
        const user = userEvent.setup();
        render(<Settings {...defaultProps} setDebugMode={setDebugMode} />);

        await user.click(screen.getByTestId('settings-debug-toggle'));
        expect(setDebugMode).toHaveBeenCalledWith(true);
    });

    it('displays system info correctly', () => {
        render(<Settings {...defaultProps} />);

        expect(screen.getByText('ROBCO UOS v8.0.1')).toBeInTheDocument();
        expect(screen.getByText('640K RAM SYSTEM')).toBeInTheDocument();
        expect(screen.getByText('38911 BYTES FREE')).toBeInTheDocument();
        expect(screen.getByText('OFFLINE')).toBeInTheDocument();
    });

    it('switches active theme indicator when different theme is selected', () => {
        const { rerender } = render(<Settings {...defaultProps} />);

        // Initially green is active
        expect(screen.getByTestId('settings-theme-theme-green').textContent).toContain('[ACTIVE]');

        // Rerender with amber active
        rerender(<Settings {...defaultProps} theme="theme-amber" />);
        expect(screen.getByTestId('settings-theme-theme-amber').textContent).toContain('[ACTIVE]');
        expect(screen.getByTestId('settings-theme-theme-green').textContent).not.toContain('[ACTIVE]');
    });
});
