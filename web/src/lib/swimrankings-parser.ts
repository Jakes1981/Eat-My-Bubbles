/**
 * SwimRankings.net page content parser.
 *
 * Parses the text content that a user copies (Cmd+A, Cmd+C) from their
 * SwimRankings athlete profile page.
 *
 * Tested format (from actual SwimRankings page):
 *
 *   BURGER, Noa Josh
 *   (2012  )
 *   CAN - Canada
 *   Calgary Patriots Swim Club
 *   ...
 *   100m Freestyle    50m    56.29    560    20 Feb 2026    Calgary (AB)    Meet Name
 */

export interface ParsedSwimmer {
  name: string;
  firstName: string;
  lastName: string;
  birthYear: number;
  gender: 'M' | 'F';
  country: string;
  countryCode: string;
  club: string;
  swimRankingsId: string;
}

export interface ParsedPersonalBest {
  eventName: string;       // e.g., "100m Freestyle"
  distance: number;        // e.g., 100
  stroke: string;          // e.g., "Freestyle"
  course: 'LCM' | 'SCM';  // 50m or 25m
  timeSeconds: number;
  timeText: string;        // e.g., "56.29"
  finaPoints: number;
  date: string;            // e.g., "20 Feb 2026"
  city: string;            // e.g., "Calgary (AB)"
  meet: string;            // e.g., "Western Transmountain Festival"
}

export interface ParsedMeet {
  date: string;
  city: string;
  name: string;
  course?: string;
}

export interface ParsedResult {
  eventName: string;
  distance: number;
  stroke: string;
  course: 'LCM' | 'SCM';
  timeSeconds: number;
  timeText: string;
  finaPoints: number;
  date: string;           // "12 Oct 2024"
  dateISO: string;        // "2024-10-12"
  city: string;
  season: string;         // "2025", "2026"
  ageAtSwim: number;      // calculated from birth year and date
}

export interface ParsedProfile {
  swimmer: ParsedSwimmer;
  personalBests: ParsedPersonalBest[];
  allResults: ParsedResult[];
  meets: ParsedMeet[];
}

/**
 * Parse time string to seconds.
 * Handles: "56.29", "1:02.34", "2:07.54", "14:32.78", "18:22.33"
 */
function parseTimeToSeconds(timeStr: string): number {
  const cleaned = timeStr.trim();
  if (!cleaned) return 0;

  const parts = cleaned.split(':');
  if (parts.length === 1) {
    return parseFloat(parts[0]);
  } else if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
  } else if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
  }
  return 0;
}

/**
 * Normalize stroke name from SwimRankings format.
 */
function normalizeStroke(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (lower === 'freestyle' || lower === 'freestyle lap') return 'Freestyle';
  if (lower === 'backstroke') return 'Backstroke';
  if (lower === 'breaststroke') return 'Breaststroke';
  if (lower === 'butterfly' || lower === 'butterfly lap') return 'Butterfly';
  if (lower === 'medley') return 'IM';
  return raw;
}

/**
 * Parse course: "50m" → "LCM", "25m" → "SCM"
 */
function parseCourse(courseStr: string): 'LCM' | 'SCM' {
  return courseStr.trim() === '50m' ? 'LCM' : 'SCM';
}

/**
 * Map event to our slug format.
 * "100m Freestyle" + "50m" → "100-free"
 */
function eventToSlug(distance: number, stroke: string): string {
  const strokeMap: Record<string, string> = {
    'Freestyle': 'free',
    'Backstroke': 'back',
    'Breaststroke': 'breast',
    'Butterfly': 'fly',
    'IM': 'im',
  };
  return `${distance}-${strokeMap[stroke] || stroke.toLowerCase()}`;
}

/**
 * Parse the pasted text content from a SwimRankings athlete page.
 */
