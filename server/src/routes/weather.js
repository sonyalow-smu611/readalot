import { Router } from "express";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const lat = req.query.lat;
    const lng = req.query.lng;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&daily=sunrise,sunset&timezone=auto`;
    const response = await fetch(url);
    const data = await response.json();

    res.json({
      temperature: data.current_weather?.temperature,
      windSpeed: data.current_weather?.windspeed,
      weatherCode: data.current_weather?.weathercode,
      isDay: data.current_weather?.is_day !== 0,
      // local wall-clock times at the requested location, e.g. "2026-01-01T18:52"
      time: data.current_weather?.time,
      sunrise: data.daily?.sunrise?.[0],
      sunset: data.daily?.sunset?.[0]
    });
  } catch (err) {
    next(err);
  }
});

export default router;
