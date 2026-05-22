'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

const GIA_HUES = [
  { label: 'Red', hex: '#dc2626' },
  { label: 'Orangy Red', hex: '#ea580c' },
  { label: 'Red-Orange', hex: '#f97316' },
  { label: 'Orange', hex: '#fb923c' },
  { label: 'Orange-Yellow', hex: '#fbbf24' },
  { label: 'Yellow', hex: '#eab308' },
  { label: 'Greenish Yellow', hex: '#84cc16' },
  { label: 'Yellow-Green', hex: '#65a30d' },
  { label: 'Green', hex: '#16a34a' },
  { label: 'Bluish Green', hex: '#0d9488' },
  { label: 'Blue-Green', hex: '#0891b2' },
  { label: 'Greenish Blue', hex: '#0284c7' },
  { label: 'Blue', hex: '#2563eb' },
  { label: 'Violet-Blue', hex: '#4f46e5' },
  { label: 'Blue-Violet', hex: '#7c3aed' },
  { label: 'Violet', hex: '#9333ea' },
  { label: 'Purple', hex: '#a855f7' },
  { label: 'Reddish Purple', hex: '#c026d3' },
  { label: 'Red-Purple', hex: '#db2777' },
  { label: 'Purplish Red', hex: '#e11d48' },
  { label: 'Pink', hex: '#ec4899' },
  { label: 'Pinkish Red', hex: '#f43f5e' },
  { label: 'Colorless', hex: '#e2e8f0' },
  { label: 'Brown', hex: '#92400e' },
  { label: 'Gray', hex: '#6b7280' },
];

// Tone: 1 (lightest) → 9 (darkest)
const TONE_LABELS = ['1 – Very Light', '2 – Light', '3 – Med-Light', '4 – Medium', '5 – Med-Dark', '6 – Dark', '7 – Very Dark', '8 – Extremely Dark', '9 – Black'];

// Saturation: 1 (gray) → 6 (vivid)
const SAT_LABELS = ['1 – Grayish', '2 – Slightly', '3 – Moderately', '4 – Strongly', '5 – Vivid', '6 – Deep'];

interface ColorGradingPickerProps {
  value: { hue?: string; tone?: number; saturation?: number };
  onChange: (v: { hue?: string; tone?: number; saturation?: number }) => void;
  className?: string;
}

export function ColorGradingPicker({ value, onChange, className }: ColorGradingPickerProps) {
  const selectedHue = GIA_HUES.find(h => h.label === value.hue);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Hue */}
      <div>
        <label className="label">Color Hue (GIA Standard)</label>
        <div className="flex flex-wrap gap-2">
          {GIA_HUES.map(({ label, hex }) => (
            <button
              key={label}
              type="button"
              onClick={() => onChange({ ...value, hue: value.hue === label ? undefined : label })}
              title={label}
              className={cn(
                'w-7 h-7 rounded-full border-2 transition-all hover:scale-110',
                value.hue === label ? 'border-white ring-1 ring-white/30 scale-110' : 'border-transparent',
              )}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
        {value.hue && (
          <p className="text-xs text-ivory-muted mt-1.5 flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full inline-block border border-white/20"
              style={{ backgroundColor: selectedHue?.hex }}
            />
            {value.hue}
          </p>
        )}
      </div>

      {/* Tone */}
      <div>
        <label className="label">
          Tone {value.tone ? <span className="text-gold">{TONE_LABELS[(value.tone ?? 1) - 1]}</span> : '(1–9)'}
        </label>
        <div className="flex gap-1">
          {TONE_LABELS.map((_, i) => {
            const v = i + 1;
            const lightness = Math.round(95 - i * 10);
            return (
              <button
                key={v}
                type="button"
                onClick={() => onChange({ ...value, tone: value.tone === v ? undefined : v })}
                title={TONE_LABELS[i]}
                className={cn(
                  'flex-1 h-8 rounded transition-all border',
                  value.tone === v ? 'border-white ring-1 ring-white/30 scale-105' : 'border-transparent hover:border-white/20',
                )}
                style={{ backgroundColor: selectedHue ? `hsl(${getHueAngle(selectedHue.hex)}, 60%, ${lightness}%)` : `hsl(0,0%,${lightness}%)` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[9px] text-ivory-subtle mt-0.5 px-0.5">
          <span>Light</span><span>Dark</span>
        </div>
      </div>

      {/* Saturation */}
      <div>
        <label className="label">
          Saturation {value.saturation ? <span className="text-gold">{SAT_LABELS[(value.saturation ?? 1) - 1]}</span> : '(1–6)'}
        </label>
        <div className="flex gap-1">
          {SAT_LABELS.map((_, i) => {
            const v = i + 1;
            const sat = Math.round(i * 20);
            const tone = value.tone ?? 5;
            const light = Math.round(95 - (tone - 1) * 10);
            return (
              <button
                key={v}
                type="button"
                onClick={() => onChange({ ...value, saturation: value.saturation === v ? undefined : v })}
                title={SAT_LABELS[i]}
                className={cn(
                  'flex-1 h-8 rounded transition-all border',
                  value.saturation === v ? 'border-white ring-1 ring-white/30 scale-105' : 'border-transparent hover:border-white/20',
                )}
                style={{ backgroundColor: selectedHue ? `hsl(${getHueAngle(selectedHue.hex)}, ${sat}%, ${light}%)` : `hsl(0,0%,${100 - sat / 2}%)` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[9px] text-ivory-subtle mt-0.5 px-0.5">
          <span>Grayish</span><span>Vivid</span>
        </div>
      </div>
    </div>
  );
}

function getHueAngle(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  let h = 0;
  const d = max - min;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return Math.round(h * 60);
}
