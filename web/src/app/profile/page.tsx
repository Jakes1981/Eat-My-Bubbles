'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EVENTS, WORLD_TOP3 } from '@/data/seed-data';
import { getCurrentSwimmer } from '@/lib/swimmer-data';
import type { Swimmer, SwimmerResult } from '@/lib/types';
import { formatTime } from '@/lib/swim-utils';
import PBTable from '@/components/PBTable';
import NavBar from '@/components/NavBar';

export default function ProfilePage() {
  const router = useRouter();
  const [swimmer, setSwimmer] = useState<Swimmer | null>(null);
  const [results, setResults] = useState<SwimmerResult[]>([]);

  useEffect(() => {
    const data = getCurrentSwimmer();
    if (!data.swimmer) {
      router.push('/');
      return;
    }
    setSwimmer(data.swimmer);
    setResults(data.results);
  }, [router]);

  if (!swimmer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#06B6D4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const age = currentYear - swimmer.birthYear;

  // Find strongest event (fastest relative to world #1)
  type EventSummary = { slug: string; pct: number; time: number };
  let strongestEvent: EventSummary | null = null;
  let closestToRecord: EventSummary | null = null;

  for (const r of results) {
    const worldEntry = WORLD_TOP3.find(
      (w) => w.eventSlug === r.eventSlug && w.gender === swimmer.gender
    );
    if (!worldEntry || worldEntry.swimmers.length === 0) continue;
    const worldBest = worldEntry.swimmers[0].swimmer.currentPB;
    const pct = ((r.timeSeconds - worldBest) / worldBest) * 100;

    if (!closestToRecord || pct < closestToRecord.pct) {
      closestToRecord = { slug: r.eventSlug, pct, time: r.timeSeconds };
    }
    if (!strongestEvent || pct < strongestEvent.pct) {
      strongestEvent = { slug: r.eventSlug, pct, time: r.timeSeconds };
    }
  }

  const worldTop3Entries = WORLD_TOP3.filter((w) => w.gender === swimmer.gender);

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Profile header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#0891B2] flex items-center justify-center text-white text-xl font-bold shrink-0">
            {swimmer.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{swimmer.name}</h1>
            <p className="text-sm text-[#64748B]">{swimmer.club}</p>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#111D33] rounded-xl border border-[#1E3050] p-3 text-center">
            <p className="text-2xl font-bold text-[#06B6D4]">{age}</p>
            <p className="text-[10px] text-[#64748B] uppercase tracking-wider mt-0.5">Age</p>
          </div>
          <div className="bg-[#111D33] rounded-xl border border-[#1E3050] p-3 text-center">
            <p className="text-sm font-bold text-white truncate">{swimmer.province}</p>
            <p className="text-[10px] text-[#64748B] uppercase tracking-wider mt-0.5">Province</p>
          </div>
          <div className="bg-[#111D33] rounded-xl border border-[#1E3050] p-3 text-center">
            <p className="text-sm font-bold text-white truncate">{swimmer.country}</p>
            <p className="text-[10px] text-[#64748B] uppercase tracking-wider mt-0.5">Country</p>
          </div>
        </div>
      </div>

      {/* Summary highlights */}
      {(strongestEvent || closestToRecord) && (
        <div className="px-4 mb-4">
          <div className="bg-gradient-to-r from-[#111D33] to-[#0F1D30] rounded-xl border border-[#1E3050] p-4 space-y-2">
            {strongestEvent && (
              <p className="text-sm text-[#94A3B8]">
                <span className="text-[#06B6D4] font-semibold">Strongest event:</span>{' '}
                {EVENTS.find((e) => e.slug === strongestEvent!.slug)?.shortName ?? strongestEvent.slug}{' '}
                <span className="text-white font-medium">({formatTime(strongestEvent.time)})</span>
              </p>
            )}
            {closestToRecord && (
              <p className="text-sm text-[#94A3B8]">
                <span className="text-[#F59E0B] font-semibold">Closest to world #1:</span>{' '}
                {EVENTS.find((e) => e.slug === closestToRecord!.slug)?.shortName ?? closestToRecord.slug}{' '}
                <span className="text-white font-medium">
                  (+{closestToRecord.pct.toFixed(1)}%)
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* PB Table */}
      <div className="px-4 flex-1">
        <h2 className="text-sm text-[#64748B] uppercase tracking-wider font-medium mb-3">
          Personal Bests
        </h2>
        <PBTable results={results} worldTop3={worldTop3Entries} />
      </div>

      <NavBar />
    </div>
  );
}
