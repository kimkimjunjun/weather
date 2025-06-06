// pages/index.tsx
import { useState, useEffect } from 'react';

type WeatherData = {
  name: string;
  weather: { description: string; icon: string }[];
  main: { temp: number; feels_like: number; humidity: number };
  wind: { speed: number };
}

export default function HomePage() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  // 위도, 경도로 날씨 정보를 가져오는 함수 (이전과 동일)
  const fetchWeatherByCoords = async (latitude: number, longitude: number) => {
    setLoading(true);
    setError(null);
    setWeather(null);

    try {
      const response = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
      const data = await response.json();

      if (response.ok) {
        setWeather(data);
        setCity('');
      } else {
        setError(data.message || '위치 기반 날씨 정보를 가져오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('날씨 정보를 가져오는 중 예상치 못한 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 도시 이름으로 날씨 정보를 가져오는 함수 (이전과 동일)
  const fetchWeatherByCity = async (cityName: string) => {
    if (!cityName) return;
    setLoading(true);
    setError(null);
    setWeather(null);

    try {
      const response = await fetch(`/api/weather?city=${cityName}`);
      const data = await response.json();

      if (response.ok) {
        setWeather(data);
      } else {
        setError(data.message || '도시 이름으로 날씨 정보를 가져오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('날씨 정보를 가져오는 중 예상치 못한 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 페이지 로딩 시 사용자 위치 정보를 가져와 날씨 표시 - 수정된 부분
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherByCoords(latitude, longitude);
          setLocationLoading(false);
        },
        (err: GeolocationPositionError) => { // 에러 타입을 명시해주면 더 좋습니다.
          console.error('Geolocation error:', err);
          let errorMessage = '위치 정보를 가져오는데 실패했습니다.';

          switch (err.code) {
            case GeolocationPositionError.PERMISSION_DENIED:
              errorMessage = '위치 정보 제공을 허용해주세요.';
              break;
            case GeolocationPositionError.POSITION_UNAVAILABLE:
              errorMessage = '사용 가능한 위치 정보가 없습니다.';
              break;
            case GeolocationPositionError.TIMEOUT:
              errorMessage = '위치 정보 요청 시간이 초과되었습니다.';
              break;
            default:
              errorMessage = `알 수 없는 위치 정보 오류가 발생했습니다. (코드: ${err.code})`;
              break;
          }

          setLocationError(errorMessage);
          setLocationLoading(false);
        }
      );
    } else {
      setLocationError('이 브라우저는 위치 정보 기능을 지원하지 않습니다.');
      setLocationLoading(false);
    }
  }, []);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWeatherByCity(city);
  };

  return (
    <div>
      <h1>날씨 대시보드</h1>

      <p>
        {locationLoading ? '위치 정보 확인 중...' : ''}
        {locationError && <span style={{ color: 'orange' }}>{locationError}</span>}
      </p>

      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="또는 도시 이름을 입력하세요 (예: Seoul)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          disabled={loading || locationLoading}
        />
        <button type="submit" disabled={loading || locationLoading}>날씨 검색</button>
      </form>

      {loading && <p>날씨 정보를 불러오는 중...</p>}
      {error && <p style={{ color: 'red' }}>오류: {error}</p>}

      {weather && (
        <div>
          <h2>{weather.name}</h2>
          <p>현재 날씨: {weather.weather[0].description}</p>
          <p>온도: {weather.main.temp}°C</p>
          <p>체감 온도: {weather.main.feels_like}°C</p>
          <p>습도: {weather.main.humidity}%</p>
          <p>풍속: {weather.wind.speed} m/s</p>
          <img src={`http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`} alt={weather.weather[0].description} />
        </div>
      )}
    </div>
  );
}
