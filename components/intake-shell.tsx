'use client';

import { useState, useMemo, useEffect } from 'react';
import { useIntakeStore, getUnansweredQuestionIndexes } from '@/lib/intake-store';
import { CardScrollArea } from '@/components/card-scroll-area';
import { StepProvider } from '@/components/step-context';
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
import { VoiceOpening } from '@/components/questions/voice-opening';
import { VoiceSuccess } from '@/components/voice-success';
import { PRODUCT_ROWS } from '@/lib/product-labels';
import type { Products, Procedures, IntakeForm } from '@/lib/types';
import type { SpokenFieldInput } from '@/lib/voice-schema';

type CardSpec = { id: string; component: React.FC; questionNum: number; questionSpan?: number; suffix?: string };

// Row order matches lib/schema.json exactly — this drives both the "which
// procedures" picker and the order its detail cards appear in.
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
//
// The voiceScoped* flags skip a card outright once the opening/second voice
// capture has already answered it (provenance 'spoken') — never for a
// tapped answer, so normal tap-through navigation is untouched.
function buildCards(
  smoking: boolean | null,
  salon: boolean | null,
  productsGateway: boolean | null,
  products: IntakeForm['products'],
  proceduresGateway: boolean | null,
  procedures: IntakeForm['procedures'],
  pastTreatmentSideEffects: boolean | null
): CardSpec[] {
  const cards: CardSpec[] = [];

  cards.push(
    { id: 'q1', component: Q1Age, questionNum: 1 },
    { id: 'q2', component: Q2Duration, questionNum: 2 },
    { id: 'q3', component: Q3Family, questionNum: 3 },
    { id: 'q4', component: Q4Pattern, questionNum: 4 },
  );

  cards.push(
    { id: 'q5', component: Q5Conditions, questionNum: 5 },
    { id: 'q67', component: Q67Hormonal, questionNum: 6, questionSpan: 2 },
    { id: 'q8', component: Q8Acne, questionNum: 8 },
    { id: 'q9', component: Q9Hair, questionNum: 9 },
  );

  cards.push({ id: 'q10', component: Q10Triggers, questionNum: 10 });

  cards.push({ id: 'q11-smoking', component: Q11Smoking, questionNum: 11, suffix: 'Habits' });

  if (smoking === true) {
    cards.push({ id: 'q11-severity', component: Q11Severity, questionNum: 11, suffix: 'Habits' });
  }

  cards.push(
    { id: 'q11-alcohol', component: Q11Alcohol, questionNum: 11, suffix: 'Habits' },
    { id: 'q11-hardwater', component: Q11HardWater, questionNum: 11, suffix: 'Habits' },
    { id: 'q11-washfreq', component: Q11WashFreq, questionNum: 11, suffix: 'Habits' },
    { id: 'q11-heating', component: Q11Heating, questionNum: 11, suffix: 'Habits' },
    { id: 'q11-salon', component: Q11Salon, questionNum: 11, suffix: 'Habits' },
  );

  if (salon === true) {
    cards.push({ id: 'q11-salon-detail', component: Q11SalonDetail, questionNum: 11, suffix: 'Habits' });
  }

  cards.push({ id: 'q12-gateway', component: Q12ProductsGateway, questionNum: 12 });
  if (productsGateway === true) {
    cards.push({ id: 'q12-which', component: Q12ProductsWhich, questionNum: 12, suffix: 'Products' });
  }

  // Detail cards (duration/helped/side-effects) —
  // they always show for any row marked used, regardless of how "used" got set.
  if (productsGateway === true) {
    for (const { key } of PRODUCT_ROWS) {
      if (products[key].used === true) {
        cards.push({ id: `q12-detail-${key}`, component: PRODUCT_DETAIL_CARDS[key], questionNum: 12, suffix: 'Products' });
      }
    }
  }

  cards.push({ id: 'q13-gateway', component: Q13ProceduresGateway, questionNum: 13 });

  if (proceduresGateway === true) {
    cards.push({ id: 'q13-which', component: Q13ProceduresWhich, questionNum: 13, suffix: 'Procedures' });
    for (const { key } of PROCEDURE_ROWS) {
      if (procedures[key].done === true) {
        cards.push({ id: `q13-detail-${key}`, component: PROCEDURE_DETAIL_CARDS[key], questionNum: 13, suffix: 'Procedures' });
      }
    }
  }

  cards.push({ id: 'q14', component: Q14SideEffects, questionNum: 14 });

  if (pastTreatmentSideEffects === true) {
    cards.push({ id: 'q14-describe', component: Q14Describe, questionNum: 14 });
  }

  cards.push(
    { id: 'q15', component: Q15SampleType, questionNum: 15 },
    { id: 'q16', component: Q16Consent, questionNum: 16 },
  );

  return cards;
}

