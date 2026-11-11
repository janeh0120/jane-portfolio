import { getSupabase } from './supabase';

/**
 * A rate limit stored in the database, so it holds across Vercel's serverless instances
 * (the in-memory one in rate-limit.ts resets per instance). Used for admin actions.
 */
export async function checkPersistentRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const supabase = getSupabase();
  const since = new Date(Date.now() - windowMs).toISOString();

  const { count, error } = await supabase
    .from('admin_rate_events')
    .select('*', { count: 'exact', head: true })
    .eq('key', key)
    .gte('created_at', since);

  if (error) throw error;
  if ((count ?? 0) >= limit) return false;

  const { error: insertError } = await supabase.from('admin_rate_events').insert({ key });
  if (insertError) throw insertError;

  const { error: cleanupError } = await supabase
    .from('admin_rate_events')
    .delete()
    .eq('key', key)
    .lt('created_at', since);
  if (cleanupError) throw cleanupError;

  return true;
}
