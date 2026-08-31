import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildExtractionPrompt, sanitizeExtraction } from '@/lib/voice-schema';

// ---------------------------------------------------------------------------
// Model configuration — ordered primary first. Change this array to change
// which models are tried; everything below reads from it.
// ---------------------------------------------------------------------------
const MODELS = ['gemini-flash-lite-latest', 'gemini-2.5-flash'] as const;

const MAX_ATTEMPTS_PER_MODEL = 2;
const RETRY_BASE_DELAY_MS = 400; // doubles per attempt: 400ms, 800ms, ...
const RETRYABLE_STATUSES = new Set([429, 503]);

// Hard budget for the whole route — every attempt across every model shares
// this one deadline, not a per-call timeout, so a slow primary can't eat
// into the fallback's chance to run. The patient-facing client also aborts
// on its own the moment "Skip" is tapped, independent of this.
const ROUTE_TIMEOUT_MS = 12_000;

const RequestSchema = z.object({
  transcript: z.string().min(1, 'transcript must not be empty').max(4000, 'transcript is too long'),
});

function parseJsonLoose(text: string): unknown {
  // Gemini is instructed to return raw JSON with no markdown fences, but
  // strip them defensively in case it wraps the response anyway.
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class GeminiRequestError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
  }
}

/** A single call to one model. Throws GeminiRequestError with the HTTP status on failure. */
async function callGeminiModel(
  model: string,
  prompt: string,
  apiKey: string,
  signal: AbortSignal
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0 },
      }),
      signal,
    }
  );

  if (!res.ok) {
    // Full detail logged server-side for diagnosis; never sent to the browser.
    const errText = await res.text().catch(() => '<no body>');
    console.error(`[extract] model=${model} status=${res.status} body=${errText.slice(0, 500)}`);
    throw new GeminiRequestError(`Gemini request failed (${res.status})`, res.status);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') {
    console.error(`[extract] model=${model} status=${res.status} body=<missing text content>`);
    throw new GeminiRequestError('Extraction response was missing text content.');
  }

  console.log(`[extract] model=${model} status=${res.status} ok`);
  return text;
}

/** One model, retried up to MAX_ATTEMPTS_PER_MODEL times with exponential
 *  backoff, but only when the failure is a transient 429/503 — anything else
 *  fails immediately so the caller can move on to the fallback model. */
async function callModelWithRetry(
  model: string,
  prompt: string,
  apiKey: string,
  signal: AbortSignal
): Promise<string> {
  let lastErr: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
    try {
      return await callGeminiModel(model, prompt, apiKey, signal);
    } catch (err) {
      lastErr = err;
      const status = err instanceof GeminiRequestError ? err.status : undefined;
      const isRetryable = status !== undefined && RETRYABLE_STATUSES.has(status);
      const hasMoreAttempts = attempt < MAX_ATTEMPTS_PER_MODEL;

      console.error(
        `[extract] model=${model} attempt=${attempt}/${MAX_ATTEMPTS_PER_MODEL} failed` +
          (status ? ` (status ${status})` : '') +
          (isRetryable && hasMoreAttempts ? ' — retrying' : ' — giving up on this model')
      );

      if (!isRetryable || !hasMoreAttempts) break;
      await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
    }
  }

  throw lastErr;
}

/**
 * Tries the primary model with full retry-with-backoff; if that's exhausted
 * (any reason), falls back to a single attempt on the next model in MODELS,
 * and so on. Throws the last error if every model fails.
 */
async function callGemini(prompt: string, apiKey: string, signal: AbortSignal): Promise<string> {
  let lastErr: unknown;

  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i];
    try {
      return i === 0
        ? await callModelWithRetry(model, prompt, apiKey, signal)
        : await callGeminiModel(model, prompt, apiKey, signal); // fallback model: one shot only
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'A transcript string is required.' },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Extraction is not configured on the server.' },
      { status: 500 }
    );
  }

  try {
    const prompt = buildExtractionPrompt(parsed.data.transcript);
    const rawText = await callGemini(prompt, apiKey, AbortSignal.timeout(ROUTE_TIMEOUT_MS));

    let rawJson: unknown;
    try {
      rawJson = parseJsonLoose(rawText);
    } catch {
      return NextResponse.json(
        { error: 'Extraction did not return valid JSON.' },
        { status: 502 }
      );
    }

    const fields = sanitizeExtraction(rawJson);
    console.log('[extract] raw:', JSON.stringify(rawJson));
    console.log('[extract] sanitized:', JSON.stringify(fields));
    return NextResponse.json({ fields });
  } catch (err) {
    console.error('[extract] Unexpected error calling Gemini:', err);
    return NextResponse.json({ error: 'Extraction failed.' }, { status: 502 });
  }
}
