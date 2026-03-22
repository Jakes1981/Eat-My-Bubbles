# Eat My Bubbles PWA Prototype — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-friendly PWA where Noa and 3-5 club mates can view their swimming trajectory charts overlaid on the current world top 3 in every event, chat with an AI swim coach, and where Jaco can track usage.

**Architecture:** Next.js app in a `web/` subdirectory of the existing repo. Reads data from Supabase (already set up). Seed scripts populate swimmer and trajectory data. Deployed to Vercel.

**Tech Stack:** Next.js 14 (App Router), Tailwind CSS, Recharts, Supabase JS client, Claude API (Anthropic SDK), Vercel

---

## File Structure

```
web/
├── package.json
├── next.config.js
├── tailwind.config.js
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── icons/                 # App icons
│   └── sw.js                  # Service worker
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout, nav, PWA meta tags
│   │   ├── page.tsx           # Login screen
│   │   ├── events/
│   │   │   └── page.tsx       # My Events grid
│   │   ├── events/[slug]/
│   │   │   └── page.tsx       # Event detail — trajectory chart
│   │   ├── profile/
│   │   │   └── page.tsx       # Swimmer profile
│   │   ├── chat/
│   │   │   └── page.tsx       # AI coach chat
│   │   ├── admin/
│   │   │   └── page.tsx       # Admin analytics dashboard
│   │   └── api/
│   │       └── chat/
│   │           └── route.ts   # Claude API proxy endpoint
│   ├── components/
│   │   ├── TrajectoryChart.tsx # Recharts trajectory visualization
│   │   ├── EventCard.tsx      # Event card for grid
│   │   ├── NavBar.tsx         # Bottom navigation bar
│   │   ├── ChatMessage.tsx    # Chat bubble component
│   │   └── PBTable.tsx        # Personal bests table
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client (browser)
│   │   ├── supabase-server.ts # Supabase client (server)
│   │   ├── analytics.ts       # Usage tracking functions
│   │   ├── types.ts           # TypeScript types
│   │   └── swim-utils.ts      # Time formatting, event helpers
│   └── data/
│       └── seed-data.ts       # Hardcoded world top 3 trajectory data
scripts/
├── seed_world_top3.py         # Script to curate world top 3 data
├── seed_swimmers.py           # Script to seed Noa + club mates
└── setup_analytics.sql        # Analytics table DDL
```

---

### Task 1: Scaffold Next.js App

**Files:**
- Create: `web/package.json`, `web/next.config.js`, `web/tailwind.config.js`, `web/tsconfig.json`
- Create: `web/src/app/layout.tsx`, `web/src/app/page.tsx`
- Create: `web/public/manifest.json`

- [ ] **Step 1: Create Next.js app with Tailwind**

```bash
cd "/Users/jacoburger/Documents/Noa Swimming"
npx create-next-app@latest web --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*"
```

- [ ] **Step 2: Install dependencies**

```bash
cd web
npm install @supabase/supabase-js recharts @anthropic-ai/sdk
```

- [ ] **Step 3: Add PWA manifest**

Create `web/public/manifest.json` with app name "Eat My Bubbles", theme color, display: standalone, icons.

- [ ] **Step 4: Add PWA meta tags to layout.tsx**

Update `web/src/app/layout.tsx`: add viewport meta, theme-color, manifest link, apple-mobile-web-app-capable.

- [ ] **Step 5: Verify dev server starts**

```bash
cd web && npm run dev
```
Expected: App running at localhost:3000

- [ ] **Step 6: Commit**

```bash
git add web/
git commit -m "feat: scaffold Next.js PWA with Tailwind"
```

---

### Task 2: Seed Data — World Top 3 Trajectories

**Files:**
- Create: `web/src/data/seed-data.ts`
- Create: `scripts/setup_analytics.sql`

- [ ] **Step 1: Create seed data file with world top 3 trajectories**

Create `web/src/data/seed-data.ts` containing:
- Current world top 3 for each individual LCM event (men and women)
- For each elite swimmer: name, country, birth_year, best_time_per_age from age 12 to present
- Events: 50/100/200/400/800/1500 Free, 100/200 Back, 100/200 Breast, 100/200 Fly, 200/400 IM
- Source data from World Aquatics and public records
- Include Noa's data (from SwimCloud profile we already fetched)
- Include placeholder data for 3-5 club mates (Jaco can fill in real data later)

