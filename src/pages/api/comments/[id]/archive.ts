import type { APIRoute } from 'astro';
import { isAdminSession, isCrossSiteRequest } from '../../../../lib/admin-auth';
import {
  archiveComment,
  CommentAuthError,
  restoreComment,
  type ArchiveReason,
} from '../../../../lib/comments';

export const prerender = false;

const VALID_REASONS = new Set<ArchiveReason>(['not-feedback', 'resolved']);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(error: unknown, label: string) {
  if (error instanceof CommentAuthError && error.code === 'NOT_FOUND') {
    return json({ error: error.message }, 404);
  }
  console.error(label, error);
  return json({ error: 'Unable to update comment.' }, 503);
}

export const POST: APIRoute = async ({ cookies, params, request }) => {
  if (!isAdminSession(cookies) || isCrossSiteRequest(request)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const reason = String(body.reason ?? '') as ArchiveReason;
    if (!VALID_REASONS.has(reason)) return json({ error: 'Invalid archive reason.' }, 400);

    const archivedAt = await archiveComment(params.id ?? '', reason);
    return json({ ok: true, archivedAt: archivedAt.toISOString(), reason });
  } catch (error) {
    return errorResponse(error, 'POST /api/comments/[id]/archive');
  }
};

export const DELETE: APIRoute = async ({ cookies, params, request }) => {
  if (!isAdminSession(cookies) || isCrossSiteRequest(request)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    await restoreComment(params.id ?? '');
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error, 'DELETE /api/comments/[id]/archive');
  }
};
