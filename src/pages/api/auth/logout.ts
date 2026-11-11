import type { APIRoute } from 'astro';
import { endAdminSession, isCrossSiteRequest } from '../../../lib/admin-auth';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect, request }) => {
  if (!isCrossSiteRequest(request)) endAdminSession(cookies);
  return redirect('/admin/login', 303);
};
