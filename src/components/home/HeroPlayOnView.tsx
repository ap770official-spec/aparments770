"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Starts the hero animation when the card scrolls into view. On phones the
// card sits below the search form, so a load-time animation would be over
// before anyone saw it. Sets data-play directly: no re-render needed.
export default function HeroPlayOnView({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.play = "";
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
