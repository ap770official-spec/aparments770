"use client";

import { useCallback, useEffect, useRef, type PointerEvent } from "react";

/** A modal dialog doesn't stop the page behind it from scrolling. */
function setPageScrollLocked(locked: boolean) {
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const EASE_DRAWER = "cubic-bezier(0.32, 0.72, 0, 1)";
/** Movement before a press on the handle area becomes a drag (lets taps on
 * the close button through). */
const DRAG_SLOP = 8;
/** A flick this fast (px/ms) dismisses regardless of distance. */
const FLICK_VELOCITY = 0.11;

/**
 * Bottom sheet behaviour on a native <dialog>:
 * - open(): locks page scroll and shows the modal (CSS @starting-style
 *   slides it up).
 * - close(): slides it back down the way it came, then closes.
 * - dragHandlers: spread on the sheet's top area (grabber + title). The
 *   sheet follows the finger 1:1; release far enough or fast enough and it
 *   dismisses, otherwise it springs back. Dragging up meets resistance.
 * Escape still closes instantly (keyboard actions shouldn't animate).
 */
export function useBottomSheet() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const drag = useRef<{
    pointerId: number;
    startY: number;
    startTime: number;
    dy: number;
    active: boolean;
    /** Recent (time, dy) samples: release velocity comes from the last
     * ~100ms, so a drag that pauses before letting go doesn't fling. */
    samples: { t: number; dy: number }[];
  } | null>(null);
  const closing = useRef(false);

  useEffect(() => () => setPageScrollLocked(false), []);

  const open = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    closing.current = false;
    dialog.style.transform = "";
    dialog.style.transition = "";
    setPageScrollLocked(true);
    dialog.showModal();
  }, []);

  /** Animate from wherever the sheet is now down off-screen, then close. */
  const close = useCallback((fromY = 0) => {
    const dialog = dialogRef.current;
    if (!dialog || !dialog.open || closing.current) return;
    closing.current = true;
    dialog.style.transition = "none";
    const finish = () => {
      dialog.close();
      dialog.style.transform = "";
      dialog.style.transition = "";
      closing.current = false;
    };
    const animation = prefersReducedMotion()
      ? dialog.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 150,
          easing: "ease",
        })
      : dialog.animate(
          [
            { transform: `translateY(${fromY}px)` },
            { transform: "translateY(100%)" },
          ],
          // Exit faster than the 300ms entrance.
          { duration: 220, easing: EASE_DRAWER, fill: "forwards" },
        );
    animation.onfinish = () => {
      finish();
      animation.cancel();
    };
  }, []);

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startTime: event.timeStamp,
      dy: 0,
      active: false,
      samples: [],
    };
  }, []);

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    const state = drag.current;
    const dialog = dialogRef.current;
    if (!state || !dialog || event.pointerId !== state.pointerId) return;
    const raw = event.clientY - state.startY;
    if (!state.active) {
      if (Math.abs(raw) < DRAG_SLOP) return;
      // Now it's a drag: capture so it keeps tracking outside the handle.
      state.active = true;
      state.startY = event.clientY;
      state.startTime = event.timeStamp;
      event.currentTarget.setPointerCapture(event.pointerId);
      dialog.style.transition = "none";
    }
    const delta = event.clientY - state.startY;
    // Down follows the finger; up resists (rubber band), it can't go higher.
    state.dy = delta >= 0 ? delta : -Math.sqrt(-delta) * 2;
    dialog.style.transform = `translateY(${state.dy}px)`;
    state.samples.push({ t: event.timeStamp, dy: state.dy });
    while (state.samples.length > 2 && event.timeStamp - state.samples[0].t > 100) {
      state.samples.shift();
    }
  }, []);

  const endDrag = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const state = drag.current;
      const dialog = dialogRef.current;
      drag.current = null;
      if (!state || !state.active || !dialog) return;
      const first = state.samples[0] ?? { t: state.startTime, dy: 0 };
      const elapsed = Math.max(1, event.timeStamp - first.t);
      const velocity = (state.dy - first.dy) / elapsed;
      const height = dialog.getBoundingClientRect().height;
      if (state.dy > height * 0.25 || (velocity > FLICK_VELOCITY && state.dy > 12)) {
        close(state.dy);
        return;
      }
      // Not far or fast enough: settle back from where it is.
      const back = dialog.animate(
        [{ transform: `translateY(${state.dy}px)` }, { transform: "translateY(0)" }],
        { duration: prefersReducedMotion() ? 0 : 260, easing: EASE_DRAWER },
      );
      dialog.style.transform = "";
      back.onfinish = () => {
        dialog.style.transition = "";
      };
    },
    [close],
  );

  return {
    dialogRef,
    open,
    close: () => close(0),
    /** onClose for the <dialog>: Escape and programmatic closes. */
    onDialogClose: () => setPageScrollLocked(false),
    /** onClick for the <dialog>: a click on the backdrop closes. */
    onDialogClick: (event: React.MouseEvent<HTMLDialogElement>) => {
      if (event.target === event.currentTarget) close(0);
    },
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      style: { touchAction: "none" as const },
    },
  };
}
