'use client';

import { useIntakeStore } from '@/lib/intake-store';
import type { Products } from '@/lib/types';

const ROWS: { key: keyof Products; label: string }[] = [
  { key: 'otc_medicated_shampoos', label: 'OTC/Medicated Shampoos' },
  { key: 'hair_oils_serums', label: 'Hair Oils/Serums' },
  { key: 'topical_minoxidil', label: 'Topical Minoxidil' },
  { key: 'oral_minoxidil', label: 'Oral Minoxidil' },
  { key: 'supplements', label: 'Supplements' },
];

export function Q12ProductsWhich() {
  const products = useIntakeStore(s => s.form.products);
  const setProductCell = useIntakeStore(s => s.setProductCell);

  function toggle(row: keyof Products) {
    const isUsed = products[row].used === true;
    if (isUsed) {
      // Deselecting clears the row's answers — they no longer apply.
      setProductCell(row, 'used', false, 'tapped');
      setProductCell(row, 'duration', null, 'empty');
      setProductCell(row, 'helped', null, 'empty');
      setProductCell(row, 'side_effects', null, 'empty');
    } else {
      setProductCell(row, 'used', true, 'tapped');
    }
  }

  return (
    <div className="flex flex-col min-h-full px-4 py-8 bg-slate-50">
      <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium tracking-wide text-sky-600">Question 12 of 16 · Products</p>
          <h2
            className="text-xl font-semibold text-slate-800 leading-snug"
            style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
          >
            Which of these have you used?
          </h2>
          <p className="text-base text-slate-500">Select all that apply.</p>
        </div>

        <div className="flex flex-col gap-3">
          {ROWS.map(row => {
            const isSelected = products[row.key].used === true;
            return (
              <button
                key={row.key}
                onClick={() => toggle(row.key)}
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
                <span
                  className="text-base font-medium"
                  style={{ color: isSelected ? '#0369a1' : '#334155' }}
                >
                  {row.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
