'use client';

import Link from 'next/link';
import type { SwimEvent } from '@/lib/types';
import { formatTime } from '@/lib/swim-utils';

interface EventCardProps {
  event: SwimEvent;
  timeSeconds?: number;
  worldBestSeconds?: number;
}

export default function EventCard({ event, timeSeconds, worldBestSeconds }: EventCardProps) {
  // Calculate percentage of world best
  let pctOfWorld: number | null = null;
  let colorClass = 'border-[#1E3050]';
  let indicatorColor = 'bg-[#475569]';

  if (timeSeconds && worldBestSeconds) {
    pctOfWorld = ((timeSeconds - worldBestSeconds) / worldBestSeconds) * 100;
    if (pctOfWorld <= 10) {
      colorClass = 'border-emerald-500/40';
      indicatorColor = 'bg-emerald-500';
    } else if (pctOfWorld <= 20) {
      colorClass = 'border-amber-500/40';
      indicatorColor = 'bg-amber-500';
    } else {
      colorClass = 'border-[#1E3050]';
      indicatorColor = 'bg-[#475569]';
    }
  }

  return (
    <Link href={`/events/${event.slug}`}>
      <div
        className={`relative bg-[#111D33] rounded-2xl border ${colorClass} p-4 transition-all duration-200 hover:bg-[#162038] hover:shadow-lg hover:shadow-[#06B6D4]/5 active:scale-[0.97] cursor-pointer h-full`}
      >
        {/* Color indicator dot */}
        <div className="flex items-center justify-between mb-2">
          <span className={`w-2.5 h-2.5 rounded-full ${indicatorColor}`} />
          {pctOfWorld !== null && (
            <span className="text-[10px] text-[#64748B] font-medium">
              +{pctOfWorld.toFixed(1)}%
            </span>
          )}
        </div>

        {/* Event name */}
        <h3 className="text-base font-semibold text-white mb-1 leading-tight">
          {event.shortName}
        </h3>

        {/* Time */}
        <p className="text-xl font-bold text-[#06B6D4] tabular-nums">
          {timeSeconds ? formatTime(timeSeconds) : '—'}
        </p>

        {/* World best reference */}
        {worldBestSeconds && (
          <p className="text-[10px] text-[#64748B] mt-1">
            W#1: {formatTime(worldBestSeconds)}
          </p>
        )}
      </div>
    </Link>
  );
}
