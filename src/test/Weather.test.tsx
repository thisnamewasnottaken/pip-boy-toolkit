import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { Weather } from '../components/Weather';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Thermometer: () => <span data-testid="icon-thermometer">🌡</span>,
    MapPinOff: () => <span data-testid="icon-map-pin-off">📍</span>,
    MapPin: () => <span data-testid="icon-map-pin">📌</span>,
    ChevronLeft: () => <span data-testid="icon-chevron-left">◀</span>,
    ChevronRight: () => <span data-testid="icon-chevron-right">▶</span>,
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

/** Generate mock weather timestamps starting from the current hour */
function createMockWeatherResponse(options?: { rain?: number; uvIndex?: number }) {
    const now = new Date();
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    const times: string[] = [];
    const temps: number[] = [];
    const rains: number[] = [];
    const uvs: number[] = [];
    const codes: number[] = [];

    for (let i = 0; i < 3; i++) {
        const t = new Date(currentHour.getTime() + i * 3600000);
        times.push(t.toISOString().slice(0, 16));
        temps.push(10 + i);
        rains.push(i === 0 ? (options?.rain ?? 0) : 0);
        uvs.push(i === 0 ? (options?.uvIndex ?? 1) : 1);
        codes.push(i);
    }

    return {
        hourly: {
            time: times,
            temperature_2m: temps,
            rain: rains,
            uv_index: uvs,
            weather_code: codes,
        },
    };
}