export function parseSwimRankingsText(
  text: string,
  athleteId: string
): ParsedProfile | null {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length < 5) return null;

  // === Parse swimmer identity ===
  let firstName = '';
  let lastName = '';
  let birthYear = 0;
  let gender: 'M' | 'F' = 'M';
  let country = '';
  let countryCode = '';
  let club = '';

  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const line = lines[i];

    // Name: "BURGER, Noa Josh" — all caps last name, comma, first name(s)
    const nameMatch = line.match(/^([A-ZÀ-Ü][A-ZÀ-Ü'-]+),\s+(.+)$/);
    if (nameMatch && !firstName) {
      lastName = nameMatch[1].charAt(0) + nameMatch[1].slice(1).toLowerCase();
      firstName = nameMatch[2].trim();
      continue;
    }

    // Birth year: "(2012  )" or "(2012)" — standalone line with year in parens
    const yearMatch = line.match(/^\((\d{4})\s*\)$/);
    if (yearMatch && !birthYear) {
      birthYear = parseInt(yearMatch[1]);
      continue;
    }

    // Country: "CAN - Canada"
    const countryMatch = line.match(/^([A-Z]{3})\s+-\s+(.+)$/);
    if (countryMatch && !countryCode) {
      countryCode = countryMatch[1];
      country = countryMatch[2].trim();
      continue;
    }

    // Club: line after country, typically contains "Club", "Swimming", "Swim", "SC", etc.
    if (countryCode && !club && !line.match(/^Personal|^Record|^Meet|^Bio|^swim/i)) {
      if (line.match(/club|swimming|swim|sc$|aquatic|patriot|academy/i) ||
          (i > 0 && lines[i-1].match(/^[A-Z]{3}\s+-\s+/))) {
        club = line;
        continue;
      }
    }
  }

  // === Parse personal bests ===
  const personalBests: ParsedPersonalBest[] = [];
  let inPBSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Start of PB section
    if (line.match(/^Personal bests/i) || line.match(/^Event\s+Course\s+Time/)) {
      inPBSection = true;
      continue;
    }

    // Skip header row
    if (line.match(/^Event\s+Course\s+Time\s+Pts/)) {
      continue;
    }

    if (!inPBSection) continue;

    // End of PB section — detect meet/records/biography sections
    if (line.match(/^Records|^Meets|^Biography|^swimstats|^Meet Results/i) && !line.match(/^\d+m/)) {
      break;
    }

    // Parse PB row:
    // "100m Freestyle    50m    56.29    560    20 Feb 2026    Calgary (AB)    Western Transmountain Festival ..."
    // Also: "50m Freestyle Lap    50m    26.66    -    30 May 2025    Calgary    CSI 2025"
    const pbMatch = line.match(
      /^(\d+)m\s+([A-Za-z\s]+?)\s{2,}(25m|50m)\s{2,}(\d+[:.]\d+(?:\.\d+)?)\s{2,}(\d+|-)\s{2,}(\d{1,2}\s+[A-Za-z]+\s+\d{4})\s{2,}([^\t]+?)\s{2,}(.+)$/
    );

    if (pbMatch) {
      const distance = parseInt(pbMatch[1]);
      const strokeRaw = pbMatch[2].trim();
      const courseStr = pbMatch[3];
      const timeText = pbMatch[4];
      const ptsStr = pbMatch[5];
      const date = pbMatch[6].trim();
      const city = pbMatch[7].trim();
      const meet = pbMatch[8].trim();

      // Skip "Lap" events (relay split times)
      if (strokeRaw.toLowerCase().includes('lap')) continue;

      const stroke = normalizeStroke(strokeRaw);
      const course = parseCourse(courseStr);
      const timeSeconds = parseTimeToSeconds(timeText);
      const finaPoints = ptsStr === '-' ? 0 : parseInt(ptsStr) || 0;

      personalBests.push({
        eventName: `${distance}m ${strokeRaw}`,
        distance,
        stroke,
        course,
        timeSeconds,
        timeText,
        finaPoints,
        date,
        city,
        meet,
      });
      continue;
    }

    // Try a more lenient parse — tab separated
    const parts = line.split(/\t+/);
    if (parts.length >= 4) {
      const eventMatch = parts[0].match(/^(\d+)m\s+(.+)/);
      const courseMatch = parts[1]?.match(/^(25m|50m)$/);
      const timeMatch = parts[2]?.match(/^(\d+[:.]\d+(?:\.\d+)?)$/);

      if (eventMatch && courseMatch && timeMatch) {
        const distance = parseInt(eventMatch[1]);
        const strokeRaw = eventMatch[2].trim();

        if (strokeRaw.toLowerCase().includes('lap')) continue;

        const stroke = normalizeStroke(strokeRaw);
        const course = parseCourse(courseMatch[1]);
        const timeSeconds = parseTimeToSeconds(timeMatch[1]);
        const finaPoints = parts[3] ? (parts[3] === '-' ? 0 : parseInt(parts[3]) || 0) : 0;
        const date = parts[4]?.trim() || '';
        const city = parts[5]?.trim() || '';
        const meet = parts[6]?.trim() || '';

        personalBests.push({
          eventName: `${distance}m ${strokeRaw}`,
          distance,
          stroke,
          course,
          timeSeconds,
          timeText: timeMatch[1],
          finaPoints,
          date,
          city,
          meet,
        });
      }
    }
  }

  // === Extract unique meets from PB data ===
  const meetMap = new Map<string, ParsedMeet>();
  for (const pb of personalBests) {
    const key = `${pb.date}-${pb.city}`;
    if (!meetMap.has(key) && pb.date) {
      meetMap.set(key, {
        date: pb.date,
        city: pb.city,
        name: pb.meet,
        course: pb.course === 'LCM' ? '50m' : '25m',
      });
    }
  }
  const meets = Array.from(meetMap.values());

  // Only return if we got something useful
  if (!firstName && !lastName && personalBests.length === 0) {
    return null;
  }

  return {
    swimmer: {
      name: `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      birthYear,
      gender,
      country,
      countryCode,
      club,
      swimRankingsId: athleteId,
    },
    personalBests,
    allResults: [],
    meets,
  };
}

/**
 * Parse "All results" page from SwimRankings (one season at a time).
 *
 * Format:
 *   50m Freestyle    Pts.
 *   12 Oct 2024    Calgary    25m    28.40    344
 *   8 Nov 2024    Calgary    25m    28.19    351
 *   ...
 *   100m Freestyle    Pts.
 *   9 Nov 2024    Calgary    25m    1:00.32    410
 *   ...
 */
export function parseSwimRankingsAllResults(
  text: string,
  birthYear: number,
  season?: string
): ParsedResult[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const results: ParsedResult[] = [];

  let currentDistance = 0;
  let currentStroke = '';
  let currentEventName = '';
  let isLapEvent = false;

  // Detect season from header line like "All results, Season 2025 (1 Sep - 31 Aug 2025)"
  let detectedSeason = season || '';
  for (const line of lines) {
    const seasonMatch = line.match(/Season\s+(\d{4})/);
    if (seasonMatch) {
      detectedSeason = seasonMatch[1];
      break;
    }
  }

  for (const line of lines) {
    // Event header: "100m Freestyle    Pts." or "50m Butterfly    Pts."
    const eventMatch = line.match(/^(\d+)m\s+([A-Za-z\s]+?)\s+Pts\.$/);
    if (eventMatch) {
      currentDistance = parseInt(eventMatch[1]);
      const strokeRaw = eventMatch[2].trim();
      isLapEvent = strokeRaw.toLowerCase().includes('lap');
      currentStroke = normalizeStroke(strokeRaw);
      currentEventName = `${currentDistance}m ${strokeRaw}`;
      continue;
    }

    // Skip lap events
    if (isLapEvent) continue;

    // Skip if no current event
    if (!currentDistance) continue;

    // Result row: "12 Oct 2024    Calgary    25m    28.40    344"
    // Also handles: "9 Nov 2024    Calgary    25m    1:00.32    410"
    const resultMatch = line.match(
      /^(\d{1,2}\s+[A-Za-z]+\s+\d{4})\s{2,}([A-Za-zÀ-ÿ\s'-]+?)\s{2,}(25m|50m)\s{2,}(\d+[:.]\d+(?:\.\d+)?)\s{2,}(\d+|-)$/
    );

    if (resultMatch) {
      const dateStr = resultMatch[1].trim();
      const city = resultMatch[2].trim();
      const courseStr = resultMatch[3];
      const timeText = resultMatch[4];
      const ptsStr = resultMatch[5];

      const course = parseCourse(courseStr);
      const timeSeconds = parseTimeToSeconds(timeText);
      const finaPoints = ptsStr === '-' ? 0 : parseInt(ptsStr) || 0;
      const dateISO = parseDateToISO(dateStr);
      const ageAtSwim = calculateAge(birthYear, dateISO);

      results.push({
        eventName: currentEventName,
        distance: currentDistance,
        stroke: currentStroke,
        course,
        timeSeconds,
        timeText,
        finaPoints,
        date: dateStr,
        dateISO,
        city,
        season: detectedSeason,
        ageAtSwim,
      });
      continue;
    }

    // Try tab-separated fallback
    const parts = line.split(/\t+/);
    if (parts.length >= 5 && currentDistance) {
      const dateStr = parts[0]?.trim();
      const city = parts[1]?.trim();
      const courseStr = parts[2]?.trim();
      const timeText = parts[3]?.trim();
      const ptsStr = parts[4]?.trim();

      if (dateStr?.match(/^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/) &&
          courseStr?.match(/^(25m|50m)$/) &&
          timeText?.match(/^\d+[:.]\d+/)) {
        const course = parseCourse(courseStr);
        const timeSeconds = parseTimeToSeconds(timeText);
        const finaPoints = ptsStr === '-' ? 0 : parseInt(ptsStr) || 0;
        const dateISO = parseDateToISO(dateStr);
        const ageAtSwim = calculateAge(birthYear, dateISO);

        results.push({
          eventName: currentEventName,
          distance: currentDistance,
          stroke: currentStroke,
          course,
          timeSeconds,
          timeText,
          finaPoints,
          date: dateStr,
          dateISO,
          city,
          season: detectedSeason,
          ageAtSwim,
        });
      }
    }
  }

  return results;
}

/**
 * Parse date string "12 Oct 2024" → "2024-10-12"
 */
function parseDateToISO(dateStr: string): string {
  const months: Record<string, string> = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  };
  const match = dateStr.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!match) return '';
  const day = match[1].padStart(2, '0');
  const month = months[match[2]] || '01';
  const year = match[3];
  return `${year}-${month}-${day}`;
}

/**
 * Calculate age at time of swim.
 * Swimming age in Canada = age on Dec 31 of the competition year.
 * But for trajectory, actual age at time of swim is more useful.
 */
function calculateAge(birthYear: number, dateISO: string): number {
  if (!dateISO || !birthYear) return 0;
  const swimYear = parseInt(dateISO.slice(0, 4));
  return swimYear - birthYear;
}

/**
 * Utility: get event slug from parsed PB
 */
export function pbToEventSlug(pb: ParsedPersonalBest): string {
  return eventToSlug(pb.distance, pb.stroke);
}

/**
 * Parse HTML content from a saved SwimRankings page.
 */
export function parseSwimRankingsHTML(
  html: string,
  athleteId: string
): ParsedProfile | null {
  if (typeof document === 'undefined') return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Extract name
  const nameDiv = doc.querySelector('#name');
  let firstName = '';
  let lastName = '';
  let birthYear = 0;

  if (nameDiv) {
    const nameText = nameDiv.textContent || '';
    const nameMatch = nameText.match(/([A-ZÀ-Ü][A-ZÀ-Ü'-]+),\s*([A-Za-zÀ-ÿ\s'-]+)\s*\(?(\d{4})\)?/);
    if (nameMatch) {
      lastName = nameMatch[1].charAt(0) + nameMatch[1].slice(1).toLowerCase();
      firstName = nameMatch[2].replace(/\d/g, '').trim();
      birthYear = parseInt(nameMatch[3]);
    }
  }

  const genderImg = doc.querySelector('#name img');
  const gender: 'M' | 'F' = genderImg?.getAttribute('src')?.includes('gender1') ? 'M' : 'F';

  const nationDiv = doc.querySelector('#nationclub');
  let country = '';
  let countryCode = '';
  let club = '';

  if (nationDiv) {
    const text = nationDiv.textContent || '';
    const countryMatch = text.match(/([A-Z]{3})\s*-\s*([^,\n]+)/);
    if (countryMatch) {
      countryCode = countryMatch[1];
      country = countryMatch[2].trim();
    }
    const parts = text.split('\n').map(p => p.trim()).filter(p => p);
    if (parts.length > 1) {
      club = parts[parts.length - 1];
    }
  }

  const personalBests: ParsedPersonalBest[] = [];
  const pbTable = doc.querySelector('table.athleteBest');

  if (pbTable) {
    const rows = pbTable.querySelectorAll('tr.athleteBest0, tr.athleteBest1');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 4) {
        const eventName = cells[0].textContent?.trim() || '';
        const courseStr = cells[1].textContent?.trim() || '';
        const timeText = cells[2].textContent?.trim() || '';
        const finaStr = cells[3].textContent?.trim() || '';

        const evMatch = eventName.match(/(\d+)m\s+(.+)/);
        if (!evMatch) return;
        if (evMatch[2].toLowerCase().includes('lap')) return;

        const distance = parseInt(evMatch[1]);
        const stroke = normalizeStroke(evMatch[2]);
        const course = parseCourse(courseStr);
        const timeSeconds = parseTimeToSeconds(timeText);

        personalBests.push({
          eventName,
          distance,
          stroke,
          course,
          timeSeconds,
          timeText,
          finaPoints: parseInt(finaStr) || 0,
          date: cells[4]?.textContent?.trim() || '',
          city: cells[5]?.textContent?.trim() || '',
          meet: cells[6]?.textContent?.trim() || '',
        });
      }
    });
  }

  const meets: ParsedMeet[] = [];

  if (!firstName && !lastName && personalBests.length === 0) {
    return null;
  }

  return {
    swimmer: {
      name: `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      birthYear,
      gender,
      country,
      countryCode,
      club,
      swimRankingsId: athleteId,
    },
    personalBests,
    allResults: [],
    meets,
  };
}
