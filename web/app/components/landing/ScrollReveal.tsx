"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function useInView(
  threshold = 0.15
): [React.RefCallback<HTMLDivElement>, boolean] {
  const [inView, setInView] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      if (observer.current) observer.current.disconnect();
      if (!node) return;

      observer.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.current?.disconnect();
          }
        },
        { threshold }
      );
      observer.current.observe(node);
    },
    [threshold]
  );

  return [ref, inView];
}

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Extra delay in ms (staggered reveals) */
  delay?: number;
};

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
}: ScrollRevealProps) {
  const [ref, inView] = useInView();
  const [delayDone, setDelayDone] = useState(delay === 0);

  useEffect(() => {
    if (!inView || delay === 0) return;
    const t = setTimeout(() => setDelayDone(true), delay);
    return () => clearTimeout(t);
  }, [inView, delay]);

  const show = inView && delayDone;

  return (
    <div
      ref={ref}
      className={[
        "transition-all duration-700 ease-out",
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
