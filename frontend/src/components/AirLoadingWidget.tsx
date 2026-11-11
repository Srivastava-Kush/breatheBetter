import React, { useState, useEffect } from 'react';
import { Wind, Sparkles, Activity, MapPin, Compass, ShieldCheck } from 'lucide-react';

export interface AirLoadingWidgetProps {
  variant?: 'fullscreen' | 'card' | 'inline' | 'compact';
  title?: string;
  subtitle?: string;
  stationName?: string;
  messages?: string[];
  className?: string;
}

const DEFAULT_MESSAGES = [
  'Sampling official CPCB ground telemetry network...',
  'Calibrating criteria pollutants (PM2.5, PM10, NO₂, SO₂, CO, O₃)...',
  'Harmonizing statutory CPCB severity breakpoints...',
  'Analyzing microclimatic atmospheric boundary layer...',
];

export function AirLoadingWidget({
  variant = 'card',
  title,
  subtitle,
  stationName,
  messages = DEFAULT_MESSAGES,
  className = '',
}: AirLoadingWidgetProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!messages || messages.length <= 1) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [messages]);

  const activeMessage = messages[msgIndex] || messages[0];

  // 1. COMPACT VARIANT (for small bars, buttons, list rows)
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-card/90 border border-border shadow-xs ${className}`}>
        <div className="relative w-4 h-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
          <Wind className="w-3.5 h-3.5 text-primary animate-air-breathe" />
        </div>
        <span className="text-xs font-medium text-foreground">
          {title || activeMessage}
        </span>
      </div>
    );
  }

  // 2. INLINE VARIANT (for drawers, search panels, inner tabs)
  if (variant === 'inline') {
    return (
      <div className={`py-8 px-4 flex flex-col items-center justify-center text-center gap-3 ${className}`}>
        {/* Breathing Air Ring */}
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/15 animate-air-aura" />
          <div className="absolute inset-1 rounded-full border border-dashed border-emerald-500/40 animate-air-orbit" />
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md animate-air-breathe">
            <Wind className="w-5 h-5 text-white animate-pulse" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-1 max-w-sm">
          <div className="text-xs font-bold text-foreground">
            {title || 'Querying Ground Station Telemetry'}
          </div>
          <p className="text-[11px] text-muted-foreground transition-opacity duration-300">
            {subtitle || activeMessage}
          </p>
        </div>

        {/* Mini progress bar */}
        <div className="h-1 w-32 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 rounded-full animate-air-wave" />
        </div>
      </div>
    );
  }

  // 3. CARD VARIANT (for Diurnal matrix, Analytics charts, Forecast cards)
  if (variant === 'card') {
    return (
      <div
        className={`p-8 rounded-2xl border border-border/80 bg-gradient-to-b from-card to-muted/20 flex flex-col items-center justify-center text-center gap-4 min-h-[260px] shadow-xs relative overflow-hidden ${className}`}
      >
        {/* Subtle background atmospheric gradient glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/[0.04] rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-teal-500/[0.04] rounded-full blur-2xl pointer-events-none" />

        {/* Multi-ring Breathing Animation */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Outermost expanding pulse aura */}
          <div className="absolute inset-0 rounded-full bg-emerald-500/15 animate-air-aura" />
          {/* Orbiting dashed particle ring */}
          <div className="absolute -inset-1.5 rounded-full border border-dashed border-emerald-500/30 animate-air-orbit" />
          {/* Inner counter-rotating ring with node */}
          <div className="absolute inset-0.5 rounded-full border border-teal-500/25 animate-air-orbit-reverse">
            <div className="w-2 h-2 rounded-full bg-emerald-500 absolute -top-1 left-1/2 -translate-x-1/2 shadow-xs" />
          </div>
          {/* Center core */}
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white flex items-center justify-center shadow-lg shadow-emerald-900/15 animate-air-breathe">
            <Wind className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Content & Titles */}
        <div className="space-y-1.5 max-w-md z-10">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-primary tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{title || 'Loading Atmospheric Telemetry'}</span>
          </div>

          {stationName && (
            <div className="text-sm font-semibold text-foreground flex items-center justify-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{stationName}</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground min-h-[20px] transition-all duration-300">
            {subtitle || activeMessage}
          </p>
        </div>

        {/* Animated Progress Wave */}
        <div className="h-1.5 w-44 bg-muted/80 rounded-full overflow-hidden border border-border/50">
          <div className="h-full w-2/5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 rounded-full animate-air-wave" />
        </div>

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/75 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            775 CPCB Monitors
          </span>
          <span>•</span>
          <span>OpenAQ Ground Series</span>
        </div>
      </div>
    );
  }

  // 4. FULLSCREEN VARIANT (Initial Website Home Page Landing Screen)
  return (
    <div
      className={`fixed inset-0 z-[9999] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300 ${className}`}
    >
      {/* Background ambient radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-gradient-to-tr from-emerald-500/[0.08] via-teal-500/[0.05] to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center gap-6 max-w-md w-full z-10">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-card border border-border shadow-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold tracking-tight text-foreground">
            BreatheBetter
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            India AQI Intelligence
          </span>
        </div>

        {/* Creative Center Breathing Visual Engine */}
        <div className="relative w-32 h-32 flex items-center justify-center my-2">
          {/* Concentric Aura 1 */}
          <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-air-aura" />
          {/* Concentric Aura 2 (offset) */}
          <div
            className="absolute -inset-4 rounded-full bg-teal-500/10 animate-air-aura"
            style={{ animationDelay: '1.4s' }}
          />

          {/* Radar Sweep Ring with Compass ticks */}
          <div className="absolute -inset-3 rounded-full border border-dashed border-emerald-600/30 animate-air-orbit" />
          <div className="absolute inset-1 rounded-full border border-teal-500/30 animate-air-orbit-reverse">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -top-1.5 left-1/2 -translate-x-1/2 shadow-md shadow-emerald-500/50" />
            <div className="w-2 h-2 rounded-full bg-teal-400 absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-70" />
          </div>

          {/* Central Atmospheric Sphere */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 text-white flex flex-col items-center justify-center shadow-2xl shadow-emerald-800/30 animate-air-breathe">
            <Wind className="w-9 h-9 text-white drop-shadow-sm" />
          </div>
        </div>

        {/* Dynamic Status / Location Messages */}
        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">
            {title || 'Connecting to India Clean Air Network'}
          </h1>

          {stationName ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Locked onto: {stationName}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-medium">
              <Compass className="w-3.5 h-3.5 text-primary animate-spin" style={{ animationDuration: '4s' }} />
              <span>Detecting your nearest CPCB ground station...</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground/90 max-w-sm mx-auto min-h-[32px] flex items-center justify-center transition-all duration-300">
            {subtitle || activeMessage}
          </p>
        </div>

        {/* Animated Wave Indicator */}
        <div className="h-1.5 w-60 bg-muted/80 rounded-full overflow-hidden border border-border">
          <div className="h-full w-2/5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 rounded-full animate-air-wave" />
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Official CPCB Standard
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-primary" />
            775 Live Telemetry Stations
          </span>
          <span>•</span>
          <span>Zero Synthetic Mock Data</span>
        </div>
      </div>
    </div>
  );
}

