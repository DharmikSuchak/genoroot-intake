'use client';

import { useIntakeStore } from '@/lib/intake-store';
import { useStepLabel } from '@/components/step-context';
import type { DurationOption } from '@/lib/types';

const OPTIONS: { value: DurationOption; label: string; sublabel: string }[] = [
  { value: 'Less than 6 months', label: 'Less than 6 months', sublabel: 'Started recently' },
  { value: '6-12 months', label: '6 – 12 months', sublabel: 'About half a year to a year' },
  { value: 'Over a year', label: 'Over a year', sublabel: 'More than 12 months' },
];

export function Q2Duration() {
  const selected = useIntakeStore(s => s.form.duration);
  const setField = useIntakeStore(s => s.setField);
  const stepLabel = useStepLabel();

  return (
    <div className="flex flex-col min-h-full px-4 py-8 bg-slate-50">
      <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium tracking-wide text-sky-600">{stepLabel}</p>
          <h2
            className="text-xl font-semibold text-slate-800 leading-snug"
            style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
          >
            How long has the hair loss been going on?
          </h2>
          <p className="text-base text-slate-500">A rough estimate is fine.</p>
        </div>

        <div className="flex flex-col gap-3">
          {OPTIONS.map(opt => {
            const isSelected = selected === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setField('duration', opt.value, 'tapped')}
                className="flex flex-col items-start gap-0.5 w-full min-h-[64px] rounded-2xl border-2 px-5 py-4 text-left transition-colors"
                style={{
                  borderColor: isSelected ? '#0ea5e9' : '#e2e8f0',
                  backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                }}
              >
                <span
                  className="text-base font-semibold"
                  style={{ color: isSelected ? '#0369a1' : '#334155' }}
                >
                  {opt.label}
                </span>
                <span className="text-sm" style={{ color: isSelected ? '#0284c7' : '#94a3b8' }}>
                  {opt.sublabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
