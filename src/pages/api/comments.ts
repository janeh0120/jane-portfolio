import type { APIRoute } from 'astro';
import { ADMIN_SECRET } from 'astro:env/server';
import { insertComment, listComments } from '../../lib/comments';
import { parseDeviceMeta } from '../../lib/device';

export const prerender = false;

const MAX_COMMENT_LENGTH = 2000;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const comment = String(body.comment ?? '').trim();
    const selector = String(body.selector ?? '').trim();
    const pageUrl = String(body.pageUrl ?? '').trim();
    const elementLabel = String(body.elementLabel ?? '').trim().slice(0, 200);
    const viewportWidth = Number(body.viewportWidth ?? 0);
    const userAgent = request.headers.get('user-agent') ?? '';

    if (!comment || comment.length > MAX_COMMENT_LENGTH) {
      return json({ error: 'Comment is required (max 2000 characters).' }, 400);
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
      comment,
      deviceType: device.deviceType,
      os: device.os,
      viewportWidth: device.viewportWidth,
    });

    return json({ ok: true, id });
  } catch (error) {
    console.error('POST /api/comments', error);
    return json({ error: 'Unable to save comment. Is the database configured?' }, 503);
  }
};

export const GET: APIRoute = async ({ request, url }) => {
  const provided =
    request.headers.get('x-admin-secret') ?? url.searchParams.get('key') ?? '';

  if (!ADMIN_SECRET || provided !== ADMIN_SECRET) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const comments = await listComments();
    return json({ comments });
  } catch (error) {
    console.error('GET /api/comments', error);
    return json({ error: 'Unable to load comments.' }, 503);
  }
};
