'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  parseSwimRankingsText,
  parseSwimRankingsAllResults,
  type ParsedProfile,
  type ParsedResult,
} from '@/lib/swimrankings-parser';
import { formatTime } from '@/lib/swim-utils';

type Step = 'enter-id' | 'instructions-pb' | 'paste-pb' | 'review-pb' | 'instructions-results' | 'paste-results' | 'review-all' | 'done';

export default function ImportPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('enter-id');
  const [athleteId, setAthleteId] = useState('');
  const [pastedContent, setPastedContent] = useState('');
  const [profile, setProfile] = useState<ParsedProfile | null>(null);
  const [allResults, setAllResults] = useState<ParsedResult[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [error, setError] = useState('');

  const swimRankingsUrl = `https://www.swimrankings.net/index.php?page=athleteDetail&athleteId=${athleteId}`;

  function extractAthleteId(input: string): string {
    const urlMatch = input.match(/athleteId=(\d+)/);
    if (urlMatch) return urlMatch[1];
    const numMatch = input.match(/^\d+$/);
    if (numMatch) return numMatch[0];
    return '';
  }

  function handleIdSubmit() {
    const id = extractAthleteId(athleteId.trim());
    if (!id) {
      setError('Please enter a valid SwimRankings ID or URL');
      return;
    }
    setAthleteId(id);
    setError('');
    setStep('instructions-pb');
  }

  function handlePastePB() {
    setError('');
    const parsed = parseSwimRankingsText(pastedContent, athleteId);
    if (!parsed || (parsed.personalBests.length === 0 && !parsed.swimmer.firstName)) {
      setError('Could not extract swim data. Make sure you copied the entire Personal Bests page (Cmd+A then Cmd+C).');
      return;
    }
    setProfile(parsed);
    setPastedContent('');
    setStep('review-pb');
  }

  function handlePasteResults() {
    setError('');
    if (!profile) return;

    const newResults = parseSwimRankingsAllResults(
      pastedContent,
      profile.swimmer.birthYear
    );

    if (newResults.length === 0) {
      setError('Could not extract results. Make sure you selected a year from the "All results" dropdown, then copied the entire page.');
      return;
    }

    // Merge with existing results (avoid duplicates)
    const existing = new Set(allResults.map(r => `${r.dateISO}-${r.distance}-${r.stroke}-${r.timeText}-${r.course}`));
    const unique = newResults.filter(r => !existing.has(`${r.dateISO}-${r.distance}-${r.stroke}-${r.timeText}-${r.course}`));
    const merged = [...allResults, ...unique].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
    setAllResults(merged);

    // Track which seasons we've imported
    const newSeason = newResults[0]?.season;
    if (newSeason && !seasons.includes(newSeason)) {
      setSeasons([...seasons, newSeason].sort());
    }

    setPastedContent('');
    setStep('review-all');
  }

  function handleSave() {
    if (!profile) return;

    const fullProfile = { ...profile, allResults };

    // Save to localStorage
    const swimmers = JSON.parse(localStorage.getItem('importedSwimmers') || '[]');
    const existing = swimmers.findIndex(
      (s: { swimmer: { swimRankingsId: string } }) => s.swimmer.swimRankingsId === profile.swimmer.swimRankingsId
    );
    if (existing >= 0) {
      swimmers[existing] = fullProfile;
    } else {
      swimmers.push(fullProfile);
    }
    localStorage.setItem('importedSwimmers', JSON.stringify(swimmers));
    localStorage.setItem('swimmerId', profile.swimmer.swimRankingsId);
    localStorage.setItem('swimmerName', profile.swimmer.name);
    localStorage.setItem('currentProfile', JSON.stringify(fullProfile));

    setStep('done');
    setTimeout(() => router.push('/events'), 1500);
  }

  // Count LCM results
  const lcmResults = allResults.filter(r => r.course === 'LCM');
  const scmResults = allResults.filter(r => r.course === 'SCM');
  const uniqueEvents = new Set(allResults.map(r => `${r.distance}m ${r.stroke}`));

  return (
    <div className="flex flex-col min-h-screen px-6 py-8 bg-gradient-to-b from-[#0A1628] via-[#0F2240] to-[#0A1628]">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🏊</div>
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-[#06B6D4] via-[#22D3EE] to-[#06B6D4] bg-clip-text text-transparent">
          Eat My Bubbles
        </h1>
        <p className="mt-1 text-[#94A3B8] text-sm">Import your swim data</p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {['ID', 'PBs', 'Results', 'Done'].map((label, i) => {
          const stepIndex = ['enter-id', 'instructions-pb,paste-pb,review-pb', 'instructions-results,paste-results,review-all', 'done'];
          const isActive = stepIndex.findIndex(s => s.split(',').some(ss => ss === step));
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                i <= isActive ? 'bg-[#06B6D4] text-white' : 'bg-[#1E3050] text-[#475569]'
              }`}>
                {i + 1}
              </div>
              <span className={`text-xs ${i <= isActive ? 'text-[#06B6D4]' : 'text-[#475569]'}`}>
                {label}
              </span>
              {i < 3 && <div className={`w-6 h-px ${i < isActive ? 'bg-[#06B6D4]' : 'bg-[#1E3050]'}`} />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Enter SwimRankings ID */}
      {step === 'enter-id' && (
        <div className="flex-1 flex flex-col">
          <div className="bg-[#111D33] rounded-2xl border border-[#1E3050] p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-2">Your SwimRankings ID</h2>
            <p className="text-sm text-[#94A3B8] mb-4">
              Enter your SwimRankings athlete ID or paste the full URL.
            </p>
            <input
              type="text"
              value={athleteId}
              onChange={(e) => { setAthleteId(e.target.value); setError(''); }}
              placeholder="e.g., 5561919 or full URL"
              className="w-full px-4 py-3 rounded-xl bg-[#0A1628] border border-[#1E3050] text-white placeholder-[#475569] focus:outline-none focus:border-[#06B6D4] text-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleIdSubmit()}
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>
          <button onClick={handleIdSubmit} className="w-full py-4 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white font-bold text-lg active:scale-[0.98] transition-transform">
            Continue
          </button>
        </div>
      )}

      {/* Step 2a: Instructions for PB page */}
      {step === 'instructions-pb' && (
        <div className="flex-1 flex flex-col">
          <div className="bg-[#111D33] rounded-2xl border border-[#1E3050] p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">Step 1: Copy Personal Bests</h2>
            <ol className="space-y-3 text-sm text-[#CBD5E1]">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#06B6D4] text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>Tap below to open your SwimRankings page</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#06B6D4] text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>Make sure &quot;Personal Bests: Alltime&quot; is selected</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#06B6D4] text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span>Select All (<span className="text-[#06B6D4] font-mono">Cmd+A</span>) then Copy (<span className="text-[#06B6D4] font-mono">Cmd+C</span>)</span>
              </li>
            </ol>
          </div>
          <a href={swimRankingsUrl} target="_blank" rel="noopener noreferrer"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white font-bold text-lg text-center mb-4 block active:scale-[0.98] transition-transform">
            Open SwimRankings Page
          </a>
          <button onClick={() => setStep('paste-pb')}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white font-bold text-lg active:scale-[0.98] transition-transform">
            I&apos;ve Copied It — Next
          </button>
        </div>
      )}

      {/* Step 2b: Paste PBs */}
      {step === 'paste-pb' && (
        <div className="flex-1 flex flex-col">
          <div className="bg-[#111D33] rounded-2xl border border-[#1E3050] p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-2">Paste Personal Bests</h2>
            <textarea
              value={pastedContent}
              onChange={(e) => { setPastedContent(e.target.value); setError(''); }}
              placeholder="Paste here (Cmd+V)..."
              className="w-full h-40 px-4 py-3 rounded-xl bg-[#0A1628] border border-[#1E3050] text-white placeholder-[#475569] focus:outline-none focus:border-[#06B6D4] text-sm font-mono resize-none"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>
          <button onClick={handlePastePB} disabled={!pastedContent.trim()}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white font-bold text-lg active:scale-[0.98] transition-transform disabled:opacity-50">
            Parse Data
          </button>
          <button onClick={() => setStep('instructions-pb')} className="w-full py-3 mt-3 text-[#64748B] text-sm">
            Back
          </button>
        </div>
      )}

      {/* Step 2c: Review PBs and proceed to results */}
      {step === 'review-pb' && profile && (
        <div className="flex-1 flex flex-col">
          <div className="bg-[#111D33] rounded-2xl border border-[#1E3050] p-6 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#0891B2] flex items-center justify-center text-white text-lg font-bold">
                {profile.swimmer.firstName?.[0]}{profile.swimmer.lastName?.[0]}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{profile.swimmer.name}</h2>
                <p className="text-xs text-[#94A3B8]">
                  {profile.swimmer.club} · Born {profile.swimmer.birthYear} · Age {new Date().getFullYear() - profile.swimmer.birthYear}
                </p>
              </div>
            </div>
            <p className="text-sm text-[#06B6D4]">{profile.personalBests.length} personal bests found</p>
          </div>

          <div className="bg-[#111D33] rounded-2xl border border-[#1E3050] p-4 mb-4">
            <h3 className="text-sm font-bold text-[#F59E0B] mb-3">Now let&apos;s get your full history</h3>
            <p className="text-sm text-[#94A3B8]">
              Personal bests show where you are now. To see your trajectory and predict your future, we need <span className="text-white font-semibold">all your times</span> — every swim, every meet.
            </p>
          </div>

          <button onClick={() => setStep('instructions-results')}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white font-bold text-lg active:scale-[0.98] transition-transform">
            Import Full Results
          </button>

          <button onClick={handleSave} className="w-full py-3 mt-3 text-[#64748B] text-sm">
            Skip — just use PBs for now
          </button>
        </div>
      )}

      {/* Step 3a: Instructions for all results */}
      {step === 'instructions-results' && (
        <div className="flex-1 flex flex-col">
          <div className="bg-[#111D33] rounded-2xl border border-[#1E3050] p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">Step 2: Copy All Results</h2>
            <ol className="space-y-3 text-sm text-[#CBD5E1]">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#06B6D4] text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>On your SwimRankings page, find the <span className="text-white font-semibold">&quot;All results&quot;</span> dropdown</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#06B6D4] text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>Select a year (start with the most recent)</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#06B6D4] text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span>Select All (<span className="text-[#06B6D4] font-mono">Cmd+A</span>) then Copy (<span className="text-[#06B6D4] font-mono">Cmd+C</span>)</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#06B6D4] text-white flex items-center justify-center text-xs font-bold shrink-0">4</span>
                <span>Repeat for each year you&apos;ve been swimming</span>
              </li>
            </ol>
          </div>

          {seasons.length > 0 && (
            <div className="bg-[#0F1D30] rounded-xl border border-[#1E3050] p-3 mb-4">
              <p className="text-xs text-[#64748B] mb-1">Seasons imported:</p>
              <div className="flex gap-2 flex-wrap">
                {seasons.map(s => (
                  <span key={s} className="px-2 py-1 bg-[#06B6D4]/20 text-[#06B6D4] rounded text-xs font-bold">{s}</span>
                ))}
              </div>
              <p className="text-xs text-[#94A3B8] mt-2">{allResults.length} total swims imported</p>
            </div>
          )}

          <a href={swimRankingsUrl} target="_blank" rel="noopener noreferrer"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white font-bold text-lg text-center mb-4 block active:scale-[0.98] transition-transform">
            Open SwimRankings Page
          </a>
          <button onClick={() => setStep('paste-results')}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white font-bold text-lg active:scale-[0.98] transition-transform">
            I&apos;ve Copied a Year — Paste It
          </button>
          {allResults.length > 0 && (
            <button onClick={() => setStep('review-all')} className="w-full py-3 mt-3 text-[#64748B] text-sm">
              Done importing — review data
            </button>
          )}
        </div>
      )}

      {/* Step 3b: Paste results */}
      {step === 'paste-results' && (
        <div className="flex-1 flex flex-col">
          <div className="bg-[#111D33] rounded-2xl border border-[#1E3050] p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-2">Paste Year Results</h2>
            <textarea
              value={pastedContent}
              onChange={(e) => { setPastedContent(e.target.value); setError(''); }}
              placeholder="Paste the full page with one year's results..."
              className="w-full h-40 px-4 py-3 rounded-xl bg-[#0A1628] border border-[#1E3050] text-white placeholder-[#475569] focus:outline-none focus:border-[#06B6D4] text-sm font-mono resize-none"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>
          <button onClick={handlePasteResults} disabled={!pastedContent.trim()}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white font-bold text-lg active:scale-[0.98] transition-transform disabled:opacity-50">
            Import This Year
          </button>
          <button onClick={() => setStep('instructions-results')} className="w-full py-3 mt-3 text-[#64748B] text-sm">
            Back
          </button>
        </div>
      )}

      {/* Step 3c: Review all results */}
      {step === 'review-all' && profile && (
        <div className="flex-1 flex flex-col">
          <div className="bg-[#111D33] rounded-2xl border border-[#1E3050] p-6 mb-4">
            <h2 className="text-lg font-bold text-white mb-3">Data Summary</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0A1628] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[#06B6D4]">{allResults.length}</p>
                <p className="text-xs text-[#64748B]">Total swims</p>
              </div>
              <div className="bg-[#0A1628] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[#F59E0B]">{uniqueEvents.size}</p>
                <p className="text-xs text-[#64748B]">Events</p>
              </div>
              <div className="bg-[#0A1628] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[#22D3EE]">{lcmResults.length}</p>
                <p className="text-xs text-[#64748B]">LCM swims</p>
              </div>
              <div className="bg-[#0A1628] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[#94A3B8]">{scmResults.length}</p>
                <p className="text-xs text-[#64748B]">SCM swims</p>
              </div>
            </div>
          </div>

          {/* Event breakdown */}
          <div className="bg-[#111D33] rounded-2xl border border-[#1E3050] p-4 mb-4 max-h-64 overflow-y-auto">
            <h3 className="text-sm font-bold text-[#94A3B8] mb-2 uppercase tracking-wider">By Event (LCM)</h3>
            {Array.from(new Set(lcmResults.map(r => `${r.distance}m ${r.stroke}`))).map(event => {
              const eventResults = lcmResults.filter(r => `${r.distance}m ${r.stroke}` === event);
              const best = Math.min(...eventResults.map(r => r.timeSeconds));
              return (
                <div key={event} className="flex justify-between items-center py-1.5 border-b border-[#1E3050] last:border-0">
                  <span className="text-sm text-[#CBD5E1]">{event}</span>
                  <span className="text-xs text-[#94A3B8]">
                    {eventResults.length} swims · PB {formatTime(best)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Seasons */}
          <div className="flex gap-2 flex-wrap mb-4">
            {seasons.map(s => (
              <span key={s} className="px-3 py-1 bg-[#06B6D4]/20 text-[#06B6D4] rounded-full text-xs font-bold">Season {s}</span>
            ))}
          </div>

          <button onClick={() => setStep('instructions-results')}
            className="w-full py-3 rounded-xl border border-[#1E3050] text-[#94A3B8] font-medium text-sm mb-3 active:scale-[0.98] transition-transform">
            + Import Another Year
          </button>

          <button onClick={handleSave}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white font-bold text-lg active:scale-[0.98] transition-transform">
            Save &amp; View Trajectories
          </button>
        </div>
      )}

      {/* Done */}
      {step === 'done' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-white mb-2">You&apos;re In!</h2>
          <p className="text-[#94A3B8]">Loading your trajectory charts...</p>
        </div>
      )}
    </div>
  );
}
