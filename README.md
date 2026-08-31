# GenoRoot Hair & Scalp Intake

## What this is

This is a patient-facing intake form for a hair and scalp clinic. On paper
it's sixteen questions. Underneath, it's closer to fifty fields. The app
walks a patient through those questions on their phone and produces a
filled JSON object matching the schema in `lib/schema.json`. That's what
the doctor sees, so they walk in with a complete picture instead of
starting from scratch.

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

Voice is a single opening capture, not a mic on every question and not a
chat box. Tapping just beats speaking for most of these questions, so
voice only targets six fields and pre-fills them, it doesn't run the whole
intake. It deliberately never touches Q6, Q7, or Q16. A clinic waiting
room is public, and nobody wants to say "postpartum" out loud, or consent
to genetic analysis out loud, next to strangers.

I want to be upfront that the voice pre-fill is an experiment. I wanted to
see whether speech could carry the opening of a medical intake, and I'm
genuinely not sure yet whether patients will prefer it to tapping. That's
why every voice step has a visible skip, and every AI-filled field has a
one-tap override.

Q11, Q12, and Q13 are grids on the paper form. Rendering them as grids in
the app would just rebuild the form people abandon. So Q13 became one
gateway question. One tap fills twelve fields, covering most patients who
haven't had any in-clinic procedures.

Q14 gets derived from Q12's side-effects column and shown pre-filled, so
the patient just confirms it. It's never asked cold.

Q4 uses six illustrated SVGs instead of text options. "Diffuse thinning"
means nothing to a patient, but a picture of it does.

Every field carries a provenance value: tapped, spoken, inferred, or
confirmed. That's what lets the doctor summary tell the difference between
what the patient said and what the software guessed.

The doctor summary itself is generated deterministically from the form
data, not by a model. A summary that hallucinates is worse than none at
all.

## Models and services

I used Sarvam AI for speech-to-text instead of Whisper, because Sarvam is
built for Indian languages and Hinglish code-mixing, which is honestly how
patients here talk. For extraction I used Gemini Flash-Lite, with a Flash
fallback and a short retry budget, since the free tier throws intermittent
503s under load. The app runs on Next.js, hosted on Vercel, with Zustand
for state and Zod for validation. I built most of this with Claude Code.

## Bought vs built

Bought: transcription, extraction, hosting, state and validation
libraries.

Built: the question sequencing, the inference rules, the provenance
model, the illustrated pattern picker, the audio-to-WAV conversion, and
the doctor summary.

## How I checked the fill

I ran a scripted end-to-end walkthrough at 375px with a fixed patient
profile, checking that the Q13 skip path worked, Q14 inferred correctly,
Q5's mutual-exclusion held, and the final JSON came out with all sixteen
questions filled correctly. To be honest, this was a manual run, not an
automated test suite.

## With one more week

I'd add a product-shelf photo. The patient photographs their bathroom
shelf, and a vision model maps the bottles onto Q12's five rows, turning
"which products have you used" into a camera instead of a checklist.

I'd also build out full Hindi and Gujarati UI, with the language inferred
from the patient's first spoken sentence instead of asked upfront. A
Gujarat clinic serves patients who'd genuinely rather read it in their own
language.

I'd add an automated eval harness: synthetic transcripts diffed against
expected JSON, so accuracy is a number instead of a claim.

Pincode-based hard-water inference for Q11.

A "not sure" option on questions where a patient might genuinely not know
the answer, so the form doesn't force false certainty and the doctor sees
the uncertainty instead of a guess.

And I'd rebuild Q10 as a six-month timeline the patient scrubs through,
rather than a checklist. Triggers are easier to recall against a timeline
than to pull from a list.
