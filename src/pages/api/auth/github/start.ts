import type { APIRoute } from 'astro';
import { GITHUB_OAUTH_CLIENT_ID } from 'astro:env/server';
import { createOAuthState, isAdminSession } from '../../../../lib/admin-auth';

export const prerender = false;

const COMMENT_ID = /^[0-9a-f-]{36}$/i;

export const GET: APIRoute = async ({ cookies, redirect, url }) => {
  if (!isAdminSession(cookies)) return redirect('/admin/login', 303);
  if (!GITHUB_OAUTH_CLIENT_ID) {
    return new Response('GitHub sign-in is not configured on the server.', { status: 503 });
  }

  const comment = url.searchParams.get('comment') ?? '';
  const state = createOAuthState(cookies, COMMENT_ID.test(comment) ? comment : '');

  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', GITHUB_OAUTH_CLIENT_ID);
  authorize.searchParams.set('redirect_uri', `${url.origin}/api/auth/github/callback`);
  authorize.searchParams.set('state', state);
  // No scope: this only needs to read who you are.
  authorize.searchParams.set('scope', '');
  authorize.searchParams.set('allow_signup', 'false');

  return redirect(authorize.href, 302);
};
