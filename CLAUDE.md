# GenoRoot Hair & Scalp Intake

Patient-facing intake app. 16 questions on paper, ~50 actual fields.
Goal: patient barely notices they filled anything. Doctor gets a complete,
accurate picture before the patient walks in.

Output contract: a filled JSON object matching `/lib/schema.json` exactly.

## Non-negotiables

- No login, no admin panel, no database. Patient-facing surface only.
- Mobile first. Design at 375px width. Must be finishable by a 55-year-old
  on a phone, with no instructions.
- Body text 16px minimum. Question text 18px. Tap targets 56px minimum height.
- Schema keys are the contract. Never rename a key from `/lib/schema.json`.
- API keys live in server-side route handlers only. Never `NEXT_PUBLIC_*`.
- Every AI-inferred value must have a visible one-tap override.
- Every AI-dependent step must have a "skip, I'll just tap" fallback path.

## Field provenance

Each field carries a provenance value alongside its answer:

    'empty' | 'tapped' | 'spoken' | 'inferred' | 'confirmed'

This drives two things: how the field renders in the UI, and the doctor
summary's distinction between what the patient asserted and what the
software guessed. Never lose provenance when writing a field.

## Question strategy

Not every question gets the same treatment. Per question, not one chat box.

- Q1 age: number stepper, not a keyboard.
- Q4 pattern: six illustrated SVG options, tap the picture that looks like you.
  Never rely on words like "diffuse thinning" alone.
- Q3: "no known family history" is mutually exclusive, clears the others.
- Q6 + Q7: one card, "doesn't apply to me" as first and largest option.
  Never ask the patient's sex directly. Never infer it from voice.
- Q6, Q7, Q16: tap-only, no audio readout. Clinic waiting rooms are public.
- Q11 hard_water: pre-fill from pincode lookup, ask to confirm.
- Q12, Q13: one gateway question first. Only expand the row grid on "yes".
- Q14: derive from Q12's side_effects column. Show pre-filled, ask to confirm.
  Do not ask it cold.

## Stack

Next.js 15 App Router, TypeScript, Tailwind, Zustand for state.
No database. localStorage for resume-after-close.
Sarvam Saaras v3 for Hinglish speech-to-text.
Claude for transcript extraction and product-label vision.

## Design tokens

Fonts: Inter for body, Outfit for headings and large numbers. Google Fonts.

Brand (sky):   50 #f0f9ff · 100 #e0f2fe · 500 #0ea5e9 · 600 #0284c7 · 700 #0369a1
Neutral (slate): 50 #f8fafc · 100 #f1f5f9 · 200 #e2e8f0 · 400 #94a3b8
                 500 #64748b · 700 #334155 · 800 #1e293b
Status: success #dcfce7/#15803d · warning #fef3c7/#b45309
        info #dbeafe/#1d4ed8 · danger #fee2e2/#dc2626

Radii: 16px cards and inputs · 12px buttons · full pill for badges
Shadow card: 0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)
Shadow hover: 0 0 0 1px rgba(0,0,0,0.03), 0 8px 16px rgba(0,0,0,0.06)

Transitions: card advance 350ms cubic-bezier(0.22, 1, 0.36, 1)
             element entry fadeIn 200ms / slideInFromBottom 220ms
Spacing: card padding 24px · page padding 16px mobile, 32px desktop

Provenance colors: inferred uses warning tokens, confirmed uses success tokens,
spoken uses info tokens. Tapped renders plain.

There is no sidebar, no data table, no dark auth theme, no stat card in this
project. Ignore those patterns if they appear in any reference material.

## Code standards

- Meaningful names. No `data1`, `temp`, `handleClick2`.
- Small single-purpose functions over one giant handler.
- Comments only where the logic isn't self-evident.
- Zod-validate every API route input on the server. Frontend validation is
  not validation.
- No bare try/catch that swallows. Return meaningful error responses and
  surface a usable fallback to the patient.
- Run `npm run build` before declaring a step done.
