'use client';

import { useState, useMemo, useEffect } from 'react';
import { QueueCard, QueueCardProps } from './QueueCard';
import { CheckCodeModal } from './CheckCodeModal';
import { FilterScrollRow } from '@/components/shared/FilterScrollRow';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { WORKSHOP_PROFILE } from '@/lib/status';

const CATEGORIES = [
  { id: 'ALL', label: 'Semua' },
  { id: 'ECU', label: 'ECU' },
  { id: 'SPEEDO', label: 'Speedometer' },
  { id: 'EPS', label: 'EPS & BCM' },
  { id: 'GENSET', label: 'Genset' },
  { id: 'READY', label: 'Siap Ambil' },
];

const SHOP_GALLERY = [
  {
    src: '/images/shop/multitech-front-detail.jpg',
    alt: 'Area ruang tunggu dan penerimaan unit CV Multitech Tasikmalaya',
    tag: 'GALERI BENGKEL',
    title: 'Ruang Penerimaan & Teknisi',
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

export function PublicQueueClient({ initialOrders }: { initialOrders: QueueCardProps[] }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderCode, setSelectedOrderCode] = useState('');
  const [slideIndex, setSlideIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    if (!lightboxImage) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxImage]);

  const filteredOrders = useMemo(() => {
    return initialOrders.filter((order) => {
      if (selectedCategory === 'READY') {
        if (!order.items.some((i) => i.status === 'SIAP_DIAMBIL')) return false;
      } else if (selectedCategory === 'ECU') {
        if (!order.items.some((i) => i.moduleName.toLowerCase().includes('ecu'))) return false;
      } else if (selectedCategory === 'SPEEDO') {
        if (!order.items.some((i) => i.moduleName.toLowerCase().includes('speedo'))) return false;
      } else if (selectedCategory === 'EPS') {
        if (
          !order.items.some(
            (i) => i.moduleName.toLowerCase().includes('eps') || i.moduleName.toLowerCase().includes('bcm')
          )
        ) {
          return false;
        }
      } else if (selectedCategory === 'GENSET') {
        const isGenset =
          order.unitCategory === 'GENSET_INDUSTRI' ||
          order.items.some((i) => i.moduleName.toLowerCase().includes('genset'));
        if (!isGenset) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const brandMatch = order.vehicleBrand?.toLowerCase().includes(q);
        const modelMatch = order.vehicleModel?.toLowerCase().includes(q);
        const moduleMatch = order.items.some((i) => i.moduleName.toLowerCase().includes(q));
        if (!brandMatch && !modelMatch && !moduleMatch) return false;
      }

      return true;
    });
  }, [initialOrders, selectedCategory, searchQuery]);

  const currentSlide = SHOP_GALLERY[slideIndex] || SHOP_GALLERY[0];

  const handleCardClick = () => {
    setSelectedOrderCode('');
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Tagline Spesialisasi Bengkel (Bersih & Minimalis di Atas Majalah) */}
      <div className="flex items-center gap-2.5 rounded-2xl border border-black/[0.04] bg-white px-4 py-3 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]">
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400" aria-hidden="true" />
        <p className="text-xs font-bold tracking-tight text-slate-900 dark:text-white">
          Bengkel Spesialis Perbaikan Elektronik Otomotif
        </p>
      </div>

      {/* Kartu Majalah Landscape (Foto + Alamat Lengkap Resmi) */}
      <section
        aria-label="Galeri Bengkel Multitech"
        className="overflow-hidden rounded-[24px] border border-black/[0.04] bg-white p-2.5 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]"
      >
        <button
          type="button"
          onClick={() => setLightboxImage({ src: currentSlide.src, alt: currentSlide.alt })}
          aria-label={`Perbesar foto: ${currentSlide.title}`}
          className="group relative block aspect-[16/9] w-full overflow-hidden rounded-[18px] bg-slate-100 text-left dark:bg-white/5"
        >
          <img
            src={currentSlide.src}
            alt={currentSlide.alt}
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-3.5 right-3.5">
            <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white backdrop-blur-md">
              {currentSlide.tag}
            </span>
            <p className="mt-1 truncate text-sm font-bold text-white">
              {currentSlide.title}
            </p>
            <p className="line-clamp-2 text-[11px] leading-snug text-slate-200">
              {currentSlide.subtitle}
            </p>
          </div>
        </button>

        {/* Kontrol Slide di Bawah Foto Majalah */}
        <div className="mt-2.5 flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            {SHOP_GALLERY.map((item, idx) => (
              <button
                key={item.src}
                type="button"
                onClick={() => setSlideIndex(idx)}
                aria-label={`Tampilkan foto ${idx + 1}: ${item.title}`}
                className={`h-2 rounded-full transition-all ${
                  idx === slideIndex
                    ? 'w-5 bg-slate-900 dark:bg-white'
                    : 'w-2 bg-slate-300 hover:bg-slate-400 dark:bg-white/25'
                }`}
              />
            ))}
            <span className="ml-1 font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-400">
              {slideIndex + 1}/{SHOP_GALLERY.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                setSlideIndex((prev) => (prev - 1 + SHOP_GALLERY.length) % SHOP_GALLERY.length)
              }
              aria-label="Foto bengkel sebelumnya"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F2F7] text-slate-700 hover:bg-slate-200 tap-bounce dark:bg-white/10 dark:text-slate-200"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setSlideIndex((prev) => (prev + 1) % SHOP_GALLERY.length)}
              aria-label="Foto bengkel berikutnya"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F2F7] text-slate-700 hover:bg-slate-200 tap-bounce dark:bg-white/10 dark:text-slate-200"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Header Antrean */}
      <div className="flex items-baseline justify-between pt-1">
        <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
          Antrean Servis
        </h1>
        <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
          {filteredOrders.length} unit
        </span>
      </div>

      {/* Capsule Filter Tabs (1 Baris Horizontal, Tidak Menumpuk) */}
      <FilterScrollRow ariaLabel="Filter kategori modul">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelectedCategory(cat.id)}
              className={`min-h-[40px] shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all tap-bounce ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-black'
                  : 'border border-black/[0.04] bg-white text-slate-600 hover:bg-slate-50 dark:border-white/[0.06] dark:bg-[#1C1C1E] dark:text-slate-300 dark:hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </FilterScrollRow>

      {/* Sleek Search Bar */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 dark:text-slate-400"
          aria-hidden="true"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari mobil, genset, atau modul..."
          aria-label="Cari mobil, genset, atau modul"
          className="h-11 w-full rounded-2xl border border-black/[0.04] bg-white pl-10 pr-10 text-xs text-slate-900 placeholder-slate-600 shadow-sm transition-all dark:border-white/[0.06] dark:bg-[#1C1C1E] dark:text-white dark:placeholder-slate-400"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Hapus pencarian"
            className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Cards Feed */}
      <div className="space-y-2.5 pt-1">
        {filteredOrders.length === 0 ? (
          <div className="rounded-[28px] border border-black/[0.04] bg-white p-8 text-center dark:border-white/[0.06] dark:bg-[#1C1C1E]">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Tidak ada antrean yang cocok dengan filter saat ini.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('ALL');
                setSearchQuery('');
              }}
              className="mt-3 inline-flex min-h-[40px] items-center rounded-full bg-slate-900 px-4 text-xs font-bold text-white dark:bg-white dark:text-black"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <QueueCard
              key={order.publicId}
              publicId={order.publicId}
              vehicleBrand={order.vehicleBrand}
              vehicleModel={order.vehicleModel}
              vehicleYear={order.vehicleYear}
              intakeType={order.intakeType}
              unitCategory={order.unitCategory}
              receivedAt={order.receivedAt}
              items={order.items}
              onSelect={handleCardClick}
            />
          ))
        )}
      </div>

      {/* Single Bottom Action Button (Opens Smooth Modal) */}
      <div className="no-print fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none">
        <div className="mx-auto max-w-lg px-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              setSelectedOrderCode('');
              setIsModalOpen(true);
            }}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-xs font-bold text-white shadow-xl backdrop-blur-2xl transition-transform tap-bounce dark:bg-white dark:text-black"
          >
            <span>Cek Kode Servis</span>
          </button>
        </div>
      </div>

      {/* Smooth Apple Modal Sheet */}
      <CheckCodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialCode={selectedOrderCode}
      />

      {/* Lightbox Galeri Bengkel */}
      {lightboxImage && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-[appleBackdropFadeIn_0.2s_ease-out]"
          role="dialog"
          aria-modal="true"
          aria-label={lightboxImage.alt}
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-lg overflow-hidden rounded-[28px] bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              aria-label="Tutup pratinjau foto"
              className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <img
              src={lightboxImage.src}
              alt={lightboxImage.alt}
              className="max-h-[82vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
