import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildExtractionPrompt, sanitizeExtraction } from '@/lib/voice-schema';

const RequestSchema = z.object({
  transcript: z.string().min(1, 'transcript must not be empty').max(4000, 'transcript is too long'),
});

function parseJsonLoose(text: string): unknown {
  // Gemini is instructed to return raw JSON with no markdown fences, but
  // strip them defensively in case it wraps the response anyway.
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned);
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0 },
      }),
      signal: AbortSignal.timeout(20_000),
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Extraction request failed (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') {
    throw new Error('Extraction response was missing text content.');
  }
  return text;
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
    const rawText = await callGemini(prompt, apiKey);

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
    return NextResponse.json({ fields });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Extraction failed.' },
      { status: 502 }
    );
  }
}
