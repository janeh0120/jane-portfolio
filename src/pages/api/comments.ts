import type { APIRoute } from 'astro';
import { ADMIN_SECRET } from 'astro:env/server';
import {
  addUpvote,
  insertComment,
  listComments,
  listCommentsByVersion,
  listPublicComments,
  type CommentCategory,
} from '../../lib/comments';
import { BLOCKED_CONTENT_MESSAGE, containsBlockedContent } from '../../lib/content-filter';
import { parseDeviceMeta } from '../../lib/device';
import { checkRateLimit, getClientIp } from '../../lib/rate-limit';

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

export const POST: APIRoute = async ({ request }) => {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`comment-post:${ip}`, 20, 60 * 60 * 1000);
  if (!rate.ok) {
    return json({ error: `Too many comments. Try again in ${rate.retryAfterSec}s.` }, 429);
  }

  try {
    const body = await request.json();
    const comment = String(body.comment ?? '').trim();
    const selector = String(body.selector ?? '').trim();
    const pageUrl = String(body.pageUrl ?? '').trim();
    const elementLabel = String(body.elementLabel ?? '').trim().slice(0, 200);
    const elementDisplayName = String(body.elementDisplayName ?? '').trim().slice(0, 80);
    const rawCategory = String(body.category ?? '').trim() as CommentCategory;
    const category: CommentCategory = VALID_CATEGORIES.has(rawCategory) ? rawCategory : '';
    const viewportWidth = Number(body.viewportWidth ?? 0);
    const scrollY = Number(body.scrollY ?? 0);
    const visitorId = String(body.visitorId ?? '').trim().slice(0, 64) || undefined;
    const userAgent = request.headers.get('user-agent') ?? '';

    if (!comment || comment.length > MAX_COMMENT_LENGTH) {
      return json({ error: 'Comment is required (max 2000 characters).' }, 400);
    }
    if (containsBlockedContent(comment)) {
      return json({ error: BLOCKED_CONTENT_MESSAGE }, 400);
    }
    if (!selector || selector.length > 500) {
      return json({ error: 'Invalid element selector.' }, 400);
    }
    if (!pageUrl) {
      return json({ error: 'Page URL is required.' }, 400);
    }

    const device = parseDeviceMeta(userAgent, viewportWidth || 0);

    const id = await insertComment({
      pageUrl,
      selector,
      elementLabel: elementLabel || selector,
      elementDisplayName: elementDisplayName || undefined,
      category,
      comment,
      deviceType: device.deviceType,
      os: device.os,
      viewportWidth: device.viewportWidth,
      scrollY: Number.isFinite(scrollY) ? Math.max(0, Math.round(scrollY)) : 0,
      visitorId,
      versionId: null,
    });

    return json({ ok: true, id });
  } catch (error) {
    console.error('POST /api/comments', error);
    return json({ error: 'Unable to save comment. Is Supabase configured?' }, 503);
  }
};

export const GET: APIRoute = async ({ request, url }) => {
  const isPublic = url.searchParams.get('public') === '1';
  const pageUrl = url.searchParams.get('pageUrl') ?? '';

  if (isPublic) {
    if (!pageUrl) {
      return json({ error: 'pageUrl is required for public comments.' }, 400);
    }

    try {
      const comments = await listPublicComments(pageUrl);
      return json({ comments });
    } catch (error) {
      console.error('GET /api/comments?public=1', error);
      return json({ error: 'Unable to load comments.' }, 503);
    }
  }

  const provided =
    request.headers.get('x-admin-secret') ?? url.searchParams.get('key') ?? '';

  if (!ADMIN_SECRET || provided !== ADMIN_SECRET) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const versionId = url.searchParams.get('versionId') ?? '';
    const comments = versionId
      ? await listCommentsByVersion(versionId)
      : await listComments();
    return json({ comments });
  } catch (error) {
    console.error('GET /api/comments', error);
    return json({ error: 'Unable to load comments.' }, 503);
  }
};
