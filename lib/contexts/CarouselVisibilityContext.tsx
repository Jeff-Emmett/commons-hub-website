'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/**
 * Tracks whether a viewport-occupying carousel is currently "live" (on
 * screen). Used to hide the global left-hand social sidebar so it doesn't
 * collide with full-bleed scroll-pinned carousels.
 *
 * A counter (not a boolean) so multiple carousels on one page — e.g. the
 * two PinnedCarousels on /event-venue — register/unregister independently.
 */
interface CarouselVisibilityControls {
  increment: () => void;
  decrement: () => void;
}

const LiveCountContext = createContext<number>(0);
const ControlsContext = createContext<CarouselVisibilityControls | null>(null);

export function CarouselVisibilityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => setCount((c) => c + 1), []);
  const decrement = useCallback(() => setCount((c) => Math.max(0, c - 1)), []);

  const controls = useMemo(
    () => ({ increment, decrement }),
    [increment, decrement],
  );

  return (
    <ControlsContext.Provider value={controls}>
      <LiveCountContext.Provider value={count}>
        {children}
      </LiveCountContext.Provider>
    </ControlsContext.Provider>
  );
}

/** True while at least one carousel has registered itself as on-screen. */
export function useCarouselLive(): boolean {
  return useContext(LiveCountContext) > 0;
}

/**
 * Carousels call this with whether they are currently in the viewport.
 * Registers/unregisters against the live counter and cleans up on unmount.
 * Safe to use outside a provider (no-op) so isolated component tests don't
 * need the wrapper.
 */
export function useRegisterLiveCarousel(active: boolean): void {
  const controls = useContext(ControlsContext);
  const registered = useRef(false);

  useEffect(() => {
    if (!controls) return;
    if (active && !registered.current) {
      registered.current = true;
      controls.increment();
    } else if (!active && registered.current) {
      registered.current = false;
      controls.decrement();
    }
    return () => {
      if (registered.current) {
        registered.current = false;
        controls.decrement();
      }
    };
  }, [active, controls]);
}
