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

function resolveDeployUrl(body: Record<string, unknown>): string {
  const fromBody =
    String(body.url ?? '').trim() ||
    String((body.deployment as Record<string, unknown> | undefined)?.url ?? '').trim() ||
    String((body.payload as Record<string, unknown> | undefined)?.url ?? '').trim();

  if (fromBody) {
    return fromBody.startsWith('http') ? fromBody : `https://${fromBody}`;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`;
  }

  return '';
}

function resolveGitSha(body: Record<string, unknown>): string | undefined {
  const meta = body.meta as Record<string, unknown> | undefined;
  const deployment = body.deployment as Record<string, unknown> | undefined;
  const payload = body.payload as Record<string, unknown> | undefined;
  const deploymentMeta = deployment?.meta as Record<string, unknown> | undefined;

  const sha =
    String(meta?.githubCommitSha ?? '').trim() ||
    String(body.gitSha ?? '').trim() ||
    String(deploymentMeta?.githubCommitSha ?? '').trim() ||
    String(payload?.deploymentId ?? '').trim() ||
    String(process.env.VERCEL_GIT_COMMIT_SHA ?? '').trim();

  return sha || undefined;
}

function resolveLabel(body: Record<string, unknown>): string {
  const deployment = body.deployment as Record<string, unknown> | undefined;
  const fromBody =
    String(body.name ?? '').trim() ||
    String(deployment?.name ?? '').trim() ||
    String(process.env.VERCEL_GIT_COMMIT_MESSAGE ?? '').trim();

  if (fromBody) return fromBody.slice(0, 120);

  const ref = String(process.env.VERCEL_GIT_COMMIT_REF ?? '').trim();
  if (ref) return ref;

  return 'deploy';
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
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const deployUrl = resolveDeployUrl(body);
    const gitSha = resolveGitSha(body);
    const label = resolveLabel(body);

    const versionId = await createVersion({
      label,
      deployUrl: deployUrl || undefined,
      gitSha,
      setActive: true,
    });

    return json({ ok: true, versionId, deployUrl, label, gitSha });
  } catch (error) {
    console.error('POST /api/deploy-hook', error);
    return json({ error: 'Unable to record portfolio version.' }, 503);
  }
};
