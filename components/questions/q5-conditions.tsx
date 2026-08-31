'use client';

import { useIntakeStore } from '@/lib/intake-store';
import type { DiagnosedConditionOption } from '@/lib/types';

const NONE = 'None' as const satisfies DiagnosedConditionOption;

const OPTIONS: DiagnosedConditionOption[] = [
  'PCOS/PCOD',
  'Thyroid disorder',
  'Diabetes',
  'Autoimmune disease',
  'Anemia',
  NONE,
];

export function Q5Conditions() {
  const selected = useIntakeStore(s => s.form.diagnosed_conditions);
  const setField = useIntakeStore(s => s.setField);

  function toggle(value: DiagnosedConditionOption) {
    let next: DiagnosedConditionOption[];

    if (value === NONE) {
      next = selected.includes(NONE) ? [] : [NONE];
    } else {
      const without = selected.filter(v => v !== NONE);
      next = without.includes(value)
        ? without.filter(v => v !== value)
        : [...without, value];
    }

    setField('diagnosed_conditions', next, 'tapped');
  }

  return (
    <div className="flex flex-col min-h-full px-4 py-8 bg-slate-50">
      <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium tracking-wide text-sky-600">Question 5 of 16</p>
          <h2
            className="text-xl font-semibold text-slate-800 leading-snug"
            style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
          >
            Have you been diagnosed with any of these?
          </h2>
          <p className="text-base text-slate-500">Select all that apply.</p>
        </div>

        <div className="flex flex-col gap-3">
          {OPTIONS.map(opt => {
            const isSelected = selected.includes(opt);
            const isNoneOption = opt === NONE;
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className="flex items-center gap-4 w-full min-h-[56px] rounded-2xl border-2 px-5 py-4 text-left transition-colors"
                style={{
                  borderColor: isSelected ? '#0ea5e9' : '#e2e8f0',
                  backgroundColor: isSelected
                    ? isNoneOption ? '#fef3c7' : '#f0f9ff'
                    : '#ffffff',
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
                <span
                  className="text-base font-medium"
                  style={{ color: isSelected ? '#0369a1' : '#334155' }}
                >
                  {opt}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
