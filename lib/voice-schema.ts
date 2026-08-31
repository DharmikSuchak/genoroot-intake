import { z } from 'zod';
import { PRODUCT_ROWS } from './product-labels';
import type {
  DurationOption,
  FamilyHistoryOption,
  PatternOption,
  Past6MonthsOption,
  Products,
} from './types';

// These mirror the option lists in lib/schema.json (Q2, Q3, Q4, Q10) and the
// row keys in lib/types.ts's Products interface (Q12). Kept as hand-written
// runtime constants alongside the hand-written union types in lib/types.ts,
// matching how this codebase already keeps schema.json's options in sync —
// there is no single runtime source of truth to import from otherwise.
export const DURATION_OPTIONS = ['Less than 6 months', '6-12 months', 'Over a year'] as const satisfies readonly DurationOption[];

export const FAMILY_HISTORY_OPTIONS = [
  'Father had hair loss',
  'Mother had hair loss',
  'Siblings with thinning or baldness',
  'No known family history',
] as const satisfies readonly FamilyHistoryOption[];

export const PATTERN_OPTIONS = [
  'Receding hairline',
  'Thinning at crown',
  'Widening part line',
  'Diffuse thinning',
  'Patchy loss',
  'Sudden excessive shedding',
] as const satisfies readonly PatternOption[];

export const PAST_6_MONTHS_OPTIONS = [
  'Crash dieting or major weight loss',
  'High stress or emotional trauma',
  'Fever with illness (COVID, Dengue, Typhoid)',
  'Recent surgery',
  'Change in location/water/air quality',
] as const satisfies readonly Past6MonthsOption[];

export const PRODUCT_ROW_KEYS = PRODUCT_ROWS.map(r => r.key) as [keyof Products, ...(keyof Products)[]];

const MIN_AGE = 5;
const MAX_AGE = 85;

export const CONFIDENCE_THRESHOLD = 0.75;

// ---------------------------------------------------------------------------
// Per-field validators. Each field is validated independently so a bad value
// on one field never invalidates the others — sanitizeExtraction() below
// drops failing fields one at a time rather than rejecting the whole object.
// ---------------------------------------------------------------------------

const confidence = z.number().min(0).max(1);

const fieldValidators = {
  age_hair_loss_began: z.object({ value: z.number().int().min(MIN_AGE).max(MAX_AGE), confidence }),
  duration: z.object({ value: z.enum(DURATION_OPTIONS), confidence }),
  family_history: z.object({ value: z.array(z.enum(FAMILY_HISTORY_OPTIONS)).min(1), confidence }),
  pattern: z.object({ value: z.array(z.enum(PATTERN_OPTIONS)).min(1), confidence }),
  past_6_months: z.object({ value: z.array(z.enum(PAST_6_MONTHS_OPTIONS)).min(1), confidence }),
  products: z.object({ value: z.array(z.enum(PRODUCT_ROW_KEYS)).min(1), confidence }),
} as const;

export type SpokenFieldKey = keyof typeof fieldValidators;

export interface SpokenFieldInput {
  age_hair_loss_began?: { value: number; confidence: number };
  duration?: { value: DurationOption; confidence: number };
  family_history?: { value: FamilyHistoryOption[]; confidence: number };
  pattern?: { value: PatternOption[]; confidence: number };
  past_6_months?: { value: Past6MonthsOption[]; confidence: number };
  products?: { value: (keyof Products)[]; confidence: number };
}

/**
 * Validates Gemini's raw parsed JSON field-by-field against the intake
 * schema's allowed options, silently dropping any field that doesn't
 * validate rather than rejecting the whole response.
 */
export function sanitizeExtraction(raw: unknown): SpokenFieldInput {
  const result: SpokenFieldInput = {};
  if (!raw || typeof raw !== 'object') return result;

  for (const key of Object.keys(fieldValidators) as SpokenFieldKey[]) {
    const candidate = (raw as Record<string, unknown>)[key];
    if (candidate === undefined) continue;
    const parsed = fieldValidators[key].safeParse(candidate);
    if (parsed.success) {
      (result as Record<string, unknown>)[key] = parsed.data;
    }
    // else: silently drop — do not throw, do not include.
  }
  return result;
}

// ---------------------------------------------------------------------------
// Gemini prompt
// ---------------------------------------------------------------------------

const PRODUCT_LABELS = Object.fromEntries(PRODUCT_ROWS.map(r => [r.key, r.label]));

export function buildExtractionPrompt(transcript: string): string {
  return `You are extracting structured facts from a patient's spoken description of their hair loss, for a hair-and-scalp clinic intake form. The patient may have spoken in Hindi, English, or a Hindi-English mix (Hinglish), and the transcript may itself mix scripts (Devanagari and Latin).

Extract ONLY the fields listed below, and ONLY when the patient's own words give you reasonable confidence — never guess or infer a value they did not actually communicate. It is much better to omit a field than to fabricate one.

Fields:

1. age_hair_loss_began — a whole number between ${MIN_AGE} and ${MAX_AGE}. Patients very often state their CURRENT age rather than the exact age their hair loss began — don't omit the field just because of that ambiguity:
   - If they clearly tie the age to when the hair loss started (e.g. "it started when I was 25", "began around 30"), that's a confident onset age — confidence around 0.9.
   - If they mention an age at all while describing their hair loss but don't make clear whether it's onset or current (e.g. "I'm 30", "my age is 30"), still include your best estimate using that age — confidence around 0.6, since it's more likely their current age than the true onset age.
   Only omit this field if no age was mentioned anywhere in the context of describing their hair loss.

2. duration — exactly one of: ${JSON.stringify(DURATION_OPTIONS)} — how long the hair loss has been going on.

3. family_history — an array of zero or more of: ${JSON.stringify(FAMILY_HISTORY_OPTIONS)}. Only include "No known family history" if the patient explicitly says no one in their family had hair loss — never combine it with any other option in the same array.

4. pattern — an array of zero or more of: ${JSON.stringify(PATTERN_OPTIONS)} — what the hair loss looks like.

5. past_6_months — an array of zero or more of: ${JSON.stringify(PAST_6_MONTHS_OPTIONS)} — things that happened in roughly the last 6 months.

6. products — an array of zero or more of these keys, for hair products/treatments the patient says they have personally used at home: ${JSON.stringify(PRODUCT_ROW_KEYS)}, where each key means: ${JSON.stringify(PRODUCT_LABELS)}. Map a minoxidil mention to topical_minoxidil (applied to scalp) or oral_minoxidil (a pill) based on how the patient describes using it; general/medicated shampoos map to otc_medicated_shampoos; oils or serums map to hair_oils_serums; vitamins or supplements map to supplements.

For every field you include, return it as { "value": <the value>, "confidence": <a number from 0 to 1 reflecting how sure you are the patient actually said this> }.

Return ONLY a single JSON object containing the fields you're confident about (omit the rest) — no markdown code fences, no explanation, no other text before or after the JSON.

Transcript:
"""
${transcript}
"""`;
}
