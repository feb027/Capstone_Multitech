'use client';

import { useEffect, useRef, useState } from 'react';
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
  {
    src: '/images/shop/multitech-genset-units.jpg',
    alt: 'Unit genset FIRMAN dalam penanganan servis CV Multitech Tasikmalaya',
    tag: 'SERVIS GENSET',
    title: 'Penanganan & Perbaikan Unit Genset',
    subtitle: 'Servis AVR, panel AMF, modul kontrol & kelistrikan genset',
  },
];

const SLIDE_COUNT = SHOP_GALLERY.length;
const LOOPED_SLIDES = [
  SHOP_GALLERY[SLIDE_COUNT - 1],
  ...SHOP_GALLERY,
  SHOP_GALLERY[0],
];

/**
 * Controlled infinite workshop magazine carousel.
 * Guarantees strictly 1 slide transition per swipe with smooth controlled speed
 * and seamless loop wrap-around at both ends.
 */
export function ShopMagazineCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(1);
  const [dragX, setDragX] = useState(0);
  const [isAnimated, setIsAnimated] = useState(true);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const axisLockedRef = useRef<'none' | 'horizontal' | 'vertical'>('none');
  const isPointerDownRef = useRef(false);
  const isTransitionLockedRef = useRef(false);
  const dragXRef = useRef(0);

  function normalizeEdgeIfNeeded(currentIndex: number): number {
    if (currentIndex <= 0) return SLIDE_COUNT;
    if (currentIndex >= SLIDE_COUNT + 1) return 1;
    return currentIndex;
  }

  function stepSlide(delta: -1 | 0 | 1) {
    setDragX(0);
    dragXRef.current = 0;

    if (delta === 0) {
      setIsAnimated(true);
      return;
    }

    isTransitionLockedRef.current = true;
    setIsAnimated(true);
    setIndex((prev) => {
      const normalized = normalizeEdgeIfNeeded(prev);
      return normalized + delta;
    });
  }

  function handleTransitionEnd() {
    isTransitionLockedRef.current = false;

    if (index === 0 || index === SLIDE_COUNT + 1) {
      const target = index === 0 ? SLIDE_COUNT : 1;
      setIsAnimated(false);
      setIndex(target);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimated(true);
        });
      });
    }
  }

  useEffect(() => {
    function handleWindowMouseMove(e: MouseEvent) {
      if (!isPointerDownRef.current) return;
      const width = containerRef.current?.clientWidth || 360;
      const rawDelta = e.clientX - startXRef.current;
      const clamped = Math.max(-width * 0.85, Math.min(width * 0.85, rawDelta * 0.85));
      dragXRef.current = clamped;
      setDragX(clamped);
    }

    function handleWindowMouseUp() {
      if (!isPointerDownRef.current) return;
      isPointerDownRef.current = false;
      const dx = dragXRef.current;
      if (dx <= -38) {
        stepSlide(1);
      } else if (dx >= 38) {
        stepSlide(-1);
      } else {
        stepSlide(0);
      }
    }

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, []);

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (isTransitionLockedRef.current) return;
    const normalized = normalizeEdgeIfNeeded(index);
    if (normalized !== index) {
      setIsAnimated(false);
      setIndex(normalized);
    }
    isPointerDownRef.current = true;
    startXRef.current = e.clientX;
    dragXRef.current = 0;
    setIsAnimated(false);
  }

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    if (e.touches.length !== 1) return;
    if (isTransitionLockedRef.current) return;
    const normalized = normalizeEdgeIfNeeded(index);
    if (normalized !== index) {
      setIsAnimated(false);
      setIndex(normalized);
    }
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    axisLockedRef.current = 'none';
    dragXRef.current = 0;
  }

  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (e.touches.length !== 1 || axisLockedRef.current === 'vertical') return;
    const dx = e.touches[0].clientX - startXRef.current;
    const dy = e.touches[0].clientY - startYRef.current;

    if (axisLockedRef.current === 'none') {
      if (Math.abs(dy) > Math.abs(dx) + 6) {
        axisLockedRef.current = 'vertical';
        return;
      }
      if (Math.abs(dx) > 6) {
        axisLockedRef.current = 'horizontal';
        setIsAnimated(false);
      }
    }

    if (axisLockedRef.current === 'horizontal') {
      const width = containerRef.current?.clientWidth || 360;
      const damped = Math.max(-width * 0.85, Math.min(width * 0.85, dx * 0.85));
      dragXRef.current = damped;
      setDragX(damped);
    }
  }

  function handleTouchEnd() {
    if (axisLockedRef.current !== 'horizontal') {
      axisLockedRef.current = 'none';
      return;
    }
    axisLockedRef.current = 'none';

    const dx = dragXRef.current;
    if (dx <= -36) {
      stepSlide(1);
    } else if (dx >= 36) {
      stepSlide(-1);
    } else {
      stepSlide(0);
    }
  }

  return (
    <section
      aria-label="Galeri Bengkel Multitech"
      className="ios-glass-card overflow-hidden rounded-[24px] p-2"
    >
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="overflow-hidden rounded-[18px] select-none touch-pan-y cursor-grab active:cursor-grabbing"
      >
        <div
          onTransitionEnd={handleTransitionEnd}
          style={{
            transform: `translate3d(calc(-${index * 100}% + ${dragX}px), 0, 0)`,
          }}
          className={`flex will-change-transform ${
            isAnimated
              ? 'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'
              : 'transition-none'
          }`}
        >
          {LOOPED_SLIDES.map((slide, idx) => (
            <div
              key={`${slide.src}-${idx}`}
              className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-slate-100 text-left dark:bg-white/5"
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
      </div>
    </section>
  );
}
