// pages/index.tsx
import { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartOptions } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

type WeatherData = {
  name: string;
  weather: { description: string; icon: string }[];
  main: { temp: number; feels_like: number; humidity: number };
  wind: { speed: number };
}

export default function HomePage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  const fetchWeatherByCoords = async (latitude: number, longitude: number) => {
    setLoading(true);
    setError(null);
    setWeather(null);

    try {
      const response = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
      const data = await response.json();

      if (response.ok) {
        setWeather(data);
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

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherByCoords(latitude, longitude);
          setLocationLoading(false);
        },
        (err: GeolocationPositionError) => {
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

  const calculateTemperaturePercentage = (temp: number | undefined): number | null => {
    if (temp === undefined) return null;

    const minTemp = -20;
    const maxTemp = 40;
    const range = maxTemp - minTemp;

    const clampedTemp = Math.max(minTemp, Math.min(maxTemp, temp));
    const percentage = ((clampedTemp - minTemp) / range) * 100;

    return Math.round(percentage);
  };

  const temperaturePercentage = calculateTemperaturePercentage(weather?.main.temp);

  const chartData = useMemo(() => {
    if (temperaturePercentage === null) return null;

    return {
      labels: [`현재 온도`],
      datasets: [
        {
          data: [temperaturePercentage, 100 - temperaturePercentage],
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(200, 200, 200, 0.6)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(200, 200, 200, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [temperaturePercentage]);

  const chartOptions: ChartOptions<'doughnut'> = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: temperaturePercentage !== null ? `현재 온도 (${weather?.main.temp}°C) 분포 (-20°C ~ 40°C 범위)` : '온도 분포',
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += context.parsed + '%';
            }
            return label;
          }
        }
      }
    },
    cutout: '60%',
  }), [temperaturePercentage, weather?.main.temp]);

  return (
    <div className='w-full flex flex-col'>
      <div className='flex flex-col mx-auto text-center border border-gray-300 w-[20rem]'>
        <h1 className='text-[2rem]'>날씨 대시보드</h1>

        <p>
          {locationLoading ? '위치 정보 확인 중...' : ''}
          {locationError && <span style={{ color: 'orange' }}>{locationError}</span>}
        </p>

        {loading && <p>날씨 정보를 불러오는 중...</p>}
        {error && <p style={{ color: 'red' }}>알수 없는 오류가 발생하였습니다.</p>}

        {weather && (
          <div>
            <h2>{weather.name}</h2>
            <p>현재 날씨: {weather.weather[0].description}</p>
            <p>
              온도: {weather.main.temp}°C
            </p>
            {chartData && chartOptions && (
              <div style={{ width: '200px', margin: '20px auto' }}>
                <Doughnut data={chartData} options={chartOptions} key={temperaturePercentage} />
              </div>
            )}
            <p>체감 온도: {weather.main.feels_like}°C</p>
            <p>습도: {weather.main.humidity}%</p>
            <p>풍속: {weather.wind.speed} m/s</p>

          </div>
        )}
      </div>
    </div>
  );
}
