import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  AlertTriangle,
  ShieldAlert,
  Clock,
  HeartPulse,
  Activity,
  CheckCircle2,
  Calendar,
  MapPin,
} from 'lucide-react';
import { useImpactReport, useLocations } from '../hooks/useAirQuality';
import { useAppStore, isSyntheticLocationId } from '../stores/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function ReportPage() {
  const { selectedLocationId, setSelectedLocation } = useAppStore();
  const [reportDays, setReportDays] = useState<number>(30);
  const { data: locationsData } = useLocations({ limit: 1000 });
  const stations = locationsData?.data ?? [];

  const locationId = (selectedLocationId && !isSyntheticLocationId(selectedLocationId))
    ? selectedLocationId
    : (stations[0]?.openaqId || 17);

  const { data: reportRes, isLoading, error } = useImpactReport(locationId, reportDays);
  const report = reportRes?.data;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 print:p-0 print:m-0 print:max-w-none text-foreground">
      {/* Action Bar (hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Automated Pollution Impact Report
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Epidemiological exposure analysis, WHO guideline exceedances, and respiratory risk assessment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Station Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-card border border-border px-2.5 py-1.5 rounded-lg text-xs shadow-2xs">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <select
              value={locationId}
              onChange={(e) => setSelectedLocation(Number(e.target.value))}
              aria-label="Select monitoring station for impact report"
              className="bg-transparent text-foreground text-xs font-medium focus:outline-hidden cursor-pointer max-w-[240px] truncate"
            >
              {stations.map((st) => (
                <option key={st.openaqId} value={st.openaqId} className="bg-card text-foreground">
                  {st.name} {st.locality ? `(${st.locality})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Days selector */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border text-xs">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setReportDays(d)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  reportDays === d
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>

          <Button onClick={handlePrint} size="sm" className="shadow-xs">
            <Printer className="w-4 h-4 mr-1.5" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Synthesizing longitudinal exposure telemetry and health metrics...</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          Failed to generate impact report. Please select another station.
        </div>
      )}

      {!isLoading && report && (
        <div className="space-y-6 print:space-y-4">
          {/* Report Document Header */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
            <div className="flex items-start justify-between border-b border-border/60 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Official Air Quality Diagnostic Report
                </span>
                <h2 className="text-xl font-bold text-foreground mt-1.5">
                  {report.station.name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {report.station.coordinates.latitude.toFixed(4)}°N,{' '}
                    {report.station.coordinates.longitude.toFixed(4)}°E
                  </span>
                  <span>•</span>
                  <span>Provider: {report.station.provider}</span>
                </div>
              </div>

              <div className="text-right text-xs text-muted-foreground">
                <div>Assessment Window: <strong>Last {report.reportingPeriodDays} Days</strong></div>
                <div>Generated: {new Date(report.generatedAt).toLocaleDateString()}</div>
                <div className="text-emerald-700 font-medium">Data Completeness: {report.dataCompletenessPercent}%</div>
              </div>
            </div>

            {/* Executive Summary */}
            <p className="text-sm text-foreground/90 leading-relaxed font-serif bg-muted/30 p-3.5 rounded-xl border border-border/40">
              {report.executiveSummary}
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-card border border-border shadow-xs space-y-1">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold">Average PM2.5</span>
              <div className="text-2xl font-black text-foreground">
                {report.exposureSummary.averagePm25} <span className="text-xs font-normal text-muted-foreground">µg/m³</span>
              </div>
              <div className="text-[11px] text-rose-700 font-medium">
                {report.exposureSummary.whoExceedanceMultiple}x WHO annual limit
              </div>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border shadow-xs space-y-1">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold">Days Over WHO Limit</span>
              <div className="text-2xl font-black text-rose-700">
                {report.exposureSummary.daysExceedingWhoStandard} / {report.reportingPeriodDays}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Threshold: 15 µg/m³
              </div>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border shadow-xs space-y-1">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold">Days Over CPCB Limit</span>
              <div className="text-2xl font-black text-amber-700">
                {report.exposureSummary.daysExceedingCpcbStandard} / {report.reportingPeriodDays}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Threshold: 60 µg/m³
              </div>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border shadow-xs space-y-1">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold">Health Hazard Index</span>
              <div className="text-2xl font-black text-foreground">
                {report.healthImpactAssessment.estimatedLungStrainIndex} <span className="text-xs font-normal text-muted-foreground">/ 100</span>
              </div>
              <div className="text-[11px] font-bold text-rose-700">
                {report.healthImpactAssessment.hazardLevel} Hazard
              </div>
            </div>
          </div>

          {/* Diurnal Pattern Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Diurnal Exposure Windows & Diurnal Shift
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                  <div className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    Highest Pollution Window
                  </div>
                  <div className="text-sm font-semibold text-rose-950">
                    {report.diurnalPattern.worstPollutionWindow}
                  </div>
                  <p className="text-xs text-rose-900/80">
                    {report.diurnalPattern.eveningPeakImpact}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Cleanest Ventilation Window
                  </div>
                  <div className="text-sm font-semibold text-emerald-950">
                    {report.diurnalPattern.cleanestWindow}
                  </div>
                  <p className="text-xs text-emerald-900/80">
                    Convective solar heating elevates the planetary boundary layer, providing optimal air dispersion.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Epidemiological Hazard & Recommendations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                Vulnerable Demographic Warnings & Interventions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase">Key Health Hazards:</div>
                <ul className="space-y-1.5 text-xs text-foreground/90">
                  {report.healthImpactAssessment.vulnerableDemographicWarnings.map((w: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <div className="text-xs font-semibold text-muted-foreground uppercase">Actionable Interventions:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {report.healthImpactAssessment.recommendedPrecautions.map((p: string, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/40 border border-border text-xs leading-relaxed">
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer certification */}
          <div className="text-[10px] text-muted-foreground border-t border-border pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>BreatheBetter Air Quality Intelligence Platform · CPCB Sub-Index Framework</span>
            <span>Data Source: OpenAQ Public Sensor Network & CPCB Open Telemetry</span>
          </div>
        </div>
      )}
    </div>
  );
}

