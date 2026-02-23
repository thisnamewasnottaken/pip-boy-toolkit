import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { Weather } from '../components/Weather';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Thermometer: () => <span data-testid="icon-thermometer">🌡</span>,
    MapPinOff: () => <span data-testid="icon-map-pin-off">📍</span>,
    MapPin: () => <span data-testid="icon-map-pin">📌</span>,
}));

// Mock recharts to avoid canvas/resize issues in jsdom
vi.mock('recharts', () => ({
    LineChart: ({ children }: React.PropsWithChildren) => <div data-testid="line-chart">{children}</div>,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    ResponsiveContainer: ({ children }: React.PropsWithChildren) => <div data-testid="responsive-container">{children}</div>,
}));

const mockWeatherResponse = {
    hourly: {
        time: [
            '2026-01-01T00:00',
            '2026-01-01T01:00',
            '2026-01-01T02:00',
        ],
        temperature_2m: [10, 11, 12],
        rain: [0, 0.5, 0],
        uv_index: [0, 1, 2],
        weather_code: [0, 1, 2],
    },
};

describe('Weather', () => {
    beforeEach(() => {
        // Default: geolocation unavailable so we hit the straightforward path
        vi.stubGlobal('navigator', {
            ...navigator,
            geolocation: undefined,
        });

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            json: () => Promise.resolve(mockWeatherResponse),
        }));
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('shows loading state initially', () => {
        render(<Weather />);
        expect(screen.getByTestId('weather-loading')).toBeInTheDocument();
    });

    it('renders the weather dashboard after fetching data', async () => {
        render(<Weather />);
        await waitFor(() => {
            expect(screen.getByTestId('weather-dashboard')).toBeInTheDocument();
        });
    });

    it('makes exactly one fetch call to open-meteo', async () => {
        render(<Weather />);
        await waitFor(() => {
            expect(screen.getByTestId('weather-dashboard')).toBeInTheDocument();
        });
        const fetchCalls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
        expect(fetchCalls).toHaveLength(1);
        expect(fetchCalls[0][0]).toContain('api.open-meteo.com');
    });

    it('shows location warning when geolocation is unavailable', async () => {
        render(<Weather />);
        await waitFor(() => {
            expect(screen.getByTestId('weather-location-warning')).toBeInTheDocument();
        });
    });

    it('does not show location warning when geolocation succeeds', async () => {
        const mockPosition = {
            coords: { latitude: 48.85, longitude: 2.35 },
        };
        vi.stubGlobal('navigator', {
            ...navigator,
            geolocation: {
                getCurrentPosition: (success: PositionCallback) => success(mockPosition as GeolocationPosition),
            },
        });

        render(<Weather />);
        await waitFor(() => {
            expect(screen.getByTestId('weather-dashboard')).toBeInTheDocument();
        });
        expect(screen.queryByTestId('weather-location-warning')).not.toBeInTheDocument();
    });

    it('aborts the fetch when the component unmounts', async () => {
        let capturedSignal: AbortSignal | undefined;
        (fetch as ReturnType<typeof vi.fn>).mockImplementation((_url: string, options?: RequestInit) => {
            capturedSignal = options?.signal ?? undefined;
            return new Promise(() => {}); // never resolves
        });

        const { unmount } = render(<Weather />);

        // Give effect time to run
        await act(async () => {});

        expect(capturedSignal).toBeDefined();
        expect(capturedSignal!.aborted).toBe(false);

        unmount();

        expect(capturedSignal!.aborted).toBe(true);
    });

    it('handles fetch errors gracefully and exits loading state', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

        render(<Weather />);
        await waitFor(() => {
            expect(screen.queryByTestId('weather-loading')).not.toBeInTheDocument();
        });
    });
});
