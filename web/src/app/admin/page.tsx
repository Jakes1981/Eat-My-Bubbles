'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { EVENTS } from '@/data/seed-data';
import NavBar from '@/components/NavBar';

const ADMIN_PASSWORD = 'eatmybubbles2026';

// Mock analytics data
const MOCK_ANALYTICS = [
  { screen: 'events', views: 48 },
  { screen: 'profile', views: 32 },
  { screen: 'chat', views: 24 },
  { screen: 'event-detail', views: 56 },
];

const MOCK_EVENT_VIEWS = EVENTS.slice(0, 6).map((e, i) => ({
  name: e.shortName,
  views: Math.floor(Math.random() * 30) + 10 + (6 - i) * 5,
}));

const MOCK_RECENT_EVENTS = [
  { user: 'Noa Burger', action: 'Viewed 100 Free trajectory', time: '2 min ago' },
  { user: 'Emma Wilson', action: 'Opened AI Coach', time: '5 min ago' },
  { user: 'Liam Chen', action: 'Viewed profile', time: '12 min ago' },
  { user: 'Sophie Anderson', action: 'Viewed 200 IM trajectory', time: '18 min ago' },
  { user: 'Jake Roberts', action: 'Logged in', time: '25 min ago' },
];

export default function AdminPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('swimmerId');
    if (!id) {
      router.push('/');
      return;
    }
    // Check if already authenticated this session
    if (sessionStorage.getItem('adminAuth') === 'true') {
      setAuthenticated(true);
    }
  }, [router]);

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      setError('');
    } else {
      setError('Incorrect password');
    }
  }

  if (!authenticated) {
    return (
      <div className="flex flex-col min-h-screen pb-20">
        <div className="flex flex-col items-center justify-center flex-1 px-6">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-white mb-1">Admin Access</h1>
          <p className="text-sm text-[#64748B] mb-6">Enter admin password to continue</p>

          <div className="w-full max-w-xs">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLogin();
              }}
              placeholder="Password"
              className="w-full bg-[#111D33] border border-[#1E3050] rounded-xl px-4 py-3 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#06B6D4] transition-colors mb-3"
            />
            {error && (
              <p className="text-xs text-red-400 mb-3">{error}</p>
            )}
            <button
              onClick={handleLogin}
              className="w-full bg-[#06B6D4] text-white py-3 rounded-xl font-medium text-sm hover:bg-[#0891B2] transition-colors active:scale-[0.98]"
            >
              Unlock
            </button>
          </div>
        </div>
        <NavBar />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-sm text-[#64748B]">Prototype analytics</p>
      </div>

      {/* Stats cards */}
      <div className="px-4 grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#111D33] rounded-xl border border-[#1E3050] p-4 text-center">
          <p className="text-2xl font-bold text-[#06B6D4]">23</p>
          <p className="text-[10px] text-[#64748B] uppercase tracking-wider mt-1">Logins</p>
        </div>
        <div className="bg-[#111D33] rounded-xl border border-[#1E3050] p-4 text-center">
          <p className="text-2xl font-bold text-[#F59E0B]">156</p>
          <p className="text-[10px] text-[#64748B] uppercase tracking-wider mt-1">Page Views</p>
        </div>
        <div className="bg-[#111D33] rounded-xl border border-[#1E3050] p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">5</p>
          <p className="text-[10px] text-[#64748B] uppercase tracking-wider mt-1">Swimmers</p>
        </div>
      </div>

      {/* Most viewed events chart */}
      <div className="px-4 mb-6">
        <h2 className="text-sm text-[#64748B] uppercase tracking-wider font-medium mb-3">
          Most Viewed Events
        </h2>
        <div className="bg-[#111D33] rounded-xl border border-[#1E3050] p-4">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_EVENT_VIEWS} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3050" />
                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  tickLine={{ stroke: '#1E3050' }}
                  angle={-30}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  stroke="#64748B"
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  tickLine={{ stroke: '#1E3050' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111D33',
                    border: '1px solid #1E3050',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#E2E8F0',
                  }}
                />
                <Bar dataKey="views" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent events */}
      <div className="px-4 mb-6">
        <h2 className="text-sm text-[#64748B] uppercase tracking-wider font-medium mb-3">
          Recent Activity
        </h2>
        <div className="bg-[#111D33] rounded-xl border border-[#1E3050] overflow-hidden">
          {MOCK_RECENT_EVENTS.map((event, i) => (
            <div
              key={i}
              className={`px-4 py-3 flex items-center justify-between ${
                i < MOCK_RECENT_EVENTS.length - 1 ? 'border-b border-[#1E3050]/50' : ''
              }`}
            >
              <div>
                <p className="text-sm font-medium text-white">{event.user}</p>
                <p className="text-xs text-[#64748B]">{event.action}</p>
              </div>
              <span className="text-xs text-[#475569] shrink-0 ml-2">{event.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Screen views breakdown */}
      <div className="px-4 mb-6">
        <h2 className="text-sm text-[#64748B] uppercase tracking-wider font-medium mb-3">
          Screen Views
        </h2>
        <div className="bg-[#111D33] rounded-xl border border-[#1E3050] overflow-hidden">
          {MOCK_ANALYTICS.map((item, i) => (
            <div
              key={item.screen}
              className={`px-4 py-3 flex items-center justify-between ${
                i < MOCK_ANALYTICS.length - 1 ? 'border-b border-[#1E3050]/50' : ''
              }`}
            >
              <span className="text-sm text-white capitalize">{item.screen}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-[#0D1B2A] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#06B6D4] rounded-full"
                    style={{ width: `${(item.views / 60) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-[#64748B] tabular-nums w-8 text-right">
                  {item.views}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <NavBar />
    </div>
  );
}
