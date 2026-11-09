import type { AQICategory } from '../types';
import { getAQIColorHex } from '../utils';

interface AQIGaugeProps {
  aqi: number | null;
  category: AQICategory | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function AQIGauge({ aqi, category, size = 'md', showLabel = true }: AQIGaugeProps) {
  const color = getAQIColorHex(category);
  const textColor = category === 'Moderate' ? '#1a1a1a' : '#ffffff';

  const sizes = {
    sm: { container: 80, font: 'text-xl', labelFont: 'text-xs' },
    md: { container: 140, font: 'text-4xl', labelFont: 'text-sm' },
    lg: { container: 200, font: 'text-6xl', labelFont: 'text-base' },
  };

  const { container, font, labelFont } = sizes[size];
  const radius = container / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const aqiPercent = Math.min((aqi ?? 0) / 500, 1);
  const dashOffset = circumference * (1 - aqiPercent * 0.75); // 75% arc

  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ width: container, height: container }} className="relative">
        <svg width={container} height={container} className="-rotate-[135deg]">
          {/* Background arc */}
          <circle
            cx={container / 2}
            cy={container / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={8}
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          />
          {/* Foreground arc */}
          <circle
            cx={container / 2}
            cy={container / 2}
            r={radius}
            fill="none"
            stroke={aqi !== null ? color : '#e5e7eb'}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeDashoffset={aqi !== null ? dashOffset - circumference * 0.75 : 0}
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`${font} font-bold`}
            style={{ color: aqi !== null ? color : '#9ca3af' }}
          >
            {aqi !== null ? aqi : '—'}
          </span>
          {showLabel && (
            <span className={`${labelFont} text-muted-foreground font-medium`}>AQI</span>
          )}
        </div>
      </div>

      {showLabel && category && (
        <span
          className={`px-4 py-1 rounded-full ${labelFont} font-semibold`}
          style={{ backgroundColor: color, color: textColor }}
        >
          {category}
        </span>
      )}
    </div>
  );
}

