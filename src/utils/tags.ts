export function parseProjectTags(tags: string | string[]): string[] {
  if (Array.isArray(tags)) {
    return tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  }
  return tags.split(',').map((tag) => tag.trim().toLowerCase());
}

function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatProjectTags(tags: string | string[]): string {
  return parseProjectTags(tags).map(capitalizeFirst).join(', ');
}

export function projectMatchesFilter(tags: string | string[], filter: string): boolean {
  const normalized = filter.toLowerCase();
  return parseProjectTags(tags).some(
    (tag) => tag === normalized || tag.startsWith(`${normalized} `) || tag.startsWith(normalized),
  );
}
