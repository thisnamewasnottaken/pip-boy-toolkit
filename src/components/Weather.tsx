import { useState, useEffect, useRef } from 'react';
import { Thermometer, MapPinOff, MapPin, ChevronRight, ChevronLeft } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface WeatherData {
    time: string;
    temp: number;
    rain: number;
}

type LocationStatus = 'detecting' | 'detected' | 'defaulted' | 'unavailable';

const DEFAULT_LOCATION = { lat: 52.52, lon: 13.41 };
const DEFAULT_LOCATION_NAME = 'BERLIN, DE';

export function Weather() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<WeatherData[]>([]);
    const [currentTemp, setCurrentTemp] = useState<number | null>(null);
    const [currentRain, setCurrentRain] = useState<number | null>(null);
    const [currentUV, setCurrentUV] = useState<number | null>(null);
    const [location, setLocation] = useState(DEFAULT_LOCATION);
    const [locationStatus, setLocationStatus] = useState<LocationStatus>('detecting');
    const [locationError, setLocationError] = useState<string | null>(null);
    const [activePanel, setActivePanel] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        const fetchWeather = async () => {
            try {
                let lat = DEFAULT_LOCATION.lat;
                let lon = DEFAULT_LOCATION.lon;
                let geoSuccess = false;

                if ('geolocation' in navigator) {
                    try {
                        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
                        });
                        lat = position.coords.latitude;
                        lon = position.coords.longitude;
                        geoSuccess = true;
                        setLocationStatus('detected');
                    } catch (e) {
                        const geoError = e as GeolocationPositionError;
                        let reason = 'UNKNOWN ERROR';
                        if (geoError.code === 1) reason = 'PERMISSION DENIED';
                        else if (geoError.code === 2) reason = 'POSITION UNAVAILABLE';
                        else if (geoError.code === 3) reason = 'TIMEOUT';
                        setLocationError(reason);
                        setLocationStatus('defaulted');
                        console.warn(`Geolocation failed (${reason}), using default: ${DEFAULT_LOCATION_NAME}`);
                    }
                } else {
                    setLocationError('GEOLOCATION API NOT AVAILABLE');
                    setLocationStatus('unavailable');
                }

                if (signal.aborted) return;

                if (!geoSuccess) {
                    lat = DEFAULT_LOCATION.lat;
                    lon = DEFAULT_LOCATION.lon;
                }

                setLocation({ lat, lon });

                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,rain,uv_index,weather_code&past_days=1`, { signal });
                const json = await res.json();

                if (json.hourly) {
                    const formattedData: WeatherData[] = [];
                    const now = new Date();
                    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

                    let cTemp: number | null = null;
                    let cRain: number | null = null;
                    let cUV: number | null = null;

                    for (let i = 0; i < json.hourly.time.length; i++) {
                        const timeStr = json.hourly.time[i];
                        const date = new Date(timeStr);

                        if (date >= currentHour && formattedData.length < 24) {
                            formattedData.push({
                                time: `${date.getHours().toString().padStart(2, '0')}:00`,
                                temp: json.hourly.temperature_2m[i],
                                rain: json.hourly.rain[i],
                            });

                            if (cTemp === null) {
                                cTemp = json.hourly.temperature_2m[i];
                                cRain = json.hourly.rain[i];
                                cUV = json.hourly.uv_index[i];
                            }
                        }
                    }

                    setData(formattedData);
                    setCurrentTemp(cTemp);
                    setCurrentRain(cRain);
                    setCurrentUV(cUV);
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') return;
                console.error("Failed to fetch weather data:", error);
            } finally {
                if (!signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchWeather();

        return () => {
            controller.abort();
        };
    }, []);

    // Track which panel is active via scroll position (landscape swipe)
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const handleScroll = () => {
            const scrollLeft = el.scrollLeft;
            const width = el.clientWidth;
            setActivePanel(scrollLeft > width * 0.4 ? 1 : 0);
        };
        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, [loading]);

    const scrollToPanel = (panel: number) => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTo({ left: panel * el.clientWidth, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center font-mono text-xl animate-pulse" data-testid="weather-loading">
                <p>INITIALIZING SENSORS...</p>
                <p>CALIBRATING ATMOSPHERIC PROBES...</p>
                <p>FETCHING METEOROLOGICAL DATA...</p>
            </div>
        );
    }

    // ── Shared sub-components ──────────────────────────────────

    const locationWarningDesktop = locationStatus !== 'detected' && locationStatus !== 'detecting' && (
        <div
            className="border-2 border-amber-400 bg-amber-400/10 p-4 flex items-start gap-3"
            data-testid="weather-location-warning"
        >
            <MapPinOff size={24} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
                <p className="font-bold uppercase tracking-widest text-amber-400">
                    ⚠ GEOLOCATION FAILED — USING DEFAULT LOCATION
                </p>
                <p className="text-sm opacity-80 mt-1">
                    REASON: {locationError ?? 'UNKNOWN'} • DEFAULTED TO: {DEFAULT_LOCATION_NAME} ({DEFAULT_LOCATION.lat}°N, {DEFAULT_LOCATION.lon}°E)
                </p>
                <p className="text-xs opacity-60 mt-1">
                    ALLOW LOCATION ACCESS IN YOUR BROWSER TO USE YOUR LOCAL WEATHER DATA
                </p>
            </div>
        </div>
    );

    const locationWarningMobile = locationStatus !== 'detected' && locationStatus !== 'detecting' && (
        <div className="border border-amber-400 bg-amber-400/10 px-3 py-1 flex items-center gap-2 text-xs shrink-0">
            <MapPinOff size={12} className="text-amber-400 shrink-0" />
            <span className="font-bold uppercase tracking-wider text-amber-400 truncate">
                ⚠ GEO FAILED — DEFAULT: {DEFAULT_LOCATION_NAME}
            </span>
        </div>
    );

    // Compact stat cards used by both portrait and landscape mobile
    const mobileMetrics = (
        <>
            {/* Primary Stat: Temperature */}
            <div className="border-chunky-thin p-2 flex items-center gap-3 bg-black/50 shrink-0">
                <Thermometer size={24} className="shrink-0" />
                <span className="text-2xl font-bold crt-glow flex-1">
                    {currentTemp !== null ? Math.round(currentTemp) : '--'}°C
                </span>
                <span className="text-[10px] uppercase tracking-widest opacity-70">
                    {currentRain !== null && currentRain > 0 ? 'PRECIP' : 'CLEAR'}
                </span>
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-2 gap-1.5 shrink-0">
                <div className="border-chunky-thin p-2 bg-black/50 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest opacity-60">PRECIP</span>
                    <span className="text-lg font-bold crt-glow">
                        {currentRain !== null ? currentRain.toFixed(1) : '--'}
                        <span className="text-[10px] ml-0.5 opacity-70">MM</span>
                    </span>
                </div>
                <div className="border-chunky-thin p-2 bg-black/50 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest opacity-60">UV</span>
                    <span className={`text-lg font-bold crt-glow ${currentUV !== null && currentUV > 5 ? 'text-red-500' : ''}`}>
                        {currentUV !== null ? currentUV.toFixed(1) : '--'}
                        <span className="text-[10px] ml-0.5 opacity-70">IDX</span>
                    </span>
                </div>
            </div>

            {/* System Status — single compact row */}
            <div className="border-chunky-thin px-2 py-1.5 bg-black/50 flex items-center gap-3 text-[10px] shrink-0 flex-wrap">
                <span className="flex items-center gap-1 opacity-70">
                    {locationStatus === 'detected'
                        ? <MapPin size={10} className="text-green-400" />
                        : <MapPinOff size={10} className="text-amber-400" />
                    }
                    {locationStatus === 'detected'
                        ? <>{location.lat.toFixed(2)}°N, {location.lon.toFixed(2)}°E</>
                        : <span className="text-amber-400">{DEFAULT_LOCATION_NAME}</span>
                    }
                </span>
                <span className="opacity-30">|</span>
                <span className="opacity-70">SRC: {locationStatus === 'detected' ? 'GPS' : 'DEFAULT'}</span>
                <span className="opacity-30">|</span>
                <span className="opacity-70">OPEN-METEO</span>
                <span className="opacity-30">|</span>
                <span className="opacity-70">SYNCED</span>
            </div>
        </>
    );

    const mobileChart = (
        <div className="border-chunky-thin p-2 bg-black/50 flex-1 flex flex-col min-h-0">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80 shrink-0">24-HR FORECAST</h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--term-color)" opacity={0.2} />
                        <XAxis dataKey="time" stroke="var(--term-color)" tick={{ fill: 'var(--term-color)', fontFamily: 'var(--font-mono)', fontSize: 9 }} interval={3} />
                        <YAxis yAxisId="left" stroke="var(--term-color)" tick={{ fill: 'var(--term-color)', fontFamily: 'var(--font-mono)', fontSize: 9 }} width={25} />
                        <YAxis yAxisId="right" orientation="right" stroke="#60a5fa" tick={{ fill: '#60a5fa', fontFamily: 'var(--font-mono)', fontSize: 9 }} width={25} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--term-bg)', borderColor: 'var(--term-color)', color: 'var(--term-color)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                            itemStyle={{ color: 'var(--term-color)' }}
                        />
                        <Line yAxisId="left" type="monotone" dataKey="temp" name="Temp (°C)" stroke="var(--term-color)" strokeWidth={2} dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="rain" name="Rain (mm)" stroke="#60a5fa" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-1 shrink-0">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-[var(--term-color)]"></div>
                    <span className="text-[10px] uppercase tracking-widest">TEMP</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 border-t border-dashed border-[#60a5fa]"></div>
                    <span className="text-[10px] uppercase tracking-widest text-[#60a5fa]">RAIN</span>
                </div>
            </div>
        </div>
    );

    // ─────────────────────────────────────────────────────────
    // MOBILE PORTRAIT: Stats stacked vertically with chart below
    // ─────────────────────────────────────────────────────────
    const mobilePortraitLayout = (
        <div className="h-full flex flex-col gap-1.5 overflow-y-auto scrollbar-hide">
            {locationWarningMobile}
            {mobileMetrics}
            {/* Chart fills remaining space, min-height ensures it's visible */}
            <div className="flex flex-col min-h-[200px] flex-1">
                {mobileChart}
            </div>
        </div>
    );

    // ─────────────────────────────────────────────────────────
    // MOBILE LANDSCAPE: Swipeable panels — metrics | chart
    // ─────────────────────────────────────────────────────────
    const mobileLandscapeLayout = (
        <div className="h-full flex flex-col">
            {locationWarningMobile}

            {/* Swipeable Panel Container — no scrollbars */}
            <div
                ref={scrollRef}
                className="flex-1 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide min-h-0"
            >
                {/* PANEL 1: Metrics */}
                <div className="w-full shrink-0 snap-center flex flex-col gap-1.5 p-1 overflow-hidden">
                    {mobileMetrics}
                </div>

                {/* PANEL 2: Chart */}
                <div className="w-full shrink-0 snap-center flex flex-col p-1 min-h-0">
                    {mobileChart}
                </div>
            </div>

            {/* Swipe Indicator Dots */}
            <div className="flex items-center justify-center gap-3 py-1 shrink-0">
                <button
                    onClick={() => scrollToPanel(0)}
                    className={`transition-opacity ${activePanel === 0 ? 'opacity-100' : 'opacity-40'}`}
                    aria-label="View metrics"
                >
                    <ChevronLeft size={12} />
                </button>
                <div className="flex gap-1.5">
                    <button
                        onClick={() => scrollToPanel(0)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${activePanel === 0 ? 'bg-[var(--term-color)] shadow-[0_0_4px_var(--term-color)]' : 'bg-[var(--term-color)]/30'}`}
                        aria-label="Metrics panel"
                    />
                    <button
                        onClick={() => scrollToPanel(1)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${activePanel === 1 ? 'bg-[var(--term-color)] shadow-[0_0_4px_var(--term-color)]' : 'bg-[var(--term-color)]/30'}`}
                        aria-label="Chart panel"
                    />
                </div>
                <button
                    onClick={() => scrollToPanel(1)}
                    className={`transition-opacity ${activePanel === 1 ? 'opacity-100' : 'opacity-40'}`}
                    aria-label="View chart"
                >
                    <ChevronRight size={12} />
                </button>
            </div>
        </div>
    );

    // ─────────────────────────────────────────────────────────
    // DESKTOP LAYOUT: Original full grid
    // ─────────────────────────────────────────────────────────
    const desktopLayout = (
        <div className="h-full flex flex-col gap-6">
            {locationWarningDesktop}

            <div className="grid grid-cols-4 gap-6">
                {/* Current Conditions */}
                <div className="border-chunky-thin p-6 flex flex-col items-center justify-center bg-black/50">
                    <h3 className="text-xl font-bold uppercase tracking-widest mb-4 opacity-80">CURRENT TEMP</h3>
                    <div className="flex items-center gap-4">
                        <Thermometer size={48} />
                        <span className="text-6xl font-bold crt-glow" data-testid="weather-temp">
                            {currentTemp !== null ? Math.round(currentTemp) : '--'}°C
                        </span>
                    </div>
                    <p className="mt-4 text-sm uppercase tracking-widest opacity-70">
                        {currentRain !== null && currentRain > 0 ? 'PRECIPITATION DETECTED' : 'CLEAR SKIES'}
                    </p>
                </div>

                {/* Rain Levels */}
                <div className="border-chunky-thin p-6 flex flex-col items-center justify-center bg-black/50">
                    <h3 className="text-xl font-bold uppercase tracking-widest mb-4 opacity-80">PRECIPITATION</h3>
                    <div className="flex items-center gap-4">
                        <span className="text-6xl font-bold crt-glow" data-testid="weather-rain">
                            {currentRain !== null ? currentRain.toFixed(1) : '--'}
                        </span>
                        <span className="text-2xl font-bold mt-4">MM</span>
                    </div>
                    {currentRain !== null && currentRain > 0 ? (
                        <p className="mt-4 text-sm uppercase tracking-widest text-blue-400 animate-pulse">WARNING: RAINFALL</p>
                    ) : (
                        <p className="mt-4 text-sm uppercase tracking-widest opacity-70">NOMINAL</p>
                    )}
                </div>

                {/* UV Levels (RAD analog) */}
                <div className="border-chunky-thin p-6 flex flex-col items-center justify-center bg-black/50">
                    <h3 className="text-xl font-bold uppercase tracking-widest mb-4 opacity-80">UV EXPOSURE</h3>
                    <div className="flex items-center gap-4">
                        <span className="text-6xl font-bold crt-glow" data-testid="weather-uv">
                            {currentUV !== null ? currentUV.toFixed(1) : '--'}
                        </span>
                        <span className="text-2xl font-bold mt-4">INDEX</span>
                    </div>
                    {currentUV !== null && currentUV > 5 ? (
                        <p className="mt-4 text-sm uppercase tracking-widest text-red-500 animate-pulse">WARNING: ELEVATED</p>
                    ) : (
                        <p className="mt-4 text-sm uppercase tracking-widest opacity-70">NOMINAL</p>
                    )}
                </div>

                {/* System Status */}
                <div className="border-chunky-thin p-6 flex flex-col justify-center bg-black/50 gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {locationStatus === 'detected'
                                ? <MapPin size={16} className="text-green-400" />
                                : <MapPinOff size={16} className="text-amber-400" />
                            }
                            <span className="font-bold uppercase tracking-widest">LOC</span>
                        </div>
                        <span className="text-sm font-mono text-right">
                            {locationStatus === 'detected' ? (
                                <>{location.lat.toFixed(4)}°N<br />{location.lon.toFixed(4)}°E</>
                            ) : (
                                <span className="text-amber-400">{DEFAULT_LOCATION_NAME}<br />(DEFAULT)</span>
                            )}
                        </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[var(--term-color)]/30 pt-4">
                        <span className="font-bold uppercase tracking-widest">LOC SOURCE</span>
                        <span className={`text-sm font-mono ${locationStatus === 'detected' ? '' : 'text-amber-400'}`}>
                            {locationStatus === 'detected' ? 'GPS/BROWSER' : 'FALLBACK'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[var(--term-color)]/30 pt-4">
                        <span className="font-bold uppercase tracking-widest">DATA SOURCE</span>
                        <span className="text-sm font-mono">OPEN-METEO</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[var(--term-color)]/30 pt-4">
                        <span className="font-bold uppercase tracking-widest">LAST SYNC</span>
                        <span className="text-xl font-mono">JUST NOW</span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 border-chunky-thin p-6 bg-black/50 min-h-[300px] flex flex-col">
                <h3 className="text-xl font-bold uppercase tracking-widest mb-6 opacity-80">24-HOUR FORECAST</h3>
                <div className="flex-1 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--term-color)" opacity={0.2} />
                            <XAxis dataKey="time" stroke="var(--term-color)" tick={{ fill: 'var(--term-color)', fontFamily: 'var(--font-mono)' }} />
                            <YAxis yAxisId="left" stroke="var(--term-color)" tick={{ fill: 'var(--term-color)', fontFamily: 'var(--font-mono)' }} />
                            <YAxis yAxisId="right" orientation="right" stroke="#60a5fa" tick={{ fill: '#60a5fa', fontFamily: 'var(--font-mono)' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--term-bg)', borderColor: 'var(--term-color)', color: 'var(--term-color)', fontFamily: 'var(--font-mono)' }}
                                itemStyle={{ color: 'var(--term-color)' }}
                            />
                            <Line yAxisId="left" type="monotone" dataKey="temp" name="Temp (°C)" stroke="var(--term-color)" strokeWidth={3} dot={{ fill: 'var(--term-bg)', stroke: 'var(--term-color)', strokeWidth: 2, r: 4 }} activeDot={{ r: 8 }} />
                            <Line yAxisId="right" type="monotone" dataKey="rain" name="Rain (mm)" stroke="#60a5fa" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: 'var(--term-bg)', stroke: '#60a5fa', strokeWidth: 2, r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-8 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-1 bg-[var(--term-color)]"></div>
                        <span className="text-sm uppercase tracking-widest">TEMPERATURE (°C)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-1 border-t-2 border-dashed border-[#60a5fa]"></div>
                        <span className="text-sm uppercase tracking-widest text-[#60a5fa]">RAIN (MM)</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div data-testid="weather-dashboard" className="h-full">
            {/* Mobile layouts — hidden on desktop (lg+) */}
            <div className="lg:hidden h-full">
                {/* Portrait: stats + chart stacked vertically */}
                <div className="hidden portrait:block h-full">{mobilePortraitLayout}</div>
                {/* Landscape: swipeable panels */}
                <div className="hidden landscape:block h-full">{mobileLandscapeLayout}</div>
            </div>
            {/* Desktop: full grid */}
            <div className="hidden lg:block h-full">{desktopLayout}</div>
        </div>
    );
}
