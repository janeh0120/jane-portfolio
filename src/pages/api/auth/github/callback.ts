import type { APIRoute } from 'astro';
import { GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CLIENT_SECRET } from 'astro:env/server';
import {
  consumeOAuthState,
  isAllowedGitHubUser,
  startGitHubVerification,
} from '../../../../lib/admin-auth';

export const prerender = false;

function text(message: string, status: number) {
  return new Response(message, { status, headers: { 'Content-Type': 'text/plain' } });
}

export const GET: APIRoute = async ({ cookies, url }) => {
  const stored = consumeOAuthState(cookies, url.searchParams.get('state') ?? '');
  const code = url.searchParams.get('code') ?? '';
  if (!stored || !code) return text('GitHub sign-in could not be verified.', 400);

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: GITHUB_OAUTH_CLIENT_ID,
        client_secret: GITHUB_OAUTH_CLIENT_SECRET,
        code,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const { access_token: accessToken } = (await tokenResponse.json()) as {
      access_token?: string;
    };
    if (!accessToken) return text('GitHub sign-in failed.', 400);

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'portfolio-admin',
      },
      signal: AbortSignal.timeout(10000),
    });
    const user = (await userResponse.json()) as { id?: number };
    if (!isAllowedGitHubUser(user.id)) return text('This GitHub account is not allowed.', 403);

    startGitHubVerification(cookies, user.id);
  } catch (error) {
    console.error('GET /api/auth/github/callback', error);
    return text('GitHub sign-in failed.', 502);
  }

  const destination = stored.commentId
    ? `/admin/review?open=${encodeURIComponent(stored.commentId)}`
    : '/admin/review';

  // A page rather than a redirect: the admin cookie is SameSite=Strict, and a redirect that
  // began on github.com wouldn't include it, which would look like being signed out.
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${destination}"><title>Signing in</title>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
};
