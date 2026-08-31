'use client';

import { useMemo } from 'react';
import { useIntakeStore } from '@/lib/intake-store';

export function CompletionScreen() {
  const getFilledForm = useIntakeStore(s => s.getFilledForm);
  const form = useIntakeStore(s => s.form);

  const json = useMemo(() => JSON.stringify(getFilledForm(), null, 2), [getFilledForm, form]);

  return (
    <div className="flex flex-col h-dvh overflow-y-auto px-4 py-8 bg-slate-50">
      <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span
            className="flex items-center justify-center w-14 h-14 rounded-full text-2xl"
            style={{ backgroundColor: '#dcfce7', color: '#15803d' }}
          >
            ✓
          </span>
          <h2
            className="text-xl font-semibold text-slate-800 leading-snug"
            style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
          >
            You're all set
          </h2>
          <p className="text-base text-slate-500">
            Thanks — your doctor will review this before your visit.
          </p>
        </div>

        <div
          className="rounded-2xl bg-white p-4"
          style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <pre className="text-sm text-slate-700 whitespace-pre-wrap break-words">{json}</pre>
        </div>
      </div>
    </div>
  );
}
