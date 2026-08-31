'use client';

import { useIntakeStore } from '@/lib/intake-store';
import { useStepLabel } from '@/components/step-context';
import type { HairWashFrequencyOption } from '@/lib/types';

const OPTIONS: { value: HairWashFrequencyOption; sublabel: string }[] = [
  { value: 'Daily', sublabel: 'Every day' },
  { value: 'Alternate Days', sublabel: 'Every other day' },
  { value: 'Weekly', sublabel: 'Once or twice a week' },
];

export function Q11WashFreq() {
  const value = useIntakeStore(s => s.form.habits.hair_wash_frequency);
  const setHabit = useIntakeStore(s => s.setHabit);

  return (
    <div className="flex flex-col min-h-full px-4 py-8 bg-slate-50">
      <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium tracking-wide text-sky-600">{useStepLabel()}</p>
          <h2
            className="text-xl font-semibold text-slate-800 leading-snug"
            style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
          >
            How often do you wash your hair?
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {OPTIONS.map(opt => {
            const isSelected = value === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setHabit('hair_wash_frequency', isSelected ? null : opt.value, 'tapped')}
                className="flex items-center gap-4 w-full min-h-[56px] rounded-2xl border-2 px-5 py-4 text-left transition-colors"
                style={{
                  borderColor: isSelected ? '#0ea5e9' : '#e2e8f0',
                  backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                }}
              >
                <span
                  className="flex items-center justify-center w-5 h-5 rounded-full border-2 shrink-0 transition-colors"
                  style={{
                    borderColor: isSelected ? '#0ea5e9' : '#cbd5e1',
                    backgroundColor: isSelected ? '#0ea5e9' : 'transparent',
                  }}
                />
                <span className="flex flex-col gap-0.5">
                  <span
                    className="text-base font-medium"
                    style={{ color: isSelected ? '#0369a1' : '#334155' }}
                  >
                    {opt.value}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: isSelected ? '#0284c7' : '#94a3b8' }}
                  >
                    {opt.sublabel}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
