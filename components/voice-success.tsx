'use client';

/**
 * Brief interstitial shown after voice capture finishes.
 * Tells the patient their answers have been pre-filled and
 * invites them to review & continue through the form.
 */
export function VoiceSuccess({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 bg-slate-50">
      <div className="flex flex-col items-center gap-5 max-w-sm text-center">
        {/* Animated checkmark */}
        <div
          className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100"
          style={{ animation: 'pop-in 0.4s cubic-bezier(.17,.67,.27,1.3) both' }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2
          className="text-2xl font-bold text-slate-800"
          style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
        >
          Got it!
        </h2>

        <p className="text-base text-slate-500 leading-relaxed">
          We&rsquo;ve received your response and pre-filled your answers
          accordingly. You can review and update anything as you go.
        </p>

        <button
          onClick={onContinue}
          className="mt-4 w-full max-w-xs h-14 rounded-xl font-medium text-base text-white bg-sky-500 transition-colors active:bg-sky-600"
        >
          Continue →
        </button>
      </div>

      <style>{`
        @keyframes pop-in {
          0%   { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
