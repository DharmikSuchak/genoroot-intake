'use client';

import { useIntakeStore } from '@/lib/intake-store';

export function Q12ProductsGateway() {
  const value = useIntakeStore(s => s.productsGateway);
  const setProductsGateway = useIntakeStore(s => s.setProductsGateway);

  function tap(answer: boolean) {
    setProductsGateway(value === answer ? null : answer);
  }

  return (
    <div className="flex flex-col min-h-full px-4 py-8 bg-slate-50">
      <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium tracking-wide text-sky-600">Question 12 of 16</p>
          <h2
            className="text-xl font-semibold text-slate-800 leading-snug"
            style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
          >
            Have you used any hair products or treatments at home?
          </h2>
          <p className="text-base text-slate-500">
            Shampoos, oils, minoxidil, supplements: anything you've tried yourself.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {([true, false] as const).map(answer => {
            const isSelected = value === answer;
            return (
              <button
                key={String(answer)}
                onClick={() => tap(answer)}
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
}
