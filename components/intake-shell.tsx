'use client';

import { useState } from 'react';
import { useIntakeStore, completenessSelector } from '@/lib/intake-store';

const PLACEHOLDER_CARDS = [
  {
    qNum: 1,
    question: 'How old were you when you first noticed your hair thinning?',
    hint: 'Think about when you first noticed changes — even subtle ones count.',
  },
  {
    qNum: 2,
    question: 'How long has the hair loss been going on?',
    hint: 'A rough estimate is fine.',
  },
];

type Direction = 'forward' | 'back';

function CardContent({ card }: { card: (typeof PLACEHOLDER_CARDS)[number] }) {
  return (
    <div className="flex flex-col h-full px-4 py-10 bg-slate-50">
      <div className="flex-1 flex flex-col justify-center gap-5 max-w-sm mx-auto w-full">
        <p className="text-sm font-medium tracking-wide text-sky-600">
          Question {card.qNum} of {PLACEHOLDER_CARDS.length}
        </p>
        <h2
          className="text-xl font-semibold leading-snug text-slate-800"
          style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
        >
          {card.question}
        </h2>
        <p className="text-base text-slate-500 leading-relaxed">{card.hint}</p>
        {/* Placeholder control — replace with real input per question */}
        <div className="h-14 rounded-2xl bg-slate-100 flex items-center px-4 text-slate-400 text-base select-none">
          Tap to answer
        </div>
      </div>
    </div>
  );
}

export function IntakeShell() {
  const completeness = useIntakeStore(completenessSelector);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState<number | null>(null);
  const [direction, setDirection] = useState<Direction>('forward');
  const [isAnimating, setIsAnimating] = useState(false);

  const total = PLACEHOLDER_CARDS.length;
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === total - 1;

  function advance() {
    if (isAnimating || isLast) return;
    setDirection('forward');
    setPrevIdx(currentIdx);
    setCurrentIdx(idx => idx + 1);
    setIsAnimating(true);
  }

  function retreat() {
    if (isAnimating || isFirst) return;
    setDirection('back');
    setPrevIdx(currentIdx);
    setCurrentIdx(idx => idx - 1);
    setIsAnimating(true);
  }

  function handleAnimationEnd() {
    setPrevIdx(null);
    setIsAnimating(false);
  }

  const progressPct = Math.round(completeness.fraction * 100);
  const exitClass = direction === 'forward' ? 'slide-out-left' : 'slide-out-right';
  const enterClass = direction === 'forward' ? 'slide-in-right' : 'slide-in-left';

  return (
    <div className="relative flex flex-col h-dvh overflow-hidden bg-slate-50">
      {/* Progress bar */}
      <div className="relative h-1 bg-slate-200 shrink-0 z-10">
        <div
          className="absolute inset-y-0 left-0 bg-sky-500"
          style={{ width: `${progressPct}%`, transition: 'width 500ms ease-out' }}
        />
      </div>

      {/* Card viewport — clips cards during the slide */}
      <div className="relative flex-1 overflow-hidden">
        {prevIdx !== null && (
          <div key={`exit-${prevIdx}`} className={`absolute inset-0 ${exitClass}`}>
            <CardContent card={PLACEHOLDER_CARDS[prevIdx]} />
          </div>
        )}
        <div
          key={`enter-${currentIdx}`}
          className={`absolute inset-0 ${prevIdx !== null ? enterClass : ''}`}
          onAnimationEnd={handleAnimationEnd}
        >
          <CardContent card={PLACEHOLDER_CARDS[currentIdx]} />
        </div>
      </div>

      {/* Bottom controls — always visible, nothing to reach for */}
      <div
        className="shrink-0 bg-white border-t border-slate-100 px-4 pt-4"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex gap-3 max-w-sm mx-auto">
          <button
            onClick={retreat}
            disabled={isFirst || isAnimating}
            aria-label="Go back"
            className="flex items-center justify-center w-14 h-14 rounded-xl border border-slate-200 text-slate-500 text-lg shrink-0 transition-opacity disabled:opacity-30"
          >
            ←
          </button>
          <button
            onClick={advance}
            disabled={isAnimating}
            className="flex-1 h-14 rounded-xl font-medium text-base text-white bg-sky-500 transition-colors active:bg-sky-600 disabled:opacity-60"
          >
            {isLast ? 'Done' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
