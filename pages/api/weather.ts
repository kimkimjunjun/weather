import type { NextApiRequest, NextApiResponse } from 'next';

type WeatherData = {
  name: string;
  weather: { description: string; icon: string }[];
  main: { temp: number; feels_like: number; humidity: number };
  wind: { speed: number };
  cod: number;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WeatherData | { message: string }>
) {
  const { city, lat, lon } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: 'API Key not configured' });
  }

  let url = '';
  if (lat && lon && typeof lat === 'string' && typeof lon === 'string') {
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr`;
  } else if (city && typeof city === 'string') {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=kr`;
  } else {
    return res.status(400).json({ message: 'City or latitude/longitude query parameters are required' });
  }

  try {
    const response = await fetch(url);
    const data: WeatherData = await response.json();

    if (data.cod && data.cod !== 200) {
      return res.status(data.cod).json({ message: data.message || `OpenWeatherMap API Error: ${data.cod}` });
    }

    res.status(200).json(data);

  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ message: 'Internal Server Error or Network Issue' });
  }
}
