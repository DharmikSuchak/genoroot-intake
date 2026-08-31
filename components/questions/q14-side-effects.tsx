'use client';

import { useEffect } from 'react';
import { useIntakeStore } from '@/lib/intake-store';

/**
 * Q14 is never asked cold when we have data to derive it from: if any Q12
 * product was used, we infer the answer from that product's side_effects
 * column and ask the patient to confirm rather than re-asking from scratch.
 * Only a patient who used no products at all sees a plain yes/no.
 */
export function Q14SideEffects() {
  const products = useIntakeStore(s => s.form.products);
  const value = useIntakeStore(s => s.form.past_treatment_side_effects);
  const prov = useIntakeStore(s => s.provenance.past_treatment_side_effects);
  const setField = useIntakeStore(s => s.setField);

  const usedEntries = Object.values(products).filter(entry => entry.used === true);
  const anyProductUsed = usedEntries.length > 0;
  const inferredAnswer = usedEntries.some(entry => entry.side_effects === true);

  useEffect(() => {
    if (anyProductUsed && prov === 'empty') {
      setField('past_treatment_side_effects', inferredAnswer, 'inferred');
    }
    // Only fires once per untouched visit — prov flips away from 'empty' after the write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anyProductUsed, inferredAnswer, prov]);

  function tap(answer: boolean) {
    if (prov === 'inferred' && value === answer) {
      // Tapping the pre-filled answer confirms it in place.
      setField('past_treatment_side_effects', answer, 'confirmed');
    } else {
      setField('past_treatment_side_effects', value === answer ? null : answer, 'tapped');
    }
  }

  return (
    <div className="flex flex-col h-full px-4 py-8 bg-slate-50">
      <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium tracking-wide text-sky-600">Question 14 of 16</p>
          <h2
            className="text-xl font-semibold text-slate-800 leading-snug"
            style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
          >
            Have you had side effects from any past hair treatment?
          </h2>
          {prov === 'inferred' && (
            <p className="text-base font-medium" style={{ color: '#b45309' }}>
              Based on what you told us about your products — tap to confirm, or pick the other answer to change it.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {([true, false] as const).map(answer => {
            const isSelected = value === answer;
            const isInferred = isSelected && prov === 'inferred';
            const isConfirmed = isSelected && prov === 'confirmed';

            let borderColor = '#e2e8f0';
            let backgroundColor = '#ffffff';
            let textColor = '#334155';
            let dotColor = '#cbd5e1';

            if (isInferred) {
              borderColor = '#f59e0b';
              backgroundColor = '#fef3c7';
              textColor = '#b45309';
              dotColor = '#f59e0b';
            } else if (isConfirmed) {
              borderColor = '#15803d';
              backgroundColor = '#dcfce7';
              textColor = '#15803d';
              dotColor = '#15803d';
            } else if (isSelected) {
              borderColor = '#0ea5e9';
              backgroundColor = '#f0f9ff';
              textColor = '#0369a1';
              dotColor = '#0ea5e9';
            }

            return (
              <button
                key={String(answer)}
                onClick={() => tap(answer)}
                className="flex items-center gap-4 w-full min-h-[56px] rounded-2xl border-2 px-5 py-4 text-left transition-colors"
                style={{ borderColor, backgroundColor }}
              >
                <span
                  className="flex items-center justify-center w-5 h-5 rounded-full border-2 shrink-0 transition-colors"
                  style={{
                    borderColor: isSelected ? dotColor : '#cbd5e1',
                    backgroundColor: isSelected ? dotColor : 'transparent',
                  }}
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-base font-medium" style={{ color: textColor }}>
                    {answer ? 'Yes' : 'No'}
                  </span>
                  {isInferred && (
                    <span className="text-sm font-medium" style={{ color: '#b45309' }}>
                      Tap to confirm
                    </span>
                  )}
                  {isConfirmed && (
                    <span className="text-sm font-medium" style={{ color: '#15803d' }}>
                      Confirmed
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
