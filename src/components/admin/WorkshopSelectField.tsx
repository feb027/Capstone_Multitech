'use client';

import { useEffect, useState } from 'react';
import { NEW_WORKSHOP_OPTION } from '@/lib/frontend-mock';

interface WorkshopSelectFieldProps {
  id: string;
  name?: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  labelClassName?: string;
  selectClassName?: string;
  inputClassName?: string;
}

export function WorkshopSelectField({
  id,
  name,
  label,
  required = false,
  value,
  onChange,
  options,
  labelClassName = 'block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400',
  selectClassName = 'mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-slate-50 px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#2C2C2E] dark:text-white',
  inputClassName = 'mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white',
}: WorkshopSelectFieldProps) {
  const isKnownOption = options.some(
    (opt) => opt.toLowerCase() === value.trim().toLowerCase()
  );
  const [isCustomMode, setIsCustomMode] = useState<boolean>(
    () => Boolean(value.trim()) && !isKnownOption
  );
  const [customText, setCustomText] = useState<string>(() =>
    Boolean(value.trim()) && !isKnownOption ? value : ''
  );

  useEffect(() => {
    if (!value.trim()) return;
    const matchesKnown = options.some(
      (opt) => opt.toLowerCase() === value.trim().toLowerCase()
    );
    if (!matchesKnown && !isCustomMode) {
      setIsCustomMode(true);
      setCustomText(value);
    }
  }, [value, options, isCustomMode]);

  const effectiveSelectValue = isCustomMode
    ? NEW_WORKSHOP_OPTION
    : options.find((opt) => opt.toLowerCase() === value.trim().toLowerCase()) ||
      options[0] ||
      NEW_WORKSHOP_OPTION;

  const submittedValue = isCustomMode ? customText : effectiveSelectValue;

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className={labelClassName}>
          {label}
        </label>
        {isCustomMode && options.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setIsCustomMode(false);
              setCustomText('');
              onChange(options[0]);
            }}
            className="text-[11px] font-semibold text-blue-700 hover:underline dark:text-blue-400"
          >
            Pilih dari daftar
          </button>
        )}
      </div>

      {name && <input type="hidden" name={name} value={submittedValue} />}

      {!isCustomMode && options.length > 0 ? (
        <select
          id={id}
          required={required}
          value={effectiveSelectValue}
          onChange={(e) => {
            const nextVal = e.target.value;
            if (nextVal === NEW_WORKSHOP_OPTION) {
              setIsCustomMode(true);
              setCustomText('');
              onChange('');
            } else {
              onChange(nextVal);
            }
          }}
          className={selectClassName}
        >
          {options.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
          <option value={NEW_WORKSHOP_OPTION}>+ Tambah Bengkel Mitra Baru...</option>
        </select>
      ) : (
        <input
          id={id}
          type="text"
          required={required}
          autoFocus
          value={customText}
          onChange={(e) => {
            setCustomText(e.target.value);
            onChange(e.target.value);
          }}
          placeholder="Nama bengkel mitra baru (mis. Sumber Jaya Motor)"
          className={inputClassName}
        />
      )}
    </div>
  );
}
