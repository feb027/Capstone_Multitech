'use client';

import { useState } from 'react';

export interface BarChartSeries {
  key: string;
  label: string;
  colorClass: string;
}

export interface BarChartCategory {
  label: string;
  values: number[];
  tooltips?: string[];
}

interface GroupedBarChartProps {
  title: string;
  yAxisLabel: string;
  xAxisLabel: string;
  series: BarChartSeries[];
  categories: BarChartCategory[];
  ticks: number[];
  formatTick?: (val: number) => string;
  heightClass?: string;
  wideBars?: boolean;
}

export function GroupedBarChart({
  title,
  yAxisLabel,
  xAxisLabel,
  series,
  categories,
  ticks,
  formatTick = (val) => String(val),
  heightClass = 'h-44 sm:h-48',
  wideBars = false,
}: GroupedBarChartProps) {
  const maxTick = ticks.length > 0 ? Math.max(...ticks, 1) : 1;
  const isSingleSeries = series.length <= 1;
  const [hoveredBar, setHoveredBar] = useState<{ catIdx: number; sIdx: number } | null>(null);

  return (
    <div className="w-full min-w-0 select-none overflow-visible">
      {/* Centered Chart Title */}
      <h3 className="text-center text-sm font-bold tracking-tight text-slate-900 dark:text-white sm:text-base">
        {title}
      </h3>

      {/* Centered Series Legend (only when multiple series) */}
      {!isSingleSeries && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 sm:text-xs">
          {series.map((s) => (
            <div key={s.key} className="inline-flex items-center gap-1.5">
              <span className={`h-3 w-3 shrink-0 rounded-[2px] ${s.colorClass}`} aria-hidden="true" />
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Plot Area */}
      <div className="mt-8 flex min-w-0 items-stretch gap-1.5 sm:gap-2">
        {/* Vertical Y-Axis Title */}
        <div className="flex w-4 shrink-0 items-center justify-center sm:w-5">
          <span className="-rotate-90 whitespace-nowrap text-[10px] font-semibold text-slate-600 dark:text-slate-400 sm:text-[11px]">
            {yAxisLabel}
          </span>
        </div>

        {/* Plot Grid + Bars + X Labels */}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-stretch">
            {/* Y-Axis Tick Labels Column */}
            <div className={`relative mr-2 w-7 shrink-0 sm:w-8 ${heightClass}`}>
              {ticks.map((tick) => {
                const bottomPct = (tick / maxTick) * 100;
                return (
                  <span
                    key={`tick-label-${tick}`}
                    style={{ bottom: `${bottomPct}%` }}
                    className="absolute right-0 translate-y-1/2 font-mono text-[10px] font-medium tabular-nums text-slate-600 dark:text-slate-400"
                  >
                    {formatTick(tick)}
                  </span>
                );
              })}
            </div>

            {/* Gridlines & Grouped Vertical Bars */}
            <div
              className={`relative min-w-0 flex-1 overflow-visible ${heightClass}`}
              onMouseLeave={() => setHoveredBar(null)}
            >
              {/* Horizontal Gridlines */}
              {ticks.map((tick) => {
                const bottomPct = (tick / maxTick) * 100;
                const isZero = tick === 0;
                return (
                  <div
                    key={`grid-line-${tick}`}
                    style={{ bottom: `${bottomPct}%` }}
                    className={`pointer-events-none absolute left-0 right-0 ${
                      isZero
                        ? 'z-10 border-t border-slate-900 dark:border-zinc-300'
                        : 'border-t border-slate-300/80 dark:border-white/15'
                    }`}
                  />
                );
              })}

              {/* Category Groups */}
              <div className="relative z-10 flex h-full w-full min-w-0 items-end justify-around px-1 sm:px-2">
                {categories.map((cat, catIdx) => (
                  <div
                    key={cat.label}
                    className="flex h-full min-w-0 flex-1 items-end justify-center gap-[2px] px-1 sm:gap-1 sm:px-1.5"
                  >
                    {series.map((s, sIdx) => {
                      const val = cat.values[sIdx] ?? 0;
                      const heightPct =
                        val <= 0 ? 0 : Math.min(100, Math.max(2, (val / maxTick) * 100));
                      const tooltipText =
                        cat.tooltips?.[sIdx] ?? `${cat.label} - ${s.label}: ${val}`;
                      const isHovered =
                        hoveredBar?.catIdx === catIdx && hoveredBar?.sIdx === sIdx;
                      const isDimmed = hoveredBar !== null && !isHovered;
                      const barWidthClass = isSingleSeries
                        ? wideBars
                          ? 'w-full max-w-[36px] sm:max-w-[48px]'
                          : 'w-full max-w-[26px] sm:max-w-[34px]'
                        : 'flex-1 max-w-[14px]';
                      return (
                        <div
                          key={`${cat.label}-${s.key}`}
                          tabIndex={0}
                          role="button"
                          aria-label={tooltipText}
                          onMouseEnter={() => setHoveredBar({ catIdx, sIdx })}
                          onFocus={() => setHoveredBar({ catIdx, sIdx })}
                          onBlur={() => setHoveredBar(null)}
                          onClick={() =>
                            setHoveredBar((prev) =>
                              prev?.catIdx === catIdx && prev?.sIdx === sIdx
                                ? null
                                : { catIdx, sIdx },
                            )
                          }
                          style={{ height: `${heightPct}%` }}
                          className={`relative cursor-pointer rounded-t-[3px] outline-none transition-all duration-200 ${barWidthClass} ${
                            s.colorClass
                          } ${
                            isHovered
                              ? 'z-20 origin-bottom scale-y-[1.03] brightness-110 ring-2 ring-blue-400/60 shadow-md'
                              : isDimmed
                                ? 'opacity-50'
                                : 'hover:brightness-110'
                          }`}
                        >
                          {isHovered && (
                            <div
                              role="tooltip"
                              className="pointer-events-none absolute -top-9 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg dark:bg-white dark:text-slate-900"
                            >
                              {tooltipText}
                              <span
                                aria-hidden="true"
                                className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-900 dark:bg-white"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* X-Axis Category Labels */}
          <div className="ml-9 flex min-w-0 items-start justify-around px-1 pt-2 sm:ml-10 sm:px-2">
            {categories.map((cat, catIdx) => {
              const isCatHovered = hoveredBar?.catIdx === catIdx;
              return (
                <div key={`x-cat-${cat.label}`} className="min-w-0 flex-1 text-center">
                  <span
                    className={`block truncate text-[10px] transition-colors sm:text-xs ${
                      isCatHovered
                        ? 'font-bold text-blue-700 dark:text-blue-300'
                        : 'font-medium text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Centered X-Axis Title */}
          <p className="ml-9 mt-2 text-center text-[10px] font-semibold text-slate-600 dark:text-slate-400 sm:ml-10 sm:text-[11px]">
            {xAxisLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
