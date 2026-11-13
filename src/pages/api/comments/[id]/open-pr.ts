import type { APIRoute } from 'astro';
import {
  isAdminSession,
  isCrossSiteRequest,
  isGitHubVerified,
} from '../../../../lib/admin-auth';
import { getCommentById } from '../../../../lib/comments';
import {
  branchForComment,
  buildClaudeTaskText,
  countPrRequestsToday,
  createPrRequest,
  DuplicatePrRequestError,
  isClaudeTaskConfigured,
  MAX_PROMPT_LENGTH,
  MAX_PR_REQUESTS_PER_DAY,
  startClaudeTask,
  supersedePrRequests,
  updatePrRequest,
} from '../../../../lib/pr-requests';

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ cookies, params, request }) => {
  if (!isAdminSession(cookies) || isCrossSiteRequest(request)) {
    return json({ error: 'Unauthorized' }, 401);
  }
  if (!isGitHubVerified(cookies)) {
    return json({ error: 'Sign in with GitHub first.', code: 'github_required' }, 403);
  }
  if (!isClaudeTaskConfigured()) {
    return json({ error: 'The Claude task is not configured on the server.' }, 503);
  }

  let requestId = '';

  try {
    const body = await request.json().catch(() => ({}));
    const prompt = body.prompt === undefined ? null : String(body.prompt).trim();
    if (prompt === '') return json({ error: 'The prompt is empty.' }, 400);
    if (prompt && prompt.length > MAX_PROMPT_LENGTH) {
      return json({ error: 'Prompt is too long (max 2000 characters).' }, 400);
    }

    const comment = await getCommentById(params.id ?? '');
    if (!comment) return json({ error: 'Comment not found.' }, 404);
    if (comment.archivedAt) return json({ error: 'Restore this comment first.' }, 409);

    // A visitor can edit their comment, so only send the text that was actually reviewed.
    if (body.reviewedComment !== comment.comment) {
      return json(
        { error: 'This comment changed since you loaded it. Reload to review it again.', code: 'comment_changed' },
        409,
      );
    }

    if ((await countPrRequestsToday()) >= MAX_PR_REQUESTS_PER_DAY) {
      return json({ error: `Limit of ${MAX_PR_REQUESTS_PER_DAY} PRs per day reached.` }, 429);
    }

    // Unchanged text stays visitor text, so pressing send doesn't promote it to your instruction.
    const ownerPrompt = prompt && prompt !== comment.comment.trim() ? prompt : '';

    if (body.retry === true) await supersedePrRequests(comment.id);

    const branch = branchForComment(comment.id);
    requestId = await createPrRequest(comment.id, ownerPrompt, branch);

    const sessionUrl = await startClaudeTask(buildClaudeTaskText(comment, ownerPrompt, branch));
    await updatePrRequest(requestId, { session_url: sessionUrl });

    return json({ ok: true, branch, sessionUrl, sentPrompt: ownerPrompt });
  } catch (error) {
    if (error instanceof DuplicatePrRequestError) {
      return json({ error: 'A PR was already requested for this comment.' }, 409);
    }
    console.error('POST /api/comments/[id]/open-pr', error);
    if (requestId) {
      await updatePrRequest(requestId, { status: 'failed' }).catch((updateError) =>
        console.error('Could not mark PR request as failed', updateError),
      );
    }
    return json({ error: 'Could not start Claude. Nothing was changed, so you can try again.' }, 502);
  }
};