Note: For the prototype, use the best available public data. Some elite swimmer age-progression data may be approximate for ages 12-15 when they weren't yet on the international circuit. Mark approximate data clearly.

- [ ] **Step 2: Create analytics events table**

Create `scripts/setup_analytics.sql`:
```sql
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    screen TEXT NOT NULL,
    event_slug TEXT,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_screen ON analytics_events(screen);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);
```

- [ ] **Step 3: Commit**

```bash
git add web/src/data/ scripts/setup_analytics.sql
git commit -m "feat: add world top 3 seed data and analytics schema"
```

---

### Task 3: Supabase Client & Utilities

**Files:**
- Create: `web/src/lib/supabase.ts`
- Create: `web/src/lib/types.ts`
- Create: `web/src/lib/swim-utils.ts`
- Create: `web/src/lib/analytics.ts`

- [ ] **Step 1: Create Supabase browser client**

`web/src/lib/supabase.ts` — createBrowserClient using env vars NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.

- [ ] **Step 2: Create TypeScript types**

`web/src/lib/types.ts` — Swimmer, Event, TrajectoryPoint, EliteSwimmer, ChatMessage types.

- [ ] **Step 3: Create swim utilities**

`web/src/lib/swim-utils.ts` — formatTime(), parseTime(), eventSlug(), eventLabel(), list of all LCM events.

- [ ] **Step 4: Create analytics tracker**

`web/src/lib/analytics.ts` — trackEvent(userId, screen, action, metadata?) function that inserts into analytics_events table.

- [ ] **Step 5: Create .env.local with Supabase credentials**

