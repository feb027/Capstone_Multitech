'use client';

import { useState, useMemo, useEffect } from 'react';
import { INITIAL_SPAREPARTS, SparepartItem } from '@/lib/frontend-mock';
import { FilterScrollRow } from '@/components/shared/FilterScrollRow';
import { formatRupiah } from '@/lib/utils';
import { Plus, Search, AlertTriangle, X, Package } from 'lucide-react';

type PartCategory = SparepartItem['category'];

const CATEGORIES: Array<'Semua' | PartCategory> = [
  'Semua',
  'IC & Driver',
  'Power & Regulator',
  'Kapasitor & SMD',
  'Relay & Sensor',
  'Display & Flex',
];

export function AdminInventoryClient() {
  const [parts, setParts] = useState<SparepartItem[]>(INITIAL_SPAREPARTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | PartCategory>('Semua');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<PartCategory>('IC & Driver');
  const [newStock, setNewStock] = useState('10');
  const [newMinStock, setNewMinStock] = useState('3');
  const [newPrice, setNewPrice] = useState('120000');

  useEffect(() => {
    if (!isAddOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsAddOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAddOpen]);

  const filteredParts = useMemo(() => {
    return parts.filter((part) => {
      if (categoryFilter !== 'Semua' && part.category !== categoryFilter) return false;
      if (onlyLowStock && part.stock > part.minStock) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!part.name.toLowerCase().includes(q) && !part.sku.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [parts, searchQuery, categoryFilter, onlyLowStock]);

  const lowStockCount = useMemo(
    () => parts.filter((p) => p.stock <= p.minStock).length,
    [parts]
  );

  function adjustStock(id: string, delta: number) {
    setParts((prev) =>
      prev.map((part) =>
        part.id === id ? { ...part, stock: Math.max(0, part.stock + delta) } : part
      )
    );
  }

  function handleAddPart(e: React.FormEvent) {
    e.preventDefault();
    if (!newSku.trim() || !newName.trim()) return;

    const item: SparepartItem = {
      id: `sp-${Date.now()}`,
      sku: newSku.trim().toUpperCase(),
      name: newName.trim(),
      category: newCategory,
      unit: 'pcs',
      stock: Math.max(0, Number(newStock) || 0),
      minStock: Math.max(1, Number(newMinStock) || 1),
      unitPrice: Math.max(0, Number(newPrice) || 0),
      location: 'Rak Utama',
      updatedAt: new Date().toISOString(),
    };

    setParts((prev) => [item, ...prev]);
    setIsAddOpen(false);
    setNewSku('');
    setNewName('');
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
            Stok Suku Cadang Elektronik
          </h1>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            Pantau stok IC, MOSFET, layar speedometer, dan komponen elektronik modul.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-slate-900 px-5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 tap-bounce dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Tambah Part</span>
        </button>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-[22px] border border-black/[0.04] bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Total Jenis Part
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {parts.length}
          </p>
        </div>

        <div className="rounded-[22px] border border-black/[0.04] bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Total Unit Stok
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {parts.reduce((acc, p) => acc + p.stock, 0)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOnlyLowStock((prev) => !prev)}
          className={`col-span-2 rounded-[22px] border p-4 text-left shadow-sm transition-colors tap-bounce sm:col-span-1 ${
            onlyLowStock
              ? 'border-amber-500/40 bg-amber-500/15'
              : 'border-black/[0.04] bg-white dark:border-white/[0.06] dark:bg-[#1C1C1E]'
          }`}
        >
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Stok Menipis</span>
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {lowStockCount} item
          </p>
        </button>
      </div>

      {/* Filter & Cari */}
      <div className="space-y-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode SKU atau nama komponen (misal: L9132, MOSFET)..."
            aria-label="Cari suku cadang"
            className="h-12 w-full rounded-full border border-black/[0.06] bg-white pl-11 pr-4 text-sm text-slate-900 placeholder-slate-500 shadow-sm focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:text-white dark:placeholder-slate-400"
          />
        </div>

        <FilterScrollRow ariaLabel="Filter kategori suku cadang">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={categoryFilter === cat}
              onClick={() => setCategoryFilter(cat)}
              className={`min-h-[40px] shrink-0 whitespace-nowrap rounded-full px-4 text-xs font-semibold transition-all tap-bounce ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                  : 'bg-white text-slate-600 shadow-sm hover:text-slate-900 dark:bg-[#1C1C1E] dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </FilterScrollRow>
      </div>

      {/* Konten List: Mobile Cards & Desktop Table */}
      {filteredParts.length === 0 ? (
        <div className="rounded-[26px] border border-black/[0.04] bg-white p-10 text-center shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]">
          <Package className="mx-auto h-7 w-7 text-slate-400" aria-hidden="true" />
          <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
            Suku cadang tidak ditemukan
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Coba kata kunci atau kategori lainnya.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('Semua');
              setOnlyLowStock(false);
            }}
            className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-[#F2F2F7] px-5 text-xs font-semibold text-slate-900 tap-bounce dark:bg-white/10 dark:text-white"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {filteredParts.map((part) => {
              const isLow = part.stock <= part.minStock;
              return (
                <div
                  key={part.id}
                  className="rounded-[24px] border border-black/[0.04] bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        {part.sku}
                      </span>
                      <h2 className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                        {part.name}
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                        {part.category} | {formatRupiah(part.unitPrice)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        isLow
                          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {isLow ? 'Menipis' : 'Aman'}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-black/[0.05] pt-3 dark:border-white/[0.06]">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Stok saat ini (min. {part.minStock})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => adjustStock(part.id, -1)}
                        aria-label={`Kurangi stok ${part.name}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2F2F7] text-sm font-bold text-slate-900 tap-bounce dark:bg-white/10 dark:text-white"
                      >
                        -
                      </button>
                      <span className="min-w-[2.2rem] text-center font-mono text-sm font-bold text-slate-900 dark:text-white">
                        {part.stock}
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustStock(part.id, 1)}
                        aria-label={`Tambah stok ${part.name}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white tap-bounce dark:bg-white dark:text-slate-900"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-[24px] border border-black/[0.04] bg-white shadow-sm md:block dark:border-white/[0.06] dark:bg-[#1C1C1E]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black/[0.05] bg-[#F2F2F7]/70 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-400">
                  <th className="px-5 py-3.5">SKU</th>
                  <th className="px-5 py-3.5">Nama Komponen</th>
                  <th className="px-5 py-3.5">Kategori</th>
                  <th className="px-5 py-3.5 text-right">Harga Satuan</th>
                  <th className="px-5 py-3.5 text-center">Stok</th>
                  <th className="px-5 py-3.5 text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                {filteredParts.map((part) => {
                  const isLow = part.stock <= part.minStock;
                  return (
                    <tr key={part.id} className="hover:bg-[#F2F2F7]/50 dark:hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {part.sku}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                        {part.name}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                        {part.category}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        {formatRupiah(part.unitPrice)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 font-mono text-xs font-bold ${
                            isLow
                              ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {part.stock}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => adjustStock(part.id, -1)}
                            aria-label={`Kurangi stok ${part.name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F2F2F7] font-bold text-slate-900 hover:bg-slate-200 dark:bg-white/10 dark:text-white"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustStock(part.id, 1)}
                            aria-label={`Tambah stok ${part.name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal Tambah Part */}
      {isAddOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-md sm:items-center sm:p-4 animate-[appleBackdropFadeIn_0.2s_ease-out]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-part-title"
          onClick={() => setIsAddOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-[36px] border border-black/[0.06] bg-white p-6 shadow-2xl sm:rounded-[32px] dark:border-white/[0.08] dark:bg-[#1C1C1E] animate-[appleSheetSlideUp_0.35s_cubic-bezier(0.32,0.72,0,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200 dark:bg-white/20 sm:hidden" />

            <div className="mb-5 flex items-center justify-between">
              <h2 id="add-part-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Tambah Suku Cadang
              </h2>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                aria-label="Tutup form"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F2F2F7] text-slate-600 hover:text-slate-900 dark:bg-white/10 dark:text-slate-300"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleAddPart} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="part-sku" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Kode SKU *
                  </label>
                  <input
                    id="part-sku"
                    type="text"
                    required
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    placeholder="IC-DRV-01"
                    className="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 font-mono text-sm uppercase text-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="part-cat" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Kategori
                  </label>
                  <select
                    id="part-cat"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as PartCategory)}
                    className="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 text-sm text-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-[#2C2C2E] dark:text-white"
                  >
                    {(CATEGORIES.filter((c) => c !== 'Semua') as PartCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="part-name" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Nama Komponen *
                </label>
                <input
                  id="part-name"
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: IC Driver L9132 STMicro"
                  className="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 text-sm text-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="part-stock" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Stok Awal
                  </label>
                  <input
                    id="part-stock"
                    type="number"
                    min={0}
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 font-mono text-sm text-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="part-min" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Min. Stok
                  </label>
                  <input
                    id="part-min"
                    type="number"
                    min={1}
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 font-mono text-sm text-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="part-price" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Harga (Rp)
                  </label>
                  <input
                    id="part-price"
                    type="number"
                    min={0}
                    step={5000}
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 font-mono text-sm text-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white shadow-sm hover:bg-slate-800 tap-bounce dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Simpan ke Stok
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
