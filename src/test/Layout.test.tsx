import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Layout } from '../components/Layout';

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

describe('Layout', () => {
    const mockSetActiveApp = vi.fn();

    it('renders children content', () => {
        render(
            <Layout activeApp="timer" setActiveApp={mockSetActiveApp}>
                <div data-testid="test-child">Hello</div>
            </Layout>
        );

        expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('renders all desktop navigation buttons', () => {
        render(
            <Layout activeApp="timer" setActiveApp={mockSetActiveApp}>
                <div>content</div>
            </Layout>
        );

        expect(screen.getByText('TIMER')).toBeInTheDocument();
        expect(screen.getByText('CLIMATE')).toBeInTheDocument();
        expect(screen.getByText('HACKING')).toBeInTheDocument();
        expect(screen.getByText('PIPTRIS')).toBeInTheDocument();
        expect(screen.getByText('SETTINGS')).toBeInTheDocument();
    });

    it('renders all mobile navigation buttons with truncated labels', () => {
        render(
            <Layout activeApp="timer" setActiveApp={mockSetActiveApp}>
                <div>content</div>
            </Layout>
        );

        expect(screen.getByText('TIME')).toBeInTheDocument();
        expect(screen.getByText('CLIM')).toBeInTheDocument();
        expect(screen.getByText('HACK')).toBeInTheDocument();
        expect(screen.getByText('PIPT')).toBeInTheDocument();
        expect(screen.getByText('SETT')).toBeInTheDocument();
    });

    it('shows the active module title in the desktop top bar', () => {
        render(
            <Layout activeApp="timer" setActiveApp={mockSetActiveApp}>
                <div>content</div>
            </Layout>
        );

        expect(screen.getByText('POMODORO TIMER MODULE')).toBeInTheDocument();
    });

    it('shows the correct module title for each app', () => {
        const { rerender } = render(
            <Layout activeApp="weather" setActiveApp={mockSetActiveApp}>
                <div>content</div>
            </Layout>
        );
        expect(screen.getByText('CLIMATE MODULE')).toBeInTheDocument();

        rerender(
            <Layout activeApp="hacking" setActiveApp={mockSetActiveApp}>
                <div>content</div>
            </Layout>
        );
        expect(screen.getByText('HACKING MODULE')).toBeInTheDocument();

        rerender(
            <Layout activeApp="piptris" setActiveApp={mockSetActiveApp}>
                <div>content</div>
            </Layout>
        );
        expect(screen.getByText('PIPTRIS MODULE')).toBeInTheDocument();

        rerender(
            <Layout activeApp="settings" setActiveApp={mockSetActiveApp}>
                <div>content</div>
            </Layout>
        );
        expect(screen.getByText('SETTINGS MODULE')).toBeInTheDocument();
    });

    it('calls setActiveApp when a desktop nav button is clicked', async () => {
        const setActiveApp = vi.fn();
        const user = userEvent.setup();

        render(
            <Layout activeApp="timer" setActiveApp={setActiveApp}>
                <div>content</div>
            </Layout>
        );

        await user.click(screen.getByText('CLIMATE'));
        expect(setActiveApp).toHaveBeenCalledWith('weather');

        await user.click(screen.getByText('HACKING'));
        expect(setActiveApp).toHaveBeenCalledWith('hacking');

        await user.click(screen.getByText('PIPTRIS'));
        expect(setActiveApp).toHaveBeenCalledWith('piptris');

        await user.click(screen.getByText('SETTINGS'));
        expect(setActiveApp).toHaveBeenCalledWith('settings');
    });

    it('calls setActiveApp when a mobile nav button is clicked', async () => {
        const setActiveApp = vi.fn();
        const user = userEvent.setup();

        render(
            <Layout activeApp="timer" setActiveApp={setActiveApp}>
                <div>content</div>
            </Layout>
        );

        await user.click(screen.getByText('CLIM'));
        expect(setActiveApp).toHaveBeenCalledWith('weather');
    });

    it('shows the active indicator on the active desktop button', () => {
        render(
            <Layout activeApp="timer" setActiveApp={mockSetActiveApp}>
                <div>content</div>
            </Layout>
        );

        // The active button has a ">" prefix
        expect(screen.getByText('TIMER').closest('button')?.textContent).toContain('>');
    });

    it('renders the mobile status bar', () => {
        render(
            <Layout activeApp="timer" setActiveApp={mockSetActiveApp}>
                <div>content</div>
            </Layout>
        );

        expect(screen.getByText('HP 100/100')).toBeInTheDocument();
        expect(screen.getByText('AP 90/90')).toBeInTheDocument();
    });

    it('renders the ROBCO header', () => {
        render(
            <Layout activeApp="timer" setActiveApp={mockSetActiveApp}>
                <div>content</div>
            </Layout>
        );

        expect(screen.getByText('ROBCO IND.')).toBeInTheDocument();
        expect(screen.getByText('UNIFIED OPERATING SYSTEM')).toBeInTheDocument();
    });
});
