'use client';

import { useIntakeStore } from '@/lib/intake-store';
import type { Products, ProductDurationOption } from '@/lib/types';

const DURATION_OPTIONS: ProductDurationOption[] = ['<3mo', '3-6mo', '>6mo'];

/**
 * One card per selected Q12 row, gathering duration/helped/side_effects
 * together. Built as a factory (rather than one component per row) so the
 * five possible rows share a single implementation.
 */
export function makeQ12ProductDetail(row: keyof Products, label: string) {
  return function Q12ProductDetail() {
    const entry = useIntakeStore(s => s.form.products[row]);
    const setProductCell = useIntakeStore(s => s.setProductCell);

    return (
      <div className="flex flex-col h-full px-4 py-8 bg-slate-50 overflow-y-auto">
        <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium tracking-wide text-sky-600">Question 12 of 16 · Products</p>
            <h2
              className="text-xl font-semibold text-slate-800 leading-snug"
              style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
            >
              {label}
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              How long have you used it?
            </p>
            {DURATION_OPTIONS.map(opt => {
              const isSelected = entry.duration === opt;
              return (
                <button
                  key={opt}
                  onClick={() =>
                    setProductCell(row, 'duration', isSelected ? null : opt, 'tapped')
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

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Did it help?
            </p>
            {([true, false] as const).map(answer => {
              const isSelected = entry.helped === answer;
              return (
                <button
                  key={String(answer)}
                  onClick={() =>
                    setProductCell(row, 'helped', entry.helped === answer ? null : answer, 'tapped')
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

          <div className="flex flex-col gap-3 pb-4">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Any side effects?
            </p>
            {([true, false] as const).map(answer => {
              const isSelected = entry.side_effects === answer;
              return (
                <button
                  key={String(answer)}
                  onClick={() =>
                    setProductCell(
                      row,
                      'side_effects',
                      entry.side_effects === answer ? null : answer,
                      'tapped'
                    )
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
