'use client';

import { useState, useMemo, useEffect } from 'react';
import { useIntakeStore, computeCompleteness } from '@/lib/intake-store';
import { CardScrollArea } from '@/components/card-scroll-area';
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
import { Q12ProductsGateway } from '@/components/questions/q12-products-gateway';
import { Q12ProductsWhich } from '@/components/questions/q12-products-which';
import { makeQ12ProductDetail } from '@/components/questions/q12-product-detail';
import { Q13ProceduresGateway } from '@/components/questions/q13-procedures-gateway';
import { Q13ProceduresWhich } from '@/components/questions/q13-procedures-which';
import { makeQ13ProcedureDetail } from '@/components/questions/q13-procedure-detail';
import { Q14SideEffects } from '@/components/questions/q14-side-effects';
import { Q14Describe } from '@/components/questions/q14-describe';
import { Q15SampleType } from '@/components/questions/q15-sample-type';
import { Q16Consent } from '@/components/questions/q16-consent';
import { CompletionScreen } from '@/components/completion-screen';
import type { Products, Procedures, IntakeForm } from '@/lib/types';

type CardSpec = { id: string; component: React.FC };

// Row order matches lib/schema.json exactly — this drives both the "which
// products/procedures" pickers and the order their detail cards appear in.
const PRODUCT_ROWS: { key: keyof Products; label: string }[] = [
  { key: 'otc_medicated_shampoos', label: 'OTC/Medicated Shampoos' },
  { key: 'hair_oils_serums', label: 'Hair Oils/Serums' },
  { key: 'topical_minoxidil', label: 'Topical Minoxidil' },
  { key: 'oral_minoxidil', label: 'Oral Minoxidil' },
  { key: 'supplements', label: 'Supplements' },
];

const PROCEDURE_ROWS: { key: keyof Procedures; label: string }[] = [
  { key: 'prp_gfc_iprf', label: 'PRP/GFC/iPRF' },
  { key: 'stem_cells_exosomes', label: 'Stem Cells/Exosomes' },
  { key: 'hair_transplant', label: 'Hair Transplant' },
  { key: 'other', label: 'Other' },
];

// Detail-card components are created once at module scope (not inside
// buildCards) so their identity stays stable across re-renders — recreating
// a component function per render would remount the active card on every
// unrelated store update.
const PRODUCT_DETAIL_CARDS = Object.fromEntries(
  PRODUCT_ROWS.map(({ key, label }) => [key, makeQ12ProductDetail(key, label)])
) as unknown as Record<keyof Products, React.FC>;

const PROCEDURE_DETAIL_CARDS = Object.fromEntries(
  PROCEDURE_ROWS.map(({ key, label }) => [key, makeQ13ProcedureDetail(key, label)])
) as unknown as Record<keyof Procedures, React.FC>;

// Conditional cards (q11-severity, q11-salon-detail, and the Q12/Q13/Q14
// follow-ups) are inserted into the sequence only when their parent answer
// warrants them. This lets the shell stay a flat array while still giving
// each sub-question its own navigated step.
function buildCards(
  smoking: boolean | null,
  salon: boolean | null,
  productsGateway: boolean | null,
  products: IntakeForm['products'],
  proceduresGateway: boolean | null,
  procedures: IntakeForm['procedures'],
  pastTreatmentSideEffects: boolean | null
): CardSpec[] {
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

  cards.push({ id: 'q12-gateway', component: Q12ProductsGateway });

  if (productsGateway === true) {
    cards.push({ id: 'q12-which', component: Q12ProductsWhich });
    for (const { key } of PRODUCT_ROWS) {
      if (products[key].used === true) {
        cards.push({ id: `q12-detail-${key}`, component: PRODUCT_DETAIL_CARDS[key] });
      }
    }
  }

  cards.push({ id: 'q13-gateway', component: Q13ProceduresGateway });

  if (proceduresGateway === true) {
    cards.push({ id: 'q13-which', component: Q13ProceduresWhich });
    for (const { key } of PROCEDURE_ROWS) {
      if (procedures[key].done === true) {
        cards.push({ id: `q13-detail-${key}`, component: PROCEDURE_DETAIL_CARDS[key] });
      }
    }
  }

  cards.push({ id: 'q14', component: Q14SideEffects });

  if (pastTreatmentSideEffects === true) {
    cards.push({ id: 'q14-describe', component: Q14Describe });
  }

  cards.push(
    { id: 'q15', component: Q15SampleType },
    { id: 'q16', component: Q16Consent },
  );

  return cards;
}

type Direction = 'forward' | 'back';

export function IntakeShell() {
  const progressPct = useIntakeStore(s =>
    Math.round(computeCompleteness(s.form, s.provenance).fraction * 100)
  );
  const smoking = useIntakeStore(s => s.form.habits.smoking);
  const salon = useIntakeStore(s => s.form.habits.salon_treatments);
  const productsGateway = useIntakeStore(s => s.productsGateway);
  const products = useIntakeStore(s => s.form.products);
  const proceduresGateway = useIntakeStore(s => s.proceduresGateway);
  const procedures = useIntakeStore(s => s.form.procedures);
  const pastTreatmentSideEffects = useIntakeStore(s => s.form.past_treatment_side_effects);

  const cards = useMemo(
    () =>
      buildCards(
        smoking,
        salon,
        productsGateway,
        products,
        proceduresGateway,
        procedures,
        pastTreatmentSideEffects
      ),
    [smoking, salon, productsGateway, products, proceduresGateway, procedures, pastTreatmentSideEffects]
  );

  const [currentId, setCurrentId] = useState<string>(cards[0].id);
  const [prevId, setPrevId] = useState<string | null>(null);
  const [direction, setDirection] = useState<Direction>('forward');
  const [isAnimating, setIsAnimating] = useState(false);
  const [completed, setCompleted] = useState(false);

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
    if (isAnimating || currentIdx < 0) return;
    if (isLast) {
      setCompleted(true);
      return;
    }
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

  if (completed) {
    return <CompletionScreen />;
  }

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
            <CardScrollArea>
              <PrevCard />
            </CardScrollArea>
          </div>
        )}
        {CurrentCard && (
          <div
            key={`enter-${currentId}`}
            className={`absolute inset-0 ${prevId !== null ? enterClass : ''}`}
            onAnimationEnd={handleAnimationEnd}
          >
            <CardScrollArea>
              <CurrentCard />
            </CardScrollArea>
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
