'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { QueueCard, QueueCardProps } from './QueueCard';
import { CheckCodeModal } from './CheckCodeModal';
import { Search, X } from 'lucide-react';
import { WORKSHOP_PROFILE } from '@/lib/status';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderCode, setSelectedOrderCode] = useState('');

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
      {/* Clean Minimal Title Bar */}
      <div className="flex items-baseline justify-between pt-1">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Antrean Servis
        </h1>
        <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
          {filteredOrders.length} unit
        </span>
      </div>

      {/* Capsule Filter Tabs (Apple Segmented Style) */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5" role="tablist" aria-label="Filter kategori modul">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelectedCategory(cat.id)}
              className={`min-h-[40px] shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all tap-bounce ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-black'
                  : 'border border-black/[0.04] bg-white text-slate-600 hover:bg-slate-50 dark:border-white/[0.06] dark:bg-[#1C1C1E] dark:text-slate-300 dark:hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

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

      {/* Ringkasan Alamat & Link Admin yang Ringkas di Bawah Feed */}
      <div className="rounded-[24px] border border-black/[0.04] bg-white/80 p-4 text-[11px] text-slate-600 dark:border-white/[0.06] dark:bg-[#1C1C1E]/80 dark:text-slate-400">
        <p className="font-bold text-slate-900 dark:text-white">
          {WORKSHOP_PROFILE.name} {WORKSHOP_PROFILE.city}
        </p>
        <p className="mt-0.5 leading-relaxed">{WORKSHOP_PROFILE.address}</p>
        <div className="mt-2 flex items-center justify-between border-t border-black/[0.04] pt-2 dark:border-white/[0.06]">
          <Link href="/cek" className="font-semibold text-[#0B2545] hover:underline dark:text-white">
            Halaman Cek Kode
          </Link>
          <Link href="/admin/login" className="font-medium hover:text-slate-900 dark:hover:text-white">
            Portal Admin
          </Link>
        </div>
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
    </div>
  );
}
