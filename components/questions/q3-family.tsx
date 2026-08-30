'use client';

import { useIntakeStore } from '@/lib/intake-store';
import type { FamilyHistoryOption } from '@/lib/types';

const NONE = 'No known family history' as const satisfies FamilyHistoryOption;

const OPTIONS: { value: FamilyHistoryOption; label: string }[] = [
  { value: 'Father had hair loss', label: 'Father had hair loss' },
  { value: 'Mother had hair loss', label: 'Mother had hair loss' },
  { value: 'Siblings with thinning or baldness', label: 'Siblings with thinning or baldness' },
  { value: NONE, label: 'No known family history' },
];

export function Q3Family() {
  const selected = useIntakeStore(s => s.form.family_history);
  const setField = useIntakeStore(s => s.setField);

  function toggle(value: FamilyHistoryOption) {
    let next: FamilyHistoryOption[];

    if (value === NONE) {
      // "No known family history" is exclusive — selecting it clears everything else
      next = selected.includes(NONE) ? [] : [NONE];
    } else {
      // Selecting any other option clears NONE
      const without = selected.filter(v => v !== NONE);
      next = without.includes(value)
        ? without.filter(v => v !== value)
        : [...without, value];
    }

    setField('family_history', next, 'tapped');
  }

  return (
    <div className="flex flex-col h-full px-4 py-8 bg-slate-50">
      <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium tracking-wide text-sky-600">Question 3 of 16</p>
          <h2
            className="text-xl font-semibold text-slate-800 leading-snug"
            style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
          >
            Does hair loss run in your family?
          </h2>
          <p className="text-base text-slate-500">Select all that apply.</p>
        </div>

        <div className="flex flex-col gap-3">
          {OPTIONS.map(opt => {
            const isSelected = selected.includes(opt.value);
            const isNoneOption = opt.value === NONE;
            return (
              <button
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className="flex items-center gap-4 w-full min-h-[56px] rounded-2xl border-2 px-5 py-4 text-left transition-colors"
                style={{
                  borderColor: isSelected ? '#0ea5e9' : '#e2e8f0',
                  backgroundColor: isSelected
                    ? isNoneOption
                      ? '#f0f9ff'
                      : '#f0f9ff'
                    : '#ffffff',
                }}
              >
                {/* Checkbox indicator */}
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
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
