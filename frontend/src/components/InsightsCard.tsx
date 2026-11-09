import { Sparkles, TrendingUp, TrendingDown, Minus, Clock, Flame } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { useInsights } from '../hooks/useAirQuality';

interface InsightsCardProps {
  locationId: number;
}

export function InsightsCard({ locationId }: InsightsCardProps) {
  const { data, isLoading } = useInsights(locationId);
  const insight = data?.data;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-32 bg-muted/40 rounded-xl animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!insight) return null;

  const trendIcon = {
    improving: <TrendingDown className="w-4 h-4 text-emerald-500" />,
    worsening: <TrendingUp className="w-4 h-4 text-rose-500" />,
    stable: <Minus className="w-4 h-4 text-amber-500" />,
  }[insight.trend];

  const trendBadgeColor = {
    improving: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    worsening: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    stable: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  }[insight.trend];

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Pollution Insights
          </CardTitle>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${trendBadgeColor}`}>
            {trendIcon}
            <span className="capitalize">{insight.trend}</span>
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground/90 leading-relaxed font-medium">
          {insight.summary}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {insight.peakHour && (
            <div className="p-3 rounded-lg bg-card/60 border border-border/80 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Diurnal Peak Window</span>
                <p className="text-muted-foreground mt-0.5">Highest concentration observed around {insight.peakHour}.</p>
              </div>
            </div>
          )}

          {insight.pmRatio && (
            <div className="p-3 rounded-lg bg-card/60 border border-border/80 flex items-start gap-2.5">
              <Flame className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Particulate Ratio Analysis</span>
                <p className="text-muted-foreground mt-0.5">{insight.pmRatio.interpretation}</p>
              </div>
            </div>
          )}
        </div>

        {insight.keyFindings.length > 0 && (
          <div className="pt-2 border-t border-border/60">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Key Diagnostic Observations
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {insight.keyFindings.map((finding, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
