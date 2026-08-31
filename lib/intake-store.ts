'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  IntakeForm,
  ProvenanceMap,
  Provenance,
  Habits,
  ProductEntry,
  ProcedureEntry,
  Products,
  Procedures,
  TopLevelKey,
  CompletenessResult,
} from './types';

// ---------------------------------------------------------------------------
// Default / empty state
// ---------------------------------------------------------------------------

const EMPTY_PRODUCT: ProductEntry = { used: null, duration: null, helped: null, side_effects: null };
const EMPTY_PROCEDURE: ProcedureEntry = { done: null, sessions: null, helped: null };

export const EMPTY_FORM: IntakeForm = {
  age_hair_loss_began: null,
  duration: null,
  family_history: [],
  pattern: [],
  diagnosed_conditions: [],
  menstrual_cycle: null,
  pregnancy_related: null,
  adult_acne_oily_skin: null,
  excess_body_facial_hair: null,
  past_6_months: [],
  habits: {
    smoking: null,
    smoking_severity: null,
    alcohol: null,
    hard_water: null,
    hair_wash_frequency: null,
    heating_tools_styling_chemicals: null,
    salon_treatments: null,
    salon_treatment_detail: null,
  },
  products: {
    otc_medicated_shampoos: { ...EMPTY_PRODUCT },
    hair_oils_serums: { ...EMPTY_PRODUCT },
    topical_minoxidil: { ...EMPTY_PRODUCT },
    oral_minoxidil: { ...EMPTY_PRODUCT },
    supplements: { ...EMPTY_PRODUCT },
  },
  procedures: {
    prp_gfc_iprf: { ...EMPTY_PROCEDURE },
    stem_cells_exosomes: { ...EMPTY_PROCEDURE },
    hair_transplant: { ...EMPTY_PROCEDURE },
    other: { ...EMPTY_PROCEDURE },
  },
  past_treatment_side_effects: null,
  past_treatment_side_effects_describe: null,
  sample_type: null,
  consent: null,
};

// ---------------------------------------------------------------------------
// Gateway state — Q12 and Q13 each open with a yes/no gateway card before the
// row grid expands. The gateway answer itself isn't a schema field (the
// per-row `used`/`done` booleans are what get submitted), so it lives here as
// pure navigation state rather than inside `form`.
// ---------------------------------------------------------------------------

const EMPTY_GATEWAYS = {
  productsGateway: null as boolean | null,
  proceduresGateway: null as boolean | null,
};

const E: Provenance = 'empty';

const EMPTY_PRODUCT_PROV = { used: E, duration: E, helped: E, side_effects: E } as const;
const EMPTY_PROCEDURE_PROV = { done: E, sessions: E, helped: E } as const;

export const EMPTY_PROVENANCE: ProvenanceMap = {
  age_hair_loss_began: E,
  duration: E,
  family_history: E,
  pattern: E,
  diagnosed_conditions: E,
  menstrual_cycle: E,
  pregnancy_related: E,
  adult_acne_oily_skin: E,
  excess_body_facial_hair: E,
  past_6_months: E,
  habits: {
    smoking: E,
    smoking_severity: E,
    alcohol: E,
    hard_water: E,
    hair_wash_frequency: E,
    heating_tools_styling_chemicals: E,
    salon_treatments: E,
    salon_treatment_detail: E,
  },
  products: {
    otc_medicated_shampoos: { ...EMPTY_PRODUCT_PROV },
    hair_oils_serums: { ...EMPTY_PRODUCT_PROV },
    topical_minoxidil: { ...EMPTY_PRODUCT_PROV },
    oral_minoxidil: { ...EMPTY_PRODUCT_PROV },
    supplements: { ...EMPTY_PRODUCT_PROV },
  },
  procedures: {
    prp_gfc_iprf: { ...EMPTY_PROCEDURE_PROV },
    stem_cells_exosomes: { ...EMPTY_PROCEDURE_PROV },
    hair_transplant: { ...EMPTY_PROCEDURE_PROV },
    other: { ...EMPTY_PROCEDURE_PROV },
  },
  past_treatment_side_effects: E,
  past_treatment_side_effects_describe: E,
  sample_type: E,
  consent: E,
};

