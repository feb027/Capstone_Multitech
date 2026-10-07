'use client';

import { useState, useMemo } from 'react';
import { QueueCard, QueueCardProps } from './QueueCard';
import { CheckCodeModal } from './CheckCodeModal';
import { Search } from 'lucide-react';

const CATEGORIES = [
  { id: 'ALL', label: 'Semua' },
  { id: 'ECU', label: 'ECU' },
  { id: 'SPEEDO', label: 'Speedometer' },
  { id: 'EPS', label: 'EPS & BCM' },
  { id: 'READY', label: 'Siap Ambil' },
];

export function PublicQueueClient({ initialOrders }: { initialOrders: QueueCardProps[] }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderCode, setSelectedOrderCode] = useState('');

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
    <div className="space-y-3.5">
      {/* Clean Minimal Title Bar (No text spam) */}
      <div className="flex items-baseline justify-between pt-1">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Antrean Servis
        </h1>
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
          {filteredOrders.length} unit
        </span>
      </div>

      {/* Capsule Filter Tabs (Apple Segmented Style) */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all tap-bounce ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-black'
                  : 'bg-white text-slate-600 border border-black/[0.04] hover:bg-slate-50 dark:bg-[#1C1C1E] dark:border-white/[0.06] dark:text-slate-300 dark:hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Sleek Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari mobil atau modul..."
          className="w-full rounded-2xl border border-black/[0.04] bg-white pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-slate-400 focus:outline-none dark:border-white/[0.06] dark:bg-[#1C1C1E] dark:text-white dark:placeholder-slate-500"
        />
      </div>

      {/* Cards Feed */}
      <div className="space-y-2.5 pt-1">
        {filteredOrders.length === 0 ? (
          <div className="rounded-[28px] border border-black/[0.04] bg-white p-8 text-center dark:border-white/[0.06] dark:bg-[#1C1C1E]">
            <p className="text-xs font-medium text-slate-400">
              Tidak ada antrean
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

      {/* Single Bottom Action Button (Opens Smooth Modal) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none">
        <div className="mx-auto max-w-lg px-2 pointer-events-auto">
          <button
            onClick={() => {
              setSelectedOrderCode('');
              setIsModalOpen(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-xs font-bold text-white shadow-xl backdrop-blur-2xl transition-transform tap-bounce dark:bg-white dark:text-black"
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
