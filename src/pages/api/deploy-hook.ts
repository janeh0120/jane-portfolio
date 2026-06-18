import type { APIRoute } from 'astro';
import { DEPLOY_HOOK_SECRET } from 'astro:env/server';
import { createVersion } from '../../lib/versions';

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  if (!DEPLOY_HOOK_SECRET) {
    return json({ error: 'Deploy hook is not configured.' }, 503);
  }

  const auth = request.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const headerSecret = request.headers.get('x-deploy-hook-secret') ?? '';

  if (token !== DEPLOY_HOOK_SECRET && headerSecret !== DEPLOY_HOOK_SECRET) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const deployUrl =
      String(body.url ?? body.deployment?.url ?? '').trim() ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
    const gitSha = String(body.meta?.githubCommitSha ?? body.gitSha ?? '').trim() || undefined;
    const label = String(body.name ?? body.deployment?.name ?? 'deploy').trim() || 'deploy';

    const versionId = await createVersion({
      label,
      deployUrl: deployUrl || undefined,
      gitSha,
      setActive: true,
    });

    return json({ ok: true, versionId, deployUrl });
  } catch (error) {
    console.error('POST /api/deploy-hook', error);
    return json({ error: 'Unable to record portfolio version.' }, 503);
  }
};
