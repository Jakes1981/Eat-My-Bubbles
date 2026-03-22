'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ImportedProfile {
  swimmer: {
    name: string;
    swimRankingsId: string;
    firstName: string;
    lastName: string;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [importedSwimmers, setImportedSwimmers] = useState<ImportedProfile[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('importedSwimmers');
    if (stored) {
      try {
        setImportedSwimmers(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  function handleSelect(profile: ImportedProfile) {
    localStorage.setItem('swimmerId', profile.swimmer.swimRankingsId);
    localStorage.setItem('swimmerName', profile.swimmer.name);
    localStorage.setItem('currentProfile', JSON.stringify(profile));
    router.push('/events');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-gradient-to-b from-[#0A1628] via-[#0F2240] to-[#0A1628]">
      {/* Logo area */}
      <div className="mb-12 text-center">
        <div className="text-6xl mb-4">🏊</div>
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-[#06B6D4] via-[#22D3EE] to-[#06B6D4] bg-clip-text text-transparent">
          Eat My Bubbles
        </h1>
        <p className="mt-3 text-[#94A3B8] text-lg">
          Track your swimming journey
        </p>
      </div>

      <div className="w-full max-w-sm">
        {/* Previously imported swimmers */}
        {importedSwimmers.length > 0 && (
          <>
            <p className="text-sm text-[#64748B] mb-3 text-center uppercase tracking-wider font-medium">
              Your profiles
            </p>
            <div className="flex flex-col gap-3 mb-6">
              {importedSwimmers.map((profile) => (
                <button
                  key={profile.swimmer.swimRankingsId}
                  onClick={() => handleSelect(profile)}
                  className="w-full py-4 px-6 rounded-xl text-left text-lg font-medium transition-all duration-200 border bg-[#111D33] border-[#1E3050] text-[#CBD5E1] hover:border-[#06B6D4]/50 hover:bg-[#162038] active:scale-[0.98]"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#0891B2] flex items-center justify-center text-white text-sm font-bold">
                      {profile.swimmer.firstName?.[0]}{profile.swimmer.lastName?.[0]}
                    </span>
                    {profile.swimmer.name}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-[#1E3050]" />
              <span className="text-xs text-[#475569] uppercase">or</span>
              <div className="flex-1 h-px bg-[#1E3050]" />
            </div>
          </>
        )}

        {/* Import new swimmer */}
        <button
          onClick={() => router.push('/import')}
          className="w-full py-4 px-6 rounded-xl text-lg font-medium transition-all duration-200 border-2 border-dashed border-[#1E3050] text-[#94A3B8] hover:border-[#06B6D4]/50 hover:text-white active:scale-[0.98] flex items-center justify-center gap-3"
        >
          <span className="w-10 h-10 rounded-full border-2 border-[#06B6D4] flex items-center justify-center text-[#06B6D4] text-xl font-light">
            +
          </span>
          Import from SwimRankings
        </button>
      </div>

      {/* Footer */}
      <p className="mt-12 text-xs text-[#475569]">
        Prototype v0.2 — Data powered by SwimRankings.net
      </p>
    </div>
  );
}
