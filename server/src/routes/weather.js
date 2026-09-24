import { Router } from "express";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const lat = req.query.lat;
    const lng = req.query.lng;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;
    const response = await fetch(url);
    const data = await response.json();

    res.json({
      temperature: data.current_weather?.temperature,
      windSpeed: data.current_weather?.windspeed,
      weatherCode: data.current_weather?.weathercode
    });
  } catch (err) {
    next(err);
  }
});

export default router;
