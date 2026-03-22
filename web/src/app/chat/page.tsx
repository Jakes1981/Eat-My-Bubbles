'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SWIMMERS, SWIMMER_RESULTS, EVENTS, WORLD_TOP3 } from '@/data/seed-data';
import { formatTime } from '@/lib/swim-utils';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import ChatMessage from '@/components/ChatMessage';
import NavBar from '@/components/NavBar';

const SUGGESTED_QUESTIONS = [
  'How can I improve my 100 Free?',
  "Compare me to the world's best",
  'What should I focus on this season?',
];

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = localStorage.getItem('swimmerId');
    if (!id) {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function buildSwimmerContext(): string {
    const id = localStorage.getItem('swimmerId');
    if (!id) return '';

    const swimmer = SWIMMERS.find((s) => s.id === id);
    if (!swimmer) return '';

    const results = SWIMMER_RESULTS[id] ?? [];
    const currentYear = new Date().getFullYear();
    const age = currentYear - swimmer.birthYear;

    let ctx = `Name: ${swimmer.name}\nAge: ${age}\nClub: ${swimmer.club}\nProvince: ${swimmer.province}\nCountry: ${swimmer.country}\n\nPersonal Bests:\n`;

    results.forEach((r) => {
      const event = EVENTS.find((e) => e.slug === r.eventSlug);
      const worldEntry = WORLD_TOP3.find(
        (w) => w.eventSlug === r.eventSlug && w.gender === swimmer.gender
      );
      const worldBest = worldEntry?.swimmers?.[0]?.swimmer?.currentPB;
      ctx += `- ${event?.shortName ?? r.eventSlug}: ${formatTime(r.timeSeconds)}`;
      if (worldBest) {
        const gap = ((r.timeSeconds - worldBest) / worldBest) * 100;
        ctx += ` (World #1: ${formatTime(worldBest)}, gap: +${gap.toFixed(1)}%)`;
      }
      ctx += '\n';
    });

    return ctx;
  }

  async function sendMessage(text: string) {
    if (!text.trim()) return;

    const userMessage: ChatMessageType = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          swimmerContext: buildSwimmerContext(),
        }),
      });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      setMessages([
        ...newMessages,
        { role: 'assistant', content: data.content },
      ]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'AI Coach is being set up. Check back soon!',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 border-b border-[#1E3050]">
        <h1 className="text-xl font-bold text-white">AI Swim Coach</h1>
        <p className="text-xs text-[#64748B]">Powered by Claude</p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3">🏊</div>
            <h2 className="text-lg font-semibold text-white mb-1">
              Hi! I&apos;m your AI Coach
            </h2>
            <p className="text-sm text-[#64748B] mb-6 max-w-xs">
              Ask me anything about your swimming, race strategy, or how you
              compare to the world&apos;s best.
            </p>

            {/* Suggested questions */}
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="py-3 px-4 bg-[#111D33] border border-[#1E3050] rounded-xl text-sm text-[#94A3B8] text-left hover:border-[#06B6D4]/50 hover:text-white transition-colors active:scale-[0.98]"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}

        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="w-8 h-8 rounded-full bg-[#1E3050] flex items-center justify-center text-sm shrink-0 mr-2 mt-1">
              🏊
            </div>
            <div className="bg-[#1E3050] rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-[#64748B] rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-[#64748B] rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-2 bg-[#64748B] rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-[#1E3050] bg-[#0D1B2A] mb-16">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask your AI coach..."
            className="flex-1 bg-[#111D33] border border-[#1E3050] rounded-xl px-4 py-3 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#06B6D4] transition-colors"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="bg-[#06B6D4] text-white px-4 py-3 rounded-xl font-medium text-sm hover:bg-[#0891B2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-[0.95] shrink-0"
          >
            Send
          </button>
        </div>
      </div>

      <NavBar />
    </div>
  );
}
