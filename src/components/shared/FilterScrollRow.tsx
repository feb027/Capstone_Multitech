'use client';

import { useRef, useState, useEffect, useCallback, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FilterScrollRowProps {
  children: ReactNode;
  ariaLabel: string;
}

export function FilterScrollRow({ children, ariaLabel }: FilterScrollRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const didDragRef = useRef(false);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(updateScrollButtons);
    resizeObserver.observe(el);
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [updateScrollButtons, children]);

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

  function scrollByAmount(delta: number) {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  }

  return (
    <div className="relative z-10 flex w-full min-w-0 items-center gap-1.5">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByAmount(-160)}
          aria-label="Geser filter ke kiri"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-white text-slate-700 shadow-sm hover:bg-slate-50 tap-bounce dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:text-slate-200"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
      )}

      <div
        ref={scrollRef}
        role="tablist"
        aria-label={ariaLabel}
        onScroll={updateScrollButtons}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        onClickCapture={handleClickCapture}
        className="flex min-w-0 flex-1 flex-nowrap items-center gap-2 overflow-x-auto py-1 touch-pan-x no-scrollbar cursor-grab active:cursor-grabbing"
      >
        {children}
      </div>

      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByAmount(160)}
          aria-label="Geser filter ke kanan"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-white text-slate-700 shadow-sm hover:bg-slate-50 tap-bounce dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:text-slate-200"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
