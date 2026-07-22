import { useCallback, useEffect, useRef, useState } from "react";
import type { TimelineHandle } from "../components/Timeline";

// How far above the finger the card floats while dragging (px) — keeps the
// card readable while the finger stays in comfortable thumb-reach below it.
const CARD_OFFSET_Y = 90;
// Auto-scroll speed (px/frame) at full edge-zone penetration.
const MAX_SCROLL_SPEED = 16;

interface Options {
  timelineRef: React.RefObject<TimelineHandle | null>;
  cardRef: React.RefObject<HTMLElement | null>;
  onCommit: (index: number) => void;
  onHoverChange?: (index: number | null) => void;
}

// Drives the "grab the card, drag it across the whole timeline" gesture:
// tracks the pointer via window listeners (the finger travels well outside
// the card's own bounds), computes a CSS transform that keeps the card
// floating a fixed offset above the finger, asks the Timeline which gap is
// currently under the pointer every frame, and rate-scrolls the timeline
// when the pointer sits in its edge zones.
export function useCardPlacementDrag({ timelineRef, cardRef, onCommit, onHoverChange }: Options) {
  const [dragging, setDragging] = useState(false);
  const [cardTransform, setCardTransform] = useState<string | null>(null);

  const originRef = useRef({ x: 0, y: 0 });
  const hoveredIndexRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  // GameScreen passes onCommit/onHoverChange as fresh inline closures every
  // render (they dispatch with values only known at call time) — routing
  // through refs keeps handleMove/handleUp/startDrag themselves stable, so
  // the window listeners registered in startDrag are never torn down mid-
  // drag by an unrelated parent re-render (e.g. the hoveredIndex update
  // that setHovered itself triggers).
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;
  const onHoverChangeRef = useRef(onHoverChange);
  onHoverChangeRef.current = onHoverChange;

  const setHovered = useCallback((index: number | null) => {
    if (hoveredIndexRef.current === index) return;
    hoveredIndexRef.current = index;
    onHoverChangeRef.current?.(index);
  }, []);

  const applyPosition = useCallback(() => {
    const { x, y } = pointerRef.current;
    const dx = x - originRef.current.x;
    const dy = y - CARD_OFFSET_Y - originRef.current.y;
    setCardTransform(`translate(${dx}px, ${dy}px)`);
  }, []);

  const tick = useCallback(() => {
    const handle = timelineRef.current;
    if (handle) {
      const x = pointerRef.current.x;
      setHovered(handle.getIndexAtX(x));
      const { edge, strength } = handle.getEdgeIntensity(x);
      if (edge) {
        handle.scrollBy(edge === "left" ? -MAX_SCROLL_SPEED * strength : MAX_SCROLL_SPEED * strength);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [setHovered, timelineRef]);

  const handleMove = useCallback((e: PointerEvent) => {
    pointerRef.current = { x: e.clientX, y: e.clientY };
    applyPosition();
  }, [applyPosition]);

  const handleUp = useCallback(() => {
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setDragging(false);
    setCardTransform(null);
    const committed = hoveredIndexRef.current;
    setHovered(null);
    if (committed !== null) onCommitRef.current(committed);
  }, [handleMove, setHovered]);

  const startDrag = useCallback(
    (e: React.PointerEvent) => {
      const cardRect = cardRef.current?.getBoundingClientRect();
      if (!cardRect) return;
      e.preventDefault();
      originRef.current = { x: cardRect.left + cardRect.width / 2, y: cardRect.top + cardRect.height / 2 };
      pointerRef.current = { x: e.clientX, y: e.clientY };
      setDragging(true);
      applyPosition();
      setHovered(timelineRef.current?.getIndexAtX(e.clientX) ?? null);
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
      rafRef.current = requestAnimationFrame(tick);
    },
    [applyPosition, cardRef, handleMove, handleUp, setHovered, tick, timelineRef],
  );

  // Defensive cleanup: if the component unmounts mid-drag (e.g. the turn
  // ends abruptly), don't leave window listeners/rAF loops running. Safe
  // to run only on unmount now that handleMove/handleUp are stable.
  useEffect(
    () => () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [handleMove, handleUp],
  );

  return { dragging, cardTransform, startDrag };
}
