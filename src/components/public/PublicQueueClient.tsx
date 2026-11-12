'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { QueueCard, QueueCardProps } from './QueueCard';
import { CheckCodeModal } from './CheckCodeModal';
import { ShopMagazineCarousel } from './ShopMagazineCarousel';
import { Check, Search, SlidersHorizontal, X } from 'lucide-react';

const CATEGORIES = [
  { id: 'ALL', label: 'Semua' },
  { id: 'ECU', label: 'ECU' },
  { id: 'SPEEDO', label: 'Speedometer' },
  { id: 'EPS', label: 'EPS & BCM' },
  { id: 'GENSET', label: 'Genset' },
  { id: 'READY', label: 'Siap Ambil' },
];

export function PublicQueueClient({ initialOrders }: { initialOrders: QueueCardProps[] }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderCode, setSelectedOrderCode] = useState('');
  const [selectedUnitLabel, setSelectedUnitLabel] = useState('');
  const filterContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isFilterOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        filterContainerRef.current &&
        !filterContainerRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFilterOpen]);

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

  const handleCardClick = (order: QueueCardProps) => {
    setSelectedOrderCode(order.code || '');
    const label =
      order.vehicleBrand && order.vehicleModel
        ? `${order.vehicleBrand} ${order.vehicleModel}`
        : 'Unit Servis';
    setSelectedUnitLabel(label);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <ShopMagazineCarousel />

      {/* Header Antrean */}
      <div className="flex items-baseline justify-between pt-1">
        <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
          Antrean Servis
        </h1>
        <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
          {filteredOrders.length} unit
        </span>
      </div>

      {/* Unified Search Bar + Right Filter Icon */}
      <div ref={filterContainerRef} className="relative z-30">
        <div className="ios-glass-card flex h-12 items-center rounded-2xl pl-3.5 pr-1.5 transition-all focus-within:ring-2 focus-within:ring-black/15 dark:focus-within:ring-white/25">
          <Search
            className="h-4 w-4 shrink-0 text-slate-600 dark:text-zinc-300"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              selectedCategory === 'ALL'
                ? 'Cari mobil, genset, atau modul...'
                : `Cari di ${CATEGORIES.find((c) => c.id === selectedCategory)?.label || 'Filter'}...`
            }
            aria-label="Cari mobil, genset, atau modul"
            className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-xs text-slate-900 placeholder-slate-600 focus:outline-none dark:text-white dark:placeholder-zinc-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Hapus pencarian"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <div className="mx-1 h-5 w-px shrink-0 bg-black/[0.08] dark:bg-white/[0.12]" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            aria-label={`Filter kategori (${CATEGORIES.find((c) => c.id === selectedCategory)?.label || 'Semua'})`}
            aria-expanded={isFilterOpen}
            aria-haspopup="listbox"
            className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all tap-bounce ${
              selectedCategory !== 'ALL' || isFilterOpen
                ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                : 'text-slate-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {selectedCategory !== 'ALL' && (
              <span
                className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#C9182B] dark:bg-[#EF4444]"
                aria-hidden="true"
              />
            )}
          </button>
        </div>

        {isFilterOpen && (
          <div
            role="listbox"
            aria-label="Pilih kategori filter"
            className="ios-glass-card absolute right-0 top-14 z-40 w-52 space-y-1 rounded-2xl p-1.5 shadow-2xl"
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setIsFilterOpen(false);
                  }}
                  className={`flex min-h-[40px] w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                      : 'text-slate-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10'
                  }`}
                >
                  <span>{cat.label}</span>
                  {isActive && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Cards Feed */}
      <div className="space-y-2.5 pt-1">
        {filteredOrders.length === 0 ? (
          <div className="ios-glass-card rounded-[28px] p-8 text-center">
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
              code={order.code}
              vehicleBrand={order.vehicleBrand}
              vehicleModel={order.vehicleModel}
              vehicleYear={order.vehicleYear}
              intakeType={order.intakeType}
              unitCategory={order.unitCategory}
              receivedAt={order.receivedAt}
              items={order.items}
              onSelect={() => handleCardClick(order)}
            />
          ))
        )}
      </div>

      {/* Single Bottom Action Button (Hidden when CheckCodeModal is open) */}
      {!isModalOpen && (
        <div className="no-print fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none">
          <div className="mx-auto max-w-lg px-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => {
                setSelectedOrderCode('');
                setSelectedUnitLabel('');
                setIsModalOpen(true);
              }}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-xs font-bold text-white shadow-xl backdrop-blur-2xl transition-transform tap-bounce dark:bg-white dark:text-black"
            >
              <span>Cek Kode Servis</span>
            </button>
          </div>
        </div>
      )}

      {/* Smooth Apple Modal Sheet */}
      <CheckCodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialCode={selectedOrderCode}
        unitLabel={selectedUnitLabel}
      />
    </div>
  );
}
