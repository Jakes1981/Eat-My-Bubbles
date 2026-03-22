'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseSwimRankingsText, parseSwimRankingsHTML, type ParsedProfile } from '@/lib/swimrankings-parser';
import { formatTime } from '@/lib/swim-utils';

type Step = 'enter-id' | 'instructions' | 'paste' | 'review' | 'done';

export default function ImportPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('enter-id');
  const [athleteId, setAthleteId] = useState('');
  const [pastedContent, setPastedContent] = useState('');
  const [profile, setProfile] = useState<ParsedProfile | null>(null);
  const [error, setError] = useState('');

  function extractAthleteId(input: string): string {
    // Handle full URL: https://www.swimrankings.net/index.php?page=athleteDetail&athleteId=5561919
    const urlMatch = input.match(/athleteId=(\d+)/);
    if (urlMatch) return urlMatch[1];
    // Handle just the number
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
    setStep('instructions');
  }

  function handlePaste() {
    setError('');
    const id = athleteId;

    // Try HTML parse first (if they pasted HTML)
    let parsed: ParsedProfile | null = null;
    if (pastedContent.includes('<table') || pastedContent.includes('athleteBest')) {
      parsed = parseSwimRankingsHTML(pastedContent, id);
    }

    // Fall back to text parse
    if (!parsed) {
      parsed = parseSwimRankingsText(pastedContent, id);
    }

    if (!parsed || (parsed.personalBests.length === 0 && !parsed.swimmer.firstName)) {
      setError(
        'Could not extract swim data from the pasted content. Make sure you copied the entire page (Cmd+A then Cmd+C on the SwimRankings page).'
      );
      return;
    }

    setProfile(parsed);
    setStep('review');
  }

  function handleSave() {
    if (!profile) return;

    // Save swimmer profile to localStorage for the prototype
    const swimmers = JSON.parse(localStorage.getItem('importedSwimmers') || '[]');
    const existing = swimmers.findIndex(
      (s: { swimRankingsId: string }) => s.swimRankingsId === profile.swimmer.swimRankingsId
    );
    if (existing >= 0) {
      swimmers[existing] = profile;
    } else {
      swimmers.push(profile);
    }
    localStorage.setItem('importedSwimmers', JSON.stringify(swimmers));

    // Set as current swimmer
    localStorage.setItem('swimmerId', profile.swimmer.swimRankingsId);
    localStorage.setItem('swimmerName', profile.swimmer.name);
    localStorage.setItem('currentProfile', JSON.stringify(profile));

    setStep('done');
    setTimeout(() => router.push('/events'), 1500);
  }

  return (
    <div className="flex flex-col min-h-screen px-6 py-8 bg-gradient-to-b from-[#0A1628] via-[#0F2240] to-[#0A1628]">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🏊</div>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-[#06B6D4] via-[#22D3EE] to-[#06B6D4] bg-clip-text text-transparent">
          Eat My Bubbles
        </h1>
        <p className="mt-2 text-[#94A3B8] text-sm">Import your swim data</p>
      </div>

      {/* Step 1: Enter SwimRankings ID */}
      {step === 'enter-id' && (
        <div className="flex-1 flex flex-col">
          <div className="bg-[#111D33] rounded-2xl border border-[#1E3050] p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-2">Your SwimRankings ID</h2>
            <p className="text-sm text-[#94A3B8] mb-4">
              Enter your SwimRankings athlete ID or paste the full URL from your SwimRankings profile page.
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

          <div className="bg-[#111D33]/50 rounded-2xl border border-[#1E3050] p-4 mb-6">
            <p className="text-xs text-[#64748B] leading-relaxed">
              <span className="text-[#06B6D4] font-semibold">How to find your ID:</span> Go to{' '}
              <span className="text-[#94A3B8]">swimrankings.net</span>, search for your name, and
              open your profile. The ID is in the URL after &quot;athleteId=&quot;.
            </p>
          </div>

          <button
            onClick={handleIdSubmit}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white font-bold text-lg active:scale-[0.98] transition-transform"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Instructions to open and copy */}
      {step === 'instructions' && (
        <div className="flex-1 flex flex-col">
          <div className="bg-[#111D33] rounded-2xl border border-[#1E3050] p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">Copy Your Data</h2>
            <ol className="space-y-4 text-sm text-[#CBD5E1]">
              <li className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-[#06B6D4] text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>Tap the button below to open your SwimRankings page</span>
              </li>
              <li className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-[#06B6D4] text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>Wait for the page to load completely</span>
              </li>
              <li className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-[#06B6D4] text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span>
                  Select all text: <span className="text-[#06B6D4] font-mono">Cmd+A</span> (Mac) or{' '}
                  <span className="text-[#06B6D4] font-mono">Ctrl+A</span> (PC/Android)
                </span>
              </li>
              <li className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-[#06B6D4] text-white flex items-center justify-center text-xs font-bold shrink-0">4</span>
                <span>
                  Copy: <span className="text-[#06B6D4] font-mono">Cmd+C</span> or{' '}
                  <span className="text-[#06B6D4] font-mono">Ctrl+C</span>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-[#06B6D4] text-white flex items-center justify-center text-xs font-bold shrink-0">5</span>
                <span>Come back here and paste it</span>
              </li>
            </ol>
          </div>

          <a
            href={`https://www.swimrankings.net/index.php?page=athleteDetail&athleteId=${athleteId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white font-bold text-lg text-center mb-4 block active:scale-[0.98] transition-transform"
          >
            Open SwimRankings Page
          </a>

          <button
            onClick={() => setStep('paste')}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white font-bold text-lg active:scale-[0.98] transition-transform"
          >
            I&apos;ve Copied It — Next
          </button>
        </div>
      )}

      {/* Step 3: Paste content */}
      {step === 'paste' && (
        <div className="flex-1 flex flex-col">
          <div className="bg-[#111D33] rounded-2xl border border-[#1E3050] p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-2">Paste Your Data</h2>
            <p className="text-sm text-[#94A3B8] mb-4">
              Paste the content you copied from your SwimRankings page.
            </p>
            <textarea
              value={pastedContent}
              onChange={(e) => { setPastedContent(e.target.value); setError(''); }}
              placeholder="Paste here (Cmd+V / Ctrl+V)..."
              className="w-full h-48 px-4 py-3 rounded-xl bg-[#0A1628] border border-[#1E3050] text-white placeholder-[#475569] focus:outline-none focus:border-[#06B6D4] text-sm font-mono resize-none"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>

          <button
            onClick={handlePaste}
            disabled={!pastedContent.trim()}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white font-bold text-lg active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import Data
          </button>

          <button
            onClick={() => setStep('instructions')}
            className="w-full py-3 mt-3 text-[#64748B] text-sm"
          >
            Back to instructions
          </button>
        </div>
      )}

      {/* Step 4: Review parsed data */}
      {step === 'review' && profile && (
        <div className="flex-1 flex flex-col">
          <div className="bg-[#111D33] rounded-2xl border border-[#1E3050] p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#0891B2] flex items-center justify-center text-white text-xl font-bold">
                {profile.swimmer.firstName?.[0]}{profile.swimmer.lastName?.[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{profile.swimmer.name || 'Unknown'}</h2>
                <p className="text-sm text-[#94A3B8]">
                  {profile.swimmer.club || profile.swimmer.countryCode}
                  {profile.swimmer.birthYear ? ` · Born ${profile.swimmer.birthYear}` : ''}
                </p>
              </div>
            </div>

            <div className="flex gap-4 text-center">
              <div className="flex-1 bg-[#0A1628] rounded-lg py-2">
                <p className="text-2xl font-bold text-[#06B6D4]">{profile.personalBests.length}</p>
                <p className="text-xs text-[#64748B]">Events</p>
              </div>
              <div className="flex-1 bg-[#0A1628] rounded-lg py-2">
                <p className="text-2xl font-bold text-[#F59E0B]">{profile.meets.length}</p>
                <p className="text-xs text-[#64748B]">Meets</p>
              </div>
            </div>
          </div>

          {/* Personal bests preview */}
          {profile.personalBests.length > 0 && (
            <div className="bg-[#111D33] rounded-2xl border border-[#1E3050] p-4 mb-4">
              <h3 className="text-sm font-bold text-[#94A3B8] mb-3 uppercase tracking-wider">Personal Bests</h3>
              <div className="space-y-2">
                {profile.personalBests.map((pb, i) => (
                  <div key={i} className="flex justify-between items-center py-1">
                    <span className="text-sm text-[#CBD5E1]">
                      {pb.distance}m {pb.stroke}
                      <span className="text-[#475569] ml-1 text-xs">({pb.course})</span>
                    </span>
                    <span className="text-sm font-mono text-white">{formatTime(pb.timeSeconds)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meet history preview */}
          {profile.meets.length > 0 && (
            <div className="bg-[#111D33] rounded-2xl border border-[#1E3050] p-4 mb-6">
              <h3 className="text-sm font-bold text-[#94A3B8] mb-3 uppercase tracking-wider">
                Recent Meets ({profile.meets.length} total)
              </h3>
              <div className="space-y-2">
                {profile.meets.slice(0, 5).map((meet, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-[#64748B]">{meet.date}</span>
                    <span className="text-[#CBD5E1] ml-2">{meet.name}</span>
                  </div>
                ))}
                {profile.meets.length > 5 && (
                  <p className="text-xs text-[#475569]">+ {profile.meets.length - 5} more meets</p>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white font-bold text-lg active:scale-[0.98] transition-transform"
          >
            Save &amp; Continue
          </button>

          <button
            onClick={() => setStep('paste')}
            className="w-full py-3 mt-3 text-[#64748B] text-sm"
          >
            Re-paste data
          </button>
        </div>
      )}

      {/* Step 5: Done */}
      {step === 'done' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-white mb-2">You&apos;re In!</h2>
          <p className="text-[#94A3B8]">Loading your dashboard...</p>
        </div>
      )}
    </div>
  );
}
