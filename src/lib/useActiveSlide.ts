"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Index of the slide currently filling a horizontal scroll-snap track.
 * Slides mark themselves with data-slide-index. IntersectionObserver keeps
 * this direction-agnostic (RTL scrollLeft is negative in most browsers).
 */
export function useActiveSlide(
  trackRef: RefObject<HTMLDivElement | null>,
  slideCount: number,
): number {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.slideIndex));
          }
        }
      },
      { root: track, threshold: 0.6 },
    );
    track
      .querySelectorAll("[data-slide-index]")
      .forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [trackRef, slideCount]);

  return active;
}
