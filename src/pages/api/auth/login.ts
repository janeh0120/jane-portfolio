import type { APIRoute } from 'astro';
import {
  hashForRateLimit,
  isCrossSiteRequest,
  isPasswordCorrect,
  startAdminSession,
} from '../../../lib/admin-auth';
import { checkPersistentRateLimit } from '../../../lib/persistent-rate-limit';
import { getClientIp } from '../../../lib/rate-limit';

export const prerender = false;

const WINDOW_MS = 15 * 60 * 1000;

export const POST: APIRoute = async ({ cookies, redirect, request }) => {
  if (isCrossSiteRequest(request)) return redirect('/admin/login?error=invalid', 303);

  try {
    // The global limit stops guessing spread across many IP addresses.
    const ip = hashForRateLimit(getClientIp(request));
    const allowed =
      (await checkPersistentRateLimit(`login:${ip}`, 10, WINDOW_MS)) &&
      (await checkPersistentRateLimit('login:all', 50, WINDOW_MS));
    if (!allowed) return redirect('/admin/login?error=limit', 303);

    const form = await request.formData();
    if (!isPasswordCorrect(String(form.get('password') ?? ''))) {
      return redirect('/admin/login?error=invalid', 303);
    }

    startAdminSession(cookies);
    return redirect('/admin/review', 303);
  } catch (error) {
    console.error('POST /api/auth/login', error);
    return redirect('/admin/login?error=unavailable', 303);
  }
};
