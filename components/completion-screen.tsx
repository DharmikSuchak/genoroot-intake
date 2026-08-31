'use client';

import { useMemo } from 'react';
import { useIntakeStore, summarizeProvenance } from '@/lib/intake-store';
import { generateSummary, findContradictions } from '@/lib/doctor-summary';
import { IntakeFormSchema } from '@/lib/validation';

function formatIssuePath(path: PropertyKey[]): string {
  return path.length > 0 ? path.map(String).join(' → ') : 'form';
}

function provenanceLine(counts: { tapped: number; spoken: number; inferredOrConfirmed: number }): string {
  const parts: string[] = [];
  if (counts.tapped > 0) parts.push(`${counts.tapped} answer${counts.tapped === 1 ? '' : 's'} tapped`);
  if (counts.spoken > 0) parts.push(`${counts.spoken} from what you said`);
  if (counts.inferredOrConfirmed > 0) {
    parts.push(`${counts.inferredOrConfirmed} inferred and confirmed`);
  }
  return parts.join(', ') + '.';
}

interface CompletionScreenProps {
  unansweredCount: number;
  onJumpToUnanswered: () => void;
}

export function CompletionScreen({ unansweredCount, onJumpToUnanswered }: CompletionScreenProps) {
  const getFilledForm = useIntakeStore(s => s.getFilledForm);
  const form = useIntakeStore(s => s.form);
  const provenance = useIntakeStore(s => s.provenance);

  const json = useMemo(() => JSON.stringify(getFilledForm(), null, 2), [getFilledForm, form]);
  const summarySentences = useMemo(() => generateSummary(form), [form]);
  const contradictions = useMemo(() => findContradictions(form), [form]);
  const provenanceCounts = useMemo(() => summarizeProvenance(provenance), [provenance]);
  const validation = useMemo(
    () => IntakeFormSchema.safeParse(getFilledForm()),
    [getFilledForm, form]
  );

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
            Thanks. Your doctor will review this before your visit.
          </p>
        </div>

        {unansweredCount > 0 && (
          <button
            onClick={onJumpToUnanswered}
            className="flex items-center w-full min-h-[56px] rounded-2xl px-4 py-3 text-left text-base leading-snug transition-colors"
            style={{ backgroundColor: '#fef3c7', color: '#b45309' }}
          >
            {unansweredCount} question{unansweredCount === 1 ? '' : 's'} left unanswered.
            Tap to go back and fill {unansweredCount === 1 ? 'it' : 'them'} in.
          </button>
        )}

        {summarySentences.length > 0 && (
          <div
            className="rounded-2xl bg-white p-4"
            style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Doctor summary
            </h3>
            <p className="text-base text-slate-700 leading-relaxed">
              {summarySentences.join(' ')}
            </p>
          </div>
        )}

        {contradictions.length > 0 && (
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: '#fef3c7' }}
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: '#b45309' }}>
              Worth double-checking
            </h3>
            <ul className="flex flex-col gap-1.5">
              {contradictions.map((flag, i) => (
                <li key={i} className="text-base leading-relaxed" style={{ color: '#b45309' }}>
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-sm text-slate-500 text-center">{provenanceLine(provenanceCounts)}</p>

        {validation.success ? (
          <p className="text-sm text-center" style={{ color: '#15803d' }}>
            ✓ This form validates against the schema.
          </p>
        ) : (
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#fee2e2' }}>
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: '#dc2626' }}>
              Doesn&apos;t match the schema
            </h3>
            <ul className="flex flex-col gap-1.5">
              {validation.error.issues.map((issue, i) => (
                <li key={i} className="text-base leading-relaxed" style={{ color: '#dc2626' }}>
                  {formatIssuePath(issue.path)}: {issue.message}
                </li>
              ))}
            </ul>
          </div>
        )}

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
