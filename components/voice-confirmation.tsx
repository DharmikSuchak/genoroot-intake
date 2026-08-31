'use client';

import type { AppliedSpokenSummary, SpokenFieldKey } from '@/lib/intake-store';
import { PRODUCT_ROWS } from '@/lib/product-labels';

interface VoiceConfirmationProps {
  summary: AppliedSpokenSummary;
  onContinue: () => void;
  onCorrect: (key: SpokenFieldKey) => void;
}

const PRODUCT_LABEL_BY_KEY = Object.fromEntries(PRODUCT_ROWS.map(r => [r.key, r.label]));

function describeRow(key: SpokenFieldKey, summary: AppliedSpokenSummary): { label: string; detail: string } | null {
  switch (key) {
    case 'age_hair_loss_began':
      return summary.age_hair_loss_began === undefined
        ? null
        : { label: 'When it started', detail: `${summary.age_hair_loss_began} years old` };
    case 'duration':
      return summary.duration === undefined ? null : { label: 'How long', detail: summary.duration };
    case 'family_history':
      return !summary.family_history?.length
        ? null
        : { label: 'Family history', detail: summary.family_history.join(', ') };
    case 'pattern':
      return !summary.pattern?.length
        ? null
        : { label: 'What it looks like', detail: summary.pattern.join(', ') };
    case 'past_6_months':
      return !summary.past_6_months?.length
        ? null
        : { label: 'Recent triggers', detail: summary.past_6_months.join(', ') };
    case 'products':
      return !summary.products?.length
        ? null
        : {
            label: "Products you've used",
            detail: summary.products.map(k => PRODUCT_LABEL_BY_KEY[k]).join(', '),
          };
  }
}

const ROW_ORDER: SpokenFieldKey[] = [
  'age_hair_loss_began',
  'duration',
  'family_history',
  'pattern',
  'past_6_months',
  'products',
];

export function VoiceConfirmation({ summary, onContinue, onCorrect }: VoiceConfirmationProps) {
  const rows = ROW_ORDER.map(key => ({ key, row: describeRow(key, summary) })).filter(
    (r): r is { key: SpokenFieldKey; row: { label: string; detail: string } } => r.row !== null
  );

  return (
    <div className="flex flex-col min-h-full px-4 py-8 bg-slate-50">
      <div className="max-w-sm mx-auto w-full flex flex-col gap-6 flex-1">
        <div className="flex flex-col gap-3">
          <h2
            className="text-xl font-semibold text-slate-800 leading-snug"
            style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
          >
            Here&apos;s what I caught
          </h2>
          <p className="text-base text-slate-500">Tap anything that&apos;s not quite right to fix it.</p>
        </div>

        <div className="flex flex-col gap-3">
          {rows.map(({ key, row }) => (
            <button
              key={key}
              onClick={() => onCorrect(key)}
              className="flex items-start justify-between gap-3 w-full min-h-[56px] rounded-2xl border-2 px-5 py-4 text-left transition-colors"
              style={{ borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}
            >
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  {row.label}
                </span>
                <span className="text-base font-medium text-slate-800">{row.detail}</span>
              </span>
              <span className="text-sm text-sky-600 shrink-0 pt-1">Edit</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onContinue}
        className="w-full h-14 rounded-xl font-medium text-base text-white bg-sky-500 active:bg-sky-600 transition-colors"
      >
        Continue
      </button>
    </div>
  );
}
