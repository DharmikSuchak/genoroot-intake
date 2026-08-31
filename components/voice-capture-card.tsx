'use client';

import { useEffect, useRef, useState } from 'react';
import { convertToWavBlob } from '@/lib/audio-to-wav';
import type { SpokenFieldInput } from '@/lib/voice-schema';

const RECORD_SECONDS = 30;
const FETCH_TIMEOUT_MS = 20_000;

type CaptureState = 'idle' | 'recording' | 'processing' | 'error';

interface VoiceCaptureCardProps {
  heading: string;
  /** Example block (opening) or nudge text (second capture), shown above the mic. */
  children?: React.ReactNode;
  onSkip: () => void;
  onCaptured: (fields: SpokenFieldInput, transcript: string) => void;
}

function pickSupportedMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(type)) return type;
  }
  return undefined;
}

async function fetchWithTimeout(input: string, init: RequestInit, signal: AbortSignal): Promise<Response> {
  const timeoutSignal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  return fetch(input, { ...init, signal: AbortSignal.any([timeoutSignal, signal]) });
}

export function VoiceCaptureCard({ heading, children, onSkip, onCaptured }: VoiceCaptureCardProps) {
  const [state, setState] = useState<CaptureState>('idle');
  const [secondsLeft, setSecondsLeft] = useState(RECORD_SECONDS);
  const [errorMessage, setErrorMessage] = useState('');

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Aborts any in-flight transcribe/extract call and blocks any further
  // state updates the moment the patient taps Skip — so a slow or late
  // response can never resurrect this screen after they've moved on, and
  // "Skip, I'll just tap" stays genuinely immediate throughout extraction.
  const skipControllerRef = useRef(new AbortController());

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      recorderRef.current?.stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  function handleSkipTap() {
    skipControllerRef.current.abort();
    onSkip();
  }

  function fallbackToTapFlow(message: string) {
    if (skipControllerRef.current.signal.aborted) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setErrorMessage(message);
    setState('error');
    // The patient must never be stuck here — hand off to the normal tap
    // flow shortly after showing the brief reason.
    fallbackTimerRef.current = setTimeout(() => {
      if (!skipControllerRef.current.signal.aborted) onSkip();
    }, 1800);
  }

  async function startRecording() {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      fallbackToTapFlow("Couldn't access your microphone. Let's go through it together.");
      return;
    }

    const mimeType = pickSupportedMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];

    recorder.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      void processRecording(blob);
    };

    recorderRef.current = recorder;
    recorder.start();
    setState('recording');
    setSecondsLeft(RECORD_SECONDS);

    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          stopRecording();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function stopRecording() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setState('processing');
  }

  async function processRecording(blob: Blob) {
    const signal = skipControllerRef.current.signal;
    try {
      // Sarvam rejects the webm/opus (or mp4) audio MediaRecorder actually
      // produces — normalize to 16-bit PCM WAV before it ever leaves the browser.
      const wavBlob = await convertToWavBlob(blob);

      const form = new FormData();
      form.append('audio', wavBlob, 'recording.wav');

      const transcribeRes = await fetchWithTimeout('/api/transcribe', { method: 'POST', body: form }, signal);
      if (!transcribeRes.ok) {
        throw new Error('transcribe request failed');
      }
      const { transcript } = (await transcribeRes.json()) as { transcript?: string };
      if (!transcript || !transcript.trim()) {
        throw new Error('empty transcript');
      }

      const extractRes = await fetchWithTimeout(
        '/api/extract',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript }),
        },
        signal
      );
      if (!extractRes.ok) {
        throw new Error('extract request failed');
      }
      const { fields } = (await extractRes.json()) as { fields?: SpokenFieldInput };

      // The patient may have tapped Skip while this was in flight — don't
      // resurrect the voice flow with a result that arrived after they left.
      if (signal.aborted) return;
      onCaptured(fields ?? {}, transcript);
    } catch {
      fallbackToTapFlow("Couldn't catch that. Let's go through it together.");
    }
  }

  function handleMicTap() {
    if (state === 'idle' || state === 'error') {
      startRecording();
    } else if (state === 'recording') {
      stopRecording();
    }
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const countdown = `${minutes}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="flex flex-col min-h-full px-4 py-8 bg-slate-50">
      <div className="max-w-sm mx-auto w-full flex flex-col gap-6 flex-1">
        <div className="flex flex-col gap-3">
          <h2
            className="text-xl font-semibold text-slate-800 leading-snug"
            style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
          >
            {heading}
          </h2>
        </div>

        {children}

        <div className="flex flex-col items-center gap-4 pt-4">
          <button
            onClick={handleMicTap}
            disabled={state === 'processing'}
            aria-label={state === 'recording' ? 'Stop recording' : 'Start recording'}
            className="flex items-center justify-center rounded-full transition-colors disabled:opacity-60"
            style={{
              width: 96,
              height: 96,
              backgroundColor: state === 'recording' ? '#dc2626' : '#0ea5e9',
            }}
          >
            {state === 'recording' ? (
              <span className="rounded-md bg-white" style={{ width: 28, height: 28 }} />
            ) : (
              <MicIcon />
            )}
          </button>

          <div className="flex flex-col items-center gap-1" style={{ minHeight: 48 }}>
            {state === 'recording' && (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-red-600 animate-pulse" style={{ width: 10, height: 10 }} />
                <span className="text-base font-medium text-slate-700 tabular-nums">Recording ({countdown})</span>
              </div>
            )}
            {state === 'processing' && (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-sky-500 animate-pulse" style={{ width: 10, height: 10 }} />
                <span className="text-base font-medium text-slate-700">Making sense of that…</span>
              </div>
            )}
            {state === 'error' && (
              <span className="text-base font-medium text-center" style={{ color: '#b45309' }}>
                {errorMessage}
              </span>
            )}
            {state === 'idle' && (
              <span className="text-sm text-slate-400">Tap the mic to talk, up to 30 seconds</span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={handleSkipTap}
        className="w-full h-14 rounded-xl font-medium text-base text-slate-500 border border-slate-200 bg-white active:bg-slate-50 transition-colors"
      >
        Skip, I&apos;ll just tap
      </button>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" fill="white" />
      <path
        d="M5 11a7 7 0 0 0 14 0"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M12 18v3" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
