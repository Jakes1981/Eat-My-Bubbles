'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';

interface CompareOption {
  name: string;
  id: string;
  flag: string;
  event?: string;
}

const COMPARE_SWIMMERS: CompareOption[] = [
  { name: 'Josh Liendo', id: 'LIENDO, Joshua,2002,CAN,ID:4838498', flag: '🇨🇦', event: '100m Freestyle' },
  { name: 'Pan Zhanle', id: 'PAN, Zhanle,2004,CHN,ID:5155498', flag: '🇨🇳', event: '100m Freestyle' },
  { name: 'David Popovici', id: 'POPOVICI, David,2004,ROU,ID:5052916', flag: '🇷🇴', event: '200m Freestyle' },
  { name: 'Summer McIntosh', id: 'MCINTOSH, Summer,2006,CAN,ID:5203498', flag: '🇨🇦', event: '400m Freestyle' },
  { name: 'Kristóf Milák', id: 'MILAK, Kristof,2000,HUN,ID:4781498', flag: '🇭🇺', event: '200m Butterfly' },
  { name: 'Léon Marchand', id: 'MARCHAND, Leon,2002,FRA,ID:5021564', flag: '🇫🇷', event: '200m Medley' },
];

export default function AnalysisPage() {
  const router = useRouter();
  const [athleteStr, setAthleteStr] = useState('');
  const [swimmerName, setSwimmerName] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('swimmerName') || '';
    if (!name) {
      router.push('/');
      return;
    }
    setSwimmerName(name);

    const profileJson = localStorage.getItem('currentProfile');
    if (profileJson) {
      try {
        const profile = JSON.parse(profileJson);
        const s = profile.swimmer;
        setAthleteStr(`${s.lastName.toUpperCase()}, ${s.firstName},${s.birthYear},${s.countryCode},ID:${s.swimRankingsId}`);
      } catch {
        setAthleteStr('BURGER, Noa Josh,2012,CAN,ID:5561919');
      }
    } else {
      setAthleteStr('BURGER, Noa Josh,2012,CAN,ID:5561919');
    }
  }, [router]);

  function openSwimstats(path: string, params: Record<string, string>) {
    const url = new URL(`https://www.swimstats.net/${path}`);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    window.open(url.toString(), '_blank');
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-[#0A1628]">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-white">Analysis</h1>
        <p className="text-xs text-[#64748B] mt-1">Deep performance analysis powered by swimstats.net</p>
      </div>

      <div className="px-4 space-y-4 flex-1">
        {/* My Analysis */}
        <div className="bg-[#111D33] rounded-2xl border border-[#1E3050] p-5">
          <h2 className="text-lg font-bold text-white mb-1">My Full Analysis</h2>
          <p className="text-sm text-[#94A3B8] mb-4">
            FINA points, progress charts, rankings across all events — LCM &amp; SCM
          </p>
          <button
            onClick={() => openSwimstats('single', { athlete1: athleteStr })}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white font-bold text-base active:scale-[0.98] transition-transform"
          >
            Open Full Analysis
          </button>
        </div>

        {/* Compare Section */}
        <div className="bg-[#111D33] rounded-2xl border border-[#1E3050] p-5">
          <h2 className="text-lg font-bold text-white mb-1">Compare With Elites</h2>
          <p className="text-sm text-[#94A3B8] mb-4">
            See how {swimmerName.split(' ')[0]}&apos;s times stack up against the world&apos;s best
          </p>
          <div className="space-y-2">
            {COMPARE_SWIMMERS.map(s => (
              <button
                key={s.name}
                onClick={() => openSwimstats('single', {
                  athlete1: athleteStr,
                  athlete2: s.id,
                  ...(s.event ? { style: s.event } : {}),
                })}
                className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-[#0A1628] border border-[#1E3050] hover:border-[#06B6D4]/50 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{s.flag}</span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{s.name}</p>
                    {s.event && <p className="text-xs text-[#64748B]">{s.event}</p>}
                  </div>
                </div>
                <span className="text-[#06B6D4] text-sm">Compare →</span>
              </button>
            ))}
          </div>
        </div>

        {/* Multi Analysis */}
        <div className="bg-gradient-to-r from-[#111D33] to-[#0F1D30] rounded-2xl border border-[#F59E0B]/30 p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⭐</span>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-[#F59E0B] mb-1">Full Multi-Event Report</h2>
              <p className="text-sm text-[#94A3B8] mb-4">
                Complete analysis across every stroke and distance with percentile rankings. Requires swimstats login (free, 3 per hour).
              </p>
              <button
                onClick={() => openSwimstats('multi', { athlete1: athleteStr })}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white font-bold text-base active:scale-[0.98] transition-transform"
              >
                Open Multi-Event Report
              </button>
            </div>
          </div>
        </div>

        {/* Direct link */}
        <p className="text-center text-xs text-[#475569] py-2">
          Analysis opens in swimstats.net — a free swimming analytics platform
        </p>
      </div>

      <NavBar />
    </div>
  );
}
