import React from 'react';
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

export function getAqiFigureDetails(category: AQICategory | string | null | undefined): AqiFigureDetails {
  switch (category) {
    case 'Good':
      return {
        category: 'Good',
        title: 'Clear Skies & Clean Air',
        badge: '🏃 Safe for All Outdoor Sports',
        description: 'Air is fresh and pure. Ideal conditions for outdoor running, cycling, and aerating homes.',
        bgColor: '#009966',
        textColor: '#ffffff',
        accentColor: '#34d399',
      };
    case 'Satisfactory':
      return {
        category: 'Satisfactory',
        title: 'Acceptable Air Quality',
        badge: '🚶 Enjoy Normal Outdoor Walks',
        description: 'Air quality is favorable. Minor discomfort only possible for hyper-sensitive individuals.',
        bgColor: '#55aa00',
        textColor: '#ffffff',
        accentColor: '#a3e635',
      };
    case 'Moderate':
      return {
        category: 'Moderate',
        title: 'Sensitive Group Caution',
        badge: '⚠️ Sensitive Groups Limit Exertion',
        description: 'Asthmatic patients, cardiac patients, children, and elderly should limit heavy prolonged exertion.',
        bgColor: '#ffde33',
        textColor: '#111827',
        accentColor: '#fbbf24',
      };
    case 'Poor':
      return {
        category: 'Poor',
        title: 'Unhealthy for Sensitive Groups',
        badge: '😷 N95 Mask Recommended Outdoors',
        description: 'Breathing discomfort to most people. Wear an N95 mask outdoors and avoid strenuous workouts.',
        bgColor: '#ff7e00',
        textColor: '#ffffff',
        accentColor: '#fb923c',
      };
    case 'Very Poor':
      return {
        category: 'Very Poor',
        title: 'Hazardous Smog Alert',
        badge: '🏠 Keep Windows Shut & Purify Air',
        description: 'Respiratory distress on prolonged exposure. Avoid going outdoors; run an indoor air purifier.',
        bgColor: '#cc0033',
        textColor: '#ffffff',
        accentColor: '#f87171',
      };
    case 'Severe':
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
 * Visual SVG figures illustrating daily human life & recommended actions under each AQI level.
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
  const cat = details.category;

  const dims = {
    sm: { w: 100, h: 100 },
    md: { w: 150, h: 150 },
    lg: { w: 200, h: 200 },
  }[size];

  return (
    <div className="flex flex-col items-center text-center gap-2 select-none">
      <div
        className="relative flex items-center justify-center rounded-2xl p-2.5 overflow-hidden transition-all duration-300"
        style={{
          width: dims.w,
          height: dims.h,
          background: `radial-gradient(circle, ${details.bgColor}15 0%, transparent 75%)`,
        }}
      >
        <svg
          viewBox="0 0 160 160"
          className="w-full h-full drop-shadow-md overflow-visible"
        >
          {/* GOOD: Energetic Runner Figure in Fresh Clean Air */}
          {cat === 'Good' && (
            <g>
              {/* Sun & radiant rays */}
              <circle cx="120" cy="40" r="22" fill="#009966" opacity="0.15" />
              <circle cx="120" cy="40" r="14" fill="#009966" opacity="0.8" />
              {/* Fresh leaf */}
              <path
                d="M135 25 C145 20, 150 30, 145 40 C140 45, 130 40, 135 25 Z"
                fill="#34d399"
              />
              {/* Runner ground track */}
              <line x1="20" y1="135" x2="140" y2="135" stroke="#009966" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
              {/* Runner head */}
              <circle cx="70" cy="48" r="12" fill="#009966" />
              {/* Runner torso */}
              <path d="M70 60 L62 88" stroke="#009966" strokeWidth="8" strokeLinecap="round" />
              {/* Runner arms in athletic sprint */}
              <path d="M66 68 L48 78 L38 72" stroke="#009966" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M66 68 L84 76 L96 70" stroke="#009966" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              {/* Runner legs in full stride */}
              <path d="M62 88 L46 108 L34 130" stroke="#009966" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M62 88 L80 102 L98 112" stroke="#009966" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              {/* Fresh breeze swirls */}
              <path d="M22 60 Q32 55 42 60" stroke="#34d399" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M18 72 Q30 67 40 72" stroke="#34d399" strokeWidth="2" fill="none" strokeLinecap="round" />
            </g>
          )}

          {/* SATISFACTORY: Person casually walking in park */}
          {cat === 'Satisfactory' && (
            <g>
              {/* Soft sky dome */}
              <circle cx="80" cy="80" r="65" fill="#55aa00" opacity="0.08" />
              {/* Walker path */}
              <line x1="25" y1="135" x2="135" y2="135" stroke="#55aa00" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
              {/* Walker head */}
              <circle cx="75" cy="50" r="11" fill="#55aa00" />
              {/* Walker body */}
              <path d="M75 62 L75 92" stroke="#55aa00" strokeWidth="7" strokeLinecap="round" />
              {/* Walker arms relaxed */}
              <path d="M75 70 L60 85" stroke="#55aa00" strokeWidth="5" strokeLinecap="round" />
              <path d="M75 70 L90 85" stroke="#55aa00" strokeWidth="5" strokeLinecap="round" />
              {/* Walker legs in comfortable step */}
              <path d="M75 92 L64 114 L58 134" stroke="#55aa00" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M75 92 L86 112 L96 134" stroke="#55aa00" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              {/* Park tree silhouette */}
              <circle cx="120" cy="75" r="18" fill="#55aa00" opacity="0.25" />
              <line x1="120" y1="93" x2="120" y2="135" stroke="#55aa00" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
            </g>
          )}

          {/* MODERATE: Person pausing & caution alert */}
          {cat === 'Moderate' && (
            <g>
              {/* Amber warning halo */}
              <circle cx="80" cy="80" r="62" fill="#ffde33" opacity="0.12" />
              {/* Hazy sun */}
              <circle cx="125" cy="42" r="16" fill="#f59e0b" opacity="0.3" />
              <line x1="25" y1="135" x2="135" y2="135" stroke="#d97706" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
              {/* Person standing cautious */}
              <circle cx="68" cy="54" r="11" fill="#d97706" />
              <path d="M68 66 L68 96" stroke="#d97706" strokeWidth="7" strokeLinecap="round" />
              {/* Hand touching chest / coughing slightly */}
              <path d="M68 74 L52 82 L62 90" stroke="#d97706" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M68 74 L84 84" stroke="#d97706" strokeWidth="5" strokeLinecap="round" />
              {/* Legs standing still */}
              <path d="M68 96 L58 134" stroke="#d97706" strokeWidth="6" strokeLinecap="round" />
              <path d="M68 96 L78 134" stroke="#d97706" strokeWidth="6" strokeLinecap="round" />
              {/* Yellow warning triangle icon */}
              <polygon points="120,70 138,102 102,102" fill="#ffde33" stroke="#d97706" strokeWidth="2.5" />
              <text x="120" y="96" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#111827">!</text>
            </g>
          )}

          {/* POOR: Commuter wearing N95 mask in smog */}
          {cat === 'Poor' && (
            <g>
              {/* Smog haze waves */}
              <path d="M20 40 Q50 35 80 40 T140 40" stroke="#ff7e00" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
              <path d="M15 60 Q55 55 95 60 T145 60" stroke="#ff7e00" strokeWidth="3" strokeLinecap="round" opacity="0.25" />
              <path d="M25 80 Q65 75 105 80 T145 80" stroke="#ff7e00" strokeWidth="3" strokeLinecap="round" opacity="0.2" />
              {/* Ground */}
              <line x1="25" y1="135" x2="135" y2="135" stroke="#ff7e00" strokeWidth="3" opacity="0.4" />
              {/* Commuter head */}
              <circle cx="75" cy="52" r="12" fill="#ff7e00" />
              {/* N95 Respirator Mask on face */}
              <path d="M72 52 L87 56 L83 63 L70 60 Z" fill="#ffffff" stroke="#ea580c" strokeWidth="1.5" />
              <line x1="72" y1="53" x2="68" y2="52" stroke="#ea580c" strokeWidth="1.5" />
              <line x1="70" y1="60" x2="68" y2="58" stroke="#ea580c" strokeWidth="1.5" />
              {/* Commuter body walking with coat */}
              <path d="M75 64 L75 96" stroke="#ff7e00" strokeWidth="8" strokeLinecap="round" />
              <path d="M75 74 L60 92" stroke="#ff7e00" strokeWidth="5" strokeLinecap="round" />
              <path d="M75 74 L88 88" stroke="#ff7e00" strokeWidth="5" strokeLinecap="round" />
              <path d="M75 96 L65 134" stroke="#ff7e00" strokeWidth="6" strokeLinecap="round" />
              <path d="M75 96 L85 134" stroke="#ff7e00" strokeWidth="6" strokeLinecap="round" />
              {/* Airborne PM particles */}
              <circle cx="35" cy="50" r="2" fill="#ff7e00" opacity="0.7" />
              <circle cx="45" cy="95" r="2.5" fill="#ff7e00" opacity="0.7" />
              <circle cx="115" cy="70" r="2" fill="#ff7e00" opacity="0.7" />
              <circle cx="125" cy="110" r="2.5" fill="#ff7e00" opacity="0.7" />
            </g>
          )}

          {/* VERY POOR: Person strictly indoors with air purifier */}
          {cat === 'Very Poor' && (
            <g>
              {/* House / Indoor chamber boundary */}
              <path d="M30 65 L80 30 L130 65 L130 135 L30 135 Z" fill="#cc0033" opacity="0.1" stroke="#cc0033" strokeWidth="2.5" />
              {/* Roof line */}
              <path d="M24 68 L80 25 L136 68" stroke="#cc0033" strokeWidth="4" strokeLinecap="round" fill="none" />
              {/* Window locked */}
              <rect x="95" y="70" width="24" height="24" rx="2" fill="#ffffff" stroke="#cc0033" strokeWidth="1.5" />
              <line x1="107" y1="70" x2="107" y2="94" stroke="#cc0033" strokeWidth="1" />
              <line x1="95" y1="82" x2="119" y2="82" stroke="#cc0033" strokeWidth="1" />
              {/* Air Purifier Machine inside house */}
              <rect x="42" y="90" width="18" height="38" rx="4" fill="#ffffff" stroke="#cc0033" strokeWidth="2" />
              <circle cx="51" cy="98" r="3" fill="#22c55e" />
              <line x1="46" y1="108" x2="56" y2="108" stroke="#cc0033" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="46" y1="114" x2="56" y2="114" stroke="#cc0033" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="46" y1="120" x2="56" y2="120" stroke="#cc0033" strokeWidth="1.5" strokeLinecap="round" />
              {/* Clean air stream from purifier */}
              <path d="M51 86 Q55 78 65 76" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* Person safely standing inside */}
              <circle cx="75" cy="80" r="8" fill="#cc0033" />
              <path d="M75 88 L75 112" stroke="#cc0033" strokeWidth="5" strokeLinecap="round" />
              <path d="M75 112 L68 135" stroke="#cc0033" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M75 112 L82 135" stroke="#cc0033" strokeWidth="4.5" strokeLinecap="round" />
            </g>
          )}

          {/* SEVERE: Emergency Hazard alert & heavy protection */}
          {cat === 'Severe' && (
            <g>
              {/* Hazard shield boundary */}
              <path
                d="M80 18 L135 38 C135 90, 80 142, 80 142 C80 142, 25 90, 25 38 Z"
                fill="#7e0023"
                opacity="0.15"
                stroke="#7e0023"
                strokeWidth="3"
              />
              {/* Emergency respirator symbol */}
              <circle cx="80" cy="62" r="16" fill="#7e0023" />
              {/* Respirator gas filters */}
              <ellipse cx="64" cy="76" rx="8" ry="6" fill="#ffffff" stroke="#7e0023" strokeWidth="2" />
              <ellipse cx="96" cy="76" rx="8" ry="6" fill="#ffffff" stroke="#7e0023" strokeWidth="2" />
              <circle cx="80" cy="74" r="5" fill="#ffffff" stroke="#7e0023" strokeWidth="2" />
              {/* Emergency exclamation badge */}
              <rect x="76" y="98" width="8" height="20" rx="3" fill="#dc2626" />
              <circle cx="80" cy="126" r="4.5" fill="#dc2626" />
              {/* Dense toxic particle cloud */}
              <circle cx="36" cy="35" r="3.5" fill="#7e0023" opacity="0.6" />
              <circle cx="124" cy="45" r="4" fill="#7e0023" opacity="0.6" />
              <circle cx="130" cy="95" r="3" fill="#7e0023" opacity="0.6" />
              <circle cx="30" cy="85" r="4" fill="#7e0023" opacity="0.6" />
            </g>
          )}

          {/* UNKNOWN: Radar / Satellite Search */}
          {cat === 'Unknown' && (
            <g>
              <circle cx="80" cy="80" r="55" fill="#9ca3af" opacity="0.1" stroke="#9ca3af" strokeWidth="2" strokeDasharray="4 4" />
              <circle cx="80" cy="80" r="32" fill="#9ca3af" opacity="0.15" stroke="#9ca3af" strokeWidth="2" />
              <circle cx="80" cy="80" r="8" fill="#9ca3af" />
              <line x1="80" y1="80" x2="115" y2="45" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}
        </svg>
      </div>

      {showDetails && (
        <div className="space-y-1">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs"
            style={{ backgroundColor: details.bgColor, color: details.textColor }}
          >
            <span>{details.badge}</span>
          </div>
          <p className="text-[11px] text-muted-foreground max-w-xs leading-snug">
            {details.description}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Draws the expressive visual figure directly on HTML5 Canvas for high-res social image exports.
 */
export function drawAqiFigureOnCanvas(
  ctx: CanvasRenderingContext2D,
  category: AQICategory | string | null | undefined,
  x: number,
  y: number,
  boxSize: number
) {
  const details = getAqiFigureDetails(category);
  const cat = details.category;

  ctx.save();
  ctx.translate(x, y);

  // Background ambient circle
  ctx.fillStyle = details.bgColor;
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.arc(boxSize / 2, boxSize / 2, boxSize * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  const scale = boxSize / 160;
  ctx.scale(scale, scale);

  if (cat === 'Good') {
    // Sun
    ctx.fillStyle = '#009966';
    ctx.beginPath();
    ctx.arc(120, 40, 14, 0, Math.PI * 2);
    ctx.fill();
    // Track
    ctx.strokeStyle = '#009966';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, 135);
    ctx.lineTo(140, 135);
    ctx.stroke();
    // Runner Head
    ctx.beginPath();
    ctx.arc(70, 48, 12, 0, Math.PI * 2);
    ctx.fill();
    // Torso & limbs
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(70, 60);
    ctx.lineTo(62, 88);
    ctx.stroke();
    // Arms
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(66, 68);
    ctx.lineTo(48, 78);
    ctx.lineTo(38, 72);
    ctx.moveTo(66, 68);
    ctx.lineTo(84, 76);
    ctx.lineTo(96, 70);
    ctx.stroke();
    // Legs
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(62, 88);
    ctx.lineTo(46, 108);
    ctx.lineTo(34, 130);
    ctx.moveTo(62, 88);
    ctx.lineTo(80, 102);
    ctx.lineTo(98, 112);
    ctx.stroke();
  } else if (cat === 'Satisfactory') {
    ctx.fillStyle = '#55aa00';
    ctx.strokeStyle = '#55aa00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(25, 135);
    ctx.lineTo(135, 135);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(75, 50, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(75, 62);
    ctx.lineTo(75, 92);
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(75, 70);
    ctx.lineTo(60, 85);
    ctx.moveTo(75, 70);
    ctx.lineTo(90, 85);
    ctx.stroke();
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(75, 92);
    ctx.lineTo(64, 114);
    ctx.lineTo(58, 134);
    ctx.moveTo(75, 92);
    ctx.lineTo(86, 112);
    ctx.lineTo(96, 134);
    ctx.stroke();
  } else if (cat === 'Moderate') {
    ctx.fillStyle = '#d97706';
    ctx.strokeStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(68, 54, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(68, 66);
    ctx.lineTo(68, 96);
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(68, 74);
    ctx.lineTo(52, 82);
    ctx.lineTo(62, 90);
    ctx.moveTo(68, 74);
    ctx.lineTo(84, 84);
    ctx.stroke();
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(68, 96);
    ctx.lineTo(58, 134);
    ctx.moveTo(68, 96);
    ctx.lineTo(78, 134);
    ctx.stroke();
    // Warning icon
    ctx.fillStyle = '#ffde33';
    ctx.beginPath();
    ctx.moveTo(120, 70);
    ctx.lineTo(138, 102);
    ctx.lineTo(102, 102);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (cat === 'Poor') {
    ctx.fillStyle = '#ff7e00';
    ctx.strokeStyle = '#ff7e00';
    // Head
    ctx.beginPath();
    ctx.arc(75, 52, 12, 0, Math.PI * 2);
    ctx.fill();
    // N95 Mask
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(72, 52);
    ctx.lineTo(87, 56);
    ctx.lineTo(83, 63);
    ctx.lineTo(70, 60);
    ctx.closePath();
    ctx.fill();
    // Body
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(75, 64);
    ctx.lineTo(75, 96);
    ctx.stroke();
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(75, 96);
    ctx.lineTo(65, 134);
    ctx.moveTo(75, 96);
    ctx.lineTo(85, 134);
    ctx.stroke();
  } else if (cat === 'Very Poor') {
    // Indoor shelter
    ctx.strokeStyle = '#cc0033';
    ctx.lineWidth = 3;
    ctx.strokeRect(34, 65, 92, 70);
    // Purifier
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(44, 90, 18, 38);
    ctx.strokeRect(44, 90, 18, 38);
    // Person indoors
    ctx.fillStyle = '#cc0033';
    ctx.beginPath();
    ctx.arc(80, 80, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(80, 88);
    ctx.lineTo(80, 112);
    ctx.stroke();
  } else if (cat === 'Severe') {
    // Hazard Shield
    ctx.fillStyle = '#7e0023';
    ctx.strokeStyle = '#7e0023';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, 20);
    ctx.lineTo(135, 40);
    ctx.quadraticCurveTo(135, 95, 80, 140);
    ctx.quadraticCurveTo(25, 95, 25, 40);
    ctx.closePath();
    ctx.stroke();
    // Respirator mask
    ctx.beginPath();
    ctx.arc(80, 62, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(64, 76, 7, 0, Math.PI * 2);
    ctx.arc(96, 76, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

