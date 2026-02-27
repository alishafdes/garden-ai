import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface WeatherResponse {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  weatherDescription: string;
  isRainy: boolean;
  wateringAdjustment: string;
  wateringFactor: number;
  location: string;
}

const weatherCodeDescriptions: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

function getWateringRecommendation(precipitation: number, temperature: number, humidity: number): { adjustment: string; factor: number } {
  // If it rained significantly, reduce watering
  if (precipitation > 10) {
    return { adjustment: "Skip watering today — heavy rain has your garden covered! 🌧️", factor: 0 };
  }
  if (precipitation > 5) {
    return { adjustment: "Light watering only — recent rain helped. 🌦️", factor: 0.3 };
  }
  if (precipitation > 1) {
    return { adjustment: "Reduce watering by half — some rain today. 💧", factor: 0.5 };
  }

  // Hot and dry conditions
  if (temperature > 32 && humidity < 40) {
    return { adjustment: "Water extra today — hot and dry conditions! 🔥", factor: 1.5 };
  }
  if (temperature > 28 && humidity < 50) {
    return { adjustment: "Consider extra watering — warm day ahead. ☀️", factor: 1.25 };
  }

  // Cool/humid conditions
  if (temperature < 10) {
    return { adjustment: "Reduce watering — cool temperatures slow evaporation. 🍂", factor: 0.5 };
  }
  if (humidity > 80) {
    return { adjustment: "Light watering — high humidity reduces needs. 💨", factor: 0.7 };
  }

  return { adjustment: "Normal watering schedule today. 🌱", factor: 1.0 };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { zip_code } = await req.json();
    if (!zip_code) {
      return new Response(JSON.stringify({ error: "zip_code is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Geocode the zip code using Nominatim (free, no key)
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zip_code)}&country=US&format=json&limit=1`,
      { headers: { "User-Agent": "EmpathenticGardener/1.0" } }
    );
    const geoData = await geoRes.json();

    if (!geoData || geoData.length === 0) {
      return new Response(JSON.stringify({ error: "Could not find location for this zip code" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { lat, lon, display_name } = geoData[0];
    const locationParts = display_name.split(",");
    const locationLabel = locationParts.length >= 2 
      ? `${locationParts[0].trim()}, ${locationParts[1].trim()}`
      : locationParts[0].trim();

    // Fetch weather from Open-Meteo (free, no key)
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&temperature_unit=celsius&timezone=auto`
    );
    const weatherData = await weatherRes.json();

    if (!weatherData.current) {
      return new Response(JSON.stringify({ error: "Weather data unavailable" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const current = weatherData.current;
    const temp = current.temperature_2m;
    const humidity = current.relative_humidity_2m;
    const precip = current.precipitation;
    const windSpeed = current.wind_speed_10m;
    const code = current.weather_code;
    const isRainy = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code);
    const { adjustment, factor } = getWateringRecommendation(precip, temp, humidity);

    const result: WeatherResponse = {
      temperature: Math.round(temp),
      humidity,
      precipitation: precip,
      windSpeed: Math.round(windSpeed),
      weatherCode: code,
      weatherDescription: weatherCodeDescriptions[code] || "Unknown",
      isRainy,
      wateringAdjustment: adjustment,
      wateringFactor: factor,
      location: locationLabel,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Weather function error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
