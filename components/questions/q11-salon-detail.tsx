'use client';

import { useIntakeStore } from '@/lib/intake-store';

export function Q11SalonDetail() {
  const value = useIntakeStore(s => s.form.habits.salon_treatment_detail);
  const setHabit = useIntakeStore(s => s.setHabit);

  return (
    <div className="flex flex-col h-full px-4 py-8 bg-slate-50">
      <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium tracking-wide text-sky-600">Question 11 of 16 · Habits</p>
          <h2
            className="text-xl font-semibold text-slate-800 leading-snug"
            style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
          >
            What kind of salon treatments do you get?
          </h2>
          <p className="text-base text-slate-500">A rough description is fine.</p>
        </div>

        <textarea
          value={value ?? ''}
          onChange={e =>
            setHabit('salon_treatment_detail', e.target.value || null, 'tapped')
          }
          placeholder="e.g. keratin every 6 months, colouring every 2 months…"
          rows={4}
          className="w-full rounded-2xl border-2 border-slate-200 px-5 py-4 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-400 resize-none transition-colors"
          style={{ minHeight: '120px' }}
        />
      </div>
    </div>
  );
}
