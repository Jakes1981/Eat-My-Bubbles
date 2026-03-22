'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentSwimmer, getAllEvents, getWorldBestTime } from '@/lib/swimmer-data';
import type { Swimmer, SwimmerResult } from '@/lib/types';
import EventCard from '@/components/EventCard';
import NavBar from '@/components/NavBar';

export default function EventsPage() {
  const router = useRouter();
  const [swimmer, setSwimmer] = useState<Swimmer | null>(null);
  const [results, setResults] = useState<SwimmerResult[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const data = getCurrentSwimmer();
    if (!data.swimmer) {
      router.push('/');
      return;
    }
    setSwimmer(data.swimmer);
    setResults(data.results);
    setLoaded(true);
  }, [router]);

  if (!loaded || !swimmer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#06B6D4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const events = getAllEvents();

  function getSwimmerTime(eventSlug: string): number | undefined {
    return results.find(r => r.eventSlug === eventSlug)?.timeSeconds;
  }

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <p className="text-sm text-[#64748B] mb-1">Welcome back,</p>
        <h1 className="text-2xl font-bold text-white">
          {swimmer.name.split(' ')[0]}
        </h1>
        {results.length > 0 && (
          <p className="text-xs text-[#475569] mt-1">
            {results.length} events tracked
          </p>
        )}
      </div>

      {/* Events Grid */}
      <div className="px-4 flex-1">
        <h2 className="text-sm text-[#64748B] uppercase tracking-wider font-medium mb-3">
          My Events
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {events.map((event) => (
            <EventCard
              key={event.slug}
              event={event}
              timeSeconds={getSwimmerTime(event.slug)}
              worldBestSeconds={getWorldBestTime(event.slug, swimmer.gender)}
            />
          ))}
        </div>
      </div>

      <NavBar />
    </div>
  );
}
