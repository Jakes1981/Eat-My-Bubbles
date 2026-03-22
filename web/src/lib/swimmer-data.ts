/**
 * Unified swimmer data access layer.
 *
 * Merges imported SwimRankings data with seed data.
 * This lets the app work with both real imported profiles
 * and the hardcoded seed data for demo purposes.
 */

import { SWIMMERS, SWIMMER_RESULTS, EVENTS, WORLD_TOP3 } from '@/data/seed-data';
import type { Swimmer, SwimmerResult, SwimEvent, WorldTop3Entry } from '@/lib/types';
import type { ParsedProfile } from '@/lib/swimrankings-parser';

/** Convert a parsed SwimRankings profile to our internal format */
function importedToSwimmer(profile: ParsedProfile): Swimmer {
  return {
    id: profile.swimmer.swimRankingsId,
    name: profile.swimmer.name,
    birthYear: profile.swimmer.birthYear,
    club: profile.swimmer.club,
    province: '',
    country: profile.swimmer.countryCode,
    gender: profile.swimmer.gender,
  };
}

/** Convert parsed personal bests to SwimmerResult format */
function importedToResults(profile: ParsedProfile): SwimmerResult[] {
  return profile.personalBests
    .filter(pb => pb.course === 'LCM')  // Only LCM for trajectory comparison
    .map(pb => {
      // Map to our event slug format
      const slug = `${pb.distance}-${pb.stroke.toLowerCase().replace('style', '').replace('stroke', '').trim()}`;
      // Try to match to our known events
      const event = EVENTS.find(e =>
        e.distance === pb.distance &&
        e.stroke.toLowerCase().startsWith(pb.stroke.toLowerCase().slice(0, 4))
      );

      return {
        eventSlug: event?.slug || slug,
        timeSeconds: pb.timeSeconds,
        timeText: pb.timeText,
        date: '',
        meet: '',
      };
    });
}

/**
 * Get the current swimmer's data from localStorage.
 * Works with both imported profiles and seed data.
 */
export function getCurrentSwimmer(): {
  swimmer: Swimmer | null;
  results: SwimmerResult[];
  isImported: boolean;
} {
  if (typeof window === 'undefined') {
    return { swimmer: null, results: [], isImported: false };
  }

  const swimmerId = localStorage.getItem('swimmerId');
  if (!swimmerId) {
    return { swimmer: null, results: [], isImported: false };
  }

  // Check if this is an imported profile
  const profileJson = localStorage.getItem('currentProfile');
  if (profileJson) {
    try {
      const profile: ParsedProfile = JSON.parse(profileJson);
      return {
        swimmer: importedToSwimmer(profile),
        results: importedToResults(profile),
        isImported: true,
      };
    } catch {
      // Fall through to seed data
    }
  }

  // Fall back to seed data
  const seedSwimmer = SWIMMERS.find(s => s.id === swimmerId);
  if (seedSwimmer) {
    return {
      swimmer: seedSwimmer,
      results: SWIMMER_RESULTS[swimmerId] ?? [],
      isImported: false,
    };
  }

  return { swimmer: null, results: [], isImported: false };
}

/** Get all events */
export function getAllEvents(): SwimEvent[] {
  return EVENTS;
}

/** Get world top 3 data for a given event and gender */
export function getWorldTop3(eventSlug: string, gender: 'M' | 'F'): WorldTop3Entry | undefined {
  return WORLD_TOP3.find(w => w.eventSlug === eventSlug && w.gender === gender);
}

/** Get the world best time for an event */
export function getWorldBestTime(eventSlug: string, gender: 'M' | 'F'): number | undefined {
  const entry = getWorldTop3(eventSlug, gender);
  if (!entry || entry.swimmers.length === 0) return undefined;
  return entry.swimmers[0].swimmer.currentPB;
}