// ---------------------------------------------------------------------------
// Completeness — one answered flag per question (Q1–Q16)
// An array-type question counts as answered once its provenance is no longer
// 'empty', even if the selection is empty (e.g. "none of the above").
// ---------------------------------------------------------------------------

export function computeCompleteness(
  form: IntakeForm,
  prov: ProvenanceMap
): CompletenessResult {
  const checks: boolean[] = [
    form.age_hair_loss_began !== null,                         // Q1
    form.duration !== null,                                    // Q2
    prov.family_history !== 'empty',                          // Q3
    prov.pattern !== 'empty',                                 // Q4
    prov.diagnosed_conditions !== 'empty',                    // Q5
    form.menstrual_cycle !== null,                            // Q6
    form.pregnancy_related !== null,                          // Q7
    form.adult_acne_oily_skin !== null,                       // Q8
    form.excess_body_facial_hair !== null,                    // Q9
    prov.past_6_months !== 'empty',                          // Q10
    // Q11 — all six base habit rows answered
    form.habits.smoking !== null &&
      form.habits.alcohol !== null &&
      form.habits.hard_water !== null &&
      form.habits.hair_wash_frequency !== null &&
      form.habits.heating_tools_styling_chemicals !== null &&
      form.habits.salon_treatments !== null,
    // Q12 — at least one product row touched
    (Object.values(prov.products) as (typeof EMPTY_PRODUCT_PROV)[]).some(
      r => r.used !== 'empty'
    ),
    // Q13 — at least one procedure row touched
    (Object.values(prov.procedures) as (typeof EMPTY_PROCEDURE_PROV)[]).some(
      r => r.done !== 'empty'
    ),
    form.past_treatment_side_effects !== null,                // Q14
    form.sample_type !== null,                                // Q15
    form.consent !== null,                                    // Q16
  ];

  const answered = checks.filter(Boolean).length;
  return { answered, total: 16, fraction: answered / 16 };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface IntakeState {
  form: IntakeForm;
  provenance: ProvenanceMap;
  /** Q12 gateway: has the patient used any hair products/treatments at home? */
  productsGateway: boolean | null;
  /** Q13 gateway: has the patient had any in-clinic hair procedures? */
  proceduresGateway: boolean | null;
}

interface IntakeActions {
  /** Set any top-level scalar or array field. */
  setField: <K extends TopLevelKey>(key: K, value: IntakeForm[K], prov: Provenance) => void;

  /** Set a single field inside the habits table. */
  setHabit: <K extends keyof Habits>(key: K, value: Habits[K], prov: Provenance) => void;

  /** Set one cell inside the products grid. */
  setProductCell: <C extends keyof ProductEntry>(
    row: keyof Products,
    col: C,
    value: ProductEntry[C],
    prov: Provenance
  ) => void;

  /** Set one cell inside the procedures grid. */
  setProcedureCell: <C extends keyof ProcedureEntry>(
    row: keyof Procedures,
    col: C,
    value: ProcedureEntry[C],
    prov: Provenance
  ) => void;

  /**
   * Answer the Q12 gateway ("used any products at home?"). Resets every
   * product row to used:false so a "no" answer is immediately a complete,
   * submittable Q12 — a "yes" answer leaves the same false baseline for the
   * follow-up row picker to flip individual rows on.
   */
  setProductsGateway: (value: boolean | null) => void;

  /** Same as setProductsGateway, for the Q13 procedures gateway. */
  setProceduresGateway: (value: boolean | null) => void;

  /** Returns a clean IntakeForm object with no provenance metadata. */
  getFilledForm: () => IntakeForm;

  /** Returns how many of the 16 questions have been answered. */
  getCompleteness: () => CompletenessResult;

  /** Wipes all state back to defaults. */
  reset: () => void;
}

type IntakeStore = IntakeState & IntakeActions;

export const useIntakeStore = create<IntakeStore>()(
  persist(
    (set, get) => ({
      form: EMPTY_FORM,
      provenance: EMPTY_PROVENANCE,
      ...EMPTY_GATEWAYS,

      setField: (key, value, prov) =>
        set(state => ({
          form: { ...state.form, [key]: value } as IntakeForm,
          provenance: { ...state.provenance, [key]: prov } as ProvenanceMap,
        })),

      setHabit: (key, value, prov) =>
        set(state => ({
          form: {
            ...state.form,
            habits: { ...state.form.habits, [key]: value } as Habits,
          },
          provenance: {
            ...state.provenance,
            habits: { ...state.provenance.habits, [key]: prov },
          },
        })),

      setProductCell: (row, col, value, prov) =>
        set(state => ({
          form: {
            ...state.form,
            products: {
              ...state.form.products,
              [row]: { ...state.form.products[row], [col]: value } as ProductEntry,
            },
          },
          provenance: {
            ...state.provenance,
            products: {
              ...state.provenance.products,
              [row]: { ...state.provenance.products[row], [col]: prov },
            },
          },
        })),

      setProcedureCell: (row, col, value, prov) =>
        set(state => ({
          form: {
            ...state.form,
            procedures: {
              ...state.form.procedures,
              [row]: { ...state.form.procedures[row], [col]: value } as ProcedureEntry,
            },
          },
          provenance: {
            ...state.provenance,
            procedures: {
              ...state.provenance.procedures,
              [row]: { ...state.provenance.procedures[row], [col]: prov },
            },
          },
        })),

      setProductsGateway: value =>
        set(state => {
          if (value === null) {
            return {
              productsGateway: null,
              form: { ...state.form, products: { ...EMPTY_FORM.products } },
              provenance: { ...state.provenance, products: { ...EMPTY_PROVENANCE.products } },
            };
          }
          const falseRow = (): ProductEntry => ({
            used: false,
            duration: null,
            helped: null,
            side_effects: null,
          });
          const falseRowProv = () => ({
            used: 'tapped' as Provenance,
            duration: E,
            helped: E,
            side_effects: E,
          });
          return {
            productsGateway: value,
            form: {
              ...state.form,
              products: {
                otc_medicated_shampoos: falseRow(),
                hair_oils_serums: falseRow(),
                topical_minoxidil: falseRow(),
                oral_minoxidil: falseRow(),
                supplements: falseRow(),
              },
            },
            provenance: {
              ...state.provenance,
              products: {
                otc_medicated_shampoos: falseRowProv(),
                hair_oils_serums: falseRowProv(),
                topical_minoxidil: falseRowProv(),
                oral_minoxidil: falseRowProv(),
                supplements: falseRowProv(),
              },
            },
          };
        }),

      setProceduresGateway: value =>
        set(state => {
          if (value === null) {
            return {
              proceduresGateway: null,
              form: { ...state.form, procedures: { ...EMPTY_FORM.procedures } },
              provenance: { ...state.provenance, procedures: { ...EMPTY_PROVENANCE.procedures } },
            };
          }
          const falseRow = (): ProcedureEntry => ({ done: false, sessions: null, helped: null });
          const falseRowProv = () => ({ done: 'tapped' as Provenance, sessions: E, helped: E });
          return {
            proceduresGateway: value,
            form: {
              ...state.form,
              procedures: {
                prp_gfc_iprf: falseRow(),
                stem_cells_exosomes: falseRow(),
                hair_transplant: falseRow(),
                other: falseRow(),
              },
            },
            provenance: {
              ...state.provenance,
              procedures: {
                prp_gfc_iprf: falseRowProv(),
                stem_cells_exosomes: falseRowProv(),
                hair_transplant: falseRowProv(),
                other: falseRowProv(),
              },
            },
          };
        }),

      getFilledForm: () => get().form,

      getCompleteness: () => computeCompleteness(get().form, get().provenance),

      reset: () => set({ form: EMPTY_FORM, provenance: EMPTY_PROVENANCE, ...EMPTY_GATEWAYS }),
    }),
    {
      name: 'genoroot-intake',
      // localStorage is only accessed client-side; skipHydration prevents
      // any SSR access. Call useIntakeStore.persist.rehydrate() in a
      // client root component useEffect to restore persisted state.
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);