/**
 * Counts total question slots in a card array — the "T" shown in
 * "Question N of T". Each distinct questionNum contributes its span
 * (defaults to 1; Q67 contributes 2 since it covers two questions).
 */
function countTotalQuestions(cards: CardSpec[]): number {
  const seen = new Map<number, number>();
  for (const c of cards) {
    if (!seen.has(c.questionNum)) seen.set(c.questionNum, c.questionSpan ?? 1);
  }
  let total = 0;
  for (const span of seen.values()) total += span;
  return total;
}

/**
 * Returns the 1-based step position for the card at `idx`. Each distinct
 * questionNum before this one contributes its span; the current question
 * contributes 1 (its first slot).
 */
function stepForCard(cards: CardSpec[], idx: number): number {
  const seen = new Map<number, number>();
  for (let i = 0; i <= idx; i++) {
    if (!seen.has(cards[i].questionNum)) seen.set(cards[i].questionNum, cards[i].questionSpan ?? 1);
  }
  const keys = [...seen.keys()];
  let step = 0;
  for (let i = 0; i < keys.length - 1; i++) step += seen.get(keys[i])!;
  return step + 1;
}

type Direction = 'forward' | 'back';

type VoicePhase = 'opening' | 'success' | 'done';

// Card id that opens each question, Q1 through Q16 — mirrors the order of
// getUnansweredQuestionIndexes, so the completion screen's "go back" prompt
// can jump straight to the first unanswered one. Q6/Q7 share one card.
const QUESTION_CARD_IDS = [
  'q1', 'q2', 'q3', 'q4', 'q5', 'q67', 'q67', 'q8', 'q9', 'q10',
  'q11-smoking', 'q12-gateway', 'q13-gateway', 'q14', 'q15', 'q16',
];

