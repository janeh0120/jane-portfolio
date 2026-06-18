import { ensureActiveVersion } from './versions';
import { getSupabase } from './supabase';
import type { DeviceMeta } from './device';

export type CommentCategory =
  | ''
  | 'accessibility'
  | 'content'
  | 'visual-design'
  | 'bug';

export type PortfolioComment = {
  id: string;
  versionId: string | null;
  pageUrl: string;
  selector: string;
  elementLabel: string;
  elementDisplayName?: string;
  category: CommentCategory;
  comment: string;
  createdAt: Date;
  deviceType: DeviceMeta['deviceType'];
  os: DeviceMeta['os'];
  viewportWidth: number;
  scrollY: number;
  visitorId?: string;
  upvoteCount?: number;
};

type CommentRow = {
  id: string;
  version_id: string | null;
  page_url: string;
  selector: string;
  element_label: string;
  element_display_name: string | null;
  category: string;
  comment: string;
  device_type: string;
  os: string;
  viewport_width: number;
  scroll_y: number;
  visitor_id: string | null;
  created_at: string;
};

function mapComment(row: CommentRow, upvoteCount = 0): PortfolioComment {
  return {
    id: row.id,
    versionId: row.version_id,
    pageUrl: row.page_url,
    selector: row.selector,
    elementLabel: row.element_label,
    elementDisplayName: row.element_display_name ?? undefined,
    category: (row.category || '') as CommentCategory,
    comment: row.comment,
    createdAt: new Date(row.created_at),
    deviceType: row.device_type as DeviceMeta['deviceType'],
    os: row.os as DeviceMeta['os'],
    viewportWidth: row.viewport_width,
    scrollY: row.scroll_y,
    visitorId: row.visitor_id ?? undefined,
    upvoteCount,
  };
}

async function upvoteCountsFor(commentIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (commentIds.length === 0) return counts;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('comment_upvotes')
    .select('comment_id')
    .in('comment_id', commentIds);

  if (error) throw error;

  for (const row of data ?? []) {
    const id = row.comment_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return counts;
}

export async function insertComment(
  input: Omit<PortfolioComment, 'id' | 'createdAt' | 'upvoteCount'>,
): Promise<string> {
  const supabase = getSupabase();
  const versionId = input.versionId ?? (await ensureActiveVersion());

  const { data, error } = await supabase
    .from('comments')
    .insert({
      version_id: versionId,
      page_url: input.pageUrl,
      selector: input.selector,
      element_label: input.elementLabel,
      element_display_name: input.elementDisplayName ?? null,
      category: input.category,
      comment: input.comment,
      device_type: input.deviceType,
      os: input.os,
      viewport_width: input.viewportWidth,
      scroll_y: input.scrollY,
      visitor_id: input.visitorId ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function listComments(limit = 200): Promise<PortfolioComment[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  const rows = (data ?? []) as CommentRow[];
  const counts = await upvoteCountsFor(rows.map((row) => row.id));
  return rows.map((row) => mapComment(row, counts.get(row.id) ?? 0));
}

export async function listCommentsByVersion(versionId: string): Promise<PortfolioComment[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('version_id', versionId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as CommentRow[];
  const counts = await upvoteCountsFor(rows.map((row) => row.id));
  return rows.map((row) => mapComment(row, counts.get(row.id) ?? 0));
}

export async function listPublicComments(pageUrl: string): Promise<PortfolioComment[]> {
  const versionId = await ensureActiveVersion();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('version_id', versionId)
    .eq('page_url', pageUrl)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as CommentRow[];
  const counts = await upvoteCountsFor(rows.map((row) => row.id));
  return rows.map((row) => mapComment(row, counts.get(row.id) ?? 0));
}

export async function getCommentById(id: string): Promise<PortfolioComment | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('comments').select('*').eq('id', id).maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const counts = await upvoteCountsFor([id]);
  return mapComment(data as CommentRow, counts.get(id) ?? 0);
}

export class CommentAuthError extends Error {
  constructor(
    readonly code: 'NOT_FOUND' | 'FORBIDDEN',
    message: string,
  ) {
    super(message);
    this.name = 'CommentAuthError';
  }
}

export async function updateCommentByVisitor(
  id: string,
  visitorId: string,
  patch: { comment?: string; category?: CommentCategory },
): Promise<void> {
  const existing = await getCommentById(id);
  if (!existing) throw new CommentAuthError('NOT_FOUND', 'Comment not found.');
  if (!existing.visitorId || existing.visitorId !== visitorId) {
    throw new CommentAuthError('FORBIDDEN', 'You can only edit your own comments.');
  }

  const updates: { comment?: string; category?: string } = {};
  if (patch.comment !== undefined) updates.comment = patch.comment;
  if (patch.category !== undefined) updates.category = patch.category;

  if (Object.keys(updates).length === 0) return;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('comments')
    .update(updates)
    .eq('id', id)
    .eq('visitor_id', visitorId)
    .select('id');

  if (error) throw error;
  if (!data?.length) throw new CommentAuthError('FORBIDDEN', 'You can only edit your own comments.');
}

export async function deleteCommentByVisitor(id: string, visitorId: string): Promise<void> {
  const existing = await getCommentById(id);
  if (!existing) throw new CommentAuthError('NOT_FOUND', 'Comment not found.');
  if (!existing.visitorId || existing.visitorId !== visitorId) {
    throw new CommentAuthError('FORBIDDEN', 'You can only delete your own comments.');
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id)
    .eq('visitor_id', visitorId)
    .select('id');

  if (error) throw error;
  if (!data?.length) throw new CommentAuthError('FORBIDDEN', 'You can only delete your own comments.');
}

export async function addUpvote(commentId: string, voterFingerprint: string): Promise<number> {
  const supabase = getSupabase();

  const { error } = await supabase.from('comment_upvotes').insert({
    comment_id: commentId,
    voter_fingerprint: voterFingerprint,
  });

  if (error) {
    if (error.code === '23505') {
      const { count, error: countError } = await supabase
        .from('comment_upvotes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', commentId);

      if (countError) throw countError;
      return count ?? 0;
    }
    throw error;
  }

  const { count, error: countError } = await supabase
    .from('comment_upvotes')
    .select('*', { count: 'exact', head: true })
    .eq('comment_id', commentId);

  if (countError) throw countError;
  return count ?? 0;
}
