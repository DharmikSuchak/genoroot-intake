'use client';

import { useIntakeStore } from '@/lib/intake-store';
import type { Procedures, ProcedureSessionsOption } from '@/lib/types';

const SESSIONS_OPTIONS: ProcedureSessionsOption[] = ['1-3', '4-6', '>6'];

/**
 * One card per selected Q13 row, gathering sessions/helped together. Built as
 * a factory so the four possible rows share a single implementation.
 */
export function makeQ13ProcedureDetail(row: keyof Procedures, label: string) {
  return function Q13ProcedureDetail() {
    const entry = useIntakeStore(s => s.form.procedures[row]);
    const setProcedureCell = useIntakeStore(s => s.setProcedureCell);

    return (
      <div className="flex flex-col h-full px-4 py-8 bg-slate-50 overflow-y-auto">
        <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium tracking-wide text-sky-600">Question 13 of 16 · Procedures</p>
            <h2
              className="text-xl font-semibold text-slate-800 leading-snug"
              style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
            >
              {label}
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              How many sessions?
            </p>
            {SESSIONS_OPTIONS.map(opt => {
              const isSelected = entry.sessions === opt;
              return (
                <button
                  key={opt}
                  onClick={() =>
                    setProcedureCell(row, 'sessions', isSelected ? null : opt, 'tapped')
                  }
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

          <div className="flex flex-col gap-3 pb-4">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Did it help?
            </p>
            {([true, false] as const).map(answer => {
              const isSelected = entry.helped === answer;
              return (
                <button
                  key={String(answer)}
                  onClick={() =>
                    setProcedureCell(row, 'helped', entry.helped === answer ? null : answer, 'tapped')
                  }
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
                  <span
                    className="text-base font-medium"
                    style={{ color: isSelected ? '#0369a1' : '#334155' }}
                  >
                    {answer ? 'Yes' : 'No'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
}
