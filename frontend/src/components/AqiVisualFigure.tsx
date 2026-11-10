import React, { useState } from 'react';
import type { AQICategory } from '../types';

export interface AqiFigureDetails {
  category: AQICategory;
  title: string;
  badge: string;
  description: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
}

/**
 * Returns descriptive health guidance and CPCB color palette for each AQI tier.
 */
export function getAqiFigureDetails(category: AQICategory | string | null | undefined): AqiFigureDetails {
  const norm = (category ?? '').toString().toLowerCase().trim().replace(/[\s_-]+/g, '');

  switch (norm) {
    case 'good':
      return {
        category: 'Good',
        title: 'Clear Skies & Clean Air',
        badge: '🏃 Safe for All Outdoor Sports',
        description: 'Air is fresh and pure. Ideal conditions for outdoor running, cycling, and aerating homes.',
        bgColor: '#009966',
        textColor: '#ffffff',
        accentColor: '#34d399',
      };
    case 'satisfactory':
      return {
        category: 'Satisfactory',
        title: 'Acceptable Air Quality',
        badge: '🚶 Enjoy Normal Outdoor Walks',
        description: 'Air quality is favorable. Minor discomfort only possible for hyper-sensitive individuals.',
        bgColor: '#55aa00',
        textColor: '#ffffff',
        accentColor: '#a3e635',
      };
    case 'moderate':
      return {
        category: 'Moderate',
        title: 'Sensitive Group Caution',
        badge: '⚠️ Sensitive Groups Limit Exertion',
        description: 'Asthmatic patients, cardiac patients, children, and elderly should limit heavy prolonged exertion.',
        bgColor: '#ffde33',
        textColor: '#111827',
        accentColor: '#fbbf24',
      };
    case 'poor':
      return {
        category: 'Poor',
        title: 'Unhealthy for Sensitive Groups',
        badge: '😷 N95 Mask Recommended Outdoors',
        description: 'Breathing discomfort to most people. Wear an N95 mask outdoors and avoid strenuous workouts.',
        bgColor: '#ff7e00',
        textColor: '#ffffff',
        accentColor: '#fb923c',
      };
    case 'verypoor':
      return {
        category: 'Very Poor',
        title: 'Hazardous Smog Alert',
        badge: '🏠 Keep Windows Shut & Purify Air',
        description: 'Respiratory distress on prolonged exposure. Avoid going outdoors; run an indoor air purifier.',
        bgColor: '#cc0033',
        textColor: '#ffffff',
        accentColor: '#f87171',
      };
    case 'severe':
    case 'hazardous':
      return {
        category: 'Severe',
        title: 'Emergency Health Hazard',
        badge: '🛑 Strictly Avoid Outdoor Exposure',
        description: 'Seriously affects healthy adults and inflicts severe damage on vulnerable individuals. Stay indoors.',
        bgColor: '#7e0023',
        textColor: '#ffffff',
        accentColor: '#fda4af',
      };
    default:
      return {
        category: 'Unknown' as any,
        title: 'Awaiting Air Telemetry',
        badge: 'ℹ️ Sensor Data Synchronizing',
        description: 'Station is calculating 24-hour CPCB pollutant sub-indices.',
        bgColor: '#9ca3af',
        textColor: '#ffffff',
        accentColor: '#cbd5e1',
      };
  }
}

/**
 * Resolves the user-provided illustration file from public/IMAGES/ based on CPCB AQI severity.
 */
export function getAqiImagePath(category: AQICategory | string | null | undefined): string {
  const norm = (category ?? '').toString().toLowerCase().trim().replace(/[\s_-]+/g, '');

  switch (norm) {
    case 'good':
      return '/IMAGES/good.png';
    case 'satisfactory':
      return '/IMAGES/satisfactory.png';
    case 'moderate':
      return '/IMAGES/moderate.png';
    case 'poor':
      return '/IMAGES/poor.png';
    case 'verypoor':
      return '/IMAGES/severe.png'; // Masked character in red hoodie
    case 'severe':
    case 'hazardous':
      return '/IMAGES/hazardous.png'; // Heavy respirator mask character
    default:
      return '/IMAGES/good.png';
  }
}

/**
 * Expressive character illustration component for AQI severity using public/IMAGES/ artwork.
 */
export function AqiVisualFigure({
  category,
  size = 'md',
  showDetails = true,
}: {
  category: AQICategory | string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}) {
  const details = getAqiFigureDetails(category);
  const imageSrc = getAqiImagePath(category);
  const [imgLoaded, setImgLoaded] = useState(false);

  const dims = {
    sm: { w: 90, h: 90 },
    md: { w: 140, h: 140 },
    lg: { w: 190, h: 190 },
  }[size];

  return (
    <div className="flex flex-col items-center text-center gap-2 select-none">
      {/* Illustrated Avatar Image with CPCB ambient glow */}
      <div
        className="relative flex items-center justify-center rounded-2xl p-2 overflow-hidden transition-all duration-300"
        style={{
          width: dims.w,
          height: dims.h,
          background: `radial-gradient(circle, ${details.bgColor}22 0%, transparent 75%)`,
        }}
      >
        <img
          src={imageSrc}
          alt={details.title}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-contain filter drop-shadow-md transition-all duration-300 hover:scale-105 ${
            imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          loading="lazy"
        />
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          </div>
        )}
      </div>

      {showDetails && (
        <div className="space-y-1.5 max-w-xs animate-in fade-in-50 duration-200">
          {/* Action badge */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs tracking-tight"
            style={{
              backgroundColor: details.bgColor,
              color: details.textColor,
            }}
          >
            <span>{details.badge}</span>
          </div>

          <div className="text-xs font-bold text-foreground">
            {details.title}
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed px-1">
            {details.description}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Draws the high-resolution character image onto the HTML5 Canvas for Social Share Card generation.
 */
export async function drawAqiFigureOnCanvas(
  ctx: CanvasRenderingContext2D,
  category: AQICategory | string | null | undefined,
  x: number,
  y: number,
  size: number
): Promise<void> {
  const imageSrc = getAqiImagePath(category);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Draw image centered in allocated bounding box with subtle padding
      const pad = 12;
      const targetSize = size - pad * 2;
      ctx.drawImage(img, x + pad, y + pad, targetSize, targetSize);
      resolve();
    };

    img.onerror = () => {
      // Graceful fallback if image load fails
      resolve();
    };

    img.src = imageSrc;
  });
}
