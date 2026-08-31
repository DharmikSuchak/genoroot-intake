'use client';

import { useEffect, useState } from 'react';
import { VoiceCaptureCard } from '@/components/voice-capture-card';
import type { SpokenFieldInput } from '@/lib/voice-schema';

const EXAMPLES = [
  'Do saal se hair fall ho raha hai, aage se. Papa ko bhi tha. Minoxidil use kar raha hoon.',
  'Mujhe 28 saal ki age se hair thinning start hui thi, crown pe zyada. Bahut stress bhi tha us waqt.',
  'Pichle saal se dheere dheere baal patle ho rahe hain, hairline bhi peeche ja rahi hai. Shampoo aur oil try kiya but help nahi hua.',
  'Mummy aur bhai dono ko hair loss hai family mein. Mera bhi crown ke paas thin ho raha hai, roughly ek saal se.',
];

interface VoiceOpeningProps {
  onSkip: () => void;
  onCaptured: (fields: SpokenFieldInput, transcript: string) => void;
}

export function VoiceOpening({ onSkip, onCaptured }: VoiceOpeningProps) {
  // Picking randomly during the initial render would make the server-rendered
  // HTML and the client's first render disagree (Math.random() isn't
  // deterministic across the two), so this app starts everyone on the same
  // example and rotates to a random one only after hydration completes.
  const [example, setExample] = useState(EXAMPLES[0]);
  useEffect(() => {
    setExample(EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)]);
  }, []);

  return (
    <VoiceCaptureCard
      heading="Tell me what's going on with your hair."
      onSkip={onSkip}
      onCaptured={onCaptured}
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">For example</p>
        <p className="text-base text-slate-500 italic leading-relaxed">&ldquo;{example}&rdquo;</p>
        <p className="text-sm text-slate-400 pt-1">Hindi, English, whatever&apos;s comfortable.</p>
      </div>
    </VoiceCaptureCard>
  );
}
