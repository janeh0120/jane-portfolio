import type { APIRoute } from 'astro';
import {
  CommentAuthError,
  deleteCommentByVisitor,
  updateCommentByVisitor,
  type CommentCategory,
} from '../../../lib/comments';
import { validateComment } from '../../../lib/comment-validation';
import { checkRateLimit, getClientIp } from '../../../lib/rate-limit';

export const prerender = false;

const MAX_COMMENT_LENGTH = 2000;
const VALID_CATEGORIES = new Set<CommentCategory>([
  '',
  'accessibility',
  'content',
  'visual-design',
  'bug',
]);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mapAuthError(error: unknown) {
  if (error instanceof CommentAuthError) {
    if (error.code === 'NOT_FOUND') return json({ error: error.message }, 404);
    return json({ error: error.message }, 403);
  }
  return null;
}

export const PATCH: APIRoute = async ({ params, request }) => {
  const commentId = params.id;
  if (!commentId) return json({ error: 'Comment id is required.' }, 400);

  const ip = getClientIp(request);
  const rate = checkRateLimit(`comment-patch:${ip}`, 60, 60 * 60 * 1000);
  if (!rate.ok) {
    return json({ error: `Too many updates. Try again in ${rate.retryAfterSec}s.` }, 429);
  }

  try {
    const body = await request.json();
    const visitorId = String(body.visitorId ?? '').trim().slice(0, 64);
    if (!visitorId) return json({ error: 'visitorId is required.' }, 400);

    const patch: { comment?: string; category?: CommentCategory } = {};

    if (body.comment !== undefined) {
      const comment = String(body.comment).trim();
      if (!comment || comment.length > MAX_COMMENT_LENGTH) {
        return json({ error: 'Comment is required (max 2000 characters).' }, 400);
      }
      const validation = validateComment(comment);
      if (!validation.ok) {
        return json({ error: validation.message, code: validation.code }, 400);
      }
      patch.comment = comment;
    }

    if (body.category !== undefined) {
      const rawCategory = String(body.category).trim() as CommentCategory;
      patch.category = VALID_CATEGORIES.has(rawCategory) ? rawCategory : '';
    }

    if (patch.comment === undefined && patch.category === undefined) {
      return json({ error: 'Nothing to update.' }, 400);
    }

    await updateCommentByVisitor(commentId, visitorId, patch);
    return json({ ok: true });
  } catch (error) {
    const auth = mapAuthError(error);
    if (auth) return auth;
    console.error('PATCH /api/comments/[id]', error);
    return json({ error: 'Unable to update comment.' }, 503);
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  const commentId = params.id;
  if (!commentId) return json({ error: 'Comment id is required.' }, 400);

  const ip = getClientIp(request);
  const rate = checkRateLimit(`comment-delete:${ip}`, 30, 60 * 60 * 1000);
  if (!rate.ok) {
    return json({ error: `Too many deletes. Try again in ${rate.retryAfterSec}s.` }, 429);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const visitorId = String(body.visitorId ?? '').trim().slice(0, 64);
    if (!visitorId) return json({ error: 'visitorId is required.' }, 400);

    await deleteCommentByVisitor(commentId, visitorId);
    return json({ ok: true });
  } catch (error) {
    const auth = mapAuthError(error);
    if (auth) return auth;
    console.error('DELETE /api/comments/[id]', error);
    return json({ error: 'Unable to delete comment.' }, 503);
  }
};
