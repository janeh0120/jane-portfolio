import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { AstroCookies } from 'astro';
import { ADMIN_GITHUB_USER_ID, ADMIN_SECRET } from 'astro:env/server';

const SESSION_COOKIE = 'admin_session';
const GITHUB_COOKIE = 'admin_github';
const OAUTH_STATE_COOKIE = 'admin_github_state';

const SESSION_TTL_SEC = 12 * 60 * 60;
const GITHUB_TTL_SEC = 60 * 60;
const OAUTH_STATE_TTL_SEC = 10 * 60;

const baseCookie = {
  path: '/',
  httpOnly: true,
  secure: import.meta.env.PROD,
} as const;

function equalSecrets(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

/** Derived from the password, so rotating ADMIN_SECRET signs every session out. */
function signingKey(): Buffer {
  return createHmac('sha256', ADMIN_SECRET).update('admin-session-v1').digest();
}

function sign(payload: string): string {
  return createHmac('sha256', signingKey()).update(payload).digest('base64url');
}

function createToken(data: Record<string, unknown>, ttlSec: number): string {
  const payload = Buffer.from(
    JSON.stringify({ ...data, exp: Math.floor(Date.now() / 1000) + ttlSec }),
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function readToken(token: string | undefined): Record<string, unknown> | null {
  if (!ADMIN_SECRET || !token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !equalSecrets(signature, sign(payload))) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof data.exp === 'number' && data.exp > Date.now() / 1000 ? data : null;
  } catch {
    return null;
  }
}

export function isPasswordCorrect(password: string): boolean {
  return Boolean(ADMIN_SECRET) && equalSecrets(password, ADMIN_SECRET);
}

export function startAdminSession(cookies: AstroCookies) {
  cookies.set(SESSION_COOKIE, createToken({ role: 'admin' }, SESSION_TTL_SEC), {
    ...baseCookie,
    sameSite: 'strict',
    maxAge: SESSION_TTL_SEC,
  });
}

export function endAdminSession(cookies: AstroCookies) {
  cookies.delete(SESSION_COOKIE, { path: '/' });
  cookies.delete(GITHUB_COOKIE, { path: '/' });
}

export function isAdminSession(cookies: AstroCookies): boolean {
  return readToken(cookies.get(SESSION_COOKIE)?.value)?.role === 'admin';
}

/** The numeric GitHub ID can't be taken over by renaming an account, unlike a username. */
export function isAllowedGitHubUser(id: unknown): boolean {
  return Boolean(ADMIN_GITHUB_USER_ID) && String(id) === ADMIN_GITHUB_USER_ID;
}

export function startGitHubVerification(cookies: AstroCookies, githubId: unknown) {
  cookies.set(GITHUB_COOKIE, createToken({ github: String(githubId) }, GITHUB_TTL_SEC), {
    ...baseCookie,
    sameSite: 'strict',
    maxAge: GITHUB_TTL_SEC,
  });
}

export function isGitHubVerified(cookies: AstroCookies): boolean {
  const data = readToken(cookies.get(GITHUB_COOKIE)?.value);
  return Boolean(data) && isAllowedGitHubUser(data?.github);
}

/** Lax, because this cookie has to come back on the redirect from github.com. */
export function createOAuthState(cookies: AstroCookies, commentId: string): string {
  const state = randomBytes(24).toString('base64url');
  cookies.set(OAUTH_STATE_COOKIE, createToken({ state, commentId }, OAUTH_STATE_TTL_SEC), {
    ...baseCookie,
    sameSite: 'lax',
    maxAge: OAUTH_STATE_TTL_SEC,
  });
  return state;
}

export function consumeOAuthState(
  cookies: AstroCookies,
  state: string,
): { commentId: string } | null {
  const data = readToken(cookies.get(OAUTH_STATE_COOKIE)?.value);
  cookies.delete(OAUTH_STATE_COOKIE, { path: '/' });
  if (!data || typeof data.state !== 'string' || !state || !equalSecrets(data.state, state)) {
    return null;
  }
  return { commentId: typeof data.commentId === 'string' ? data.commentId : '' };
}

/** Browsers report where a request came from; block writes that started on another site. */
export function isCrossSiteRequest(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site');
  return site !== null && site !== 'same-origin' && site !== 'none';
}

/** A keyed hash, so rate limit rows never store a visitor's raw IP address. */
export function hashForRateLimit(value: string): string {
  return createHmac('sha256', signingKey()).update(value).digest('base64url').slice(0, 32);
}
