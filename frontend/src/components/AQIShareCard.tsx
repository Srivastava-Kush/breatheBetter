import { useRef, useState } from 'react';
import { Share2, Download, Copy, Check, X } from 'lucide-react';
import { Button } from './ui/Button';
import { getAQIColorHex } from '../utils';
import type { DashboardData, AQICategory } from '../types';

interface AQIShareCardProps {
  dashboard: DashboardData;
}

export function AQIShareCard({ dashboard }: AQIShareCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const locName = dashboard.location.name;
  const aqiVal = dashboard.aqi?.value ?? 'N/A';
  const aqiCat = (dashboard.aqi?.category ?? 'Unknown') as AQICategory;
  const aqiColor = getAQIColorHex(aqiCat);
  const dominant = dashboard.aqi?.dominantPollutant?.toUpperCase() ?? 'PM2.5';
  const pm25 = dashboard.pollutants?.['pm25']?.value?.toFixed(1) ?? '—';
  const pm10 = dashboard.pollutants?.['pm10']?.value?.toFixed(1) ?? '—';

  const generateCanvasImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 1200, 630);
    bgGradient.addColorStop(0, '#0a1d16');
    bgGradient.addColorStop(1, '#05110d');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Accent header line
    ctx.fillStyle = aqiColor;
    ctx.fillRect(0, 0, 1200, 12);

    // Brand tag
    ctx.fillStyle = '#22a370';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillText('🍃 BreatheBetter', 60, 75);

    ctx.fillStyle = '#7a9e90';
    ctx.font = '18px Inter, sans-serif';
    ctx.fillText('Real-Time Air Quality Intelligence', 60, 105);

    // Station Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px Inter, sans-serif';
    const cleanName = locName.length > 35 ? locName.substring(0, 35) + '...' : locName;
    ctx.fillText(cleanName, 60, 190);

    ctx.fillStyle = '#9cb5aa';
    ctx.font = '22px Inter, sans-serif';
    ctx.fillText(dashboard.location.locality ? `${dashboard.location.locality}, India` : 'India', 60, 225);

    // AQI Pill box
    ctx.fillStyle = aqiColor;
    ctx.beginPath();
    ctx.roundRect(60, 270, 480, 220, 24);
    ctx.fill();

    // AQI Value inside box
    ctx.fillStyle = aqiCat === 'Moderate' ? '#111827' : '#ffffff';
    ctx.font = 'bold 110px Inter, sans-serif';
    ctx.fillText(String(aqiVal), 90, 390);

    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillText(aqiCat, 90, 455);

    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText('CPCB AQI', 400, 340);

    // Pollutants side panel
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.roundRect(580, 270, 560, 220, 24);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText('KEY READINGS', 620, 315);

    ctx.font = '18px Inter, sans-serif';
    ctx.fillStyle = '#a8c2b7';
    ctx.fillText('PM2.5 (Fine Particles):', 620, 365);
    ctx.fillText('PM10 (Coarse Dust):', 620, 410);
    ctx.fillText('Dominant Pollutant:', 620, 455);

    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${pm25} µg/m³`, 920, 365);
    ctx.fillText(`${pm10} µg/m³`, 920, 410);
    ctx.fillText(dominant, 920, 455);

    // Footer
    ctx.fillStyle = '#65867a';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText(
      `Calculated using CPCB National AQI methodology · Ground data: OpenAQ · ${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' })}`,
      60,
      570
    );

    // Trigger download
    const link = document.createElement('a');
    link.download = `BreatheBetter-AQI-${locName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const copyShareText = () => {
    const text = `Air Quality at ${locName}: AQI ${aqiVal} (${aqiCat}). Dominant pollutant: ${dominant}. Check live air quality and health guidance on BreatheBetter: http://localhost:5173`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Share2 className="w-4 h-4 mr-1 text-primary" />
        Share AQI Card
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">Share Air Quality Card</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Card Preview */}
            <div
              className="p-5 rounded-xl text-white space-y-4 shadow-inner"
              style={{
                background: 'linear-gradient(135deg, #0a1d16 0%, #05110d 100%)',
                borderTop: `6px solid ${aqiColor}`,
              }}
            >
              <div className="flex items-center justify-between text-xs text-emerald-400">
                <span className="font-semibold tracking-wider uppercase">🍃 BreatheBetter</span>
                <span>Live Intelligence</span>
              </div>

              <div>
                <div className="text-xl font-bold text-white line-clamp-1">{locName}</div>
                <div className="text-xs text-gray-400">{dashboard.location.locality || 'India'}</div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div
                  className="px-4 py-3 rounded-xl flex items-baseline gap-2 shadow-md"
                  style={{
                    backgroundColor: aqiColor,
                    color: aqiCat === 'Moderate' ? '#111827' : '#ffffff',
                  }}
                >
                  <span className="text-4xl font-extrabold">{aqiVal}</span>
                  <span className="text-sm font-semibold">{aqiCat}</span>
                </div>

                <div className="text-right text-xs space-y-0.5 text-gray-300">
                  <div>PM2.5: <strong className="text-white">{pm25} µg/m³</strong></div>
                  <div>PM10: <strong className="text-white">{pm10} µg/m³</strong></div>
                  <div>Dominant: <strong className="text-white">{dominant}</strong></div>
                </div>
              </div>

              <div className="text-[10px] text-gray-400 pt-1 border-t border-white/10 flex justify-between">
                <span>Calculated using CPCB methodology</span>
                <span>OpenAQ</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button onClick={generateCanvasImage} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download PNG Image
              </Button>
              <Button variant="outline" onClick={copyShareText}>
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span className="ml-2">{copied ? 'Copied!' : 'Copy Text'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
