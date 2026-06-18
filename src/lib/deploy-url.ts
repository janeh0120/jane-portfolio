/** Site root URL for admin preview iframe — never embed admin/api paths. */
export function resolvePortfolioPreviewBase(
  deployUrl: string | null | undefined,
  origin: string,
  base: string,
): string {
  const fallback = `${origin}${base}`.replace(/\/$/, '');

  if (!deployUrl?.trim()) return fallback;

  try {
    const url = new URL(deployUrl.trim());
    if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api')) {
      return fallback;
    }
    return url.origin;
  } catch {
    return fallback;
  }
}
