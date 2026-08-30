'use client';

import { useState } from 'react';
import { useIntakeStore, computeCompleteness } from '@/lib/intake-store';
import { Q1Age } from '@/components/questions/q1-age';
import { Q2Duration } from '@/components/questions/q2-duration';
import { Q3Family } from '@/components/questions/q3-family';
import { Q4Pattern } from '@/components/questions/q4-pattern';

const CARDS = [Q1Age, Q2Duration, Q3Family, Q4Pattern];

type Direction = 'forward' | 'back';

export function IntakeShell() {
  // Return a primitive so Object.is comparison is stable — avoids the
  // "getServerSnapshot result should be cached" infinite-loop error.
  const progressPct = useIntakeStore(s =>
    Math.round(computeCompleteness(s.form, s.provenance).fraction * 100)
  );

  const [currentIdx, setCurrentIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState<number | null>(null);
  const [direction, setDirection] = useState<Direction>('forward');
  const [isAnimating, setIsAnimating] = useState(false);

  const total = CARDS.length;
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

  const exitClass = direction === 'forward' ? 'slide-out-left' : 'slide-out-right';
  const enterClass = direction === 'forward' ? 'slide-in-right' : 'slide-in-left';

  const CurrentCard = CARDS[currentIdx];
  const PrevCard = prevIdx !== null ? CARDS[prevIdx] : null;

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
        {PrevCard && (
          <div key={`exit-${prevIdx}`} className={`absolute inset-0 ${exitClass}`}>
            <PrevCard />
          </div>
        )}
        <div
          key={`enter-${currentIdx}`}
          className={`absolute inset-0 ${prevIdx !== null ? enterClass : ''}`}
          onAnimationEnd={handleAnimationEnd}
        >
          <CurrentCard />
        </div>
      </div>

      {/* Bottom controls */}
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
