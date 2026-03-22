'use client';

import type { SwimmerResult, WorldTop3Entry } from '@/lib/types';
import { formatTime } from '@/lib/swim-utils';
import { EVENTS } from '@/data/seed-data';

interface PBTableProps {
  results: SwimmerResult[];
  worldTop3: WorldTop3Entry[];
}

export default function PBTable({ results, worldTop3 }: PBTableProps) {
  if (results.length === 0) {
    return (
      <div className="bg-[#111D33] rounded-xl border border-[#1E3050] p-6 text-center">
        <p className="text-[#64748B]">No results yet</p>
      </div>
    );
  }

  return (
    <div className="bg-[#111D33] rounded-xl border border-[#1E3050] overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-4 gap-2 px-4 py-2.5 bg-[#0D1B2A] border-b border-[#1E3050]">
        <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-medium">Event</span>
        <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-medium text-right">PB</span>
        <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-medium text-right">W#1</span>
        <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-medium text-right">Gap</span>
      </div>

      {/* Rows */}
      {results.map((result, i) => {
        const event = EVENTS.find((e) => e.slug === result.eventSlug);
        const worldEntry = worldTop3.find((w) => w.eventSlug === result.eventSlug);
        const worldBest = worldEntry?.swimmers?.[0]?.swimmer?.currentPB;

        let gapPct: number | null = null;
        let gapColorClass = 'text-[#64748B]';

        if (worldBest) {
          gapPct = ((result.timeSeconds - worldBest) / worldBest) * 100;
          if (gapPct < 5) {
            gapColorClass = 'text-emerald-400';
          } else if (gapPct < 15) {
            gapColorClass = 'text-amber-400';
          } else {
            gapColorClass = 'text-red-400';
          }
        }

        return (
          <div
            key={result.eventSlug}
            className={`grid grid-cols-4 gap-2 px-4 py-3 ${
              i < results.length - 1 ? 'border-b border-[#1E3050]/50' : ''
            }`}
          >
            <span className="text-sm font-medium text-white truncate">
              {event?.shortName ?? result.eventSlug}
            </span>
            <span className="text-sm font-bold text-[#06B6D4] text-right tabular-nums">
              {formatTime(result.timeSeconds)}
            </span>
            <span className="text-sm text-[#94A3B8] text-right tabular-nums">
              {worldBest ? formatTime(worldBest) : '—'}
            </span>
            <span className={`text-sm font-medium text-right tabular-nums ${gapColorClass}`}>
              {gapPct !== null ? `+${gapPct.toFixed(1)}%` : '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
