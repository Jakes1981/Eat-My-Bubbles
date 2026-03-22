import type {
  Swimmer,
  SwimEvent,
  SwimmerResult,
  EliteSwimmer,
  TrajectoryPoint,
  WorldTop3Entry,
} from '../lib/types';

// ────────────────────────────────────────────────────────────
// 1. SWIMMERS
// ────────────────────────────────────────────────────────────

export const SWIMMERS: Swimmer[] = [
  {
    id: 'noa',
    name: 'Noa Burger',
    birthYear: 2011,
    club: 'Calgary Patriots',
    province: 'AB',
    country: 'CA',
    gender: 'M',
  },
  {
    id: 'liam-k',
    name: 'Liam Klassen',
    birthYear: 2011,
    club: 'Calgary Patriots',
    province: 'AB',
    country: 'CA',
    gender: 'M',
  },
  {
    id: 'owen-r',
    name: 'Owen Rempel',
    birthYear: 2010,
    club: 'Calgary Patriots',
    province: 'AB',
    country: 'CA',
    gender: 'M',
  },
  {
    id: 'maya-t',
    name: 'Maya Thiessen',
    birthYear: 2012,
    club: 'Calgary Patriots',
    province: 'AB',
    country: 'CA',
    gender: 'F',
  },
  {
    id: 'sarah-w',
    name: 'Sarah Wiebe',
    birthYear: 2011,
    club: 'Calgary Patriots',
    province: 'AB',
    country: 'CA',
    gender: 'F',
  },
];

// ────────────────────────────────────────────────────────────
// 2. NOA'S RESULTS (all LCM, Jan 2026, Edmonton Open)
// ────────────────────────────────────────────────────────────

export const NOA_RESULTS: SwimmerResult[] = [
  {
    eventSlug: '50-free',
    timeSeconds: 26.32,
    timeText: '26.32',
    date: '2026-01-18',
    meet: 'Edmonton Open',
  },
  {
    eventSlug: '100-free',
    timeSeconds: 56.34,
    timeText: '56.34',
    date: '2026-01-18',
    meet: 'Edmonton Open',
  },
  {
    eventSlug: '200-free',
    timeSeconds: 127.54,
    timeText: '2:07.54',
    date: '2026-01-19',
    meet: 'Edmonton Open',
  },
  {
    eventSlug: '400-free',
    timeSeconds: 272.06,
    timeText: '4:32.06',
    date: '2026-01-19',
    meet: 'Edmonton Open',
  },
  {
    eventSlug: '50-fly',
    timeSeconds: 27.36,
    timeText: '27.36',
    date: '2026-01-18',
    meet: 'Edmonton Open',
  },
  {
    eventSlug: '200-im',
    timeSeconds: 145.46,
    timeText: '2:25.46',
    date: '2026-01-19',
    meet: 'Edmonton Open',
  },
];

// ────────────────────────────────────────────────────────────
// 3. SWIMMER RESULTS (club mates)
// ────────────────────────────────────────────────────────────

