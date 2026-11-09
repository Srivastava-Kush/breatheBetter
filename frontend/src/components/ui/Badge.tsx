import React from 'react';
import { cn } from '../../utils';
import type { AQICategory } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'aqi';
  category?: AQICategory;
  className?: string;
}

export function Badge({ children, variant = 'default', category, className }: BadgeProps) {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors';

  const variants: Record<string, string> = {
    default: 'bg-primary/10 text-primary border border-primary/20',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'border border-border text-foreground',
  };

  if (variant === 'aqi' && category) {
    const aqiColors: Record<string, string> = {
      Good: 'bg-[#009966] text-white',
      Satisfactory: 'bg-[#55aa00] text-white',
      Moderate: 'bg-[#ffde33] text-gray-900',
      Poor: 'bg-[#ff7e00] text-white',
      'Very Poor': 'bg-[#cc0033] text-white',
      Severe: 'bg-[#7e0023] text-white',
      Unknown: 'bg-gray-400 text-white',
    };
    return (
      <span className={cn(base, aqiColors[category] ?? aqiColors['Unknown'], className)}>
        {children}
      </span>
    );
  }

  return (
    <span className={cn(base, variants[variant], className)}>
      {children}
    </span>
  );
}

