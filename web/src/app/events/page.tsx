'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SWIMMERS, SWIMMER_RESULTS, EVENTS, WORLD_TOP3 } from '@/data/seed-data';
import type { Swimmer, SwimmerResult, SwimEvent } from '@/lib/types';
import EventCard from '@/components/EventCard';
import NavBar from '@/components/NavBar';

export default function EventsPage() {
  const router = useRouter();
  const [swimmerId, setSwimmerId] = useState<string | null>(null);
  const [swimmer, setSwimmer] = useState<Swimmer | null>(null);
  const [results, setResults] = useState<SwimmerResult[]>([]);

  useEffect(() => {
    const id = localStorage.getItem('swimmerId');
    if (!id) {
      router.push('/');
      return;
    }
    setSwimmerId(id);

    const found = SWIMMERS.find((s) => s.id === id);
    if (found) setSwimmer(found);

    const swimmerResults = SWIMMER_RESULTS[id] ?? [];
    setResults(swimmerResults);
  }, [router]);

  if (!swimmer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#06B6D4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Get world best for each event
  function getWorldBest(eventSlug: string): number | undefined {
    const entry = WORLD_TOP3.find(
      (w) => w.eventSlug === eventSlug && w.gender === swimmer?.gender
    );
    if (!entry || entry.swimmers.length === 0) return undefined;
    return entry.swimmers[0].swimmer.currentPB;
  }

  function getSwimmerTime(eventSlug: string): number | undefined {
    const result = results.find((r) => r.eventSlug === eventSlug);
    return result?.timeSeconds;
  }

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <p className="text-sm text-[#64748B] mb-1">Welcome back,</p>
        <h1 className="text-2xl font-bold text-white">
          {swimmer.name.split(' ')[0]}
        </h1>
      </div>

      {/* Events Grid */}
      <div className="px-4 flex-1">
        <h2 className="text-sm text-[#64748B] uppercase tracking-wider font-medium mb-3">
          My Events
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {EVENTS.map((event) => (
            <EventCard
              key={event.slug}
              event={event}
              timeSeconds={getSwimmerTime(event.slug)}
              worldBestSeconds={getWorldBest(event.slug)}
            />
          ))}
        </div>
      </div>

      <NavBar />
    </div>
  );
}
