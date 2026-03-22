import type { SwimEvent } from './types';
import { EVENTS } from '../data/seed-data';

/**
 * Format a time in seconds to the standard swim display format.
 *   62.34  -> "1:02.34"
 *   32.10  -> "32.10"
 *  272.06  -> "4:32.06"
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return seconds.toFixed(2);
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds - mins * 60;
  const secsStr = secs < 10 ? `0${secs.toFixed(2)}` : secs.toFixed(2);

  return `${mins}:${secsStr}`;
}

/**
 * Convert an event slug to its full label.
 *   "100-free" -> "100 Freestyle"
 */
export function eventLabel(slug: string): string {
  const ev = EVENTS.find((e) => e.slug === slug);
  if (ev) return ev.name;

  // Fallback: derive from slug
  const [dist, stroke] = slug.split('-');
  const strokeMap: Record<string, string> = {
    free: 'Freestyle',
    back: 'Backstroke',
    breast: 'Breaststroke',
    fly: 'Butterfly',
    im: 'Individual Medley',
  };
  return `${dist} ${strokeMap[stroke] ?? stroke}`;
}

/**
 * Convert an event slug to its short label.
 *   "100-free" -> "100 Free"
 */
export function eventShortLabel(slug: string): string {
  const ev = EVENTS.find((e) => e.slug === slug);
  if (ev) return ev.shortName;

  const [dist, stroke] = slug.split('-');
  const strokeMap: Record<string, string> = {
    free: 'Free',
    back: 'Back',
    breast: 'Breast',
    fly: 'Fly',
    im: 'IM',
  };
  return `${dist} ${strokeMap[stroke] ?? stroke}`;
}

/** Full list of recognised LCM individual events. */
export const ALL_EVENTS: SwimEvent[] = EVENTS;
