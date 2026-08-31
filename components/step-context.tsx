'use client';

import { createContext, useContext } from 'react';

interface StepInfo {
  /** 1-based position of this card in the visible sequence. */
  step: number;
  /** Total number of questions in the visible sequence. */
  total: number;
  /** How many question slots this card spans (defaults to 1; Q67 = 2). */
  questionSpan?: number;
  /** Optional suffix like "Habits", "Products", "Procedures". */
  suffix?: string;
}

const StepContext = createContext<StepInfo>({ step: 1, total: 16 });

export function StepProvider({
  step,
  total,
  questionSpan,
  suffix,
  children,
}: StepInfo & { children: React.ReactNode }) {
  return (
    <StepContext.Provider value={{ step, total, questionSpan, suffix }}>
      {children}
    </StepContext.Provider>
  );
}

/**
 * Returns a formatted label like "Question 3 of 14" or "Question 8 of 14 · Habits".
 * For multi-question cards (questionSpan > 1): "Questions 6–7 of 16".
 */
export function useStepLabel(): string {
  const { step, total, questionSpan, suffix } = useContext(StepContext);
  const span = questionSpan ?? 1;
  const base =
    span > 1
      ? `Questions ${step}–${step + span - 1} of ${total}`
      : `Question ${step} of ${total}`;
  return suffix ? `${base} · ${suffix}` : base;
}
