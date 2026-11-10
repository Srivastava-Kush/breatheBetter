import React, { useState } from 'react';
import { X, BookOpen, AlertCircle, ShieldAlert, Sparkles, Wind, Factory, Heart, Eye } from 'lucide-react';
import { POLLUTANTS_INFO, type PollutantInfo } from '../data/pollutantsInfo';
import { Button } from './ui/Button';

interface PollutantGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPollutant?: string;
}

export function PollutantGuideModal({
  isOpen,
  onClose,
  initialPollutant = 'pm25',
}: PollutantGuideModalProps) {
  const [selectedPollutant, setSelectedPollutant] = useState<string>(initialPollutant);

  if (!isOpen) return null;

  const current: PollutantInfo =
    POLLUTANTS_INFO[selectedPollutant] ?? POLLUTANTS_INFO['pm25'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Understanding Air Pollutants</h2>
              <p className="text-xs text-muted-foreground">
                Plain-language guide to atmospheric contaminants, sources, and health impacts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Horizontal Pollutant Selector Tabs */}
        <div className="flex items-center gap-1.5 p-2 px-4 border-b border-border bg-card overflow-x-auto shrink-0">
          {Object.values(POLLUTANTS_INFO).map((p) => {
            const isSelected = selectedPollutant === p.code;
            return (
              <button
                key={p.code}
                onClick={() => setSelectedPollutant(p.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs scale-105'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                {p.chemicalFormula} ({p.name.split(' ')[0]})
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-5 md:p-6 space-y-5 overflow-y-auto">
          {/* Headline & Category */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-foreground">{current.chemicalFormula}</span>
              <span className="text-base font-bold text-muted-foreground">· {current.name}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {current.category}
              </span>
            </div>
            {current.sizeComparison && (
              <div className="text-xs text-amber-700 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg font-medium inline-block">
                📏 {current.sizeComparison}
              </div>
            )}
          </div>

          {/* Simple Explanation */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 text-sm text-foreground leading-relaxed">
            {current.simpleExplanation}
          </div>

          {/* Grid: Sources vs Health Effects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Emission Sources */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wide">
                <Factory className="w-4 h-4 text-primary" />
                Where It Comes From
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {current.primarySources.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Health & Bodily Impacts */}
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900 uppercase tracking-wide">
                <Heart className="w-4 h-4 text-rose-600" />
                Human Health Impact
              </div>
              <ul className="space-y-1.5 text-xs text-rose-800">
                {current.healthEffects.map((h, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Standards & Limits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60 text-xs">
            <div className="p-3 rounded-lg bg-muted/30">
              <span className="text-muted-foreground block text-[11px]">CPCB Regulatory Threshold</span>
              <span className="font-bold text-foreground">{current.safeLimitCpcb}</span>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <span className="text-muted-foreground block text-[11px]">WHO Health Guideline</span>
              <span className="font-bold text-foreground">{current.whoGuideline}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 px-5 border-t border-border bg-muted/20 flex justify-end">
          <Button size="sm" onClick={onClose}>
            Got it, Close Guide
          </Button>
        </div>
      </div>
    </div>
  );
}

