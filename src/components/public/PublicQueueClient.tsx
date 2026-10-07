'use client';

import { useState, useMemo } from 'react';
import { QueueCard, QueueCardProps } from './QueueCard';

const CATEGORIES = [
  { id: 'ALL', label: 'Semua' },
  { id: 'ECU', label: 'ECU Mesin' },
  { id: 'SPEEDO', label: 'Speedometer' },
  { id: 'EPS', label: 'EPS & BCM' },
  { id: 'READY', label: 'Siap Diambil' },
];

export function PublicQueueClient({ initialOrders }: { initialOrders: QueueCardProps[] }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div className="space-y-4">
      {/* Top Header Section: Clean, Minimal, Apple-like */}
      <div className="flex items-baseline justify-between pt-1">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Antrean Servis
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {filteredOrders.length} unit sedang dalam pengerjaan
          </p>
        </div>
      </div>

      {/* Capsule Filter Tabs (Apple Segmented Style) */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all tap-bounce ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                  : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-[#1C1C1E] dark:text-slate-400 dark:hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Subtle Search Pill */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari mobil atau modul..."
          className="w-full rounded-2xl border border-black/[0.04] bg-white px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-slate-400 focus:outline-none dark:border-white/[0.06] dark:bg-[#1C1C1E] dark:text-white dark:placeholder-slate-500"
        />
      </div>

      {/* Cards Feed */}
      <div className="space-y-3 pt-1">
        {filteredOrders.length === 0 ? (
          <div className="rounded-[24px] border border-black/[0.04] bg-white p-8 text-center dark:border-white/[0.06] dark:bg-[#1C1C1E]">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Tidak ada antrean yang cocok
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
            />
          ))
        )}
      </div>
    </div>
  );
}
