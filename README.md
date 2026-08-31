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

The next week would go toward two things: taking effort off the patient
and making correctness something I can actually measure. Everything below
is ordered by how much it moves those two needles.

### Product capture

The patient takes a photo of the products they currently use. Bottles,
tubes, whatever they've got. A vision model identifies likely matches and
maps them onto Q12's five treatment/product rows. The patient reviews and
confirms what was detected before anything gets saved. The whole point is
to replace a five-row checklist with a single camera tap, not to bolt on
AI for its own sake. A wrong auto-fill that the patient doesn't catch is
worse than letting them pick manually, so the confirmation step is
non-negotiable.

### Automated evaluation

Right now I check correctness manually against a known patient profile.
That doesn't scale. I'd build a synthetic-patient test harness with a set
of scripted transcripts and tap sequences, each paired with an expected
JSON output. The harness feeds each scenario through the full intake,
covering voice extraction, conditional paths, inferred fields, and mutual
exclusions, then diffs the resulting sixteen-field JSON against the
expected one. The output is a pass/fail table and a numeric accuracy
score. The goal is to turn "the intake works" into a measurable claim
instead of a manual one.

### Q11 rapid-fire interaction

Q11 is currently a table covering smoking, alcohol, hard water, wash
frequency, heating tools, and salon treatments. Tables are dense, and
that density is exactly what makes paper forms feel like paperwork. I'd
break it into a rapid-fire sequence of small, focused questions. One
question at a time, one tap per answer. "Do you smoke?" then Yes or No.
"How often do you wash your hair?" then Daily, Alternate days, or Weekly.
Follow-ups only show up when they matter. Smoking severity appears only
after "Yes", and salon-treatment details appear only after "Yes". The
structured output stays the same because the schema doesn't change, just
the way the patient interacts with it. This cuts cognitive load and turns
a table-heavy question into something that feels more like a short
conversation. It's a UX improvement, not an AI feature.

### Six-month memory timeline

Q10 asks about triggers in the last six months, things like major stress,
illness, surgery, weight loss, or environmental changes. A checklist
works, but a visual timeline works better as a memory aid. Scrolling
through the last six months and dropping events onto it helps patients
recall things they'd otherwise forget, like a fever in March or a move
in May. The final answer still maps to Q10's required structured values.
The timeline is a recall tool, not a data-model change.

### Multilingual interaction and uncertainty

Language can be inferred from the patient's first spoken response instead
of forcing a language-selection screen upfront. Hindi and Gujarati are the
obvious first additions for a Gujarat-based clinic, and the underlying
structured data stays language-neutral regardless. I wouldn't overclaim
translation quality here. This needs real patient testing, not just a
translation pass.

Separately, I'd add a "Not sure" option on questions where the patient
genuinely might not know the answer. In a medical intake, a truthful
unknown is more useful than fabricated certainty. Making uncertainty a
first-class value that the doctor can see, rather than something the form
silently drops, means patients stop guessing and doctors know exactly
where to follow up.
