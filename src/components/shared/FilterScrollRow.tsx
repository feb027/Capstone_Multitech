'use client';

import { useRef, ReactNode } from 'react';

/**
 * Enables sideways mouse-wheel and drag scrolling on horizontal scroll containers
 * while ignoring button/card clicks triggered at the end of a drag gesture.
 */
export function useHorizontalDragScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const didDragRef = useRef(false);

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    const el = scrollRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
    }
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    const el = scrollRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    didDragRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    startScrollLeftRef.current = el.scrollLeft;
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = scrollRef.current;
    if (!isDraggingRef.current || !el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 6) {
      didDragRef.current = true;
      el.scrollLeft = startScrollLeftRef.current - walk;
    }
  }

  function stopDragging() {
    isDraggingRef.current = false;
  }

  function handleClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (didDragRef.current) {
      e.preventDefault();
      e.stopPropagation();
      didDragRef.current = false;
    }
  }

  return {
    scrollRef,
    handlers: {
      onWheel: handleWheel,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: stopDragging,
      onMouseLeave: stopDragging,
      onClickCapture: handleClickCapture,
    },
  };
}

interface FilterScrollRowProps {
  children: ReactNode;
  ariaLabel: string;
}

export function FilterScrollRow({ children, ariaLabel }: FilterScrollRowProps) {
  const { scrollRef, handlers } = useHorizontalDragScroll();

  return (
    <div
      ref={scrollRef}
      role="tablist"
      aria-label={ariaLabel}
      {...handlers}
      className="relative z-10 flex w-full min-w-0 flex-nowrap select-none items-center gap-2 overflow-x-auto py-1 touch-pan-x no-scrollbar cursor-grab active:cursor-grabbing"
    >
      {children}
    </div>
  );
}