export const SWIMMER_RESULTS: Record<string, SwimmerResult[]> = {
  noa: NOA_RESULTS,

  'liam-k': [
    {
      eventSlug: '50-free',
      timeSeconds: 27.45,
      timeText: '27.45',
      date: '2026-01-18',
      meet: 'Edmonton Open',
    },
    {
      eventSlug: '100-free',
      timeSeconds: 59.18,
      timeText: '59.18',
      date: '2026-01-18',
      meet: 'Edmonton Open',
    },
    {
      eventSlug: '200-free',
      timeSeconds: 132.87,
      timeText: '2:12.87',
      date: '2026-01-19',
      meet: 'Edmonton Open',
    },
    {
      eventSlug: '100-back',
      timeSeconds: 68.42,
      timeText: '1:08.42',
      date: '2026-01-19',
      meet: 'Edmonton Open',
    },
  ],

  'owen-r': [
    {
      eventSlug: '100-free',
      timeSeconds: 57.91,
      timeText: '57.91',
      date: '2026-01-18',
      meet: 'Edmonton Open',
    },
    {
      eventSlug: '200-free',
      timeSeconds: 129.64,
      timeText: '2:09.64',
      date: '2026-01-19',
      meet: 'Edmonton Open',
    },
    {
      eventSlug: '400-free',
      timeSeconds: 278.33,
      timeText: '4:38.33',
      date: '2026-01-19',
      meet: 'Edmonton Open',
    },
  ],

  'maya-t': [
    {
      eventSlug: '50-free',
      timeSeconds: 29.87,
      timeText: '29.87',
      date: '2026-01-18',
      meet: 'Edmonton Open',
    },
    {
      eventSlug: '100-free',
      timeSeconds: 64.23,
      timeText: '1:04.23',
      date: '2026-01-18',
      meet: 'Edmonton Open',
    },
    {
      eventSlug: '200-im',
      timeSeconds: 156.81,
      timeText: '2:36.81',
      date: '2026-01-19',
      meet: 'Edmonton Open',
    },
    {
      eventSlug: '100-breast',
      timeSeconds: 78.54,
      timeText: '1:18.54',
      date: '2026-01-19',
      meet: 'Edmonton Open',
    },
  ],

  'sarah-w': [
    {
      eventSlug: '50-free',
      timeSeconds: 28.94,
      timeText: '28.94',
      date: '2026-01-18',
      meet: 'Edmonton Open',
    },
    {
      eventSlug: '100-free',
      timeSeconds: 62.17,
      timeText: '1:02.17',
      date: '2026-01-18',
      meet: 'Edmonton Open',
    },
    {
      eventSlug: '50-fly',
      timeSeconds: 30.62,
      timeText: '30.62',
      date: '2026-01-18',
      meet: 'Edmonton Open',
    },
    {
      eventSlug: '100-fly',
      timeSeconds: 69.45,
      timeText: '1:09.45',
      date: '2026-01-19',
      meet: 'Edmonton Open',
    },
  ],
};

// ────────────────────────────────────────────────────────────
// 4. EVENTS — all 14 individual LCM events
// ────────────────────────────────────────────────────────────

export const EVENTS: SwimEvent[] = [
  { slug: '50-free', name: '50 Freestyle', distance: 50, stroke: 'Freestyle', shortName: '50 Free' },
  { slug: '100-free', name: '100 Freestyle', distance: 100, stroke: 'Freestyle', shortName: '100 Free' },
  { slug: '200-free', name: '200 Freestyle', distance: 200, stroke: 'Freestyle', shortName: '200 Free' },
  { slug: '400-free', name: '400 Freestyle', distance: 400, stroke: 'Freestyle', shortName: '400 Free' },
  { slug: '800-free', name: '800 Freestyle', distance: 800, stroke: 'Freestyle', shortName: '800 Free' },
  { slug: '1500-free', name: '1500 Freestyle', distance: 1500, stroke: 'Freestyle', shortName: '1500 Free' },
  { slug: '100-back', name: '100 Backstroke', distance: 100, stroke: 'Backstroke', shortName: '100 Back' },
  { slug: '200-back', name: '200 Backstroke', distance: 200, stroke: 'Backstroke', shortName: '200 Back' },
  { slug: '100-breast', name: '100 Breaststroke', distance: 100, stroke: 'Breaststroke', shortName: '100 Breast' },
  { slug: '200-breast', name: '200 Breaststroke', distance: 200, stroke: 'Breaststroke', shortName: '200 Breast' },
  { slug: '100-fly', name: '100 Butterfly', distance: 100, stroke: 'Butterfly', shortName: '100 Fly' },
  { slug: '200-fly', name: '200 Butterfly', distance: 200, stroke: 'Butterfly', shortName: '200 Fly' },
  { slug: '200-im', name: '200 Individual Medley', distance: 200, stroke: 'IM', shortName: '200 IM' },
  { slug: '400-im', name: '400 Individual Medley', distance: 400, stroke: 'IM', shortName: '400 IM' },
];

// ────────────────────────────────────────────────────────────
// 5. WORLD TOP 3 — with career trajectory data
// ────────────────────────────────────────────────────────────

