'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';

const COMPARE_SWIMMERS = [
  { name: 'Josh Liendo', id: 'LIENDO, Joshua, 2002, CAN, Toronto Swim Club, ID:4838498' },
  { name: 'Summer McIntosh', id: 'MCINTOSH, Summer, 2006, CAN, Toronto Swim Club, ID:5203498' },
  { name: 'Pan Zhanle', id: 'PAN, Zhanle, 2004, CHN, ID:5155498' },
  { name: 'David Popovici', id: 'POPOVICI, David, 2004, ROU, ID:5052916' },
];

type View = 'single' | 'compare' | 'multi';

export default function AnalysisPage() {
  const router = useRouter();
  const [swimmerAthleteStr, setSwimmerAthleteStr] = useState('');
  const [swimmerName, setSwimmerName] = useState('');
  const [view, setView] = useState<View>('single');
  const [compareWith, setCompareWith] = useState('');
  const [iframeUrl, setIframeUrl] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('swimmerName') || '';
    if (!name) {
      router.push('/');
      return;
    }
    setSwimmerName(name);

    // Build the swimstats athlete string from stored profile
    const profileJson = localStorage.getItem('currentProfile');
    if (profileJson) {
      try {
        const profile = JSON.parse(profileJson);
        const s = profile.swimmer;
        const athleteStr = `${s.lastName.toUpperCase()}, ${s.firstName}, ${s.birthYear}, ${s.countryCode}, ${s.club}, ID:${s.swimRankingsId}`;
        setSwimmerAthleteStr(athleteStr);
        // Default: single analysis
        setIframeUrl(buildUrl('single', athleteStr, ''));
      } catch {
        // Fall back to Noa's known string
        const fallback = 'BURGER, Noa Josh, 2012, CAN, Calgary Patriots Swim Club, ID:5561919';
        setSwimmerAthleteStr(fallback);
        setIframeUrl(buildUrl('single', fallback, ''));
      }
    } else {
      // Fallback for seed data users
      const fallback = 'BURGER, Noa Josh, 2012, CAN, Calgary Patriots Swim Club, ID:5561919';
      setSwimmerAthleteStr(fallback);
      setIframeUrl(buildUrl('single', fallback, ''));
    }
  }, [router]);

  function buildUrl(viewType: string, athlete1: string, athlete2: string): string {
    const base = 'https://www.swimstats.net';
    const a1 = encodeURIComponent(athlete1);
    if (viewType === 'multi') {
      return `${base}/multi?athlete1=${a1}`;
    }
    let url = `${base}/single?athlete1=${a1}`;
    if (athlete2) {
      url += `&athlete2=${encodeURIComponent(athlete2)}`;
    }
    return url;
  }

  function handleViewChange(newView: View) {
    setView(newView);
    if (newView === 'multi') {
      setIframeUrl(buildUrl('multi', swimmerAthleteStr, ''));
    } else if (newView === 'compare' && compareWith) {
      setIframeUrl(buildUrl('single', swimmerAthleteStr, compareWith));
    } else {
      setIframeUrl(buildUrl('single', swimmerAthleteStr, ''));
    }
  }

  function handleCompare(athleteStr: string) {
    setCompareWith(athleteStr);
    setView('compare');
    setIframeUrl(buildUrl('single', swimmerAthleteStr, athleteStr));
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-[#0A1628]">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <h1 className="text-xl font-bold text-white">Analysis</h1>
        <p className="text-xs text-[#64748B]">Powered by swimstats.net</p>
      </div>

      {/* View selector */}
      <div className="px-4 mb-3">
        <div className="flex gap-2">
          <button
            onClick={() => handleViewChange('single')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'single'
                ? 'bg-[#06B6D4] text-white'
                : 'bg-[#111D33] text-[#94A3B8] border border-[#1E3050]'
            }`}
          >
            My Stats
          </button>
          <button
            onClick={() => handleViewChange('compare')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'compare'
                ? 'bg-[#06B6D4] text-white'
                : 'bg-[#111D33] text-[#94A3B8] border border-[#1E3050]'
            }`}
          >
            Compare
          </button>
          <button
            onClick={() => handleViewChange('multi')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'multi'
                ? 'bg-[#06B6D4] text-white'
                : 'bg-[#111D33] text-[#94A3B8] border border-[#1E3050]'
            }`}
          >
            Full Report
          </button>
        </div>
      </div>

      {/* Compare swimmer picker */}
      {view === 'compare' && (
        <div className="px-4 mb-3">
          <p className="text-xs text-[#64748B] mb-2">Compare {swimmerName.split(' ')[0]} with:</p>
          <div className="flex gap-2 flex-wrap">
            {COMPARE_SWIMMERS.map(s => (
              <button
                key={s.name}
                onClick={() => handleCompare(s.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  compareWith === s.id
                    ? 'bg-[#F59E0B] text-white'
                    : 'bg-[#111D33] text-[#94A3B8] border border-[#1E3050]'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Swimstats iframe */}
      <div className="flex-1 px-2">
        {iframeUrl ? (
          <iframe
            src={iframeUrl}
            className="w-full rounded-xl border border-[#1E3050]"
            style={{ height: 'calc(100vh - 240px)', minHeight: '500px' }}
            title="Swimming Analysis"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#06B6D4] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <NavBar />
    </div>
  );
}
