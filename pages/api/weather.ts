// pages/api/weather.ts
import type { NextApiRequest, NextApiResponse } from 'next';

type WeatherData = {
  name: string;
  weather: { description: string; icon: string }[];
  main: { temp: number; feels_like: number; humidity: number };
  wind: { speed: number };
  cod: number; // HTTP status code from OpenWeatherMap
  message?: string; // Error message from OpenWeatherMap
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
    // 위도, 경도로 검색 (위치 정보 기반)
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr`;
  } else if (city && typeof city === 'string') {
    // 도시 이름으로 검색 (기존 기능)
    url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=kr`;
  } else {
    // 필요한 파라미터가 없을 경우
    return res.status(400).json({ message: 'City or latitude/longitude query parameters are required' });
  }

  try {
    const response = await fetch(url);
    const data: WeatherData = await response.json();

    // OpenWeatherMap API 응답 코드 확인
    // 성공 시 200, 오류 시 다른 코드 (예: 401, 404 등) 반환
    if (data.cod && data.cod !== 200) {
      // OpenWeatherMap에서 받은 오류 메시지를 포함하여 반환
      return res.status(data.cod).json({ message: data.message || `OpenWeatherMap API Error: ${data.cod}` });
    }

    res.status(200).json(data);

  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ message: 'Internal Server Error or Network Issue' });
  }
}
