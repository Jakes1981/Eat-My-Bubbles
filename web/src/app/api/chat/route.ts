import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { messages, swimmerContext } = await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      content: 'AI Coach is being configured. Check back soon!',
    });
  }

  const client = new Anthropic({ apiKey });

  const systemPrompt = `You are the Eat My Bubbles AI Swim Coach. You help competitive swimmers improve.

SWIMMER CONTEXT:
${swimmerContext}

GUIDELINES:
- Reference the swimmer's actual times and data in your responses
- Ground advice in swimming science
- Be encouraging but honest about where they stand
- Do NOT prescribe specific training sets (that's their coach's job)
- Focus on strategy, goal-setting, technique cues, and race planning
- Keep responses concise (2-3 paragraphs max)
- Use the swimmer's first name`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    });

    return NextResponse.json({
      content:
        response.content[0].type === 'text' ? response.content[0].text : '',
    });
  } catch (error) {
    console.error('[chat] API error:', error);
    return NextResponse.json({
      content:
        'Sorry, I encountered an error. Please try again in a moment.',
    });
  }
}
