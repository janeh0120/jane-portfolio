import type { APIRoute } from 'astro';
import { addUpvote } from '../../../../lib/comments';
import { checkRateLimit, getClientIp } from '../../../../lib/rate-limit';

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ params, request }) => {
  const commentId = params.id;
  if (!commentId) {
    return json({ error: 'Comment id is required.' }, 400);
  }

  const ip = getClientIp(request);
  const rate = checkRateLimit(`upvote:${ip}`, 60, 60 * 60 * 1000);
  if (!rate.ok) {
    return json({ error: `Too many upvotes. Try again in ${rate.retryAfterSec}s.` }, 429);
  }

  try {
    const body = await request.json();
    const voterFingerprint = String(body.voterFingerprint ?? '').trim().slice(0, 128);

    if (!voterFingerprint) {
      return json({ error: 'voterFingerprint is required.' }, 400);
    }

    const upvoteCount = await addUpvote(commentId, voterFingerprint);
    return json({ ok: true, upvoteCount });
  } catch (error) {
    console.error('POST /api/comments/[id]/upvote', error);
    return json({ error: 'Unable to record upvote.' }, 503);
  }
};
