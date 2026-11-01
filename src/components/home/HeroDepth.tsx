"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Gives the hero scene its depth. Each [data-depth] layer drifts sideways
// with the pointer (mouse only), nearer layers more than far ones.
// data-lift adds vertical pointer drift and data-scroll a scroll offset
// (far layers sink behind the ground as the page scrolls); layers standing
// on the ground line leave both at 0 so they never float off it.
// A [data-tilt] element turns in 3D with the pointer instead.
// Transforms are written straight onto each layer inside one rAF loop
// that stops once the layers settle, so React never re-renders.
export default function HeroDepth({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layers = Array.from(
      root.querySelectorAll<HTMLElement>("[data-depth]"),
    ).map((el) => ({
      el,
      depth: Number(el.dataset.depth) || 0,
      lift: Number(el.dataset.lift) || 0,
      scroll: Number(el.dataset.scroll) || 0,
    }));
    const tilt = root.querySelector<HTMLElement>("[data-tilt]");
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let scroll = window.scrollY;
    let frame = 0;
    let visible = true;

    function render() {
      x += (targetX - x) * 0.08;
      y += (targetY - y) * 0.08;
      for (const layer of layers) {
        const dx = x * layer.depth * 16;
        const dy = y * layer.lift * 10 + scroll * layer.scroll;
        layer.el.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
      }
      if (tilt) {
        tilt.style.transform = `rotateX(${(-y * 4).toFixed(3)}deg) rotateY(${(x * 10).toFixed(3)}deg)`;
      }
      const settled =
        Math.abs(targetX - x) < 0.001 && Math.abs(targetY - y) < 0.001;
      frame = settled ? 0 : requestAnimationFrame(render);
    }
    function kick() {
      if (visible && !frame) frame = requestAnimationFrame(render);
    }
    function onPointerMove(event: PointerEvent) {
      targetX = event.clientX / window.innerWidth - 0.5;
      targetY = event.clientY / window.innerHeight - 0.5;
      kick();
    }
    function onScroll() {
      scroll = window.scrollY;
      kick();
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) kick();
    });
    observer.observe(root);
    if (finePointer) window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className={className} aria-hidden="true">
      {children}
    </div>
  );
}
