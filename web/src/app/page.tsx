'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SWIMMERS = [
  { id: 'noa', name: 'Noa Burger' },
  { id: 'emma', name: 'Emma Wilson' },
  { id: 'liam', name: 'Liam Chen' },
  { id: 'sophie', name: 'Sophie Anderson' },
  { id: 'jake', name: 'Jake Roberts' },
];

export default function LoginPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(id: string) {
    setSelected(id);
    localStorage.setItem('swimmerId', id);
    const swimmer = SWIMMERS.find((s) => s.id === id);
    if (swimmer) {
      localStorage.setItem('swimmerName', swimmer.name);
    }
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

      {/* Swimmer selector */}
      <div className="w-full max-w-sm">
        <p className="text-sm text-[#64748B] mb-3 text-center uppercase tracking-wider font-medium">
          Select your profile
        </p>
        <div className="flex flex-col gap-3">
          {SWIMMERS.map((swimmer) => (
            <button
              key={swimmer.id}
              onClick={() => handleSelect(swimmer.id)}
              className={`w-full py-4 px-6 rounded-xl text-left text-lg font-medium transition-all duration-200 border ${
                selected === swimmer.id
                  ? 'bg-[#06B6D4]/20 border-[#06B6D4] text-white shadow-lg shadow-[#06B6D4]/10'
                  : 'bg-[#111D33] border-[#1E3050] text-[#CBD5E1] hover:border-[#06B6D4]/50 hover:bg-[#162038] active:scale-[0.98]'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#0891B2] flex items-center justify-center text-white text-sm font-bold">
                  {swimmer.name.split(' ').map((n) => n[0]).join('')}
                </span>
                {swimmer.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-12 text-xs text-[#475569]">
        Prototype v0.1
      </p>
    </div>
  );
}