describe('Weather', () => {
    beforeEach(() => {
        // Default: geolocation unavailable so we hit the straightforward path
        vi.stubGlobal('navigator', {
            ...navigator,
            geolocation: undefined,
        });

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            json: () => Promise.resolve(createMockWeatherResponse()),
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
            return new Promise(() => { }); // never resolves
        });

        const { unmount } = render(<Weather />);

        // Give effect time to run
        await act(async () => { });

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

    it('shows location warning when geolocation API is not available in navigator', async () => {
        // Stub navigator without geolocation key at all
        const navWithoutGeo: Record<string, unknown> = {};
        vi.stubGlobal('navigator', navWithoutGeo);

        render(<Weather />);
        await waitFor(() => {
            expect(screen.getByTestId('weather-dashboard')).toBeInTheDocument();
        });
        expect(screen.getByTestId('weather-location-warning')).toBeInTheDocument();
    });

    it('handles geolocation permission denied error', async () => {
        vi.stubGlobal('navigator', {
            ...navigator,
            geolocation: {
                getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) => {
                    error({ code: 1, message: 'Permission denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError);
                },
            },
        });

        render(<Weather />);
        await waitFor(() => {
            expect(screen.getByTestId('weather-dashboard')).toBeInTheDocument();
        });
        expect(screen.getByTestId('weather-location-warning')).toBeInTheDocument();
    });

    it('handles geolocation position unavailable error', async () => {
        vi.stubGlobal('navigator', {
            ...navigator,
            geolocation: {
                getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) => {
                    error({ code: 2, message: 'Position unavailable', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError);
                },
            },
        });

        render(<Weather />);
        await waitFor(() => {
            expect(screen.getByTestId('weather-dashboard')).toBeInTheDocument();
        });
        expect(screen.getByTestId('weather-location-warning')).toBeInTheDocument();
    });

    it('handles geolocation timeout error', async () => {
        vi.stubGlobal('navigator', {
            ...navigator,
            geolocation: {
                getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) => {
                    error({ code: 3, message: 'Timeout', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError);
                },
            },
        });

        render(<Weather />);
        await waitFor(() => {
            expect(screen.getByTestId('weather-dashboard')).toBeInTheDocument();
        });
        expect(screen.getByTestId('weather-location-warning')).toBeInTheDocument();
    });

    it('displays actual temperature data when timestamps match current time', async () => {
        render(<Weather />);
        await waitFor(() => {
            expect(screen.getByTestId('weather-dashboard')).toBeInTheDocument();
        });
        // With current timestamps, the data should be processed
        expect(screen.getByTestId('weather-temp')).toHaveTextContent('10°C');
    });

    it('shows precipitation warning when rain > 0', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            json: () => Promise.resolve(createMockWeatherResponse({ rain: 2.5 })),
        });

        render(<Weather />);
        await waitFor(() => {
            expect(screen.getByTestId('weather-dashboard')).toBeInTheDocument();
        });

        // Desktop rain warning text
        expect(screen.getByText('WARNING: RAINFALL')).toBeInTheDocument();
    });

    it('shows UV elevated warning when UV index > 5', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            json: () => Promise.resolve(createMockWeatherResponse({ uvIndex: 7.5 })),
        });

        render(<Weather />);
        await waitFor(() => {
            expect(screen.getByTestId('weather-dashboard')).toBeInTheDocument();
        });

        // Desktop UV warning text
        expect(screen.getByText('WARNING: ELEVATED')).toBeInTheDocument();
    });

    it('shows nominal when rain is 0 and UV is low', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            json: () => Promise.resolve(createMockWeatherResponse({ rain: 0, uvIndex: 2 })),
        });

        render(<Weather />);
        await waitFor(() => {
            expect(screen.getByTestId('weather-dashboard')).toBeInTheDocument();
        });

        const nominalElements = screen.getAllByText('NOMINAL');
        expect(nominalElements.length).toBeGreaterThanOrEqual(2);
    });

    it('calls scrollToPanel when panel navigation buttons are clicked', async () => {
        // Mock scrollTo since jsdom doesn't support it
        HTMLElement.prototype.scrollTo = vi.fn();

        render(<Weather />);
        await waitFor(() => {
            expect(screen.getByTestId('weather-dashboard')).toBeInTheDocument();
        });

        // Click landscape panel navigation buttons
        const metricsBtn = screen.getByLabelText('Metrics panel');
        const chartBtn = screen.getByLabelText('Chart panel');
        const viewMetricsBtn = screen.getByLabelText('View metrics');
        const viewChartBtn = screen.getByLabelText('View chart');

        await act(async () => {
            metricsBtn.click();
            chartBtn.click();
            viewMetricsBtn.click();
            viewChartBtn.click();
        });

        expect(HTMLElement.prototype.scrollTo).toHaveBeenCalled();
    });

    describe('element visibility', () => {
        it('renders temperature data in the dashboard', async () => {
            render(<Weather />);
            await waitFor(() => {
                expect(screen.getByTestId('weather-dashboard')).toBeInTheDocument();
            });
            // Desktop testid for temp
            expect(screen.getByTestId('weather-temp')).toBeInTheDocument();
        });

        it('renders precipitation data in the dashboard', async () => {
            render(<Weather />);
            await waitFor(() => {
                expect(screen.getByTestId('weather-dashboard')).toBeInTheDocument();
            });
            expect(screen.getByTestId('weather-rain')).toBeInTheDocument();
        });

        it('renders UV data in the dashboard', async () => {
            render(<Weather />);
            await waitFor(() => {
                expect(screen.getByTestId('weather-dashboard')).toBeInTheDocument();
            });
            expect(screen.getByTestId('weather-uv')).toBeInTheDocument();
        });

        it('renders the forecast chart', async () => {
            render(<Weather />);
            await waitFor(() => {
                expect(screen.getByTestId('weather-dashboard')).toBeInTheDocument();
            });
            // Chart should be present in at least one layout
            const charts = screen.getAllByTestId('line-chart');
            expect(charts.length).toBeGreaterThanOrEqual(1);
        });

        it('renders the thermometer icon', async () => {
            render(<Weather />);
            await waitFor(() => {
                expect(screen.getByTestId('weather-dashboard')).toBeInTheDocument();
            });
            const icons = screen.getAllByTestId('icon-thermometer');
            expect(icons.length).toBeGreaterThanOrEqual(1);
        });

        it('renders system status information with location data', async () => {
            render(<Weather />);
            await waitFor(() => {
                expect(screen.getByTestId('weather-dashboard')).toBeInTheDocument();
            });
            // Should always show OPEN-METEO as data source
            const meteoText = screen.getAllByText('OPEN-METEO');
            expect(meteoText.length).toBeGreaterThanOrEqual(1);
        });
    });
});
