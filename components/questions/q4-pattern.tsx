'use client';

import { useIntakeStore } from '@/lib/intake-store';
import type { PatternOption } from '@/lib/types';

// ---------------------------------------------------------------------------
// SVG illustrations — top-down head view, 64×64 viewBox
// Top of SVG = front of head (forehead). All use clipPath for clean edges.
// ---------------------------------------------------------------------------

function RecedingHairlineSvg() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <clipPath id="q4-c1">
          <circle cx="32" cy="36" r="24" />
        </clipPath>
      </defs>
      {/* Scalp base */}
      <circle cx="32" cy="36" r="24" fill="#f1f5f9" />
      {/* Full hair body */}
      <circle cx="32" cy="36" r="24" fill="#1e293b" />
      {/* Left temple recession */}
      <ellipse
        cx="16" cy="20" rx="13" ry="10"
        fill="#f1f5f9"
        transform="rotate(-20 16 20)"
        clipPath="url(#q4-c1)"
      />
      {/* Right temple recession */}
      <ellipse
        cx="48" cy="20" rx="13" ry="10"
        fill="#f1f5f9"
        transform="rotate(20 48 20)"
        clipPath="url(#q4-c1)"
      />
      {/* Head outline */}
      <circle cx="32" cy="36" r="24" stroke="#94a3b8" strokeWidth="1.5" />
    </svg>
  );
}

function ThinningAtCrownSvg() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      {/* Full hair */}
      <circle cx="32" cy="36" r="24" fill="#1e293b" />
      {/* Crown thinning — concentric lighter spot offset toward top (crown = center-top) */}
      <circle cx="32" cy="30" r="11" fill="#64748b" />
      <circle cx="32" cy="30" r="6" fill="#94a3b8" />
      {/* Head outline */}
      <circle cx="32" cy="36" r="24" stroke="#94a3b8" strokeWidth="1.5" />
    </svg>
  );
}

function WideningPartLineSvg() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <clipPath id="q4-c3">
          <circle cx="32" cy="36" r="24" />
        </clipPath>
      </defs>
      {/* Full hair */}
      <circle cx="32" cy="36" r="24" fill="#1e293b" />
      {/* Wide part line running front-to-back (vertical strip through center) */}
      <rect x="26" y="12" width="12" height="48" fill="#f1f5f9" clipPath="url(#q4-c3)" />
      {/* Soften edges of the part line */}
      <rect x="28" y="12" width="8" height="48" fill="#e2e8f0" clipPath="url(#q4-c3)" />
      {/* Head outline */}
      <circle cx="32" cy="36" r="24" stroke="#94a3b8" strokeWidth="1.5" />
    </svg>
  );
}

function DiffuseThinning() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <pattern id="q4-p4" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.8" fill="#334155" />
        </pattern>
        <clipPath id="q4-c4">
          <circle cx="32" cy="36" r="24" />
        </clipPath>
      </defs>
      {/* Scalp base */}
      <circle cx="32" cy="36" r="24" fill="#f1f5f9" />
      {/* Stippled hair — uniform dots represent sparse/thin coverage */}
      <circle cx="32" cy="36" r="24" fill="url(#q4-p4)" clipPath="url(#q4-c4)" />
      {/* Head outline */}
      <circle cx="32" cy="36" r="24" stroke="#94a3b8" strokeWidth="1.5" />
    </svg>
  );
}

function PatchyLossSvg() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <clipPath id="q4-c5">
          <circle cx="32" cy="36" r="24" />
        </clipPath>
      </defs>
      {/* Full hair */}
      <circle cx="32" cy="36" r="24" fill="#1e293b" />
      {/* Irregular bald patches */}
      <ellipse cx="24" cy="28" rx="8" ry="7" fill="#f1f5f9" clipPath="url(#q4-c5)" />
      <ellipse cx="42" cy="40" rx="7" ry="9" fill="#f1f5f9" clipPath="url(#q4-c5)" />
      <circle cx="28" cy="48" r="5" fill="#f1f5f9" clipPath="url(#q4-c5)" />
      {/* Head outline */}
      <circle cx="32" cy="36" r="24" stroke="#94a3b8" strokeWidth="1.5" />
    </svg>
  );
}

function ExcessiveSheddingSvg() {
  return (
    <svg viewBox="0 0 72 72" fill="none" aria-hidden="true">
      {/* Head with slightly thinned hair */}
      <circle cx="36" cy="40" r="22" fill="#334155" />
      {/* Hair strands falling out — short curved lines radiating from the head */}
      <path d="M 16 28 Q 7 22 9 12" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 25 14 Q 23 5 28 2" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 36 14 Q 36 5 38 1" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 47 14 Q 51 5 56 5" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 56 28 Q 65 22 67 12" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 58 42 Q 68 40 70 34" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 14 42 Q 4 40 2 34" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
      {/* Head outline */}
      <circle cx="36" cy="40" r="22" stroke="#94a3b8" strokeWidth="1.5" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Pattern data
// ---------------------------------------------------------------------------

const PATTERNS: { value: PatternOption; label: string; Svg: React.FC }[] = [
  { value: 'Receding hairline', label: 'Receding hairline', Svg: RecedingHairlineSvg },
  { value: 'Thinning at crown', label: 'Thinning at crown', Svg: ThinningAtCrownSvg },
  { value: 'Widening part line', label: 'Widening part line', Svg: WideningPartLineSvg },
  { value: 'Diffuse thinning', label: 'Diffuse thinning', Svg: DiffuseThinning },
  { value: 'Patchy loss', label: 'Patchy loss', Svg: PatchyLossSvg },
  { value: 'Sudden excessive shedding', label: 'Excessive shedding', Svg: ExcessiveSheddingSvg },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Q4Pattern() {
  const selected = useIntakeStore(s => s.form.pattern);
  const setField = useIntakeStore(s => s.setField);

  function toggle(value: PatternOption) {
    const next = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value];
    setField('pattern', next, 'tapped');
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      <div className="px-4 pt-8 pb-4 max-w-sm mx-auto w-full">
        <div className="flex flex-col gap-3 mb-6">
          <p className="text-sm font-medium tracking-wide text-sky-600">Question 4 of 16</p>
          <h2
            className="text-xl font-semibold text-slate-800 leading-snug"
            style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
          >
            Which of these pictures matches your hair loss?
          </h2>
          <p className="text-base text-slate-500">Tap all that apply.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-4">
          {PATTERNS.map(({ value, label, Svg }) => {
            const isSelected = selected.includes(value);
            return (
              <button
                key={value}
                onClick={() => toggle(value)}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 p-3 bg-white transition-colors text-center"
                style={{
                  borderColor: isSelected ? '#0ea5e9' : '#e2e8f0',
                  backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                  boxShadow: isSelected
                    ? '0 0 0 1px rgba(14,165,233,0.15), 0 2px 8px rgba(14,165,233,0.08)'
                    : '0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div className="w-full aspect-square flex items-center justify-center">
                  <Svg />
                </div>
                <span
                  className="text-sm font-medium leading-tight"
                  style={{ color: isSelected ? '#0369a1' : '#475569' }}
                >
                  {label}
                </span>
                {isSelected && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500 shrink-0">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4l2.5 2.5L9 1"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
