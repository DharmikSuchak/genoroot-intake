'use client';

import { useRef, useState, useEffect } from 'react';
import { useIntakeStore } from '@/lib/intake-store';

const MIN = 5;
const MAX = 85;
const TICK = 48; // px between ticks — well above the 44px minimum
const DEFAULT = 25;

const AGES = Array.from({ length: MAX - MIN + 1 }, (_, i) => i + MIN);

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function translateForValue(v: number, halfW: number) {
  return halfW - (v - MIN) * TICK;
}

function valueFromTranslate(tx: number, halfW: number) {
  return clamp(Math.round(MIN + (halfW - tx) / TICK), MIN, MAX);
}

export function Q1Age() {
  const stored = useIntakeStore(s => s.form.age_hair_loss_began);
  const setField = useIntakeStore(s => s.setField);

  const [value, setValue] = useState(stored ?? DEFAULT);
  const [touched, setTouched] = useState(stored !== null);
  const [halfW, setHalfW] = useState(0);
  // dragTx is the raw translateX during an active drag; null when idle
  const [dragTx, setDragTx] = useState<number | null>(null);
  // mountOffset starts at 30px and settles to 0 on first render, giving the
  // ruler a visible "slide in" that reads as draggable without instructions
  const [mountOffset, setMountOffset] = useState(30);
  const dragStart = useRef<{ x: number; tx: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setHalfW(el.clientWidth / 2);
    // Settle the mount offset after the strip has rendered at its initial position
    const raf = requestAnimationFrame(() => setMountOffset(0));
    return () => cancelAnimationFrame(raf);
  }, []);

  const minTx = halfW - (MAX - MIN) * TICK;
  const maxTx = halfW;

  // The live translate: dragTx during drag, stable derived value otherwise
  const liveTx = dragTx !== null ? dragTx : translateForValue(value, halfW);
  const tx = clamp(liveTx, minTx, maxTx);

  // What value the ruler is currently showing (integer, updates during drag)
  const displayValue = halfW > 0 ? valueFromTranslate(tx, halfW) : value;

  function commit(v: number) {
    setValue(v);
    if (!touched) setTouched(true);
    setField('age_hair_loss_began', v, 'tapped');
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const startTx = dragTx !== null ? dragTx : translateForValue(value, halfW);
    dragStart.current = { x: e.clientX, tx: startTx };
    setDragTx(startTx);
    if (!touched) setTouched(true); // undim immediately on first touch
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    const raw = dragStart.current.tx + (e.clientX - dragStart.current.x);
    setDragTx(clamp(raw, minTx, maxTx));
  }

  function handlePointerUp() {
    if (!dragStart.current) return;
    dragStart.current = null;
    const snapped = valueFromTranslate(tx, halfW);
    commit(snapped);
    setDragTx(null); // let CSS transition animate the snap to exact grid position
  }

  function adjustBy(delta: number) {
    const next = clamp(value + delta, MIN, MAX);
    commit(next);
    setDragTx(null); // ensures idle transition animates to new position
  }

  return (
    <div className="flex flex-col h-full py-8 bg-slate-50">
      {/* Question header — padded */}
      <div className="px-4 flex flex-col gap-3 max-w-sm mx-auto w-full">
        <p className="text-sm font-medium tracking-wide text-sky-600">Question 1 of 16</p>
        <h2
          className="text-xl font-semibold text-slate-800 leading-snug"
          style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
        >
          How old were you when you first noticed your hair thinning?
        </h2>
      </div>

      {/* Large number */}
      <div className="flex flex-col items-center pt-6 pb-4">
        <span
          className="text-8xl font-bold leading-none tabular-nums"
          style={{
            fontFamily: 'var(--font-outfit), system-ui, sans-serif',
            color: touched ? '#1e293b' : '#cbd5e1',
            display: 'inline-block',
            transform: dragTx !== null ? 'scale(1.05)' : 'scale(1)',
            transition: 'color 200ms, transform 150ms ease-out',
          }}
        >
          {displayValue}
        </span>
        <span
          className="text-base mt-2"
          style={{ color: touched ? '#94a3b8' : '#e2e8f0', transition: 'color 200ms' }}
        >
          years old
        </span>
      </div>

      {/* Ruler — full bleed, no horizontal padding */}
      <div className="relative" style={{ userSelect: 'none' }}>
        {/* Fixed center indicator: thin line + downward triangle */}
        <div className="pointer-events-none absolute inset-0 flex justify-center z-10">
          <div className="flex flex-col items-center">
            <div style={{ width: 2, height: '100%', backgroundColor: '#0ea5e9', opacity: 0.6 }} />
          </div>
        </div>
        {/* Downward triangle above the ruler */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 z-10" style={{ marginTop: -7 }}>
          <svg width="12" height="8" viewBox="0 0 12 8">
            <path d="M6 8L0 0h12z" fill="#0ea5e9" />
          </svg>
        </div>

        {/* Left fade */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10"
          style={{ width: 72, background: 'linear-gradient(to right, #f8fafc 30%, transparent)' }}
        />
        {/* Right fade */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10"
          style={{ width: 72, background: 'linear-gradient(to left, #f8fafc 30%, transparent)' }}
        />

        {/* Draggable viewport */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            position: 'relative',
            overflow: 'hidden',
            height: 64,
            touchAction: 'none',
            cursor: dragTx !== null ? 'grabbing' : 'grab',
          }}
        >
          {/* Tick strip */}
          {halfW > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                // wide enough for all ticks + half a gap of breathing room
                width: (MAX - MIN + 1) * TICK,
                height: '100%',
                transform: `translateX(${tx + mountOffset}px)`,
                // CSS transition applies the snap animation on pointer-up;
                // disabled during drag so motion tracks the finger exactly
                transition: dragTx !== null ? 'none' : 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                willChange: 'transform',
              }}
            >
              {AGES.map((age, i) => {
                const isMajor5 = age % 5 === 0;
                const hasLabel = age % 10 === 0 || age === MIN || age === MAX;
                const isActive = age === displayValue;
                return (
                  <div
                    key={age}
                    style={{
                      position: 'absolute',
                      left: i * TICK,
                      top: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    {/* Tick line */}
                    <div
                      style={{
                        width: isActive ? 2.5 : isMajor5 ? 1.5 : 1,
                        height: isActive ? 28 : isMajor5 ? 22 : 14,
                        backgroundColor: isActive ? '#0ea5e9' : isMajor5 ? '#475569' : '#cbd5e1',
                        borderRadius: 2,
                      }}
                    />
                    {/* Label — only on major-10 ticks and range ends */}
                    {hasLabel && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 34,
                          fontSize: 10,
                          lineHeight: 1,
                          whiteSpace: 'nowrap',
                          transform: 'translateX(-50%)',
                          color: isActive ? '#0284c7' : '#94a3b8',
                          fontWeight: isActive ? 600 : 400,
                        }}
                      >
                        {age}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fine-adjustment buttons — visually secondary (40px, outlined) */}
      <div className="flex justify-center gap-8 pt-5 pb-1">
        <button
          onClick={() => adjustBy(-1)}
          aria-label="Decrease age by 1"
          className="flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 text-xl active:bg-slate-50"
          style={{ width: 40, height: 40 }}
        >
          −
        </button>
        <button
          onClick={() => adjustBy(1)}
          aria-label="Increase age by 1"
          className="flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 text-xl active:bg-slate-50"
          style={{ width: 40, height: 40 }}
        >
          +
        </button>
      </div>

    </div>
  );
}
