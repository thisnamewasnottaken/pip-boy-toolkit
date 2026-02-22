import { useState, useEffect } from 'react';
import { Thermometer, MapPinOff, MapPin } from 'lucide-react';
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

    useEffect(() => {
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

                if (!geoSuccess) {
                    lat = DEFAULT_LOCATION.lat;
                    lon = DEFAULT_LOCATION.lon;
                }

                setLocation({ lat, lon });

                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,rain,uv_index,weather_code&past_days=1`);
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
                console.error("Failed to fetch weather data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, []);

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center font-mono text-xl animate-pulse" data-testid="weather-loading">
                <p>INITIALIZING SENSORS...</p>
                <p>CALIBRATING ATMOSPHERIC PROBES...</p>
                <p>FETCHING METEOROLOGICAL DATA...</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col gap-6" data-testid="weather-dashboard">
            {/* Location Fallback Warning */}
            {locationStatus !== 'detected' && locationStatus !== 'detecting' && (
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
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
}
