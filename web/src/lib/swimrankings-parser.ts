/**
 * SwimRankings.net page content parser.
 *
 * Parses the text content that a user copies from their SwimRankings
 * athlete profile page. Extracts personal details, personal bests,
 * and meet history.
 *
 * The user flow:
 * 1. Open swimrankings.net/index.php?page=athleteDetail&athleteId=XXXXX
 * 2. Select All (Cmd+A / Ctrl+A)
 * 3. Copy (Cmd+C / Ctrl+C)
 * 4. Paste into our app
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
  eventName: string;       // e.g., "100 m Freestyle"
  distance: number;        // e.g., 100
  stroke: string;          // e.g., "Freestyle"
  course: 'LCM' | 'SCM';  // 50m or 25m
  timeSeconds: number;
  timeText: string;        // e.g., "56.34"
  finaPoints: number;
  date?: string;
  meet?: string;
}

export interface ParsedMeet {
  date: string;
  city: string;
  name: string;
  course?: string;
}

export interface ParsedProfile {
  swimmer: ParsedSwimmer;
  personalBests: ParsedPersonalBest[];
  meets: ParsedMeet[];
}

/**
 * Parse time string to seconds.
 * Handles: "56.34", "1:02.34", "2:07.54", "14:32.78"
 */
function parseTimeToSeconds(timeStr: string): number {
  const cleaned = timeStr.trim().replace(/[^\d:.]/g, '');
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
 * Normalize stroke name to canonical form.
 */
function normalizeStroke(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('free')) return 'Freestyle';
  if (lower.includes('back')) return 'Backstroke';
  if (lower.includes('breast')) return 'Breaststroke';
  if (lower.includes('fly') || lower.includes('butter')) return 'Butterfly';
  if (lower.includes('medley') || lower.includes('im')) return 'IM';
  return raw;
}

/**
 * Parse an event name like "100 m Freestyle" into distance and stroke.
 */
function parseEventName(eventName: string): { distance: number; stroke: string } {
  const match = eventName.match(/(\d+)\s*m?\s+(.+)/);
  if (match) {
    return {
      distance: parseInt(match[1]),
      stroke: normalizeStroke(match[2]),
    };
  }
  return { distance: 0, stroke: eventName };
}

/**
 * Parse course length: "50m" → "LCM", "25m" → "SCM"
 */
function parseCourse(courseStr: string): 'LCM' | 'SCM' {
  if (courseStr.includes('50') || courseStr.toLowerCase().includes('lcm')) return 'LCM';
  return 'SCM';
}

/**
 * Parse the pasted text content from a SwimRankings athlete page.
 *
 * SwimRankings pages have a consistent text layout when copied:
 * - Name with birth year in parentheses at the top
 * - Country and club info
 * - Personal bests table with event, course, time, FINA points
 * - Meet history with dates and locations
 */
