import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Sarvam's REST speech-to-text endpoint caps audio at 30s, which matches
// this app's own recording limit — no client-side trimming needed.
const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

const AudioMetaSchema = z.object({
  size: z.number().positive().max(MAX_AUDIO_BYTES, 'Audio file is too large.'),
  type: z.string().refine(t => t.startsWith('audio/'), 'File must be an audio recording.'),
});

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: 'Expected multipart form data containing an audio file.' },
      { status: 400 }
    );
  }

  const file = formData.get('audio');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No audio file was provided.' }, { status: 400 });
  }

  const meta = AudioMetaSchema.safeParse({ size: file.size, type: file.type });
  if (!meta.success) {
    return NextResponse.json(
      { error: meta.error.issues[0]?.message ?? 'Invalid audio file.' },
      { status: 400 }
    );
  }

  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Transcription is not configured on the server.' },
      { status: 500 }
    );
  }

  try {
    const sarvamForm = new FormData();
    // The client always sends 16-bit PCM WAV (see lib/audio-to-wav.ts) —
    // Sarvam rejects the webm/opus MediaRecorder actually records.
    sarvamForm.append('file', file, file.name || 'recording.wav');
    sarvamForm.append('model', 'saaras:v3');
    // codemix mode keeps English words in English and Indic words in native
    // script, which is exactly what natural Hinglish speech looks like —
    // truer to what the patient said than forcing translation or romanization.
    sarvamForm.append('mode', 'codemix');

    const res = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': apiKey },
      body: sarvamForm,
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      // Full detail (status, body, whatever Sarvam actually complained
      // about) is logged server-side for diagnosis — never sent to the
      // browser, which only needs to know to fall back to the tap flow.
      const errText = await res.text().catch(() => '<no body>');
      console.error(`[transcribe] Sarvam speech-to-text failed (${res.status}):`, errText);
      return NextResponse.json({ error: 'Transcription failed.' }, { status: 502 });
    }

    const data = await res.json();
    const transcript = typeof data?.transcript === 'string' ? data.transcript.trim() : '';
    if (!transcript) {
      return NextResponse.json({ error: 'No speech was detected in the recording.' }, { status: 422 });
    }

    return NextResponse.json({ transcript });
  } catch (err) {
    console.error('[transcribe] Unexpected error calling Sarvam:', err);
    return NextResponse.json({ error: 'Transcription failed.' }, { status: 502 });
  }
}
