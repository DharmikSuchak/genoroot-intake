'use client';

import { useIntakeStore } from '@/lib/intake-store';

export function Q14Describe() {
  const value = useIntakeStore(s => s.form.past_treatment_side_effects_describe);
  const setField = useIntakeStore(s => s.setField);

  return (
    <div className="flex flex-col min-h-full px-4 py-8 bg-slate-50">
      <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium tracking-wide text-sky-600">Question 14 of 16</p>
          <h2
            className="text-xl font-semibold text-slate-800 leading-snug"
            style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
          >
            What side effects did you notice?
          </h2>
          <p className="text-base text-slate-500">A rough description is fine.</p>
        </div>

        <textarea
          value={value ?? ''}
          onChange={e =>
            setField('past_treatment_side_effects_describe', e.target.value || null, 'tapped')
          }
          placeholder="e.g. scalp irritation from minoxidil, redness after PRP…"
          rows={4}
          className="w-full rounded-2xl border-2 border-slate-200 px-5 py-4 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-400 resize-none transition-colors"
          style={{ minHeight: '120px' }}
        />
      </div>
    </div>
  );
}
