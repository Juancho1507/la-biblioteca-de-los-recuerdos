import { useCallback, useEffect, useMemo, useState } from 'react';
import { CloudSun, Droplets, Gauge, LocateFixed, MapPin, Moon, Search, Sun, Sunrise, Sunset, Wind, X } from 'lucide-react';
import './styles.css';

type Units = 'metric' | 'imperial';
type Location = { name: string; country: string; latitude: number; longitude: number; admin1?: string };
type Weather = {
  current: { time: string; temperature_2m: number; relative_humidity_2m: number; apparent_temperature: number; is_day: number; precipitation: number; weather_code: number; wind_speed_10m: number; wind_direction_10m: number };
  hourly: { time: string[]; temperature_2m: number[]; precipitation_probability: number[]; weather_code: number[]; relative_humidity_2m: number[] };
  daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: number[]; sunrise: string[]; sunset: string[] };
};

const weatherLabel = (code: number) => code === 0 ? 'Clear sky' : code <= 3 ? 'Partly cloudy' : code <= 48 ? 'Foggy' : code <= 67 ? 'Rainy' : code <= 77 ? 'Snowy' : code <= 82 ? 'Showers' : 'Thunderstorms';
const weatherIcon = (code: number, day = true) => code === 0 ? (day ? '☀' : '☾') : code <= 3 ? '⛅' : code <= 48 ? '☁' : code <= 67 ? '🌧' : code <= 77 ? '❄' : code <= 82 ? '🌦' : '⛈';
const formatDay = (value: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(undefined, options).format(new Date(`${value}T12:00:00`));
const formatTime = (value: string) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
const direction = (degrees: number) => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(degrees / 45) % 8];

async function findLocation(query: string): Promise<Location> {
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
  if (!response.ok) throw new Error('Unable to search for that location.');
  const data = await response.json();
  if (!data.results?.length) throw new Error('No locations found. Try another city.');
  const result = data.results[0];
  return { name: result.name, country: result.country, latitude: result.latitude, longitude: result.longitude, admin1: result.admin1 };
}

