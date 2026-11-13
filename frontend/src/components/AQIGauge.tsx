import { useState, useEffect } from 'react';
import type { AQICategory } from '../types';
import { getAQIColorHex } from '../utils';

interface AQIGaugeProps {
  aqi: number | null;
  category: AQICategory | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

// CPCB Breakpoints and their normalized arc angles
const CPCB_SEGMENTS = [
  { label: 'Good', max: 50, color: '#009966' },
  { label: 'Satisfactory', max: 100, color: '#55aa00' },
  { label: 'Moderate', max: 200, color: '#ffde33' },
  { label: 'Poor', max: 300, color: '#ff7e00' },
  { label: 'Very Poor', max: 400, color: '#cc0033' },
  { label: 'Severe', max: 500, color: '#7e0023' },
];

export function AQIGauge({ aqi, category, size = 'md', showLabel = true }: AQIGaugeProps) {
  const color = getAQIColorHex(category);
  const textColor = category === 'Moderate' ? '#1a1a1a' : '#ffffff';

  // Animated number counter
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    if (aqi === null || isNaN(aqi)) {
      setDisplayValue(0);
      return;
    }

    const startValue = displayValue;
    const endValue = aqi;
    const duration = 900; // ms
    const startTime = performance.now();

    let animationFrameId: number;

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * easeOut);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCounter);
      }
    };

    animationFrameId = requestAnimationFrame(updateCounter);

    return () => cancelAnimationFrame(animationFrameId);
  }, [aqi]);

  const sizes = {
    sm: { container: 90, stroke: 8, font: 'text-2xl', labelFont: 'text-[10px]', beadR: 5 },
    md: { container: 160, stroke: 12, font: 'text-4xl', labelFont: 'text-xs', beadR: 6 },
    lg: { container: 220, stroke: 16, font: 'text-6xl', labelFont: 'text-sm', beadR: 8 },
  };

  const { container, stroke, font, labelFont, beadR } = sizes[size];
  const radius = container / 2 - stroke - 4;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270 degree arc

  // Normalized percent bounded 0 to 1
  const aqiPercent = Math.min(Math.max((aqi ?? 0) / 500, 0), 1);
  const strokeDashoffset = arcLength * (1 - aqiPercent);

  // Calculate coordinates for the glowing tip bead
  // Base rotation is -225 deg (or 135 deg to 405 deg)
  const angleRad = (135 + aqiPercent * 270) * (Math.PI / 180);
  const cx = container / 2;
  const cy = container / 2;
  const beadX = cx + radius * Math.cos(angleRad);
  const beadY = cy + radius * Math.sin(angleRad);

  return (
    <div className="flex flex-col items-center gap-2.5 select-none">
      <div
        style={{ width: container, height: container }}
        className="relative flex items-center justify-center group"
      >
        {/* Ambient radial glow backdrop */}
        <div
          className="absolute inset-2 rounded-full opacity-20 blur-xl transition-all duration-700 pointer-events-none"
          style={{ backgroundColor: aqi !== null ? color : 'transparent' }}
        />

        <svg width={container} height={container} className="relative z-10 overflow-visible">
          <defs>
            {/* Dynamic Drop Shadow Filter for Active Arc */}
            <filter id={`gauge-glow-${size}`} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={color} floodOpacity="0.45" />
            </filter>

            {/* Gradient Arc Definition */}
            <linearGradient id={`gauge-grad-${size}`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#009966" />
              <stop offset="25%" stopColor="#ffde33" />
              <stop offset="60%" stopColor="#ff7e00" />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
          </defs>

          {/* Background Track (270 degree arc from 135 to 405 deg) */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="var(--gauge-track, #e2e8f0)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            transform={`rotate(135 ${cx} ${cy})`}
          />

          {/* CPCB Scale Reference Tick Marks */}
          {CPCB_SEGMENTS.map((seg) => {
            const segPercent = seg.max / 500;
            const segAngle = (135 + segPercent * 270) * (Math.PI / 180);
            const tickInnerR = radius - stroke / 2 - 2;
            const tickOuterR = radius + stroke / 2 + 2;
            const x1 = cx + tickInnerR * Math.cos(segAngle);
            const y1 = cy + tickInnerR * Math.sin(segAngle);
            const x2 = cx + tickOuterR * Math.cos(segAngle);
            const y2 = cy + tickOuterR * Math.sin(segAngle);
            return (
              <line
                key={seg.label}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--gauge-tick, #94a3b8)"
                strokeWidth={1.5}
                strokeOpacity={0.65}
              />
            );
          })}

          {/* Active Animated Progress Arc */}
          {aqi !== null && (
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={stroke + 2}
              strokeLinecap="round"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(135 ${cx} ${cy})`}
              filter={`url(#gauge-glow-${size})`}
              style={{
                transition: 'stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.5s ease',
              }}
            />
          )}

          {/* Glowing Head Bead */}
          {aqi !== null && aqi > 0 && (
            <g className="transition-all duration-700">
              {/* Outer pulsing ring */}
              <circle
                cx={beadX}
                cy={beadY}
                r={beadR + 3}
                fill={color}
                opacity={0.35}
                className="animate-ping"
                style={{ animationDuration: '2.5s' }}
              />
              {/* Solid inner core */}
              <circle
                cx={beadX}
                cy={beadY}
                r={beadR}
                fill="#ffffff"
                stroke={color}
                strokeWidth={3}
                className="shadow-sm"
              />
            </g>
          )}
        </svg>

        {/* Center Numerical Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
          <span
            className={`${font} font-extrabold tracking-tight transition-colors duration-500`}
            style={{ color: aqi !== null ? color : '#94a3b8' }}
          >
            {aqi !== null ? displayValue : '—'}
          </span>
          {showLabel && (
            <span className={`${labelFont} text-muted-foreground/80 font-bold uppercase tracking-wider -mt-0.5`}>
              CPCB AQI
            </span>
          )}
        </div>
      </div>

      {/* Category Pill with Smooth Pulse */}
      {showLabel && category && (
        <div className="flex items-center gap-1.5">
          <span
            className={`px-3.5 py-1 rounded-full ${labelFont} font-bold shadow-xs transition-all duration-300 flex items-center gap-1.5`}
            style={{ backgroundColor: color, color: textColor }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-current opacity-80 animate-pulse"
            />
            {category}
          </span>
        </div>
      )}
    </div>
  );
}
