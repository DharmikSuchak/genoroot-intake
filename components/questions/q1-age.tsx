'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useIntakeStore } from '@/lib/intake-store';

const MIN = 5;
const MAX = 85;
const ITEM_HEIGHT = 56; // matches the app's 56px tap-target minimum
const VISIBLE_ITEMS = 5; // odd, so exactly one row sits dead-center
const PADDING = ((VISIBLE_ITEMS - 1) / 2) * ITEM_HEIGHT;
const LIST_HEIGHT = VISIBLE_ITEMS * ITEM_HEIGHT;
const DEFAULT = 25;
const SETTLE_DELAY = 120; // ms of scroll inactivity before committing the centered value

const AGES = Array.from({ length: MAX - MIN + 1 }, (_, i) => i + MIN);

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function indexForScrollTop(scrollTop: number) {
  return clamp(Math.round(scrollTop / ITEM_HEIGHT), 0, AGES.length - 1);
}

export function Q1Age() {
  const stored = useIntakeStore(s => s.form.age_hair_loss_began);
  const setField = useIntakeStore(s => s.setField);

  const [value, setValue] = useState(stored ?? DEFAULT);
  const [touched, setTouched] = useState(stored !== null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const programmaticScroll = useRef(false);

  function scrollToAge(age: number, smooth: boolean) {
    const el = listRef.current;
    if (!el) return;
    programmaticScroll.current = true;
    el.scrollTo({ top: (age - MIN) * ITEM_HEIGHT, behavior: smooth ? 'smooth' : 'auto' });
    window.setTimeout(() => { programmaticScroll.current = false; }, smooth ? 400 : 50);
  }

  // Position the wheel on the stored (or default) value before first paint.
  useLayoutEffect(() => {
    scrollToAge(value, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commit(age: number) {
    setValue(age);
    if (!touched) setTouched(true);
    setField('age_hair_loss_began', age, 'tapped');
  }

  function handleScroll() {
    if (programmaticScroll.current) return;
    if (!touched) setTouched(true);
    const el = listRef.current;
    if (!el) return;
    setValue(AGES[indexForScrollTop(el.scrollTop)]);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const finalEl = listRef.current;
      if (!finalEl) return;
      commit(AGES[indexForScrollTop(finalEl.scrollTop)]);
    }, SETTLE_DELAY);
  }

  function openEditor() {
    setDraft(String(value));
    setEditing(true);
  }

  function submitEditor() {
    const parsed = parseInt(draft, 10);
    if (!Number.isNaN(parsed)) {
      const clamped = clamp(parsed, MIN, MAX);
      commit(clamped);
      scrollToAge(clamped, true);
    }
    setEditing(false);
  }

  function cancelEditor() {
    setEditing(false);
  }

  return (
    <div className="flex flex-col min-h-full py-8 bg-slate-50">
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

      {/* Vertical wheel picker */}
      <div className="flex flex-col items-center pt-6 pb-2">
        <div
          className="relative w-full max-w-sm"
          style={{ height: LIST_HEIGHT }}
        >
          {/* Centered highlight band — sits behind the scroll list */}
          <div
            className="pointer-events-none absolute inset-x-4 rounded-2xl border-2"
            style={{
              top: PADDING,
              height: ITEM_HEIGHT,
              borderColor: touched ? '#0ea5e9' : '#e2e8f0',
              backgroundColor: touched ? '#f0f9ff' : 'transparent',
              transition: 'border-color 200ms, background-color 200ms',
            }}
          />

          {editing ? (
            // Editing needs real pointer events (it's a live input), but that's
            // fine here — the wheel underneath is hidden while editing, so
            // there's no swipe to conflict with.
            <div
              className="absolute inset-x-4 flex items-center justify-center gap-2"
              style={{ top: PADDING, height: ITEM_HEIGHT }}
            >
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={draft}
                onChange={e => setDraft(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                onBlur={submitEditor}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submitEditor();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelEditor();
                  }
                }}
                className="w-20 bg-transparent text-center focus:outline-none"
                style={{
                  fontFamily: 'var(--font-outfit), system-ui, sans-serif',
                  fontSize: 36,
                  fontWeight: 700,
                  color: '#0369a1',
                }}
              />
              <span className="text-base text-sky-600">years old</span>
            </div>
          ) : (
            // Purely decorative — pointer-events-none so it never steals a
            // swipe that starts over the center band. The actual tap-to-edit
            // target is the (transparent) center row inside the scrollable
            // list below, which is a normal in-flow element and never blocks
            // scrolling.
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-4 flex items-center justify-center gap-2"
              style={{ top: PADDING, height: ITEM_HEIGHT }}
            >
              <span
                className="tabular-nums"
                style={{
                  fontFamily: 'var(--font-outfit), system-ui, sans-serif',
                  fontSize: 36,
                  fontWeight: 700,
                  color: touched ? '#0369a1' : '#94a3b8',
                }}
              >
                {value}
              </span>
              <span className="text-base" style={{ color: touched ? '#0284c7' : '#94a3b8' }}>
                years old
              </span>
            </div>
          )}

          {/* Scrollable wheel — hidden behind the highlight band and input while editing */}
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="h-full overflow-y-scroll"
            style={{
              scrollSnapType: 'y mandatory',
              WebkitOverflowScrolling: 'touch',
              maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)',
              visibility: editing ? 'hidden' : 'visible',
            }}
          >
            <div style={{ paddingTop: PADDING, paddingBottom: PADDING }}>
              {AGES.map(age => {
                const distance = Math.abs(age - value);
                const isCenter = distance === 0;
                return (
                  <div
                    key={age}
                    role={isCenter ? 'button' : undefined}
                    tabIndex={isCenter ? 0 : undefined}
                    aria-label={isCenter ? `Edit age, currently ${value} years old` : undefined}
                    onClick={() => {
                      if (isCenter) openEditor();
                    }}
                    onKeyDown={e => {
                      if (isCenter && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        openEditor();
                      }
                    }}
                    className="flex items-center justify-center tabular-nums"
                    style={{
                      height: ITEM_HEIGHT,
                      scrollSnapAlign: 'center',
                      fontFamily: 'var(--font-outfit), system-ui, sans-serif',
                      fontSize: isCenter ? 36 : distance === 1 ? 22 : 18,
                      fontWeight: isCenter ? 700 : 500,
                      cursor: isCenter ? 'pointer' : undefined,
                      // The center row's number is rendered by the decorative
                      // overlay above (which can also host the edit input);
                      // this row stays present for scroll-snap geometry and
                      // handles the actual tap-to-edit interaction, but its
                      // own text is invisible so nothing doubles up visually.
                      color: isCenter ? 'transparent' : distance === 1 ? '#94a3b8' : '#cbd5e1',
                    }}
                  >
                    {age}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-400 pt-4">
          Swipe up or down to choose, or tap the number to type it in.
        </p>
      </div>
    </div>
  );
}
