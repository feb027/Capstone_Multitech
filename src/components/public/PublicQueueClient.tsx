'use client';

import { useState, useMemo } from 'react';
import { QueueCard, QueueCardProps } from './QueueCard';
import { CheckCodeModal } from './CheckCodeModal';
import { Search, Sparkles, KeyRound } from 'lucide-react';

const CATEGORIES = [
  { id: 'ALL', label: 'Semua Unit' },
  { id: 'ECU', label: 'ECU Mesin' },
  { id: 'SPEEDO', label: 'Speedometer' },
  { id: 'EPS', label: 'EPS & BCM' },
  { id: 'READY', label: 'Siap Diambil' },
];

export function PublicQueueClient({ initialOrders }: { initialOrders: QueueCardProps[] }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderCode, setSelectedOrderCode] = useState('');

  const readyCount = useMemo(() => {
    return initialOrders.filter((o) => o.items.some((i) => i.status === 'SIAP_DIAMBIL')).length;
  }, [initialOrders]);

  const filteredOrders = useMemo(() => {
    return initialOrders.filter((order) => {
      // Category filter
      if (selectedCategory === 'READY') {
        const hasReady = order.items.some((i) => i.status === 'SIAP_DIAMBIL');
        if (!hasReady) return false;
      } else if (selectedCategory === 'ECU') {
        const hasEcu = order.items.some((i) => i.moduleName.toLowerCase().includes('ecu'));
        if (!hasEcu) return false;
      } else if (selectedCategory === 'SPEEDO') {
        const hasSpeedo = order.items.some((i) => i.moduleName.toLowerCase().includes('speedo'));
        if (!hasSpeedo) return false;
      } else if (selectedCategory === 'EPS') {
        const hasEpsBcm = order.items.some(
          (i) => i.moduleName.toLowerCase().includes('eps') || i.moduleName.toLowerCase().includes('bcm')
        );
        if (!hasEpsBcm) return false;
      }

      // Search query
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
    setSelectedOrderCode('');
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Top Lively Header Banner */}
      <div className="rounded-[28px] border border-black/[0.04] bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Layanan Elektronika Aktif</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
            <span>{readyCount} Siap Diambil</span>
          </div>
        </div>

        <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Antrean Servis
        </h1>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Transparansi progres ECU, BCM, EPS & Speedometer mobil
        </p>

        {/* Quick Inline Action Button */}
        <button
          onClick={() => {
            setSelectedOrderCode('');
            setIsModalOpen(true);
          }}
          className="mt-4 flex w-full items-center justify-between rounded-2xl bg-[#F2F2F7] px-4 py-3 text-xs font-bold text-slate-800 transition-transform tap-bounce hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
        >
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#E63946]" />
            <span>Punya Nota? Cek Status Unit Anda</span>
          </div>
          <span className="rounded-lg bg-white px-2 py-0.5 font-mono text-[11px] text-slate-700 shadow-sm dark:bg-black dark:text-slate-200">
            4-Digit &rarr;
          </span>
        </button>
      </div>

      {/* Capsule Filter Tabs (Apple Segmented Style) */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all tap-bounce ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md dark:bg-white dark:text-black'
                  : 'bg-white text-slate-600 border border-black/[0.04] hover:bg-slate-50 dark:bg-[#1C1C1E] dark:border-white/[0.06] dark:text-slate-300 dark:hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari Avanza, Jazz, ECU, Speedometer..."
          className="w-full rounded-2xl border border-black/[0.04] bg-white pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-slate-400 focus:outline-none dark:border-white/[0.06] dark:bg-[#1C1C1E] dark:text-white dark:placeholder-slate-500"
        />
      </div>

      {/* Cards List */}
      <div className="space-y-3 pt-1">
        {filteredOrders.length === 0 ? (
          <div className="rounded-[28px] border border-black/[0.04] bg-white p-8 text-center dark:border-white/[0.06] dark:bg-[#1C1C1E]">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Tidak ada antrean kendaraan pada kategori ini.
            </p>
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
              receivedAt={order.receivedAt}
              items={order.items}
              onSelect={() => handleCardClick(order)}
            />
          ))
        )}
      </div>

      {/* Floating Bottom Bar (Opens Modal Smoothly) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none">
        <div className="mx-auto max-w-lg px-2 pointer-events-auto">
          <button
            onClick={() => {
              setSelectedOrderCode('');
              setIsModalOpen(true);
            }}
            className="flex w-full items-center justify-between rounded-full bg-[#0B2545] px-5 py-3.5 text-xs font-bold text-white shadow-2xl backdrop-blur-2xl transition-transform tap-bounce dark:bg-white dark:text-black"
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#E63946] animate-ping" />
              <span>Cek Status Servis Saya</span>
            </div>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 font-mono text-[10px] dark:bg-black/10">
              # Masukkan Kode
            </span>
          </button>
        </div>
      </div>

      {/* Smooth Modal Bottom Sheet */}
      <CheckCodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialCode={selectedOrderCode}
      />
    </div>
  );
}
