'use client';

import { useState, useMemo, useEffect } from 'react';
import { QueueCard, QueueCardProps } from './QueueCard';
import { CheckCodeModal } from './CheckCodeModal';
import { FilterScrollRow } from '@/components/shared/FilterScrollRow';
import { Search, X, MapPin, Wrench } from 'lucide-react';
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
    alt: 'Area ruang tunggu dan penerimaan unit Multitech Tasikmalaya',
    tag: 'WORKSHOP RESMI',
    caption: 'Ruang Penerimaan & Teknisi',
  },
  {
    src: '/images/shop/multitech-front-wide.jpg',
    alt: 'Tampak depan bengkel Multitech di Tasikmalaya',
    tag: 'LOKASI BENGKEL',
    caption: 'Tawang, Tasikmalaya',
  },
];

export function PublicQueueClient({ initialOrders }: { initialOrders: QueueCardProps[] }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderCode, setSelectedOrderCode] = useState('');
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

  const handleCardClick = () => {
    setSelectedOrderCode('');
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-3.5">
      {/* Identitas Toko di Bagian Atas */}
      <section className="rounded-[24px] border border-black/[0.04] bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
              {WORKSHOP_PROFILE.name} {WORKSHOP_PROFILE.city}
            </h1>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              {WORKSHOP_PROFILE.focus}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F2F2F7] px-2.5 py-1 text-[10px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-300">
            <Wrench className="h-3 w-3" aria-hidden="true" />
            <span>Buka</span>
          </span>
        </div>

        <p className="mt-2 flex items-start gap-1.5 border-t border-black/[0.04] pt-2 text-[11px] leading-relaxed text-slate-600 dark:border-white/[0.06] dark:text-slate-400">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C9182B] dark:text-[#F87171]" aria-hidden="true" />
          <span>{WORKSHOP_PROFILE.address}</span>
        </p>
      </section>

      {/* Editorial / Majalah Mini Foto Bengkel (di atas Search & Filter) */}
      <section
        aria-label="Galeri Bengkel Multitech"
        className="rounded-[24px] border border-black/[0.04] bg-white p-2.5 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]"
      >
        <div className="grid h-[156px] grid-cols-12 gap-2 sm:h-[172px]">
          <button
            type="button"
            onClick={() => setLightboxImage(SHOP_GALLERY[0])}
            className="group relative col-span-7 h-full overflow-hidden rounded-[18px] bg-slate-100 text-left tap-bounce dark:bg-white/5"
            aria-label={`Perbesar foto: ${SHOP_GALLERY[0].caption}`}
          >
            <img
              src={SHOP_GALLERY[0].src}
              alt={SHOP_GALLERY[0].alt}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-2.5 left-2.5 right-2.5">
              <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold tracking-wider text-white backdrop-blur-md">
                {SHOP_GALLERY[0].tag}
              </span>
              <p className="mt-1 truncate text-xs font-bold text-white">
                {SHOP_GALLERY[0].caption}
              </p>
            </div>
          </button>

          <div className="col-span-5 flex h-full flex-col gap-2">
            <button
              type="button"
              onClick={() => setLightboxImage(SHOP_GALLERY[1])}
              className="group relative flex-1 overflow-hidden rounded-[18px] bg-slate-100 text-left tap-bounce dark:bg-white/5"
              aria-label={`Perbesar foto: ${SHOP_GALLERY[1].caption}`}
            >
              <img
                src={SHOP_GALLERY[1].src}
                alt={SHOP_GALLERY[1].alt}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
              <p className="absolute bottom-2 left-2.5 right-2 truncate text-[10px] font-bold text-white">
                {SHOP_GALLERY[1].caption}
              </p>
            </button>

            <div className="rounded-[14px] bg-[#F2F2F7] px-2.5 py-2 dark:bg-white/[0.05]">
              <p className="truncate text-[10px] font-bold text-slate-900 dark:text-white">
                Servis ECU & Modul
              </p>
              <p className="truncate text-[10px] text-slate-600 dark:text-slate-400">
                Bergaransi & Transparan
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Header Antrean */}
      <div className="flex items-baseline justify-between pt-0.5">
        <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
          Antrean Servis
        </h2>
        <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
          {filteredOrders.length} unit
        </span>
      </div>

      {/* Capsule Filter Tabs (Bisa Scroll Horizontal + Wheel + Drag + Panah) */}
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
              className={`min-h-[40px] shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all tap-bounce ${
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
