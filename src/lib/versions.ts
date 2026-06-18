import { getSupabase } from './supabase';

export type PortfolioVersion = {
  id: string;
  label: string;
  deployUrl: string | null;
  gitSha: string | null;
  isActive: boolean;
  createdAt: Date;
};

type VersionRow = {
  id: string;
  label: string;
  deploy_url: string | null;
  git_sha: string | null;
  is_active: boolean;
  created_at: string;
};

function mapVersion(row: VersionRow): PortfolioVersion {
  return {
    id: row.id,
    label: row.label,
    deployUrl: row.deploy_url,
    gitSha: row.git_sha,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
  };
}

export async function ensureActiveVersion(): Promise<string> {
  const supabase = getSupabase();

  const { data: active, error: activeError } = await supabase
    .from('portfolio_versions')
    .select('id')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (activeError) throw activeError;
  if (active?.id) return active.id;

  const { data: created, error: createError } = await supabase
    .from('portfolio_versions')
    .insert({ label: 'live', is_active: true })
    .select('id')
    .single();

  if (createError) throw createError;
  return created.id;
}

export async function listVersions(limit = 50): Promise<PortfolioVersion[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('portfolio_versions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as VersionRow[]).map(mapVersion);
}

export async function createVersion(input: {
  label: string;
  deployUrl?: string;
  gitSha?: string;
  setActive?: boolean;
}): Promise<string> {
  const supabase = getSupabase();

  if (input.setActive) {
    const { error: deactivateError } = await supabase
      .from('portfolio_versions')
      .update({ is_active: false })
      .eq('is_active', true);

    if (deactivateError) throw deactivateError;
  }

  const { data, error } = await supabase
    .from('portfolio_versions')
    .insert({
      label: input.label,
      deploy_url: input.deployUrl ?? null,
      git_sha: input.gitSha ?? null,
      is_active: input.setActive ?? false,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function getVersionById(id: string): Promise<PortfolioVersion | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('portfolio_versions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapVersion(data as VersionRow) : null;
}
