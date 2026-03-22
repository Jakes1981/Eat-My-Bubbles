'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/events', label: 'Events', icon: '🏊' },
  { href: '/analysis', label: 'Analysis', icon: '📈' },
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

export default function NavBar() {
  const pathname = usePathname();
  const [swimmerId, setSwimmerId] = useState<string | null>(null);

  useEffect(() => {
    setSwimmerId(localStorage.getItem('swimmerId'));
  }, []);

  const visibleItems = NAV_ITEMS;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D1B2A]/95 backdrop-blur-lg border-t border-[#1E3050]">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-2 px-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-[#06B6D4] scale-105'
                  : 'text-[#64748B] hover:text-[#94A3B8] active:scale-95'
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className={`text-[10px] font-medium ${isActive ? 'text-[#06B6D4]' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#06B6D4]" />
              )}
            </Link>
          );
        })}
      </div>
      {/* Safe area for phones with home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
