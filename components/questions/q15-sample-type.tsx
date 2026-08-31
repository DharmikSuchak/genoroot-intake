'use client';

import { useIntakeStore } from '@/lib/intake-store';
import { useStepLabel } from '@/components/step-context';
import type { SampleTypeOption } from '@/lib/types';

const OPTIONS: { value: SampleTypeOption; label: string; sublabel: string }[] = [
  { value: 'Saliva', label: 'Saliva', sublabel: 'A quick cheek swab' },
  { value: 'Blood', label: 'Blood', sublabel: 'A small blood draw' },
  { value: 'Either', label: 'Either is fine', sublabel: 'Let the clinic decide' },
];

export function Q15SampleType() {
  const selected = useIntakeStore(s => s.form.sample_type);
  const setField = useIntakeStore(s => s.setField);

  return (
    <div className="flex flex-col min-h-full px-4 py-8 bg-slate-50">
      <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium tracking-wide text-sky-600">{useStepLabel()}</p>
          <h2
            className="text-xl font-semibold text-slate-800 leading-snug"
            style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
          >
            Which sample would you prefer to give?
          </h2>
          <p className="text-base text-slate-500">
            Either works for the genetic analysis. Pick whichever you're more comfortable with.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {OPTIONS.map(opt => {
            const isSelected = selected === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setField('sample_type', opt.value, 'tapped')}
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
