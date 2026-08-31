'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Makes any card scrollable and shows a bottom fade whenever there's more
 * content below the fold that the fixed bottom nav would otherwise hide
 * silently — e.g. the Q6/Q7 "Not applicable" option or a Q12 product-detail
 * row. The fade disappears once the patient has scrolled to the end.
 */
export function CardScrollArea({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showFade, setShowFade] = useState(false);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    if (!scrollEl || !contentEl) return;

    function updateFade() {
      if (!scrollEl) return;
      const hasOverflow = scrollEl.scrollHeight > scrollEl.clientHeight + 1;
      const atBottom = scrollEl.scrollTop >= scrollEl.scrollHeight - scrollEl.clientHeight - 1;
      setShowFade(hasOverflow && !atBottom);
    }

    updateFade();
    scrollEl.addEventListener('scroll', updateFade, { passive: true });
    // Content height can change after mount (e.g. Q1's ruler settling its
    // width), so watch the content box rather than relying on a single check.
    const resizeObserver = new ResizeObserver(updateFade);
    resizeObserver.observe(contentEl);

    return () => {
      scrollEl.removeEventListener('scroll', updateFade);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="relative h-full">
      <div ref={scrollRef} className="h-full overflow-y-auto">
        <div ref={contentRef}>{children}</div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 transition-opacity duration-200"
        style={{
          background: 'linear-gradient(to top, #f8fafc, rgba(248,250,252,0))',
          opacity: showFade ? 1 : 0,
        }}
      />
    </div>
  );
}
