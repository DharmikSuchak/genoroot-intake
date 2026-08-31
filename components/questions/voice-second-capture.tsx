'use client';

import { VoiceCaptureCard } from '@/components/voice-capture-card';
import type { SpokenFieldInput } from '@/lib/voice-schema';

interface VoiceSecondCaptureProps {
  ageOrDurationMissing: boolean;
  familyHistoryMissing: boolean;
  patternMissing: boolean;
  past6MonthsMissing: boolean;
  productsMissing: boolean;
  onSkip: () => void;
  onCaptured: (fields: SpokenFieldInput, transcript: string) => void;
}

/**
 * Names broad areas still missing — never the specific questions — so the
 * nudge reads like a person asking a follow-up, not a checklist.
 */
function missingAreas(props: VoiceSecondCaptureProps): string[] {
  const areas: string[] = [];
  if (props.ageOrDurationMissing) areas.push('when this started');
  if (props.familyHistoryMissing) areas.push('family history');
  if (props.patternMissing) areas.push('what it looks like');
  if (props.past6MonthsMissing) areas.push('anything stressful lately');
  if (props.productsMissing) areas.push("anything you've tried");
  return areas;
}

function joinNudge(areas: string[]): string {
  if (areas.length === 0) return 'Anything else you want to add?';
  if (areas.length === 1) return `Anything about ${areas[0]}?`;
  const picked = areas.slice(0, 3);
  if (picked.length === 2) return `Anything about ${picked[0]} or ${picked[1]}?`;
  return `Anything about ${picked[0]}, ${picked[1]}, or ${picked[2]}?`;
}

export function VoiceSecondCapture(props: VoiceSecondCaptureProps) {
  const nudge = joinNudge(missingAreas(props));

  return (
    <VoiceCaptureCard heading="Anything else?" onSkip={props.onSkip} onCaptured={props.onCaptured}>
      <p className="text-base text-slate-500 leading-relaxed">{nudge}</p>
    </VoiceCaptureCard>
  );
}
