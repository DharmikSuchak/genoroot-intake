'use client';

import { useIntakeStore } from '@/lib/intake-store';
import { useStepLabel } from '@/components/step-context';
import type { MenstrualCycleOption, PregnancyRelatedOption } from '@/lib/types';

type Q6Value = Exclude<MenstrualCycleOption, 'Not applicable'>;
type Q7Value = Exclude<PregnancyRelatedOption, 'Not applicable'>;

const Q6_OPTIONS: { value: Q6Value; label: string }[] = [
  { value: 'Regular', label: 'Regular' },
  { value: 'Irregular', label: 'Irregular' },
  { value: 'Menopausal', label: 'Menopausal / Postmenopausal' },
];

const Q7_OPTIONS: { value: Q7Value; label: string }[] = [
  { value: 'Currently pregnant', label: 'Currently pregnant' },
  { value: 'Postpartum <1 year', label: 'Recent birth (under 1 year ago)' },
];

export function Q67Hormonal() {
  const menstrual = useIntakeStore(s => s.form.menstrual_cycle);
  const pregnancy = useIntakeStore(s => s.form.pregnancy_related);
  const setField = useIntakeStore(s => s.setField);
  const stepLabel = useStepLabel();

  const doesNotApply =
    menstrual === 'Not applicable' && pregnancy === 'Not applicable';

  function tapGateway() {
    if (doesNotApply) {
      setField('menstrual_cycle', null, 'tapped');
      setField('pregnancy_related', null, 'tapped');
    } else {
      setField('menstrual_cycle', 'Not applicable', 'tapped');
      setField('pregnancy_related', 'Not applicable', 'tapped');
    }
  }

  function tapQ6(value: Q6Value) {
    setField('menstrual_cycle', menstrual === value ? null : value, 'tapped');
  }

  function tapQ7(value: Q7Value) {
    setField('pregnancy_related', pregnancy === value ? null : value, 'tapped');
  }

  return (
    <div className="flex flex-col min-h-full px-4 py-8 bg-slate-50">
      <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium tracking-wide text-sky-600">{stepLabel}</p>
          <h2
            className="text-xl font-semibold text-slate-800 leading-snug"
            style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
          >
            Hormonal health
          </h2>
          <p className="text-base text-slate-500">
            Hormonal changes are a common trigger for hair loss.
          </p>
        </div>

        {/* Gateway — first and largest option */}
        <button
          onClick={tapGateway}
          className="w-full rounded-2xl border-2 px-6 py-5 text-left transition-colors"
          style={{
            borderColor: doesNotApply ? '#f59e0b' : '#e2e8f0',
            backgroundColor: doesNotApply ? '#fef3c7' : '#ffffff',
          }}
        >
          <span
            className="text-lg font-semibold"
            style={{ color: doesNotApply ? '#b45309' : '#334155' }}
          >
            Doesn't apply to me
          </span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-sm text-slate-400">or answer below</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Q6: Menstrual cycle */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Menstrual cycle
          </p>
          {Q6_OPTIONS.map(opt => {
            const isSelected = menstrual === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => tapQ6(opt.value)}
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
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Q7: Recent pregnancy */}
        <div className="flex flex-col gap-3 pb-4">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Recent pregnancy
          </p>
          {Q7_OPTIONS.map(opt => {
            const isSelected = pregnancy === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => tapQ7(opt.value)}
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
