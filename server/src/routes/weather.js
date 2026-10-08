// Open-Meteo weather for the room window. One response serves both callers: `scene` picks
// the window illustration, and the raw fields (time, sunrise, sunset) let a client work out
// the time of day itself.
import { Router } from "express";

const router = Router();

const SINGAPORE = { lat: 1.3521, lng: 103.8198 };

const FALLBACK = {
  scene: "cloudy",
  temperature: null,
  weatherCode: null,
  isDay: true,
  unavailable: true
};

const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);

// WMO weather codes as returned by Open-Meteo
function sceneForCode(code) {
  if (code === 0 || code === 1) return "sunny";
  if (RAIN_CODES.has(code)) return "rain";
  return "cloudy";
}

function coordinate(value, fallback) {
  const number = Number(value);
  return value !== undefined && value !== "" && Number.isFinite(number) ? number : fallback;
}

function fromForecast(data) {
  const current = data?.current;
  const weatherCode = Number(current?.weather_code);
  const temperature = Number(current?.temperature_2m);
  if (!Number.isFinite(weatherCode) || !Number.isFinite(temperature)) return null;

  return {
    scene: sceneForCode(weatherCode),
    temperature: Math.round(temperature),
    weatherCode,
    isDay: current.is_day === 1 || current.is_day === true,
    windSpeed: current.wind_speed_10m,
    // local wall-clock times at the requested location, e.g. "2026-01-01T18:52"
    time: current.time,
    sunrise: data.daily?.sunrise?.[0],
    sunset: data.daily?.sunset?.[0]
  };
}

router.get("/", async (req, res) => {
  const lat = coordinate(req.query.lat, SINGAPORE.lat);
  const lng = coordinate(req.query.lng, SINGAPORE.lng);
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    "&current=weather_code,temperature_2m,is_day,wind_speed_10m&daily=sunrise,sunset&timezone=auto";

  try {
    const upstream = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!upstream.ok) {
      res.json(FALLBACK);
      return;
    }
    res.json(fromForecast(await upstream.json()) ?? FALLBACK);
  } catch {
    // the window falls back to a neutral sky rather than breaking the room
    res.json(FALLBACK);
  }
});

export default router;
