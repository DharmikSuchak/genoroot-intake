import { z } from 'zod';

const HabitsSchema = z
  .object({
    smoking: z.boolean().nullable(),
    smoking_severity: z
      .enum(['Mild <5/day', 'Moderate 5-10/day', 'Severe >10/day'])
      .nullable(),
    alcohol: z.boolean().nullable(),
    hard_water: z.boolean().nullable(),
    hair_wash_frequency: z.enum(['Daily', 'Alternate Days', 'Weekly']).nullable(),
    heating_tools_styling_chemicals: z.boolean().nullable(),
    salon_treatments: z.boolean().nullable(),
    salon_treatment_detail: z.string().nullable(),
  })
  .refine(d => !d.smoking || d.smoking_severity !== null, {
    message: 'smoking_severity required when smoking is true',
    path: ['smoking_severity'],
  })
  .refine(d => !d.salon_treatments || d.salon_treatment_detail !== null, {
    message: 'salon_treatment_detail required when salon_treatments is true',
    path: ['salon_treatment_detail'],
  });

const ProductEntrySchema = z.object({
  used: z.boolean().nullable(),
  duration: z.enum(['<3mo', '3-6mo', '>6mo']).nullable(),
  helped: z.boolean().nullable(),
  side_effects: z.boolean().nullable(),
});

const ProductsSchema = z.object({
  otc_medicated_shampoos: ProductEntrySchema,
  hair_oils_serums: ProductEntrySchema,
  topical_minoxidil: ProductEntrySchema,
  oral_minoxidil: ProductEntrySchema,
  supplements: ProductEntrySchema,
});

const ProcedureEntrySchema = z.object({
  done: z.boolean().nullable(),
  sessions: z.enum(['1-3', '4-6', '>6']).nullable(),
  helped: z.boolean().nullable(),
});

const ProceduresSchema = z.object({
  prp_gfc_iprf: ProcedureEntrySchema,
  stem_cells_exosomes: ProcedureEntrySchema,
  hair_transplant: ProcedureEntrySchema,
  other: ProcedureEntrySchema,
});

export const IntakeFormSchema = z
  .object({
    age_hair_loss_began: z.number().int().min(1).max(120).nullable(),
    duration: z.enum(['Less than 6 months', '6-12 months', 'Over a year']).nullable(),
    family_history: z
      .array(
        z.enum([
          'Father had hair loss',
          'Mother had hair loss',
          'Siblings with thinning or baldness',
          'No known family history',
        ])
      )
      .refine(
        arr => !(arr.includes('No known family history') && arr.length > 1),
        { message: '"No known family history" is mutually exclusive with other options' }
      ),
    pattern: z.array(
      z.enum([
        'Receding hairline',
        'Thinning at crown',
        'Widening part line',
        'Diffuse thinning',
        'Patchy loss',
        'Sudden excessive shedding',
      ])
    ),
    diagnosed_conditions: z.array(
      z.enum(['PCOS/PCOD', 'Thyroid disorder', 'Diabetes', 'Autoimmune disease', 'Anemia', 'None'])
    ),
    menstrual_cycle: z
      .enum(['Regular', 'Irregular', 'Menopausal', 'Not applicable'])
      .nullable(),
    pregnancy_related: z
      .enum(['Currently pregnant', 'Postpartum <1 year', 'Not applicable'])
      .nullable(),
    adult_acne_oily_skin: z.boolean().nullable(),
    excess_body_facial_hair: z.boolean().nullable(),
    past_6_months: z.array(
      z.enum([
        'Crash dieting or major weight loss',
        'High stress or emotional trauma',
        'Fever with illness (COVID, Dengue, Typhoid)',
        'Recent surgery',
        'Change in location/water/air quality',
      ])
    ),
    habits: HabitsSchema,
    products: ProductsSchema,
    procedures: ProceduresSchema,
    past_treatment_side_effects: z.boolean().nullable(),
    past_treatment_side_effects_describe: z.string().nullable(),
    sample_type: z.enum(['Saliva', 'Blood', 'Either']).nullable(),
    consent: z.boolean().nullable(),
  })
  .refine(
    d => !d.past_treatment_side_effects || d.past_treatment_side_effects_describe !== null,
    {
      message: 'describe required when past_treatment_side_effects is true',
      path: ['past_treatment_side_effects_describe'],
    }
  );

export type ValidatedIntakeForm = z.infer<typeof IntakeFormSchema>;
