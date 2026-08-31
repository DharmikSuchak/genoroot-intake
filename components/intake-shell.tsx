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
import { VoiceOpening } from '@/components/questions/voice-opening';
import { VoiceSecondCapture } from '@/components/questions/voice-second-capture';
import { VoiceConfirmation } from '@/components/voice-confirmation';
import { PRODUCT_ROWS } from '@/lib/product-labels';
import {
  countVoiceScopedFilled,
  computeVoiceScopedMissing,
  hasVoiceScopedMissing,
  voiceAnswered,
  type AppliedSpokenSummary,
  type SpokenFieldKey,
} from '@/lib/intake-store';
import type { Products, Procedures, IntakeForm, Provenance } from '@/lib/types';
import type { SpokenFieldInput } from '@/lib/voice-schema';

type CardSpec = { id: string; component: React.FC };

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
  pastTreatmentSideEffects: boolean | null,
  voiceScopedAge: boolean,
  voiceScopedDuration: boolean,
  voiceScopedFamilyHistory: boolean,
  voiceScopedPattern: boolean,
  voiceScopedPast6Months: boolean,
  voiceScopedProducts: boolean
): CardSpec[] {
  const cards: CardSpec[] = [];

  if (!voiceScopedAge) cards.push({ id: 'q1', component: Q1Age });
  if (!voiceScopedDuration) cards.push({ id: 'q2', component: Q2Duration });
  if (!voiceScopedFamilyHistory) cards.push({ id: 'q3', component: Q3Family });
  if (!voiceScopedPattern) cards.push({ id: 'q4', component: Q4Pattern });

  cards.push(
    { id: 'q5', component: Q5Conditions },
    { id: 'q67', component: Q67Hormonal },
    { id: 'q8', component: Q8Acne },
    { id: 'q9', component: Q9Hair },
  );

  if (!voiceScopedPast6Months) cards.push({ id: 'q10', component: Q10Triggers });

  cards.push({ id: 'q11-smoking', component: Q11Smoking });

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

  if (!voiceScopedProducts) {
    cards.push({ id: 'q12-gateway', component: Q12ProductsGateway });
    if (productsGateway === true) {
      cards.push({ id: 'q12-which', component: Q12ProductsWhich });
    }
  }

  // Detail cards (duration/helped/side-effects) are never voice-filled —
  // they always show for any row marked used, regardless of how "used" got set.
  if (productsGateway === true) {
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

type VoicePhase = 'opening' | 'confirming' | 'secondary' | 'done';

// Where "tap to correct" on the confirmation card should land the patient.
const CARD_ID_FOR_SPOKEN_FIELD: Record<SpokenFieldKey, string> = {
  age_hair_loss_began: 'q1',
  duration: 'q2',
  family_history: 'q3',
  pattern: 'q4',
  past_6_months: 'q10',
  products: 'q12-gateway',
};

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

  const ageProv = useIntakeStore(s => s.provenance.age_hair_loss_began);
  const durationProv = useIntakeStore(s => s.provenance.duration);
  const familyHistoryProv = useIntakeStore(s => s.provenance.family_history);
  const patternProv = useIntakeStore(s => s.provenance.pattern);
  const past6moProv = useIntakeStore(s => s.provenance.past_6_months);
  const productsProv = useIntakeStore(s => s.provenance.products);

  // voiceAnswered covers 'spoken' (auto-filled), 'inferred' (suggested, not
  // yet confirmed) and 'confirmed' (suggested and accepted) — anything the
  // voice pipeline already has an answer for, so the card doesn't get asked
  // again. Deliberately never matches 'tapped', since that only happens
  // live during the normal flow.
  const voiceScopedAge = voiceAnswered(ageProv);
  const voiceScopedDuration = voiceAnswered(durationProv);
  const voiceScopedFamilyHistory = voiceAnswered(familyHistoryProv);
  const voiceScopedPattern = voiceAnswered(patternProv);
  const voiceScopedPast6Months = voiceAnswered(past6moProv);
  const voiceScopedProducts = (Object.values(productsProv) as { used: Provenance }[]).some(r =>
    voiceAnswered(r.used)
  );

  const voiceScopedMissing = computeVoiceScopedMissing({
    ageProvenance: ageProv,
    durationProvenance: durationProv,
    familyHistoryProvenance: familyHistoryProv,
    patternProvenance: patternProv,
    past6MonthsProvenance: past6moProv,
    productsGateway,
  });

  const applySpokenFields = useIntakeStore(s => s.applySpokenFields);
  const clearSpokenField = useIntakeStore(s => s.clearSpokenField);
  const confirmAgeSuggestion = useIntakeStore(s => s.confirmAgeSuggestion);

  const cards = useMemo(
    () =>
      buildCards(
        smoking,
        salon,
        productsGateway,
        products,
        proceduresGateway,
        procedures,
        pastTreatmentSideEffects,
        voiceScopedAge,
        voiceScopedDuration,
        voiceScopedFamilyHistory,
        voiceScopedPattern,
        voiceScopedPast6Months,
        voiceScopedProducts
      ),
    [
      smoking,
      salon,
      productsGateway,
      products,
      proceduresGateway,
      procedures,
      pastTreatmentSideEffects,
      voiceScopedAge,
      voiceScopedDuration,
      voiceScopedFamilyHistory,
      voiceScopedPattern,
      voiceScopedPast6Months,
      voiceScopedProducts,
    ]
  );

  const [currentId, setCurrentId] = useState<string>(cards[0]?.id ?? 'q5');
  const [prevId, setPrevId] = useState<string | null>(null);
  const [direction, setDirection] = useState<Direction>('forward');
  const [isAnimating, setIsAnimating] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [voicePhase, setVoicePhase] = useState<VoicePhase>('opening');
  const [openingSummary, setOpeningSummary] = useState<AppliedSpokenSummary>({});

  // A fresh, non-memoized recomputation of the card list from the live
  // store — used only when transitioning out of the voice phases, where a
  // just-applied store write (e.g. applySpokenFields) hasn't flowed through
  // to the `cards` useMemo above yet within the same synchronous handler.
  function computeFreshCards(): CardSpec[] {
    const s = useIntakeStore.getState();
    return buildCards(
      s.form.habits.smoking,
      s.form.habits.salon_treatments,
      s.productsGateway,
      s.form.products,
      s.proceduresGateway,
      s.form.procedures,
      s.form.past_treatment_side_effects,
      voiceAnswered(s.provenance.age_hair_loss_began),
      voiceAnswered(s.provenance.duration),
      voiceAnswered(s.provenance.family_history),
      voiceAnswered(s.provenance.pattern),
      voiceAnswered(s.provenance.past_6_months),
      (Object.values(s.provenance.products) as { used: Provenance }[]).some(r => voiceAnswered(r.used))
    );
  }

  function enterNormalFlow(jumpToId?: string) {
    const fresh = computeFreshCards();
    const target = jumpToId && fresh.some(c => c.id === jumpToId) ? jumpToId : fresh[0]?.id;
    if (target) setCurrentId(target);
    setPrevId(null);
    setIsAnimating(false);
    setVoicePhase('done');
  }

  function handleOpeningCaptured(fields: SpokenFieldInput) {
    const summary = applySpokenFields(fields);
    if (Object.keys(summary).length === 0) {
      // Nothing cleared the confidence bar — skip the empty confirmation
      // screen and go straight to the second-capture decision.
      decideAfterCapture();
      return;
    }
    setOpeningSummary(summary);
    setVoicePhase('confirming');
  }

  function decideAfterCapture() {
    const s = useIntakeStore.getState();
    const missing = computeVoiceScopedMissing({
      ageProvenance: s.provenance.age_hair_loss_began,
      durationProvenance: s.provenance.duration,
      familyHistoryProvenance: s.provenance.family_history,
      patternProvenance: s.provenance.pattern,
      past6MonthsProvenance: s.provenance.past_6_months,
      productsGateway: s.productsGateway,
    });
    // Nothing left for a second capture to even ask about — offering one
    // would just show an empty "anything else?" with no real nudge.
    if (!hasVoiceScopedMissing(missing)) {
      enterNormalFlow();
      return;
    }
    const filled = countVoiceScopedFilled(s.form, s.provenance);
    if (filled < 10) {
      setVoicePhase('secondary');
    } else {
      enterNormalFlow();
    }
  }

  function handleSecondCaptured(fields: SpokenFieldInput) {
    applySpokenFields(fields);
    enterNormalFlow();
  }

  function handleCorrect(key: SpokenFieldKey) {
    clearSpokenField(key);
    enterNormalFlow(CARD_ID_FOR_SPOKEN_FIELD[key]);
  }

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

  if (voicePhase === 'opening') {
    return <VoiceOpening onSkip={() => enterNormalFlow()} onCaptured={handleOpeningCaptured} />;
  }

  if (voicePhase === 'confirming') {
    return (
      <VoiceConfirmation
        summary={openingSummary}
        onContinue={decideAfterCapture}
        onCorrect={handleCorrect}
        onAcceptAgeSuggestion={confirmAgeSuggestion}
      />
    );
  }

  if (voicePhase === 'secondary') {
    return (
      <VoiceSecondCapture missing={voiceScopedMissing} onSkip={() => enterNormalFlow()} onCaptured={handleSecondCaptured} />
    );
  }

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
