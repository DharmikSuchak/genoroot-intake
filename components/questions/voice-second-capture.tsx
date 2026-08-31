'use client';

import { VoiceCaptureCard } from '@/components/voice-capture-card';
import type { VoiceScopedMissing } from '@/lib/intake-store';
import type { SpokenFieldInput } from '@/lib/voice-schema';

interface VoiceSecondCaptureProps {
  missing: VoiceScopedMissing;
  onSkip: () => void;
  onCaptured: (fields: SpokenFieldInput, transcript: string) => void;
}

// Order matters — this is also the order areas appear in the nudge.
const AREA_LABELS: { key: keyof VoiceScopedMissing; label: string }[] = [
  { key: 'age', label: 'when it started' },
  { key: 'duration', label: "how long it's been going on" },
  { key: 'familyHistory', label: 'family history' },
  { key: 'pattern', label: 'what it looks like' },
  { key: 'past6Months', label: 'anything stressful lately' },
  { key: 'products', label: "anything you've tried" },
];

/**
 * Names broad areas still missing — computed straight from the fields that
 * are actually still empty, never a fixed list — so the nudge reads like a
 * person asking a follow-up, not a checklist, and never re-asks about
 * something already answered.
 */
function missingAreas(missing: VoiceScopedMissing): string[] {
  return AREA_LABELS.filter(({ key }) => missing[key]).map(({ label }) => label);
}

function joinNudge(areas: string[]): string {
  if (areas.length === 0) return 'Anything else you want to add?';
  if (areas.length === 1) return `Anything about ${areas[0]}?`;
  const picked = areas.slice(0, 3);
  if (picked.length === 2) return `Anything about ${picked[0]} or ${picked[1]}?`;
  return `Anything about ${picked[0]}, ${picked[1]}, or ${picked[2]}?`;
}

export function VoiceSecondCapture({ missing, onSkip, onCaptured }: VoiceSecondCaptureProps) {
  const nudge = joinNudge(missingAreas(missing));

  return (
    <VoiceCaptureCard heading="Anything else?" onSkip={onSkip} onCaptured={onCaptured}>
      <p className="text-base text-slate-500 leading-relaxed">{nudge}</p>
    </VoiceCaptureCard>
  );
}
