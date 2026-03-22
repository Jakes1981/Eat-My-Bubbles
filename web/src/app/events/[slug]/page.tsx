'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { EVENTS, WORLD_TOP3 } from '@/data/seed-data';
import { getNoaLCMResults, getNoaTrajectory, NOA_BIRTH_YEAR } from '@/data/noa-results';
import { getCurrentSwimmer } from '@/lib/swimmer-data';
import type { Swimmer, SwimmerResult } from '@/lib/types';
import { formatTime } from '@/lib/swim-utils';
import TrajectoryChart from '@/components/TrajectoryChart';
import NavBar from '@/components/NavBar';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

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

  const event = EVENTS.find((e) => e.slug === slug);
  const eventIndex = EVENTS.findIndex((e) => e.slug === slug);
  const prevEvent = eventIndex > 0 ? EVENTS[eventIndex - 1] : null;
  const nextEvent = eventIndex < EVENTS.length - 1 ? EVENTS[eventIndex + 1] : null;

  if (!event || !swimmer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#06B6D4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const swimmerResult = results.find((r) => r.eventSlug === slug);
  const swimmerTime = swimmerResult?.timeSeconds;

  // World top 3 data
  const worldEntry = WORLD_TOP3.find(
    (w) => w.eventSlug === slug && w.gender === swimmer.gender
  );
  const worldSwimmers = worldEntry?.swimmers ?? [];

  // Current year and swimmer age
  const currentYear = new Date().getFullYear();
  const swimmerAge = currentYear - swimmer.birthYear;

  // Build trajectory data from full race history
  // Best LCM time per year for trajectory line
  const trajectoryPoints = getNoaTrajectory(slug);

  // All individual LCM race results as scatter points
  const allLCMRaces = getNoaLCMResults(slug).map(r => ({
    age: parseInt(r.date.slice(0, 4)) - NOA_BIRTH_YEAR + (parseInt(r.date.slice(5, 7)) - 1) / 12,
    timeSeconds: r.time,
    date: r.date,
    city: r.city,
  }));

  // Use trajectory points if we have full history, otherwise fall back to single PB
  const swimmerTrajectory = trajectoryPoints.length > 0
    ? trajectoryPoints
    : swimmerTime
      ? [{ age: swimmerAge, timeSeconds: swimmerTime }]
      : [];

  const worldTop3ForChart = worldSwimmers.map((ws, i) => ({
    name: ws.swimmer.name,
    country: ws.swimmer.country,
    trajectory: ws.trajectory,
    color: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : '#CD7F32',
  }));

  // Gap to world #1
  const world1 = worldSwimmers[0];
  const gapSeconds =
    swimmerTime && world1 ? swimmerTime - world1.swimmer.currentPB : null;

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <Link
          href="/events"
          className="text-sm text-[#06B6D4] mb-2 inline-block hover:underline"
        >
          &larr; Back to Events
        </Link>
        <h1 className="text-2xl font-bold text-white">{event.name}</h1>
        {swimmerTime && (
          <p className="text-3xl font-extrabold text-[#06B6D4] mt-1 tabular-nums">
            {formatTime(swimmerTime)}
          </p>
        )}
      </div>

      {/* Chart */}
      <div className="px-2 mt-4">
        <TrajectoryChart
          swimmerName={swimmer.name.split(' ')[0]}
          swimmerTrajectory={swimmerTrajectory}
          allRaces={allLCMRaces}
          worldTop3={worldTop3ForChart}
        />
      </div>

      {/* Gap callout */}
      {gapSeconds !== null && world1 && (
        <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-[#111D33] to-[#0F1D30] rounded-xl border border-[#1E3050]">
          <p className="text-sm text-[#94A3B8]">
            You&apos;re{' '}
            <span className="text-[#F59E0B] font-bold text-lg">
              {gapSeconds.toFixed(2)}s
            </span>{' '}
            behind{' '}
            <span className="text-white font-semibold">{world1.swimmer.name}</span>{' '}
            at age {swimmerAge}
          </p>
        </div>
      )}

      {/* World Top 3 table */}
      {worldSwimmers.length > 0 && (
        <div className="mx-4 mt-4">
          <h3 className="text-sm text-[#64748B] uppercase tracking-wider font-medium mb-2">
            World Top 3
          </h3>
          <div className="bg-[#111D33] rounded-xl border border-[#1E3050] overflow-hidden">
            {worldSwimmers.map((ws, i) => {
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
              return (
                <div
                  key={ws.swimmer.name}
                  className={`flex items-center justify-between px-4 py-3 ${
                    i < worldSwimmers.length - 1 ? 'border-b border-[#1E3050]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{medal}</span>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {ws.swimmer.name}
                      </p>
                      <p className="text-xs text-[#64748B]">{ws.swimmer.country}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-white tabular-nums">
                    {formatTime(ws.swimmer.currentPB)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Prev / Next navigation */}
      <div className="flex justify-between px-4 mt-6 gap-3">
        {prevEvent ? (
          <Link
            href={`/events/${prevEvent.slug}`}
            className="flex-1 py-3 px-4 bg-[#111D33] border border-[#1E3050] rounded-xl text-center text-sm font-medium text-[#94A3B8] hover:border-[#06B6D4]/50 transition-colors active:scale-[0.97]"
          >
            &larr; {prevEvent.shortName}
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {nextEvent ? (
          <Link
            href={`/events/${nextEvent.slug}`}
            className="flex-1 py-3 px-4 bg-[#111D33] border border-[#1E3050] rounded-xl text-center text-sm font-medium text-[#94A3B8] hover:border-[#06B6D4]/50 transition-colors active:scale-[0.97]"
          >
            {nextEvent.shortName} &rarr;
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>

      <NavBar />
    </div>
  );
}