```
NEXT_PUBLIC_SUPABASE_URL=https://kbtcailhcvsspcetmhap.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
ANTHROPIC_API_KEY=<to-be-added>
```

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/
git commit -m "feat: add Supabase client, types, swim utils, analytics"
```

---

### Task 4: Login Screen

**Files:**
- Modify: `web/src/app/page.tsx`
- Create: `web/src/app/events/page.tsx` (placeholder)

- [ ] **Step 1: Build login page**

Simple screen: swimmer selects their name from a dropdown list (populated from seed data). No password. Stores selected swimmer in localStorage. Mobile-first design with Tailwind.

App branding: "Eat My Bubbles" title, wave/swimming themed gradient background.

- [ ] **Step 2: Add navigation to events page on login**

After selecting name, redirect to `/events`.

- [ ] **Step 3: Test on mobile viewport**

Open Chrome DevTools, toggle mobile view, verify it looks good on iPhone size.

- [ ] **Step 4: Commit**

```bash
git add web/src/app/
git commit -m "feat: add swimmer login screen"
```

---

### Task 5: My Events Grid

**Files:**
- Create: `web/src/app/events/page.tsx`
- Create: `web/src/components/EventCard.tsx`
- Create: `web/src/components/NavBar.tsx`

- [ ] **Step 1: Build EventCard component**

Card showing: event name (e.g., "100 Free"), swimmer's PB time, small visual indicator of how close to world #1. Events swimmer hasn't competed in show "—" greyed out.

- [ ] **Step 2: Build bottom NavBar**

4 tabs: Events, Profile, Chat, (Admin if Jaco). Fixed bottom nav, mobile-native feel.

- [ ] **Step 3: Build events grid page**

Grid of EventCards for all 14 individual LCM events. Tapping a card navigates to `/events/[slug]`. Track page view with analytics.

- [ ] **Step 4: Test mobile layout**

Verify grid looks good on phone viewport — 2 columns, proper spacing, scrollable.

- [ ] **Step 5: Commit**

```bash
git add web/src/
git commit -m "feat: add events grid and navigation"
```

---

### Task 6: Trajectory Chart — Core Feature

**Files:**
- Create: `web/src/app/events/[slug]/page.tsx`
- Create: `web/src/components/TrajectoryChart.tsx`

- [ ] **Step 1: Build TrajectoryChart component**

Using Recharts LineChart:
- X-axis: age (12 → latest age of world #1)
- Y-axis: time in seconds (inverted — lower/faster at top)
- Lines: swimmer (bold blue), world #1 (gold), #2 (silver), #3 (bronze)
- Custom tooltip: shows swimmer name, age, time (formatted), meet name
- Responsive container that fills mobile width
- Legend showing swimmer names and countries

- [ ] **Step 2: Build event detail page**

`web/src/app/events/[slug]/page.tsx`:
- Header: event name, swimmer's PB
- TrajectoryChart component
- Callout card: "You're X.Xs behind [World #1] at age [N]"
- Below chart: table of world top 3 current PBs
- Track page view + which event with analytics

- [ ] **Step 3: Add swipe navigation between events**

Left/right swipe or arrow buttons to move to next/previous event.

- [ ] **Step 4: Test with Noa's real data**

Verify chart renders correctly with Noa's 100 Free times vs world top 3 trajectory.

- [ ] **Step 5: Commit**

```bash
git add web/src/
git commit -m "feat: add trajectory chart with world top 3 comparison"
```

---

### Task 7: Swimmer Profile

**Files:**
- Create: `web/src/app/profile/page.tsx`
- Create: `web/src/components/PBTable.tsx`

- [ ] **Step 1: Build PBTable component**

Table showing swimmer's PB for each event they've competed in. Columns: event, time, date, gap to world #1.

- [ ] **Step 2: Build profile page**

Swimmer's name, club (Calgary Patriots), age group, province. PBTable. Summary: strongest event, number of events, overall assessment.

- [ ] **Step 3: Commit**

```bash
git add web/src/
git commit -m "feat: add swimmer profile page"
```

---

### Task 8: AI Coach Chat

**Files:**
- Create: `web/src/app/api/chat/route.ts`
- Create: `web/src/app/chat/page.tsx`
- Create: `web/src/components/ChatMessage.tsx`

- [ ] **Step 1: Build Claude API route**

`web/src/app/api/chat/route.ts`:
- POST endpoint that receives messages + swimmer context
- Builds system prompt with: swimmer's PBs, trajectory data, world top 3 comparison, age, club
- Calls Claude API (streaming)
- System prompt includes swim science context and guardrails

- [ ] **Step 2: Build ChatMessage component**

Styled chat bubbles — user messages right-aligned, AI responses left-aligned with swim-themed styling.

- [ ] **Step 3: Build chat page**

Full chat interface: message list, input field, send button. Pre-populated with suggested questions. Scrolls to bottom on new messages. Track chat interactions with analytics.

- [ ] **Step 4: Test with a real question**

Ask "How does my 100 Free compare to Pan Zhanle at my age?" and verify the response references Noa's actual data.

- [ ] **Step 5: Commit**

```bash
git add web/src/
git commit -m "feat: add AI coach chat with Claude API"
```

---

### Task 9: Admin Dashboard

**Files:**
- Create: `web/src/app/admin/page.tsx`

- [ ] **Step 1: Build admin page**

Password-protected (simple hardcoded password for prototype). Shows:
- Total users, total page views
- Most viewed events (bar chart)
- Recent activity log (last 50 events)
- Per-swimmer usage breakdown

- [ ] **Step 2: Commit**

```bash
git add web/src/app/admin/
git commit -m "feat: add admin analytics dashboard"
```

---

### Task 10: PWA Polish & Deploy

**Files:**
- Modify: `web/public/manifest.json`
- Create: `web/public/sw.js`
- Modify: `web/next.config.js`

- [ ] **Step 1: Finalize PWA manifest**

Icons (generate simple ones), splash screens, background color, theme color matching the app design.

- [ ] **Step 2: Add service worker for offline support**

Basic service worker that caches the app shell and trajectory data.

- [ ] **Step 3: Deploy to Vercel**

```bash
cd web
npx vercel --prod
```

Or connect GitHub repo to Vercel for auto-deploys.

- [ ] **Step 4: Test on actual phone**

Open the Vercel URL on Noa's phone, add to home screen, verify:
- Opens full-screen (no browser bar)
- Charts render correctly
- Navigation works
- Chat works
- Feels like a native app

- [ ] **Step 5: Commit final version**

```bash
git add .
git commit -m "feat: finalize PWA config and deploy"
git push
```

---

## Verification

1. **Login:** Open on mobile, select Noa, verify redirect to events
2. **Events grid:** All 14 individual events displayed, Noa's PBs shown where available
3. **Trajectory chart:** Tap 100 Free, see Noa's line + world top 3 lines with correct data
4. **Swipe:** Swipe between events smoothly
5. **Profile:** View Noa's full PB table
6. **AI chat:** Ask "What should I focus on to improve my 100 Free?" — get response referencing Noa's actual time
7. **Admin:** Go to /admin, enter password, see usage analytics
8. **PWA:** Add to home screen on phone, opens full-screen
9. **Analytics:** Check Supabase analytics_events table has logged the interactions
