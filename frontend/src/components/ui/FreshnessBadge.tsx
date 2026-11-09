import React from 'react';
import { getFreshnessColor, formatAge, formatDateTime } from '../../utils';
import type { FreshnessStatus } from '../../types';

interface FreshnessBadgeProps {
  status: FreshnessStatus;
  ageMinutes: number | null;
  measurementUtc?: string | null;
  showTime?: boolean;
}

export function FreshnessBadge({
  status,
  ageMinutes,
  measurementUtc,
  showTime = false,
}: FreshnessBadgeProps) {
  const color = getFreshnessColor(status);

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span style={{ color }}>{status}</span>
      <span>·</span>
      <span>{formatAge(ageMinutes)}</span>
      {showTime && measurementUtc && (
        <>
          <span>·</span>
          <span>{formatDateTime(measurementUtc)}</span>
        </>
      )}
    </div>
  );
}

