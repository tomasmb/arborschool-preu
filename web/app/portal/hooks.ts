"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Animates a number from 0 to `target` over `duration` ms using rAF.
 * Returns the current display value (rounded integer).
 */
export function useCountUp(target: number | null, duration = 900): number {
  const [value, setValue] = useState(0);
  const prevTarget = useRef<number | null>(null);

  useEffect(() => {
    if (target === null || target === prevTarget.current) return;
    prevTarget.current = target;

    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

/**
 * Returns a boolean that flips from false → true on the
 * first render, triggering CSS transitions from 0 to target.
 */
export function useAnimatedMount(delay = 50): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(id);
  }, [delay]);
  return mounted;
}

/**
 * IntersectionObserver hook — returns [ref, isInView].
 * Once visible, stays visible (no re-trigger).
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit
): [React.RefCallback<T>, boolean] {
  const [inView, setInView] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: T | null) => {
      if (observer.current) observer.current.disconnect();
      if (!node) return;

      observer.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.current?.disconnect();
          }
        },
        { threshold: 0.15, ...options }
      );

      observer.current.observe(node);
    },
    [options]
  );

  return [ref, inView];
}
