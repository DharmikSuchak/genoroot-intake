export type Provenance = 'empty' | 'tapped' | 'spoken' | 'inferred' | 'confirmed';

// Q2
export type DurationOption = 'Less than 6 months' | '6-12 months' | 'Over a year';

// Q3
export type FamilyHistoryOption =
  | 'Father had hair loss'
  | 'Mother had hair loss'
  | 'Siblings with thinning or baldness'
  | 'No known family history';

// Q4
export type PatternOption =
  | 'Receding hairline'
  | 'Thinning at crown'
  | 'Widening part line'
  | 'Diffuse thinning'
  | 'Patchy loss'
  | 'Sudden excessive shedding';

// Q5
export type DiagnosedConditionOption =
  | 'PCOS/PCOD'
  | 'Thyroid disorder'
  | 'Diabetes'
  | 'Autoimmune disease'
  | 'Anemia'
  | 'None';

// Q6
export type MenstrualCycleOption = 'Regular' | 'Irregular' | 'Menopausal' | 'Not applicable';

// Q7
export type PregnancyRelatedOption = 'Currently pregnant' | 'Postpartum <1 year' | 'Not applicable';

// Q10
export type Past6MonthsOption =
  | 'Crash dieting or major weight loss'
  | 'High stress or emotional trauma'
  | 'Fever with illness (COVID, Dengue, Typhoid)'
  | 'Recent surgery'
  | 'Change in location/water/air quality';

// Q11
export type SmokingSeverityOption = 'Mild <5/day' | 'Moderate 5-10/day' | 'Severe >10/day';
export type HairWashFrequencyOption = 'Daily' | 'Alternate Days' | 'Weekly';

export interface Habits {
  smoking: boolean | null;
  smoking_severity: SmokingSeverityOption | null;
  alcohol: boolean | null;
  hard_water: boolean | null;
  hair_wash_frequency: HairWashFrequencyOption | null;
  heating_tools_styling_chemicals: boolean | null;
  salon_treatments: boolean | null;
  salon_treatment_detail: string | null;
}

// Q12
export type ProductDurationOption = '<3mo' | '3-6mo' | '>6mo';

export interface ProductEntry {
  used: boolean | null;
  duration: ProductDurationOption | null;
  helped: boolean | null;
  side_effects: boolean | null;
}

export interface Products {
  otc_medicated_shampoos: ProductEntry;
  hair_oils_serums: ProductEntry;
  topical_minoxidil: ProductEntry;
  oral_minoxidil: ProductEntry;
  supplements: ProductEntry;
}

// Q13
export type ProcedureSessionsOption = '1-3' | '4-6' | '>6';

export interface ProcedureEntry {
  done: boolean | null;
  sessions: ProcedureSessionsOption | null;
  helped: boolean | null;
}

export interface Procedures {
  prp_gfc_iprf: ProcedureEntry;
  stem_cells_exosomes: ProcedureEntry;
  hair_transplant: ProcedureEntry;
  other: ProcedureEntry;
}

// Q15
export type SampleTypeOption = 'Saliva' | 'Blood' | 'Either';

/**
 * The complete intake form output. Every key maps to a question key from
 * lib/schema.json. The shape of this interface IS the doctor-facing JSON contract.
 *
 * Row keys for products / procedures are snake_case derivations of the row
 * labels in the schema (e.g. "OTC/Medicated Shampoos" → otc_medicated_shampoos).
 * The followup key for Q14 is prefixed with its parent to avoid an ambiguous
 * top-level "describe" key.
 */
export interface IntakeForm {
  age_hair_loss_began: number | null;                    // Q1
  duration: DurationOption | null;                        // Q2
  family_history: FamilyHistoryOption[];                  // Q3
  pattern: PatternOption[];                               // Q4
  diagnosed_conditions: DiagnosedConditionOption[];       // Q5
  menstrual_cycle: MenstrualCycleOption | null;           // Q6
  pregnancy_related: PregnancyRelatedOption | null;       // Q7
  adult_acne_oily_skin: boolean | null;                   // Q8
  excess_body_facial_hair: boolean | null;                // Q9
  past_6_months: Past6MonthsOption[];                     // Q10
  habits: Habits;                                         // Q11
  products: Products;                                     // Q12
  procedures: Procedures;                                 // Q13
  past_treatment_side_effects: boolean | null;            // Q14
  past_treatment_side_effects_describe: string | null;    // Q14 followup
  sample_type: SampleTypeOption | null;                   // Q15
  consent: boolean | null;                                // Q16
}

/**
 * Recursively mirrors IntakeForm, replacing every leaf value type with Provenance.
 * Arrays collapse to a single Provenance (the whole selection shares one provenance).
 */
type Leaf<T> = T extends (infer _U)[]
  ? Provenance
  : T extends object
  ? { [K in keyof T]: Leaf<T[K]> }
  : Provenance;

export type ProvenanceMap = { [K in keyof IntakeForm]: Leaf<IntakeForm[K]> };

/** Top-level keys that are plain scalars or arrays (not nested table objects). */
export type TopLevelKey = Exclude<keyof IntakeForm, 'habits' | 'products' | 'procedures'>;

export interface CompletenessResult {
  answered: number;
  total: 16;
  fraction: number;
}
