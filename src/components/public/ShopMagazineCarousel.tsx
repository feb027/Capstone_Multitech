'use client';

import { useEffect, useRef } from 'react';
import { WORKSHOP_PROFILE } from '@/lib/status';

interface MagazineSlide {
  src: string;
  alt: string;
  tag: string;
  title: string;
  subtitle: string;
}

const SHOP_GALLERY: MagazineSlide[] = [
  {
    src: '/images/shop/multitech-front-detail.jpg',
    alt: 'Bengkel Spesialis Perbaikan Elektronik Otomotif CV Multitech Tasikmalaya',
    tag: 'GALERI BENGKEL',
    title: 'Bengkel Spesialis Perbaikan Elektronik Otomotif',
    subtitle: 'ECU, BCM, EPS, Digital Speedometer & Modul Genset',
  },
  {
    src: '/images/shop/multitech-front-wide.jpg',
    alt: 'Tampak depan lokasi bengkel CV Multitech Tasikmalaya',
    tag: 'LOKASI RESMI',
    title: 'Workshop CV Multitech Tasikmalaya',
    subtitle: WORKSHOP_PROFILE.address,
  },
];

const LOOPED_SLIDES = [...SHOP_GALLERY, ...SHOP_GALLERY, ...SHOP_GALLERY];
const SLIDE_COUNT = SHOP_GALLERY.length;

/**
 * Infinite horizontal swipeable and draggable workshop magazine banner.
 * Clones slides 3x and silently recenters into the middle set so users can
 * swipe endlessly in either direction without hitting an edge.
 */
export function ShopMagazineCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function instantJump(el: HTMLDivElement, nextScrollLeft: number) {
    el.style.scrollSnapType = 'none';
    el.scrollLeft = nextScrollLeft;
    requestAnimationFrame(() => {
      if (!isDraggingRef.current && trackRef.current) {
        trackRef.current.style.scrollSnapType = '';
      }
    });
  }

  function recenterIntoMiddleSet(el: HTMLDivElement) {
    const slideWidth = el.clientWidth;
    if (!slideWidth) return;
    const setWidth = slideWidth * SLIDE_COUNT;

    if (el.scrollLeft < setWidth) {
      const offset = ((el.scrollLeft % setWidth) + setWidth) % setWidth;
      instantJump(el, setWidth + offset);
    } else if (el.scrollLeft >= setWidth * 2) {
      const offset = el.scrollLeft % setWidth;
      instantJump(el, setWidth + offset);
    }
  }

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const placeAtMiddleStart = () => {
      if (!el.clientWidth) return;
      const currentIdx = Math.round(el.scrollLeft / el.clientWidth) % SLIDE_COUNT;
      instantJump(el, el.clientWidth * (SLIDE_COUNT + (Number.isNaN(currentIdx) ? 0 : currentIdx)));
    };

    instantJump(el, el.clientWidth * SLIDE_COUNT);

    const observer = new ResizeObserver(() => {
      placeAtMiddleStart();
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, []);

  function handleScroll() {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;

    const slideWidth = el.clientWidth;
    const setWidth = slideWidth * SLIDE_COUNT;

    // Prevent hitting physical edges during fast multi-swipes
    if (el.scrollLeft <= slideWidth * 0.25) {
      instantJump(el, el.scrollLeft + setWidth);
      if (isDraggingRef.current) {
        startScrollLeftRef.current += setWidth;
      }
    } else if (el.scrollLeft >= slideWidth * (SLIDE_COUNT * 3 - 1.25)) {
      instantJump(el, el.scrollLeft - setWidth);
      if (isDraggingRef.current) {
        startScrollLeftRef.current -= setWidth;
      }
    }

    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => {
      if (!isDraggingRef.current && trackRef.current) {
        recenterIntoMiddleSet(trackRef.current);
      }
    }, 140);
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    const el = trackRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX;
    startScrollLeftRef.current = el.scrollLeft;
    el.style.scrollSnapType = 'none';
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = trackRef.current;
    if (!isDraggingRef.current || !el) return;
    const walk = e.pageX - startXRef.current;
    el.scrollLeft = startScrollLeftRef.current - walk;
  }

  function finishDrag() {
    const el = trackRef.current;
    if (!isDraggingRef.current || !el) return;
    isDraggingRef.current = false;

    const slideWidth = el.clientWidth;
    if (slideWidth > 0) {
      const targetSlide = Math.round(el.scrollLeft / slideWidth);
      el.scrollTo({ left: targetSlide * slideWidth, behavior: 'smooth' });
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      settleTimerRef.current = setTimeout(() => {
        if (trackRef.current) {
          recenterIntoMiddleSet(trackRef.current);
        }
      }, 320);
    } else {
      el.style.scrollSnapType = '';
    }
  }

  return (
    <section
      aria-label="Galeri Bengkel Multitech"
      className="ios-glass-card overflow-hidden rounded-[24px] p-2"
    >
      <div
        ref={trackRef}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={finishDrag}
        onMouseLeave={finishDrag}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-[18px] select-none touch-pan-x no-scrollbar cursor-grab active:cursor-grabbing"
      >
        {LOOPED_SLIDES.map((slide, idx) => (
          <div
            key={`${slide.src}-${idx}`}
            className="relative aspect-[16/9] w-full shrink-0 snap-center overflow-hidden bg-slate-100 text-left dark:bg-white/5"
          >
            <img
              src={slide.src}
              alt={slide.alt}
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <div className="pointer-events-none absolute bottom-3 left-3.5 right-3.5">
              <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white backdrop-blur-md">
                {slide.tag}
              </span>
              <p className="mt-1 text-sm font-bold leading-snug text-white">
                {slide.title}
              </p>
              <p className="line-clamp-2 text-[11px] leading-snug text-slate-200">
                {slide.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
