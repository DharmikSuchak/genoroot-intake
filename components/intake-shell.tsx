'use client';

import { useState, useMemo, useEffect } from 'react';
import { useIntakeStore, computeCompleteness } from '@/lib/intake-store';
import { Q1Age } from '@/components/questions/q1-age';
import { Q2Duration } from '@/components/questions/q2-duration';
import { Q3Family } from '@/components/questions/q3-family';
import { Q4Pattern } from '@/components/questions/q4-pattern';
import { Q5Conditions } from '@/components/questions/q5-conditions';
import { Q67Hormonal } from '@/components/questions/q67-hormonal';
import { Q8Acne } from '@/components/questions/q8-acne';
import { Q9Hair } from '@/components/questions/q9-hair';
import { Q10Triggers } from '@/components/questions/q10-triggers';
import { Q11Smoking } from '@/components/questions/q11-smoking';
import { Q11Severity } from '@/components/questions/q11-severity';
import { Q11Alcohol } from '@/components/questions/q11-alcohol';
import { Q11HardWater } from '@/components/questions/q11-hardwater';
import { Q11WashFreq } from '@/components/questions/q11-washfreq';
import { Q11Heating } from '@/components/questions/q11-heating';
import { Q11Salon } from '@/components/questions/q11-salon';
import { Q11SalonDetail } from '@/components/questions/q11-salon-detail';

type CardSpec = { id: string; component: React.FC };

// Conditional cards (q11-severity, q11-salon-detail) are inserted into the
// sequence only when their parent answer is 'true'. This lets the shell stay
// a flat array while still giving each habit its own navigated step.
function buildCards(smoking: boolean | null, salon: boolean | null): CardSpec[] {
  const cards: CardSpec[] = [
    { id: 'q1', component: Q1Age },
    { id: 'q2', component: Q2Duration },
    { id: 'q3', component: Q3Family },
    { id: 'q4', component: Q4Pattern },
    { id: 'q5', component: Q5Conditions },
    { id: 'q67', component: Q67Hormonal },
    { id: 'q8', component: Q8Acne },
    { id: 'q9', component: Q9Hair },
    { id: 'q10', component: Q10Triggers },
    { id: 'q11-smoking', component: Q11Smoking },
  ];

  if (smoking === true) {
    cards.push({ id: 'q11-severity', component: Q11Severity });
  }

  cards.push(
    { id: 'q11-alcohol', component: Q11Alcohol },
    { id: 'q11-hardwater', component: Q11HardWater },
    { id: 'q11-washfreq', component: Q11WashFreq },
    { id: 'q11-heating', component: Q11Heating },
    { id: 'q11-salon', component: Q11Salon },
  );

  if (salon === true) {
    cards.push({ id: 'q11-salon-detail', component: Q11SalonDetail });
  }

  return cards;
}

type Direction = 'forward' | 'back';

export function IntakeShell() {
  const progressPct = useIntakeStore(s =>
    Math.round(computeCompleteness(s.form, s.provenance).fraction * 100)
  );
  const smoking = useIntakeStore(s => s.form.habits.smoking);
  const salon = useIntakeStore(s => s.form.habits.salon_treatments);

  const cards = useMemo(() => buildCards(smoking, salon), [smoking, salon]);

  const [currentId, setCurrentId] = useState<string>(cards[0].id);
  const [prevId, setPrevId] = useState<string | null>(null);
  const [direction, setDirection] = useState<Direction>('forward');
  const [isAnimating, setIsAnimating] = useState(false);

  const currentIdx = cards.findIndex(c => c.id === currentId);

  // Guard: if the active card was removed (e.g. smoking changed to false while
  // still on the severity card — shouldn't happen in normal flow but safe to handle).
  useEffect(() => {
    if (currentIdx < 0) {
      setCurrentId(cards[Math.max(0, cards.length - 1)].id);
      setPrevId(null);
      setIsAnimating(false);
    }
  }, [cards, currentIdx]);

  const isFirst = currentIdx <= 0;
  const isLast = currentIdx >= cards.length - 1;

  function advance() {
    if (isAnimating || isLast || currentIdx < 0) return;
    setDirection('forward');
    setPrevId(currentId);
    setCurrentId(cards[currentIdx + 1].id);
    setIsAnimating(true);
  }

  function retreat() {
    if (isAnimating || isFirst || currentIdx < 0) return;
    setDirection('back');
    setPrevId(currentId);
    setCurrentId(cards[currentIdx - 1].id);
    setIsAnimating(true);
  }

  function handleAnimationEnd() {
    setPrevId(null);
    setIsAnimating(false);
  }

  const exitClass = direction === 'forward' ? 'slide-out-left' : 'slide-out-right';
  const enterClass = direction === 'forward' ? 'slide-in-right' : 'slide-in-left';

  const CurrentCard = cards[currentIdx]?.component ?? null;
  const PrevCard = prevId !== null ? (cards.find(c => c.id === prevId)?.component ?? null) : null;

  return (
    <div className="relative flex flex-col h-dvh overflow-hidden bg-slate-50">
      {/* Progress bar */}
      <div className="relative h-1 bg-slate-200 shrink-0 z-10">
        <div
          className="absolute inset-y-0 left-0 bg-sky-500"
          style={{ width: `${progressPct}%`, transition: 'width 500ms ease-out' }}
        />
      </div>

      {/* Card viewport */}
      <div className="relative flex-1 overflow-hidden">
        {PrevCard && (
          <div key={`exit-${prevId}`} className={`absolute inset-0 ${exitClass}`}>
            <PrevCard />
          </div>
        )}
        {CurrentCard && (
          <div
            key={`enter-${currentId}`}
            className={`absolute inset-0 ${prevId !== null ? enterClass : ''}`}
            onAnimationEnd={handleAnimationEnd}
          >
            <CurrentCard />
          </div>
        )}
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