/** Helper: generate a realistic trajectory from age 14 to peak. */
function buildTrajectory(
  birthYear: number,
  currentPB: number,
  peakAge?: number
): TrajectoryPoint[] {
  const peak = peakAge ?? Math.max(20, 2026 - birthYear);
  const startAge = 14;
  const points: TrajectoryPoint[] = [];

  for (let age = startAge; age <= peak; age++) {
    const yearsFromPeak = peak - age;
    // Exponential decay: large gap at 14, shrinking to 0 at peak
    let pctSlower: number;
    if (yearsFromPeak <= 0) {
      pctSlower = 0;
    } else {
      const totalSpan = peak - startAge;
      const frac = yearsFromPeak / totalSpan; // 1 at start, 0 at peak
      // Curve: steeper early, flatter late
      pctSlower = 0.14 * Math.pow(frac, 1.4);
    }

    const timeSeconds = Math.round((currentPB * (1 + pctSlower)) * 100) / 100;
    const year = birthYear + age;
    points.push({
      age,
      timeSeconds,
      date: `${year}-07-01`,
    });
  }

  return points;
}

// ── MEN'S TOP 3 ──

export const WORLD_TOP3: WorldTop3Entry[] = [
  // ---------- 50 FREE ----------
  {
    eventSlug: '50-free',
    gender: 'M',
    swimmers: [
      {
        swimmer: { name: 'Pan Zhanle', country: 'CHN', birthYear: 2004, currentPB: 21.16 },
        trajectory: buildTrajectory(2004, 21.16, 22),
      },
      {
        swimmer: { name: 'Cameron McEvoy', country: 'AUS', birthYear: 1994, currentPB: 21.32 },
        trajectory: buildTrajectory(1994, 21.32, 29),
      },
      {
        swimmer: { name: 'Ben Proud', country: 'GBR', birthYear: 1994, currentPB: 21.30 },
        trajectory: buildTrajectory(1994, 21.30, 28),
      },
    ],
  },

  // ---------- 100 FREE ----------
  {
    eventSlug: '100-free',
    gender: 'M',
    swimmers: [
      {
        swimmer: { name: 'Pan Zhanle', country: 'CHN', birthYear: 2004, currentPB: 46.40 },
        trajectory: buildTrajectory(2004, 46.40, 20),
      },
      {
        swimmer: { name: 'Kyle Chalmers', country: 'AUS', birthYear: 1998, currentPB: 47.04 },
        trajectory: buildTrajectory(1998, 47.04, 23),
      },
      {
        swimmer: { name: 'David Popovici', country: 'ROU', birthYear: 2004, currentPB: 46.88 },
        trajectory: buildTrajectory(2004, 46.88, 20),
      },
    ],
  },

  // ---------- 200 FREE ----------
  {
    eventSlug: '200-free',
    gender: 'M',
    swimmers: [
      {
        swimmer: { name: 'David Popovici', country: 'ROU', birthYear: 2004, currentPB: 102.97 },
        trajectory: buildTrajectory(2004, 102.97, 20),
      },
      {
        swimmer: { name: 'Luke Hobson', country: 'USA', birthYear: 2002, currentPB: 104.05 },
        trajectory: buildTrajectory(2002, 104.05, 22),
      },
      {
        swimmer: { name: 'Tom Dean', country: 'GBR', birthYear: 1999, currentPB: 104.22 },
        trajectory: buildTrajectory(1999, 104.22, 22),
      },
    ],
  },

  // ---------- 400 FREE ----------
  {
    eventSlug: '400-free',
    gender: 'M',
    swimmers: [
      {
        swimmer: { name: 'Sam Short', country: 'AUS', birthYear: 2003, currentPB: 220.68 },
        trajectory: buildTrajectory(2003, 220.68, 22),
      },
      {
        swimmer: { name: 'Lukas Märtens', country: 'GER', birthYear: 2001, currentPB: 221.78 },
        trajectory: buildTrajectory(2001, 221.78, 23),
      },
      {
        swimmer: { name: 'Elijah Winnington', country: 'AUS', birthYear: 2000, currentPB: 222.36 },
        trajectory: buildTrajectory(2000, 222.36, 23),
      },
    ],
  },

  // ---------- 800 FREE ----------
  {
    eventSlug: '800-free',
    gender: 'M',
    swimmers: [
      {
        swimmer: { name: 'Daniel Wiffen', country: 'IRL', birthYear: 2001, currentPB: 458.19 },
        trajectory: buildTrajectory(2001, 458.19, 23),
      },
      {
        swimmer: { name: 'Florian Wellbrock', country: 'GER', birthYear: 1997, currentPB: 461.87 },
        trajectory: buildTrajectory(1997, 461.87, 24),
      },
      {
        swimmer: { name: 'Gregorio Paltrinieri', country: 'ITA', birthYear: 1994, currentPB: 459.27 },
        trajectory: buildTrajectory(1994, 459.27, 25),
      },
    ],
  },

  // ---------- 1500 FREE ----------
  {
    eventSlug: '1500-free',
    gender: 'M',
    swimmers: [
      {
        swimmer: { name: 'Daniel Wiffen', country: 'IRL', birthYear: 2001, currentPB: 872.78 },
        trajectory: buildTrajectory(2001, 872.78, 23),
      },
      {
        swimmer: { name: 'Florian Wellbrock', country: 'GER', birthYear: 1997, currentPB: 876.94 },
        trajectory: buildTrajectory(1997, 876.94, 24),
      },
      {
        swimmer: { name: 'Bobby Finke', country: 'USA', birthYear: 2000, currentPB: 879.65 },
        trajectory: buildTrajectory(2000, 879.65, 24),
      },
    ],
  },

  // ---------- 100 BACK ----------
  {
    eventSlug: '100-back',
    gender: 'M',
    swimmers: [
      {
        swimmer: { name: 'Thomas Ceccon', country: 'ITA', birthYear: 2001, currentPB: 51.60 },
        trajectory: buildTrajectory(2001, 51.60, 22),
      },
      {
        swimmer: { name: 'Ryan Murphy', country: 'USA', birthYear: 1995, currentPB: 51.85 },
        trajectory: buildTrajectory(1995, 51.85, 21),
      },
      {
        swimmer: { name: 'Pieter Coetze', country: 'RSA', birthYear: 2004, currentPB: 51.89 },
        trajectory: buildTrajectory(2004, 51.89, 21),
      },
    ],
  },

  // ---------- 200 BACK ----------
  {
    eventSlug: '200-back',
    gender: 'M',
    swimmers: [
      {
        swimmer: { name: 'Hubert Kos', country: 'HUN', birthYear: 2003, currentPB: 112.43 },
        trajectory: buildTrajectory(2003, 112.43, 22),
      },
      {
        swimmer: { name: 'Ryan Murphy', country: 'USA', birthYear: 1995, currentPB: 113.27 },
        trajectory: buildTrajectory(1995, 113.27, 21),
      },
      {
        swimmer: { name: 'Luke Greenbank', country: 'GBR', birthYear: 1997, currentPB: 114.04 },
        trajectory: buildTrajectory(1997, 114.04, 24),
      },
    ],
  },

  // ---------- 100 BREAST ----------
  {
    eventSlug: '100-breast',
    gender: 'M',
    swimmers: [
      {
        swimmer: { name: 'Adam Peaty', country: 'GBR', birthYear: 1994, currentPB: 56.88 },
        trajectory: buildTrajectory(1994, 56.88, 25),
      },
      {
        swimmer: { name: 'Qin Haiyang', country: 'CHN', birthYear: 2002, currentPB: 57.69 },
        trajectory: buildTrajectory(2002, 57.69, 21),
      },
      {
        swimmer: { name: 'Nic Fink', country: 'USA', birthYear: 1993, currentPB: 58.23 },
        trajectory: buildTrajectory(1993, 58.23, 30),
      },
    ],
  },

  // ---------- 200 BREAST ----------
  {
    eventSlug: '200-breast',
    gender: 'M',
    swimmers: [
      {
        swimmer: { name: 'Zac Stubblety-Cook', country: 'AUS', birthYear: 2000, currentPB: 125.95 },
        trajectory: buildTrajectory(2000, 125.95, 21),
      },
      {
        swimmer: { name: 'Matt Fallon', country: 'USA', birthYear: 2002, currentPB: 126.44 },
        trajectory: buildTrajectory(2002, 126.44, 22),
      },
      {
        swimmer: { name: 'Qin Haiyang', country: 'CHN', birthYear: 2002, currentPB: 127.09 },
        trajectory: buildTrajectory(2002, 127.09, 21),
      },
    ],
  },

  // ---------- 100 FLY ----------
  {
    eventSlug: '100-fly',
    gender: 'M',
    swimmers: [
      {
        swimmer: { name: 'Caeleb Dressel', country: 'USA', birthYear: 1996, currentPB: 49.45 },
        trajectory: buildTrajectory(1996, 49.45, 25),
      },
      {
        swimmer: { name: 'Noè Ponti', country: 'SUI', birthYear: 2001, currentPB: 49.52 },
        trajectory: buildTrajectory(2001, 49.52, 23),
      },
      {
        swimmer: { name: 'Kristóf Milák', country: 'HUN', birthYear: 1999, currentPB: 49.68 },
        trajectory: buildTrajectory(1999, 49.68, 22),
      },
    ],
  },

  // ---------- 200 FLY ----------
  {
    eventSlug: '200-fly',
    gender: 'M',
    swimmers: [
      {
        swimmer: { name: 'Kristóf Milák', country: 'HUN', birthYear: 1999, currentPB: 110.34 },
        trajectory: buildTrajectory(1999, 110.34, 22),
      },
      {
        swimmer: { name: 'Léon Marchand', country: 'FRA', birthYear: 2002, currentPB: 112.43 },
        trajectory: buildTrajectory(2002, 112.43, 22),
      },
      {
        swimmer: { name: 'Tomoru Honda', country: 'JPN', birthYear: 2001, currentPB: 113.05 },
        trajectory: buildTrajectory(2001, 113.05, 22),
      },
    ],
  },

  // ---------- 200 IM ----------
  {
    eventSlug: '200-im',
    gender: 'M',
    swimmers: [
      {
        swimmer: { name: 'Léon Marchand', country: 'FRA', birthYear: 2002, currentPB: 114.06 },
        trajectory: buildTrajectory(2002, 114.06, 22),
      },
      {
        swimmer: { name: 'Carson Foster', country: 'USA', birthYear: 2002, currentPB: 115.71 },
        trajectory: buildTrajectory(2002, 115.71, 22),
      },
      {
        swimmer: { name: 'Duncan Scott', country: 'GBR', birthYear: 1997, currentPB: 115.90 },
        trajectory: buildTrajectory(1997, 115.90, 24),
      },
    ],
  },

  // ---------- 400 IM ----------
  {
    eventSlug: '400-im',
    gender: 'M',
    swimmers: [
      {
        swimmer: { name: 'Léon Marchand', country: 'FRA', birthYear: 2002, currentPB: 242.50 },
        trajectory: buildTrajectory(2002, 242.50, 22),
      },
      {
        swimmer: { name: 'Carson Foster', country: 'USA', birthYear: 2002, currentPB: 246.61 },
        trajectory: buildTrajectory(2002, 246.61, 22),
      },
      {
        swimmer: { name: 'Sam Short', country: 'AUS', birthYear: 2003, currentPB: 249.19 },
        trajectory: buildTrajectory(2003, 249.19, 22),
      },
    ],
  },

  // ── WOMEN'S EVENTS ──

  // ---------- 50 FREE ----------
  {
    eventSlug: '50-free',
    gender: 'F',
    swimmers: [
      {
        swimmer: { name: 'Sarah Sjöström', country: 'SWE', birthYear: 1993, currentPB: 23.61 },
        trajectory: buildTrajectory(1993, 23.61, 24),
      },
      {
        swimmer: { name: 'Emma McKeon', country: 'AUS', birthYear: 1994, currentPB: 23.81 },
        trajectory: buildTrajectory(1994, 23.81, 27),
      },
      {
        swimmer: { name: 'Meg Harris', country: 'AUS', birthYear: 2002, currentPB: 24.02 },
        trajectory: buildTrajectory(2002, 24.02, 22),
      },
    ],
  },

  // ---------- 100 FREE ----------
  {
    eventSlug: '100-free',
    gender: 'F',
    swimmers: [
      {
        swimmer: { name: 'Sarah Sjöström', country: 'SWE', birthYear: 1993, currentPB: 51.71 },
        trajectory: buildTrajectory(1993, 51.71, 24),
      },
      {
        swimmer: { name: 'Mollie O\'Callaghan', country: 'AUS', birthYear: 2004, currentPB: 52.16 },
        trajectory: buildTrajectory(2004, 52.16, 20),
      },
      {
        swimmer: { name: 'Torri Huske', country: 'USA', birthYear: 2002, currentPB: 52.29 },
        trajectory: buildTrajectory(2002, 52.29, 22),
      },
    ],
  },

  // ---------- 200 FREE ----------
  {
    eventSlug: '200-free',
    gender: 'F',
    swimmers: [
      {
        swimmer: { name: 'Summer McIntosh', country: 'CAN', birthYear: 2005, currentPB: 113.01 },
        trajectory: buildTrajectory(2005, 113.01, 19),
      },
      {
        swimmer: { name: 'Mollie O\'Callaghan', country: 'AUS', birthYear: 2004, currentPB: 113.28 },
        trajectory: buildTrajectory(2004, 113.28, 20),
      },
      {
        swimmer: { name: 'Ariarne Titmus', country: 'AUS', birthYear: 2001, currentPB: 113.56 },
        trajectory: buildTrajectory(2001, 113.56, 22),
      },
    ],
  },

  // ---------- 400 FREE ----------
  {
    eventSlug: '400-free',
    gender: 'F',
    swimmers: [
      {
        swimmer: { name: 'Ariarne Titmus', country: 'AUS', birthYear: 2001, currentPB: 233.08 },
        trajectory: buildTrajectory(2001, 233.08, 22),
      },
      {
        swimmer: { name: 'Summer McIntosh', country: 'CAN', birthYear: 2005, currentPB: 234.47 },
        trajectory: buildTrajectory(2005, 234.47, 19),
      },
      {
        swimmer: { name: 'Katie Ledecky', country: 'USA', birthYear: 1997, currentPB: 235.11 },
        trajectory: buildTrajectory(1997, 235.11, 21),
      },
    ],
  },

  // ---------- 800 FREE ----------
  {
    eventSlug: '800-free',
    gender: 'F',
    swimmers: [
      {
        swimmer: { name: 'Katie Ledecky', country: 'USA', birthYear: 1997, currentPB: 490.07 },
        trajectory: buildTrajectory(1997, 490.07, 21),
      },
      {
        swimmer: { name: 'Ariarne Titmus', country: 'AUS', birthYear: 2001, currentPB: 494.77 },
        trajectory: buildTrajectory(2001, 494.77, 22),
      },
      {
        swimmer: { name: 'Simona Quadarella', country: 'ITA', birthYear: 1999, currentPB: 496.53 },
        trajectory: buildTrajectory(1999, 496.53, 23),
      },
    ],
  },

  // ---------- 1500 FREE ----------
  {
    eventSlug: '1500-free',
    gender: 'F',
    swimmers: [
      {
        swimmer: { name: 'Katie Ledecky', country: 'USA', birthYear: 1997, currentPB: 926.36 },
        trajectory: buildTrajectory(1997, 926.36, 21),
      },
      {
        swimmer: { name: 'Simona Quadarella', country: 'ITA', birthYear: 1999, currentPB: 943.85 },
        trajectory: buildTrajectory(1999, 943.85, 23),
      },
      {
        swimmer: { name: 'Lani Pallister', country: 'AUS', birthYear: 2002, currentPB: 946.12 },
        trajectory: buildTrajectory(2002, 946.12, 22),
      },
    ],
  },

  // ---------- 100 BACK ----------
  {
    eventSlug: '100-back',
    gender: 'F',
    swimmers: [
      {
        swimmer: { name: 'Regan Smith', country: 'USA', birthYear: 2002, currentPB: 57.13 },
        trajectory: buildTrajectory(2002, 57.13, 17),
      },
      {
        swimmer: { name: 'Kaylee McKeown', country: 'AUS', birthYear: 2001, currentPB: 57.33 },
        trajectory: buildTrajectory(2001, 57.33, 22),
      },
      {
        swimmer: { name: 'Kylie Masse', country: 'CAN', birthYear: 1996, currentPB: 57.70 },
        trajectory: buildTrajectory(1996, 57.70, 22),
      },
    ],
  },

  // ---------- 200 BACK ----------
  {
    eventSlug: '200-back',
    gender: 'F',
    swimmers: [
      {
        swimmer: { name: 'Kaylee McKeown', country: 'AUS', birthYear: 2001, currentPB: 123.03 },
        trajectory: buildTrajectory(2001, 123.03, 22),
      },
      {
        swimmer: { name: 'Regan Smith', country: 'USA', birthYear: 2002, currentPB: 123.46 },
        trajectory: buildTrajectory(2002, 123.46, 17),
      },
      {
        swimmer: { name: 'Claire Curzan', country: 'USA', birthYear: 2004, currentPB: 125.08 },
        trajectory: buildTrajectory(2004, 125.08, 20),
      },
    ],
  },

  // ---------- 100 BREAST ----------
  {
    eventSlug: '100-breast',
    gender: 'F',
    swimmers: [
      {
        swimmer: { name: 'Lilly King', country: 'USA', birthYear: 1997, currentPB: 64.13 },
        trajectory: buildTrajectory(1997, 64.13, 20),
      },
      {
        swimmer: { name: 'Tatjana Smith', country: 'RSA', birthYear: 1997, currentPB: 64.27 },
        trajectory: buildTrajectory(1997, 64.27, 24),
      },
      {
        swimmer: { name: 'Tang Qianting', country: 'CHN', birthYear: 2003, currentPB: 64.79 },
        trajectory: buildTrajectory(2003, 64.79, 21),
      },
    ],
  },

  // ---------- 200 BREAST ----------
  {
    eventSlug: '200-breast',
    gender: 'F',
    swimmers: [
      {
        swimmer: { name: 'Tatjana Smith', country: 'RSA', birthYear: 1997, currentPB: 138.95 },
        trajectory: buildTrajectory(1997, 138.95, 24),
      },
      {
        swimmer: { name: 'Kate Douglass', country: 'USA', birthYear: 2001, currentPB: 140.12 },
        trajectory: buildTrajectory(2001, 140.12, 22),
      },
      {
        swimmer: { name: 'Evgeniia Chikunova', country: 'AIN', birthYear: 2004, currentPB: 140.67 },
        trajectory: buildTrajectory(2004, 140.67, 20),
      },
    ],
  },

  // ---------- 100 FLY ----------
  {
    eventSlug: '100-fly',
    gender: 'F',
    swimmers: [
      {
        swimmer: { name: 'Torri Huske', country: 'USA', birthYear: 2002, currentPB: 55.37 },
        trajectory: buildTrajectory(2002, 55.37, 22),
      },
      {
        swimmer: { name: 'Gretchen Walsh', country: 'USA', birthYear: 2003, currentPB: 55.63 },
        trajectory: buildTrajectory(2003, 55.63, 21),
      },
      {
        swimmer: { name: 'Sarah Sjöström', country: 'SWE', birthYear: 1993, currentPB: 55.48 },
        trajectory: buildTrajectory(1993, 55.48, 22),
      },
    ],
  },

  // ---------- 200 FLY ----------
  {
    eventSlug: '200-fly',
    gender: 'F',
    swimmers: [
      {
        swimmer: { name: 'Summer McIntosh', country: 'CAN', birthYear: 2005, currentPB: 121.81 },
        trajectory: buildTrajectory(2005, 121.81, 19),
      },
      {
        swimmer: { name: 'Regan Smith', country: 'USA', birthYear: 2002, currentPB: 124.08 },
        trajectory: buildTrajectory(2002, 124.08, 22),
      },
      {
        swimmer: { name: 'Zhang Yufei', country: 'CHN', birthYear: 1998, currentPB: 123.86 },
        trajectory: buildTrajectory(1998, 123.86, 23),
      },
    ],
  },

  // ---------- 200 IM ----------
  {
    eventSlug: '200-im',
    gender: 'F',
    swimmers: [
      {
        swimmer: { name: 'Summer McIntosh', country: 'CAN', birthYear: 2005, currentPB: 124.88 },
        trajectory: buildTrajectory(2005, 124.88, 19),
      },
      {
        swimmer: { name: 'Kate Douglass', country: 'USA', birthYear: 2001, currentPB: 126.37 },
        trajectory: buildTrajectory(2001, 126.37, 22),
      },
      {
        swimmer: { name: 'Alex Walsh', country: 'USA', birthYear: 2001, currentPB: 126.84 },
        trajectory: buildTrajectory(2001, 126.84, 21),
      },
    ],
  },

  // ---------- 400 IM ----------
  {
    eventSlug: '400-im',
    gender: 'F',
    swimmers: [
      {
        swimmer: { name: 'Summer McIntosh', country: 'CAN', birthYear: 2005, currentPB: 261.70 },
        trajectory: buildTrajectory(2005, 261.70, 19),
      },
      {
        swimmer: { name: 'Katie Grimes', country: 'USA', birthYear: 2006, currentPB: 268.55 },
        trajectory: buildTrajectory(2006, 268.55, 18),
      },
      {
        swimmer: { name: 'Emma Weyant', country: 'USA', birthYear: 2001, currentPB: 269.17 },
        trajectory: buildTrajectory(2001, 269.17, 20),
      },
    ],
  },
];