export function IntakeShell() {
  const smoking = useIntakeStore(s => s.form.habits.smoking);
  const salon = useIntakeStore(s => s.form.habits.salon_treatments);
  const productsGateway = useIntakeStore(s => s.productsGateway);
  const products = useIntakeStore(s => s.form.products);
  const proceduresGateway = useIntakeStore(s => s.proceduresGateway);
  const procedures = useIntakeStore(s => s.form.procedures);
  const pastTreatmentSideEffects = useIntakeStore(s => s.form.past_treatment_side_effects);
  const consent = useIntakeStore(s => s.form.consent);
  const fullForm = useIntakeStore(s => s.form);
  const fullProvenance = useIntakeStore(s => s.provenance);

  const applySpokenFields = useIntakeStore(s => s.applySpokenFields);

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
    [
      smoking,
      salon,
      productsGateway,
      products,
      proceduresGateway,
      procedures,
      pastTreatmentSideEffects,
    ]
  );

  const unansweredIndexes = useMemo(
    () => getUnansweredQuestionIndexes(fullForm, fullProvenance),
    [fullForm, fullProvenance]
  );
  const firstUnansweredCardId =
    unansweredIndexes.length > 0 ? QUESTION_CARD_IDS[unansweredIndexes[0]] : null;

  const [currentId, setCurrentId] = useState<string>(cards[0]?.id ?? 'q5');
  const [prevId, setPrevId] = useState<string | null>(null);
  const [direction, setDirection] = useState<Direction>('forward');
  const [isAnimating, setIsAnimating] = useState(false);
  const [completed, setCompleted] = useState(false);

  const reset = useIntakeStore(s => s.reset);
  const [voicePhase, setVoicePhase] = useState<VoicePhase>('opening');

  // Each new intake session starts with a clean slate — clear any data
  // persisted in localStorage from a prior session so old answers
  // (e.g. "Father had hair loss") never bleed into a new voice capture.
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function enterNormalFlow() {
    setCurrentId(cards[0]?.id ?? 'q1');
    setPrevId(null);
    setIsAnimating(false);
    setVoicePhase('done');
  }

  function handleOpeningCaptured(fields: SpokenFieldInput) {
    applySpokenFields(fields);
    // Always show the success screen — even if nothing was extracted,
    // the patient spoke and deserves acknowledgement before the tap flow.
    setVoicePhase('success');
  }

  function handleJumpToUnanswered() {
    if (!firstUnansweredCardId || !cards.some(c => c.id === firstUnansweredCardId)) return;
    setCompleted(false);
    setDirection('back');
    setPrevId(null);
    setIsAnimating(false);
    setCurrentId(firstUnansweredCardId);
  }

  const currentIdx = cards.findIndex(c => c.id === currentId);
  // Position in the card sequence, not answered-question count — so the bar
  // visibly advances on every "Next" tap, including while stepping through a
  // multi-card question like Q11's habit table.
  const progressPct = cards.length > 0 ? Math.round(((Math.max(currentIdx, 0) + 1) / cards.length) * 100) : 0;

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
  // Consent (Q16) can't be left blank — every other question is skippable,
  // since forcing an answer on a medical intake produces guesses rather
  // than blanks, and a blank is something a doctor can follow up on.
  const onUnansweredConsent = cards[currentIdx]?.id === 'q16' && consent === null;

  function advance() {
    if (isAnimating || currentIdx < 0 || onUnansweredConsent) return;
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
  const currentStep = currentIdx >= 0 ? stepForCard(cards, currentIdx) : 1;
  const currentSuffix = cards[currentIdx]?.suffix;
  const currentSpan = cards[currentIdx]?.questionSpan;
  const totalSteps = countTotalQuestions(cards);

  const prevIdx = prevId !== null ? cards.findIndex(c => c.id === prevId) : -1;
  const PrevCard = prevIdx >= 0 ? cards[prevIdx].component : null;
  const prevStep = prevIdx >= 0 ? stepForCard(cards, prevIdx) : 1;
  const prevSuffix = prevIdx >= 0 ? cards[prevIdx].suffix : undefined;
  const prevSpan = prevIdx >= 0 ? cards[prevIdx].questionSpan : undefined;

  if (voicePhase === 'opening') {
    return <VoiceOpening onSkip={() => enterNormalFlow()} onCaptured={handleOpeningCaptured} />;
  }

  if (voicePhase === 'success') {
    return <VoiceSuccess onContinue={() => enterNormalFlow()} />;
  }

  if (completed) {
    return (
      <CompletionScreen
        unansweredCount={unansweredIndexes.length}
        onJumpToUnanswered={handleJumpToUnanswered}
      />
    );
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
              <StepProvider step={prevStep} total={totalSteps} questionSpan={prevSpan} suffix={prevSuffix}>
                <PrevCard />
              </StepProvider>
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
              <StepProvider step={currentStep} total={totalSteps} questionSpan={currentSpan} suffix={currentSuffix}>
                <CurrentCard />
              </StepProvider>
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
            disabled={isAnimating || onUnansweredConsent}
            className="flex-1 h-14 rounded-xl font-medium text-base text-white bg-sky-500 transition-colors active:bg-sky-600 disabled:opacity-60"
          >
            {isLast ? 'Done' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
