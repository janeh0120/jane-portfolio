import { checkRateLimit } from './rate-limit';

export type SubmissionGuardCode = 'duplicate_submit' | 'burst_limited' | 'identical_flood';

export type SubmissionGuardResult =
  | { ok: true }
  | { ok: false; code: SubmissionGuardCode; message: string; retryAfterSec?: number };

export const SUBMISSION_GUARD_MESSAGES: Record<SubmissionGuardCode, string> = {
  duplicate_submit: 'You already posted this on this section. Edit it or wait a moment.',
  burst_limited: "Slow down — you're posting too quickly. Try again in a moment.",
  identical_flood: "You've posted this same comment many times. Try varying your feedback.",
};

const DUPLICATE_WINDOW_MS = 60_000;
const BURST_WINDOW_MS = 60_000;
const BURST_LIMIT = 5;
const IDENTICAL_WINDOW_MS = 10 * 60_000;
const IDENTICAL_LIMIT = 8;

function commentFingerprint(comment: string): string {
  return comment.trim().toLowerCase();
}

export function checkCommentSubmission(input: {
  visitorId?: string;
  pageUrl: string;
  selector: string;
  comment: string;
}): SubmissionGuardResult {
  const { visitorId, pageUrl, selector, comment } = input;
  if (!visitorId) return { ok: true };

  const fingerprint = commentFingerprint(comment);

  const duplicateKey = `comment-dup:${visitorId}:${pageUrl}:${selector}:${fingerprint}`;
  const duplicate = checkRateLimit(duplicateKey, 1, DUPLICATE_WINDOW_MS);
  if (!duplicate.ok) {
    return {
      ok: false,
      code: 'duplicate_submit',
      message: SUBMISSION_GUARD_MESSAGES.duplicate_submit,
    };
  }

  const burstKey = `comment-post-burst:${visitorId}`;
  const burst = checkRateLimit(burstKey, BURST_LIMIT, BURST_WINDOW_MS);
  if (!burst.ok) {
    return {
      ok: false,
      code: 'burst_limited',
      message: SUBMISSION_GUARD_MESSAGES.burst_limited,
      retryAfterSec: burst.retryAfterSec,
    };
  }

  const identicalKey = `comment-identical:${visitorId}:${fingerprint}`;
  const identical = checkRateLimit(identicalKey, IDENTICAL_LIMIT, IDENTICAL_WINDOW_MS);
  if (!identical.ok) {
    return {
      ok: false,
      code: 'identical_flood',
      message: SUBMISSION_GUARD_MESSAGES.identical_flood,
      retryAfterSec: identical.retryAfterSec,
    };
  }

  return { ok: true };
}

export function rateLimitedCommentMessage(retryAfterSec: number): {
  code: 'rate_limited';
  message: string;
} {
  return {
    code: 'rate_limited',
    message: `Too many comments. Try again in ${retryAfterSec}s.`,
  };
}
