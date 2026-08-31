# GenoRoot Hair & Scalp Intake

## What this is

A patient-facing intake form for a hair and scalp clinic. On paper the intake
is sixteen questions; underneath that it's roughly fifty fields. The app
walks a patient through those sixteen questions on their phone and produces
a filled JSON object matching the schema in `lib/schema.json`, so the doctor
has a complete, accurate picture before the patient sits down.

## Running it

```
npm install
```

Create `.env.local` with:

```
SARVAM_API_KEY=...
GEMINI_API_KEY=...
```

Then:

```
npm run dev
```

Live: https://genoroot-intake-alpha.vercel.app

## Decisions

Voice is a single opening capture, not a per-question mic and not a chat
box. Tapping beats speaking for most of these questions, so voice targets
only six fields and is used to pre-fill them, not to run the whole intake.
It deliberately never touches Q6, Q7, or Q16 — a clinic waiting room is
public, and nobody wants to say "postpartum" out loud, or give genetic
analysis consent verbally, next to strangers.

The voice pre-fill is an experiment. I wanted to see whether speech could
carry the opening of a medical intake, and I'm genuinely unsure whether
patients will prefer it to tapping. That uncertainty is why every voice step
has a visible skip and every AI-filled field has a one-tap override.

Q11, Q12, and Q13 are grids on the paper form. Rendering them as grids in
the app would just recreate the form people abandon. Q13 is now one gateway
question that, with a single tap, fills twelve fields for the large
majority of patients who have had no in-clinic procedures.

Q14 is derived from Q12's side-effects column and shown pre-filled for
confirmation rather than asked cold.

Q4 uses six illustrated SVGs instead of text options, because "diffuse
thinning" means nothing to a patient but a picture does.

Every field carries a provenance value: tapped, spoken, inferred, or
confirmed. The doctor summary uses this to distinguish what the patient
asserted from what the software guessed.

The doctor summary is generated deterministically from the form data, not
by a model. A summary that hallucinates is worse than no summary.

## Models and services

Sarvam AI for speech-to-text, chosen over Whisper because it's built for
Indian languages and Hinglish code-mixing, which is how patients here
actually speak. Gemini Flash-Lite for transcript extraction, with a Flash
fallback and a short retry budget, because the free tier returns
intermittent 503s under load. Next.js on Vercel. Zustand for state, Zod for
validation. Claude Code for most of the implementation.

## Bought vs built

Bought: transcription, extraction, hosting, state and validation libraries.

Built: the question sequencing, the inference rules, the provenance model,
the illustrated pattern picker, the audio-to-WAV conversion, and the doctor
summary.

## How I checked the fill

A scripted end-to-end walkthrough at 375px width, using a fixed patient
profile, checking that the Q13 skip path, the Q14 inference, and the Q5
mutual-exclusion behave correctly, and that the final JSON contains all
sixteen questions with correct values. This was a manual scripted run, not
an automated test suite.

## With one more week

A product-shelf photo: the patient photographs their bathroom shelf and a
vision model maps the bottles onto Q12's five rows, turning "which products
have you used" into a camera instead of a checklist.

Full Hindi and Gujarati UI, with the language inferred from the first
spoken sentence rather than asked upfront — a Gujarat clinic serves
patients who would genuinely prefer it.

An automated eval harness of synthetic transcripts diffed against expected
JSON, so extraction accuracy is a number instead of a claim.

Pincode-based hard-water inference for Q11.
