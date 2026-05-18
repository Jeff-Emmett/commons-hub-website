'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface JourneySection {
  /** Number of internal steps (e.g. carousel slides). 1 = no internal steps. */
  steps: number;
  /** Receives the current 0-based step within this section. */
  render: (step: number) => ReactNode;
  /** Optional: let this section scroll internally instead of fixed height. */
  scrollable?: boolean;
}

interface PresentationScrollProps {
  sections: JourneySection[];
  /** ms between auto-advances of the first section's steps (0 = off). */
  autoplayMs?: number;
}

// Height available below the fixed 80px (h-20) nav.
const SECTION_H = 'calc(100vh - 5rem)';
const ANIM_MS = 700;

export function PresentationScroll({
  sections,
  autoplayMs = 0,
}: PresentationScrollProps) {
  const [cur, setCur] = useState(0);
  const [step, setStep] = useState(0);
  const lockRef = useRef(false);
  const interactedRef = useRef(false);
  const touchY = useRef<number | null>(null);

  const last = sections.length - 1;

  const lock = useCallback(() => {
    lockRef.current = true;
    window.setTimeout(() => {
      lockRef.current = false;
    }, ANIM_MS + 60);
  }, []);

  const next = useCallback(() => {
    if (lockRef.current) return;
    const s = sections[cur];
    if (step < s.steps - 1) {
      setStep((v) => v + 1);
      lock();
    } else if (cur < last) {
      setCur(cur + 1);
      setStep(0);
      lock();
    }
  }, [cur, step, sections, last, lock]);

  const prev = useCallback(() => {
    if (lockRef.current) return;
    if (step > 0) {
      setStep((v) => v - 1);
      lock();
    } else if (cur > 0) {
      const target = cur - 1;
      setCur(target);
      setStep(sections[target].steps - 1);
      lock();
    }
  }, [cur, step, sections, lock]);

  // Wheel / keyboard / touch navigation.
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      // Let a genuinely scrollable section scroll internally.
      if (sections[cur].scrollable) {
        const el = document.getElementById(`journey-sec-${cur}`);
        if (el) {
          const atTop = el.scrollTop <= 0;
          const atBottom =
            el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
          if (!(e.deltaY > 0 && atBottom) && !(e.deltaY < 0 && atTop)) {
            return; // internal scroll
          }
        }
      }
      e.preventDefault();
      interactedRef.current = true;
      if (Math.abs(e.deltaY) < 8) return;
      if (e.deltaY > 0) next();
      else prev();
    };
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault();
        interactedRef.current = true;
        next();
      } else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        interactedRef.current = true;
        prev();
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      touchY.current = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (touchY.current == null) return;
      const dy = touchY.current - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 50) {
        interactedRef.current = true;
        if (dy > 0) next();
        else prev();
      }
      touchY.current = null;
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [cur, next, prev, sections]);

  // Autoplay: loop the first section's steps until the user interacts.
  useEffect(() => {
    if (!autoplayMs) return;
    const id = window.setInterval(() => {
      if (interactedRef.current) return;
      if (cur !== 0) return;
      setStep((v) => (v + 1) % sections[0].steps);
    }, autoplayMs);
    return () => window.clearInterval(id);
  }, [autoplayMs, cur, sections]);

  return (
    <div
      className="presentation-scroll relative overflow-hidden"
      style={{ height: SECTION_H }}
    >
      <div
        className="presentation-track"
        style={{
          transform: `translateY(-${cur * 100}%)`,
          transition: `transform ${ANIM_MS}ms cubic-bezier(0.22,1,0.36,1)`,
        }}
      >
        {sections.map((s, i) => (
          <section
            key={i}
            id={`journey-sec-${i}`}
            className={s.scrollable ? 'overflow-y-auto' : 'overflow-hidden'}
            style={{ height: SECTION_H }}
          >
            {s.render(i === cur ? step : 0)}
          </section>
        ))}
      </div>

      {/* Progress dots */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
        {sections.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to section ${i + 1}`}
            onClick={() => {
              interactedRef.current = true;
              setCur(i);
              setStep(0);
              lock();
            }}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              i === cur ? 'bg-slate-900' : 'bg-slate-300 hover:bg-slate-500'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
