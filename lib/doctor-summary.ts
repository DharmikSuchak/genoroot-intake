import type { IntakeForm, Products, Procedures } from './types';

/**
 * Deterministic, non-AI summarization of a filled IntakeForm for the doctor
 * to skim before the patient walks in. No network calls, no randomness —
 * same form in, same prose out, every time.
 */

// ---------------------------------------------------------------------------
// Small prose helpers
// ---------------------------------------------------------------------------

function capitalize(s: string): string {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function lowerFirst(s: string): string {
  return s.length ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

/** "a" / "a and b" / "a, b, and c" — for enumerating same-kind items. */
function joinList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

/** Joins distinct facts into one sentence body, comma separated, no "and". */
function joinClauses(clauses: string[]): string | null {
  if (clauses.length === 0) return null;
  return `${capitalize(clauses.join(', '))}.`;
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const PRODUCT_LABEL: Record<keyof Products, string> = {
  otc_medicated_shampoos: 'OTC/medicated shampoos',
  hair_oils_serums: 'hair oils/serums',
  topical_minoxidil: 'topical minoxidil',
  oral_minoxidil: 'oral minoxidil',
  supplements: 'supplements',
};

const PROCEDURE_LABEL: Record<keyof Procedures, string> = {
  prp_gfc_iprf: 'PRP/GFC/iPRF',
  stem_cells_exosomes: 'stem cells/exosomes',
  hair_transplant: 'hair transplant',
  other: 'another procedure',
};

const DURATION_ONGOING: Record<string, string> = {
  'Less than 6 months': 'ongoing for less than 6 months',
  '6-12 months': 'ongoing for 6-12 months',
  'Over a year': 'ongoing over a year',
};

const PRODUCT_DURATION_LABEL: Record<string, string> = {
  '<3mo': 'under 3 months',
  '3-6mo': '3-6 months',
  '>6mo': 'over 6 months',
};

const PROCEDURE_SESSIONS_LABEL: Record<string, string> = {
  '1-3': '1-3 sessions',
  '4-6': '4-6 sessions',
  '>6': 'over 6 sessions',
};

const SMOKING_SEVERITY_LABEL: Record<string, string> = {
  'Mild <5/day': 'under 5/day',
  'Moderate 5-10/day': '5-10/day',
  'Severe >10/day': 'over 10/day',
};

const WASH_FREQUENCY_LABEL: Record<string, string> = {
  Daily: 'daily washes',
  'Alternate Days': 'alternate-day washes',
  Weekly: 'weekly washes',
};

const FAMILY_MEMBER_LABEL: Record<string, string> = {
  'Father had hair loss': 'father',
  'Mother had hair loss': 'mother',
  'Siblings with thinning or baldness': 'siblings',
};

// ---------------------------------------------------------------------------
// generateSummary
// ---------------------------------------------------------------------------

function sentenceOnset(form: IntakeForm): string | null {
  const clauses: string[] = [];
  if (form.age_hair_loss_began !== null) {
    clauses.push(`hair loss began around age ${form.age_hair_loss_began}`);
  }
  if (form.duration !== null) {
    clauses.push(DURATION_ONGOING[form.duration]);
  }
  if (form.pattern.length > 0) {
    clauses.push(`with ${joinList(form.pattern.map(lowerFirst))}`);
  }
  return joinClauses(clauses);
}

function sentenceFamily(form: IntakeForm): string | null {
  const fh = form.family_history;
  if (fh.length === 0) return null;
  if (fh.includes('No known family history')) return 'No known family history.';
  const members = fh.map(f => FAMILY_MEMBER_LABEL[f]).filter(Boolean);
  if (members.length === 0) return null;
  return `${capitalize(joinList(members))} also affected.`;
}

function sentenceMedical(form: IntakeForm): string | null {
  const clauses: string[] = [];

  const conditions = form.diagnosed_conditions.filter(c => c !== 'None');
  if (conditions.length > 0) {
    clauses.push(`${joinList(conditions)} diagnosed`);
  }
  if (form.menstrual_cycle !== null && form.menstrual_cycle !== 'Not applicable') {
    clauses.push(`${form.menstrual_cycle.toLowerCase()} menstrual cycle`);
  }
  if (form.pregnancy_related !== null && form.pregnancy_related !== 'Not applicable') {
    clauses.push(form.pregnancy_related.toLowerCase());
  }
  if (form.adult_acne_oily_skin === true) {
    clauses.push('adult acne/oily skin');
  }
  if (form.excess_body_facial_hair === true) {
    clauses.push('excess facial/body hair');
  }

  return joinClauses(clauses);
}

function sentenceTreatments(form: IntakeForm): string | null {
  const treatmentPhrases: string[] = [];

  for (const key of Object.keys(form.products) as (keyof Products)[]) {
    const entry = form.products[key];
    if (entry.used !== true) continue;
    let phrase = PRODUCT_LABEL[key];
    if (entry.duration) phrase += ` for ${PRODUCT_DURATION_LABEL[entry.duration]}`;
    const notes: string[] = [];
    if (entry.helped === true) notes.push('helped');
    if (entry.helped === false) notes.push("didn't help");
    if (entry.side_effects === true) notes.push('caused side effects');
    if (notes.length > 0) phrase += ` (${joinList(notes)})`;
    treatmentPhrases.push(phrase);
  }

  for (const key of Object.keys(form.procedures) as (keyof Procedures)[]) {
    const entry = form.procedures[key];
    if (entry.done !== true) continue;
    let phrase = PROCEDURE_LABEL[key];
    if (entry.sessions) phrase += ` (${PROCEDURE_SESSIONS_LABEL[entry.sessions]})`;
    if (entry.helped === true) phrase += ' — helped';
    if (entry.helped === false) phrase += " — didn't help";
    treatmentPhrases.push(phrase);
  }

  const clauses: string[] = [];
  if (treatmentPhrases.length > 0) {
    clauses.push(`has used ${joinList(treatmentPhrases)}`);
  }
  if (form.past_treatment_side_effects === true) {
    const desc = form.past_treatment_side_effects_describe;
    clauses.push(`reports treatment side effects${desc ? ` (${desc})` : ''}`);
  }

  return joinClauses(clauses);
}

function sentenceLifestyle(form: IntakeForm): string | null {
  const clauses: string[] = [];

  if (form.past_6_months.length > 0) {
    clauses.push(`${joinList(form.past_6_months.map(lowerFirst))} in the past 6 months`);
  }

  const h = form.habits;
  if (h.smoking === true) {
    const severity = h.smoking_severity ? SMOKING_SEVERITY_LABEL[h.smoking_severity] : null;
    clauses.push(severity ? `smokes ${severity}` : 'smokes');
  }
  if (h.alcohol === true) {
    clauses.push('drinks alcohol');
  }
  if (h.hard_water === true) {
    clauses.push('hard water at home');
  }
  if (h.hair_wash_frequency !== null) {
    clauses.push(WASH_FREQUENCY_LABEL[h.hair_wash_frequency]);
  }
  if (h.heating_tools_styling_chemicals === true) {
    clauses.push('regular heat styling/chemical treatments');
  }
  if (h.salon_treatments === true) {
    clauses.push(`salon treatments${h.salon_treatment_detail ? ` (${h.salon_treatment_detail})` : ''}`);
  }

  return joinClauses(clauses);
}

/**
 * Returns 3-5 short clinical-prose sentences summarizing the form, one per
 * covered theme (onset/pattern, family history, medical/hormonal,
 * treatments tried, lifestyle). A theme with nothing answered contributes
 * no sentence rather than a placeholder.
 */
export function generateSummary(form: IntakeForm): string[] {
  const sentences = [
    sentenceOnset(form),
    sentenceFamily(form),
    sentenceMedical(form),
    sentenceTreatments(form),
    sentenceLifestyle(form),
  ].filter((s): s is string => s !== null);

  return sentences;
}

// ---------------------------------------------------------------------------
// findContradictions
// ---------------------------------------------------------------------------

/**
 * Flags internally inconsistent answers worth a doctor's second glance
 * before they take these at face value.
 */
export function findContradictions(form: IntakeForm): string[] {
  const flags: string[] = [];

  if (
    form.family_history.includes('No known family history') &&
    form.family_history.length > 1
  ) {
    flags.push(
      '"No known family history" is selected alongside a specific family member with hair loss.'
    );
  }

  if (form.diagnosed_conditions.includes('None') && form.diagnosed_conditions.length > 1) {
    flags.push('"None" is selected alongside a specific diagnosed condition.');
  }

  if (form.past_treatment_side_effects === false) {
    const sideEffectRows = (Object.keys(form.products) as (keyof Products)[])
      .filter(key => form.products[key].side_effects === true)
      .map(key => PRODUCT_LABEL[key]);
    if (sideEffectRows.length > 0) {
      flags.push(
        `Marked "no past treatment side effects", but side effects were reported for ${joinList(
          sideEffectRows
        )}.`
      );
    }
  }

  for (const key of Object.keys(form.procedures) as (keyof Procedures)[]) {
    const entry = form.procedures[key];
    if (entry.done === false && entry.sessions !== null) {
      flags.push(
        `${PROCEDURE_LABEL[key]} is marked as not done, but a number of sessions was recorded.`
      );
    }
  }

  return flags;
}
