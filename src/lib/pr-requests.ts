import { CLAUDE_TASK_FIRE_URL, CLAUDE_TASK_TOKEN } from 'astro:env/server';
import type { PortfolioComment } from './comments';
import { getSupabase } from './supabase';

export const MAX_PR_REQUESTS_PER_DAY = 10;
export const MAX_OWNER_NOTE_LENGTH = 2000;

export type PrRequest = {
  id: string;
  commentId: string;
  ownerNote: string;
  status: 'requested' | 'failed';
  branch: string;
  sessionUrl: string | null;
  createdAt: Date;
};

type PrRequestRow = {
  id: string;
  comment_id: string;
  owner_note: string;
  status: PrRequest['status'];
  branch: string;
  session_url: string | null;
  created_at: string;
};

export class DuplicatePrRequestError extends Error {}

function mapPrRequest(row: PrRequestRow): PrRequest {
  return {
    id: row.id,
    commentId: row.comment_id,
    ownerNote: row.owner_note,
    status: row.status,
    branch: row.branch,
    sessionUrl: row.session_url,
    createdAt: new Date(row.created_at),
  };
}

/** Uses only the comment's ID, because branch names are public on GitHub. */
export function shortCommentId(commentId: string): string {
  return commentId.replace(/-/g, '').slice(0, 8);
}

export function branchForComment(commentId: string): string {
  return `claude/comment-${shortCommentId(commentId)}`;
}

export function isClaudeTaskConfigured(): boolean {
  return Boolean(CLAUDE_TASK_FIRE_URL && CLAUDE_TASK_TOKEN);
}

/** The most recent request for each comment. */
export async function latestPrRequests(commentIds: string[]): Promise<Map<string, PrRequest>> {
  const latest = new Map<string, PrRequest>();
  if (commentIds.length === 0) return latest;

  const { data, error } = await getSupabase()
    .from('pr_requests')
    .select('*')
    .in('comment_id', commentIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  for (const row of (data ?? []) as PrRequestRow[]) {
    if (!latest.has(row.comment_id)) latest.set(row.comment_id, mapPrRequest(row));
  }
  return latest;
}

export async function countPrRequestsToday(): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await getSupabase()
    .from('pr_requests')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', since);

  if (error) throw error;
  return count ?? 0;
}

export async function createPrRequest(
  commentId: string,
  ownerNote: string,
  branch: string,
): Promise<string> {
  const { data, error } = await getSupabase()
    .from('pr_requests')
    .insert({ comment_id: commentId, owner_note: ownerNote, branch })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') throw new DuplicatePrRequestError();
    throw error;
  }
  return data.id;
}

export async function updatePrRequest(
  id: string,
  patch: { status?: PrRequest['status']; session_url?: string },
): Promise<void> {
  const { error } = await getSupabase().from('pr_requests').update(patch).eq('id', id);
  if (error) throw error;
}

function pagePath(pageUrl: string): string {
  try {
    return new URL(pageUrl).pathname;
  } catch {
    return '/';
  }
}

/**
 * JSON keeps a visitor's text inside one escaped string, so it can't close a delimiter and
 * pose as an instruction. Older comments have no browser, and their OS is unreliable: Macs
 * used to be recorded as iOS.
 */
export function buildClaudeTaskText(
  comment: PortfolioComment,
  ownerNote: string,
  branch: string,
): string {
  const captured = Boolean(comment.browser);
  return JSON.stringify(
    {
      branch,
      commentId: comment.id,
      ownerNote,
      visitorComment: comment.comment,
      category: comment.category || null,
      page: pagePath(comment.pageUrl),
      element: comment.elementDisplayName || comment.elementLabel,
      selector: comment.selector,
      scrollY: comment.scrollY,
      device: {
        type: comment.deviceType,
        os: captured ? comment.os : null,
        browser: comment.browser ?? null,
        browserVersion: comment.browserVersion ?? null,
        viewportWidth: comment.viewportWidth,
        viewportHeight: comment.viewportHeight ?? null,
        devicePixelRatio: comment.devicePixelRatio ?? null,
        colorTheme: comment.colorTheme ?? null,
        reducedMotion: comment.reducedMotion ?? null,
      },
    },
    null,
    2,
  );
}

/**
 * This endpoint isn't in the Anthropic SDKs, so it's a direct request. It has no idempotency
 * key: every success starts a new run, so never retry it automatically.
 */
export async function startClaudeTask(text: string): Promise<string> {
  const response = await fetch(CLAUDE_TASK_FIRE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CLAUDE_TASK_TOKEN}`,
      'anthropic-version': '2026-10-21',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Claude task request failed with status ${response.status}`);
  }

  const data = (await response.json()) as { claude_code_session_url?: string };
  return data.claude_code_session_url ?? '';
}
