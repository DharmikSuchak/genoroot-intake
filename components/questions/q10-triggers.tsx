'use client';

import { useIntakeStore } from '@/lib/intake-store';
import type { Past6MonthsOption } from '@/lib/types';

const OPTIONS: { value: Past6MonthsOption; sublabel?: string }[] = [
  { value: 'Crash dieting or major weight loss' },
  { value: 'High stress or emotional trauma' },
  {
    value: 'Fever with illness (COVID, Dengue, Typhoid)',
    sublabel: 'COVID, Dengue, Typhoid, etc.',
  },
  { value: 'Recent surgery' },
  { value: 'Change in location/water/air quality' },
];

export function Q10Triggers() {
  const selected = useIntakeStore(s => s.form.past_6_months);
  const setField = useIntakeStore(s => s.setField);

  function toggle(value: Past6MonthsOption) {
    const next = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value];
    setField('past_6_months', next, 'tapped');
  }

  return (
    <div className="flex flex-col min-h-full px-4 py-8 bg-slate-50">
      <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium tracking-wide text-sky-600">Question 10 of 16</p>
          <h2
            className="text-xl font-semibold text-slate-800 leading-snug"
            style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
          >
            In the past 6 months, have any of these happened?
          </h2>
          <p className="text-base text-slate-500">Select all that apply.</p>
        </div>

        <div className="flex flex-col gap-3">
          {OPTIONS.map(opt => {
            const isSelected = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className="flex items-center gap-4 w-full min-h-[56px] rounded-2xl border-2 px-5 py-4 text-left transition-colors"
                style={{
                  borderColor: isSelected ? '#0ea5e9' : '#e2e8f0',
                  backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                }}
              >
                <span
                  className="flex items-center justify-center w-6 h-6 rounded-md border-2 shrink-0 transition-colors"
                  style={{
                    borderColor: isSelected ? '#0ea5e9' : '#cbd5e1',
                    backgroundColor: isSelected ? '#0ea5e9' : 'transparent',
                  }}
                >
                  {isSelected && (
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                      <path
                        d="M1 5l3.5 3.5L11 1"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span
                    className="text-base font-medium"
                    style={{ color: isSelected ? '#0369a1' : '#334155' }}
                  >
                    {opt.value}
                  </span>
                  {opt.sublabel && (
                    <span
                      className="text-sm"
                      style={{ color: isSelected ? '#0284c7' : '#94a3b8' }}
                    >
                      {opt.sublabel}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