export function parseSwimRankingsText(
  text: string,
  athleteId: string
): ParsedProfile | null {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length < 5) return null;

  // Parse swimmer identity
  // Pattern: "LastName, FirstName (YYYY)" somewhere near the top
  let firstName = '';
  let lastName = '';
  let birthYear = 0;
  let gender: 'M' | 'F' = 'M';
  let country = '';
  let countryCode = '';
  let club = '';

  for (const line of lines.slice(0, 20)) {
    // Look for "LastName, FirstName (YYYY)" pattern
    const nameMatch = line.match(/^([A-Za-zÀ-ÿ\s'-]+),\s*([A-Za-zÀ-ÿ\s'-]+)\s*\((\d{4})\)/);
    if (nameMatch) {
      lastName = nameMatch[1].trim();
      firstName = nameMatch[2].trim();
      birthYear = parseInt(nameMatch[3]);
      continue;
    }

    // Also try "LastName, FirstName(YYYY)" without space
    const nameMatch2 = line.match(/^([A-Za-zÀ-ÿ\s'-]+),\s*([A-Za-zÀ-ÿ\s'-]+)\((\d{4})\)/);
    if (nameMatch2 && !firstName) {
      lastName = nameMatch2[1].trim();
      firstName = nameMatch2[2].trim();
      birthYear = parseInt(nameMatch2[3]);
      continue;
    }

    // Look for country code pattern like "RSA" or "CAN"
    const countryMatch = line.match(/^([A-Z]{3})\s+-\s+(.+)/);
    if (countryMatch && !countryCode) {
      countryCode = countryMatch[1];
      country = countryMatch[2].trim();
      continue;
    }

    // Gender detection from SwimRankings
    if (line.toLowerCase().includes('male') && !line.toLowerCase().includes('female')) {
      gender = 'M';
    } else if (line.toLowerCase().includes('female')) {
      gender = 'F';
    }
  }

  // If we couldn't find name in standard format, try broader patterns
  if (!firstName) {
    for (const line of lines.slice(0, 10)) {
      // Try "LastName, FirstName" without year
      const simpleMatch = line.match(/^([A-Za-zÀ-ÿ'-]+),\s+([A-Za-zÀ-ÿ\s'-]+)$/);
      if (simpleMatch) {
        lastName = simpleMatch[1].trim();
        firstName = simpleMatch[2].trim();
        break;
      }
    }
  }

  // Find club name — often after country line
  for (const line of lines.slice(0, 20)) {
    // Club names are often standalone lines after the country info
    if (line.match(/^[A-Za-z].*(?:Club|Swimming|Swim|SC|AC|SS|Aquatic|Patriots|Academy)/i)) {
      if (!line.match(/^\d/) && !line.includes('Personal') && !line.includes('Meet')) {
        club = line;
        break;
      }
    }
  }

  // Parse personal bests
  const personalBests: ParsedPersonalBest[] = [];
  let inPBSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect PB section
    if (line.includes('Personal Best') || line.includes('personal best')) {
      inPBSection = true;
      continue;
    }

    // Detect end of PB section
    if (inPBSection && (line.includes('Meet Results') || line.includes('Meet History') || line.includes('Meets'))) {
      inPBSection = false;
      continue;
    }

    if (!inPBSection) continue;

    // Try to parse PB lines
    // Typical format: "100 m Freestyle  50m  56.34  567"
    // Or: "100 m Freestyle\t50m\t56.34\t567"
    const pbMatch = line.match(
      /(\d+\s*m?\s+[A-Za-z\s]+?)\s+(25m|50m|SCM|LCM)\s+(\d+[:.]\d+(?:\.\d+)?)\s*(\d*)/
    );
    if (pbMatch) {
      const eventName = pbMatch[1].trim();
      const { distance, stroke } = parseEventName(eventName);
      const course = parseCourse(pbMatch[2]);
      const timeText = pbMatch[3];
      const timeSeconds = parseTimeToSeconds(timeText);
      const finaPoints = pbMatch[4] ? parseInt(pbMatch[4]) : 0;

      personalBests.push({
        eventName,
        distance,
        stroke,
        course,
        timeSeconds,
        timeText,
        finaPoints,
      });
      continue;
    }

    // Alternative: tab-separated or multi-space separated
    const parts = line.split(/\t+|\s{2,}/);
    if (parts.length >= 3) {
      const possibleEvent = parts[0];
      const possibleCourse = parts[1];
      const possibleTime = parts[2];

      if (
        possibleEvent.match(/\d+\s*m?\s+[A-Za-z]/) &&
        possibleCourse.match(/25m|50m/i) &&
        possibleTime.match(/^\d+[:.]\d+/)
      ) {
        const { distance, stroke } = parseEventName(possibleEvent);
        const course = parseCourse(possibleCourse);
        const timeText = possibleTime;
        const timeSeconds = parseTimeToSeconds(timeText);
        const finaPoints = parts[3] ? parseInt(parts[3]) || 0 : 0;

        personalBests.push({
          eventName: possibleEvent.trim(),
          distance,
          stroke,
          course,
          timeSeconds,
          timeText,
          finaPoints,
        });
      }
    }
  }

  // Parse meet history
  const meets: ParsedMeet[] = [];
  let inMeetSection = false;

  for (const line of lines) {
    if (line.includes('Meet') && (line.includes('Results') || line.includes('History'))) {
      inMeetSection = true;
      continue;
    }

    if (!inMeetSection) continue;

    // Meet lines typically: "01.02.2026  Edmonton  Edmonton Open"
    // Or: "Jan 30, 2026  Edmonton  Edmonton Open"
    const meetMatch = line.match(
      /(\d{1,2}[./]\d{1,2}[./]\d{2,4})\s+([A-Za-zÀ-ÿ\s'-]+?)\s{2,}(.+)/
    );
    if (meetMatch) {
      meets.push({
        date: meetMatch[1].trim(),
        city: meetMatch[2].trim(),
        name: meetMatch[3].trim(),
      });
    }
  }

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
    meets,
  };
}

/**
 * Parse HTML content from a saved SwimRankings page.
 * This handles the case where someone saves the page as HTML.
 */
export function parseSwimRankingsHTML(
  html: string,
  athleteId: string
): ParsedProfile | null {
  // Create a temporary element to parse HTML
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
    const nameMatch = nameText.match(/([A-Za-zÀ-ÿ\s'-]+),\s*([A-Za-zÀ-ÿ\s'-]+)\s*\(?(\d{4})\)?/);
    if (nameMatch) {
      lastName = nameMatch[1].trim();
      firstName = nameMatch[2].replace(/\d/g, '').trim();
      birthYear = parseInt(nameMatch[3]);
    }
  }

  // Extract gender
  const genderImg = doc.querySelector('#name img');
  const gender: 'M' | 'F' = genderImg?.getAttribute('src')?.includes('gender1') ? 'M' : 'F';

  // Extract country and club
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
    // Club is usually the remaining text
    const parts = text.split('\n').map(p => p.trim()).filter(p => p);
    if (parts.length > 1) {
      club = parts[parts.length - 1];
    }
  }

  // Extract personal bests from table
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

        const { distance, stroke } = parseEventName(eventName);
        const course = parseCourse(courseStr);
        const timeSeconds = parseTimeToSeconds(timeText);
        const finaPoints = parseInt(finaStr) || 0;

        personalBests.push({
          eventName,
          distance,
          stroke,
          course,
          timeSeconds,
          timeText,
          finaPoints,
        });
      }
    });
  }

  // Extract meets
  const meets: ParsedMeet[] = [];
  const meetTable = doc.querySelector('table.athleteMeet');

  if (meetTable) {
    const rows = meetTable.querySelectorAll('tr.athleteMeet0, tr.athleteMeet1');
    rows.forEach(row => {
      const dateCell = row.querySelector('td.date');
      const cityCell = row.querySelector('td.city');

      if (dateCell && cityCell) {
        const date = dateCell.textContent?.trim() || '';
        const link = cityCell.querySelector('a');
        const city = link?.textContent?.trim() || '';
        const name = link?.getAttribute('title') || city;

        meets.push({ date, city, name });
      }
    });
  }

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
    meets,
  };
}
