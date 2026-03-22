import { supabase } from './supabase';

export async function trackEvent(
  userId: string,
  screen: string,
  action: string,
  eventSlug?: string,
  metadata?: Record<string, unknown>
) {
  const payload = {
    user_id: userId,
    screen,
    action,
    event_slug: eventSlug ?? null,
    metadata: metadata ?? null,
    created_at: new Date().toISOString(),
  };

  try {
    // Only attempt Supabase insert when both env vars are present
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      const { error } = await supabase
        .from('analytics_events')
        .insert(payload);

      if (error) {
        console.warn('[analytics] Supabase insert failed:', error.message);
      }
    } else {
      // Dev mode — log to console
      console.log('[analytics]', payload);
    }
  } catch (err) {
    console.warn('[analytics] Unexpected error:', err);
  }
}
