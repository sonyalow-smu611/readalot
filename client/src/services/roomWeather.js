// Picks which illustration shows outside the room's window.

export const SCENES = ["sun", "cloud", "rain", "night", "golden"];

const SCENE_LABELS = {
  sun: "Sunny",
  cloud: "Cloudy",
  rain: "Rain",
  night: "Night",
  golden: "Golden hour"
};

// WMO weather codes as returned by Open-Meteo
const isRain = (code) => (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
const isCloud = (code) => [2, 3, 45, 48].includes(code) || (code >= 71 && code <= 77) || code === 85 || code === 86;

// "2026-01-01T18:52" -> minutes since midnight
function minutes(stamp) {
  const match = /T(\d{2}):(\d{2})/.exec(stamp || "");
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function pickScene(weather, now = new Date()) {
  const clock = minutes(weather?.time) ?? now.getHours() * 60 + now.getMinutes();
  const sunrise = minutes(weather?.sunrise) ?? 6 * 60 + 45;
  const sunset = minutes(weather?.sunset) ?? 19 * 60;

  const isDay = weather?.isDay ?? (clock >= sunrise && clock < sunset);
  const golden =
    (clock >= sunset - 50 && clock <= sunset + 20) || (clock >= sunrise - 15 && clock <= sunrise + 35);

  let scene = "sun";
  if (weather && isRain(weather.weatherCode)) scene = "rain";
  else if (golden) scene = "golden";
  else if (!isDay) scene = "night";
  else if (weather && isCloud(weather.weatherCode)) scene = "cloud";

  return describeScene(scene, { dark: !isDay && !golden, temperature: weather?.temperature });
}

export function describeScene(scene, { dark = scene === "night", temperature } = {}) {
  const degrees = Number.isFinite(temperature) ? ` · ${Math.round(temperature)}°C` : "";
  return { scene, dark, label: `${SCENE_LABELS[scene]}${degrees}` };
}
