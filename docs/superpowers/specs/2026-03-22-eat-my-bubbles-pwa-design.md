# Eat My Bubbles — PWA Prototype Design

## Overview

A Progressive Web App (PWA) that lets competitive swimmers compare their career trajectory against the current world top 3 in every event. Looks and feels like a native mobile app when added to the home screen.

**Target users:** Noa Burger + 3-5 Calgary Patriots club mates (13-14 age group)
**Core feature:** Interactive trajectory charts showing swimmer's progression from age 12 overlaid on the world's best swimmers at the same ages.

---

## Screens

### 1. Login
- Simple PIN or name-based login (no email/password — these are kids)
- Supabase Auth for session management

### 2. My Events
- Grid of event cards covering all individual LCM events:
  - 50/100/200 Free, 100/200 Back, 100/200 Breast, 100/200 Fly
  - 200/400 IM, 400/800/1500 Free
- Each card shows: swimmer's PB, mini sparkline of progression
- Events not yet swum are greyed out
- Both male and female events supported

### 3. Event Detail — Trajectory Chart
- Full-width interactive chart (Chart.js or Recharts)
- X-axis: age (12 → current age of world #1)
- Y-axis: time (inverted — faster times higher)
- Lines:
  - Swimmer's trajectory (bold, primary color)
  - World #1 trajectory (gold)
  - World #2 trajectory (silver)
  - World #3 trajectory (bronze)
- Tap any data point → tooltip with exact time, meet name, date
- Callout banner: "You're X.Xs behind [World #1] at the same age"
- Swipe left/right to navigate between events

### 4. Swimmer Profile
- Name, club, age group, province, country
- PB table across all events
- Overall summary stats

### 5. AI Coach Chat
- Powered by Claude API
- Context-aware: knows the swimmer's PBs, trajectory, comparison data, age
- Example queries:
  - "What do I need to do to break 55s in 100 Free by provincials?"
  - "What should my 200 IM split strategy be?"
  - "How does my progress compare to Popovici at my age?"
- Guardrails:
  - Swim coaching only (not general chatbot)
  - References swimmer's actual data
  - Grounded in published swim science
  - Does NOT prescribe specific training sets (that's the coach's job)
- Tone: neutral/friendly to start, adjusted based on user feedback

### 6. Admin Dashboard (for Jaco)
- Password-protected at `/admin`
- Usage analytics:
  - Who logged in and when
  - Which screens/events viewed
  - Time spent per screen
  - Most popular events across all swimmers
- Query interface for custom analytics

---

## Tech Stack

- **Next.js** — React framework, server-side rendering
- **Supabase** — Database (already set up), auth, analytics storage
- **Chart.js or Recharts** — Interactive trajectory charts
- **Claude API** — AI coach chat
- **Vercel** — Free hosting, auto-deploys from GitHub
- **PWA config** — manifest.json, service worker for offline support, full-screen mode

---

## Data

### Swimmer data (Noa + club mates)
- Source: SwimCloud profile pages
- Stored in existing Supabase `swimmers`, `results`, `events`, `meets` tables
- Need: complete career history for each swimmer

### World top 3 per event
- Source: World Aquatics official rankings (current top 3 per event)
- Career histories: official national federation sites for each swimmer
- Need: best time at each age from ~12 years old to present
- Stored in `swimmer_trajectories` table
- ~17 events x 2 genders x 3 swimmers = ~102 elite swimmer trajectories to curate

### All individual LCM events covered
50 Free, 100 Free, 200 Free, 400 Free, 800 Free, 1500 Free,
100 Back, 200 Back, 100 Breast, 200 Breast, 100 Fly, 200 Fly,
200 IM, 400 IM

---

## Usage Tracking

Every user interaction logged to Supabase `analytics_events` table:
- `user_id`, `screen`, `event_viewed`, `action`, `timestamp`, `duration_seconds`
- Enables queries like:
  - "How often does Noa check his 100 Free trajectory?"
  - "Which event is most viewed across all swimmers?"
  - "Average session duration per swimmer"

---

## PWA Features

- **Add to home screen** — full-screen, no browser bar
- **Offline support** — cached trajectory data viewable without internet
- **Smooth transitions** — page transitions feel native
- **Responsive** — works on any phone, tablet, or desktop

---

## Deployment

- GitHub repo (Eat-My-Bubbles) → Vercel auto-deploys on push
- Free tier: sufficient for prototype (< 100 users)
- Custom domain (`eatmybubbles.com`) can be added later