async function loadWeather(location: Location, units: Units): Promise<Weather> {
  const temperatureUnit = units === 'metric' ? 'celsius' : 'fahrenheit';
  const windspeedUnit = units === 'metric' ? 'kmh' : 'mph';
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,weather_code,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&forecast_days=7&temperature_unit=${temperatureUnit}&windspeed_unit=${windspeedUnit}&timezone=auto`);
  if (!response.ok) throw new Error('Weather data is temporarily unavailable.');
  return response.json();
}

function App() {
  const [location, setLocation] = useState<Location>({ name: 'San Francisco', country: 'United States', latitude: 37.7749, longitude: -122.4194 });
  const [weather, setWeather] = useState<Weather | null>(null);
  const [units, setUnits] = useState<Units>('metric');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const refresh = useCallback(async (place: Location, nextUnits = units) => {
    setLoading(true); setError('');
    try { setWeather(await loadWeather(place, nextUnits)); } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); } finally { setLoading(false); }
  }, [units]);

  useEffect(() => { refresh(location); }, [location, refresh]);
  const hourly = useMemo(() => {
    if (!weather) return [];
    const now = Date.now();
    return weather.hourly.time.map((time, index) => ({ time, index, date: new Date(time).getTime() })).filter(item => item.date >= now - 60 * 60 * 1000).slice(0, 8);
  }, [weather]);
  const unitSymbol = units === 'metric' ? '°' : '°';
  const windUnit = units === 'metric' ? 'km/h' : 'mph';

  const submitSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    try { const place = await findLocation(query.trim()); setLocation(place); setQuery(''); setSearchOpen(false); } catch (err) { setError(err instanceof Error ? err.message : 'Search failed.'); }
  };

  const useCurrentLocation = () => navigator.geolocation?.getCurrentPosition(async position => {
    try { const reverse = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&count=1&language=en&format=json`).then(res => res.json()); const result = reverse.results?.[0]; setLocation({ name: result?.name || 'Current location', country: result?.country || '', latitude: position.coords.latitude, longitude: position.coords.longitude, admin1: result?.admin1 }); } catch { setError('Could not identify your current location.'); }
  }, () => setError('Location access was denied.'));

  const changeUnits = (next: Units) => { setUnits(next); refresh(location, next); };

  return <div className={`app ${weather?.current.is_day ? 'day' : 'night'}`}>
    <header className="topbar"><a className="logo" href="/" aria-label="Skyline Weather home"><span className="logo-mark">☼</span><span>skyline<span className="logo-muted">weather</span></span></a><nav><button className="icon-button" aria-label="Use my location" onClick={useCurrentLocation}><LocateFixed size={19} /></button><button className="icon-button" aria-label="Toggle search" onClick={() => setSearchOpen(value => !value)}><Search size={19} /></button><div className="unit-switch" aria-label="Temperature units"><button className={units === 'metric' ? 'selected' : ''} onClick={() => changeUnits('metric')}>°C</button><button className={units === 'imperial' ? 'selected' : ''} onClick={() => changeUnits('imperial')}>°F</button></div></nav></header>
    {searchOpen && <form className="search-bar" onSubmit={submitSearch}><Search size={18} /><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Search a city..." /><button type="submit">Search</button><button type="button" className="close-search" onClick={() => setSearchOpen(false)}><X size={18} /></button></form>}
    <main>
      <section className="location-heading"><div><div className="location-name"><MapPin size={17} /> <h1>{location.name}</h1><span>{location.admin1 || location.country}</span></div><p>Live weather conditions and a 7-day forecast</p></div><button className="outline-button" onClick={() => refresh(location)}>Refresh data</button></section>
      {error && <div className="error-banner" role="alert">{error}<button onClick={() => { setError(''); refresh(location); }}>Try again</button></div>}
      {loading && <div className="loading-card">Fetching the latest forecast<span>...</span></div>}
      {!loading && weather && <>
        <section className="hero-grid"><div className="current-card"><div className="card-label">CURRENT CONDITIONS <span>UPDATED {formatTime(weather.current.time)}</span></div><div className="current-main"><div><div className="big-temp">{Math.round(weather.current.temperature_2m)}{unitSymbol}</div><div className="condition">{weatherLabel(weather.current.weather_code)}</div><div className="feels">Feels like {Math.round(weather.current.apparent_temperature)}{unitSymbol}</div></div><div className="hero-icon">{weatherIcon(weather.current.weather_code, Boolean(weather.current.is_day))}</div></div><div className="current-footer"><span><Droplets size={16} />{weather.current.relative_humidity_2m}% humidity</span><span><Wind size={16} />{Math.round(weather.current.wind_speed_10m)} {windUnit} {direction(weather.current.wind_direction_10m)}</span><span><Gauge size={16} />{weather.current.precipitation} mm rain</span></div></div><aside className="insight-card"><div className="card-label">TODAY'S INSIGHT</div><div className="insight-icon"><Sun size={22} /></div><h2>Make the most of the day</h2><p>{weather.current.precipitation > 0 ? 'Keep an umbrella close — showers are expected today.' : 'Clear conditions make this a great day to get outside.'}</p><div className="sun-times"><span><Sunrise size={17} /> Sunrise <b>{formatTime(weather.daily.sunrise[0])}</b></span><span><Sunset size={17} /> Sunset <b>{formatTime(weather.daily.sunset[0])}</b></span></div></aside></section>
        <section className="section"><div className="section-heading"><div><span className="eyebrow">NEXT 24 HOURS</span><h2>Hourly forecast</h2></div><span className="section-note">Local time</span></div><div className="hourly-row">{hourly.map((item, position) => <div className={`hour ${position === 0 ? 'now' : ''}`} key={item.time}><span>{position === 0 ? 'Now' : formatTime(item.time)}</span><strong>{weatherIcon(weather.hourly.weather_code[item.index])}</strong><b>{Math.round(weather.hourly.temperature_2m[item.index])}{unitSymbol}</b><small><Droplets size={12} /> {weather.hourly.precipitation_probability[item.index]}%</small></div>)}</div></section>
        <section className="section forecast-section"><div className="section-heading"><div><span className="eyebrow">LOOKING AHEAD</span><h2>7-day forecast</h2></div><span className="section-note">Precipitation chance</span></div><div className="daily-list">{weather.daily.time.map((day, index) => <div className="day-row" key={day}><strong>{index === 0 ? 'Today' : formatDay(day, { weekday: 'short' })}</strong><span className="day-date">{formatDay(day, { month: 'short', day: 'numeric' })}</span><span className="day-weather"><i>{weatherIcon(weather.daily.weather_code[index])}</i> {weatherLabel(weather.daily.weather_code[index])}</span><span className="rain"><Droplets size={14} />{weather.daily.precipitation_probability_max[index]}%</span><span className="temps"><b>{Math.round(weather.daily.temperature_2m_max[index])}{unitSymbol}</b><span className="temp-bar"><i style={{ left: `${Math.max(0, (weather.daily.temperature_2m_min[index] + 10) / 60 * 100)}%`, width: `${Math.max(12, (weather.daily.temperature_2m_max[index] - weather.daily.temperature_2m_min[index]) / 60 * 100)}%` }} /></span><em>{Math.round(weather.daily.temperature_2m_min[index])}{unitSymbol}</em></span></div>)}</div></section>
      </>}
    </main><footer>Data provided by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> · Forecasts are updated automatically</footer>
  </div>;
}

export default App;
