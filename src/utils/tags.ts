export function parseProjectTags(tags: string): string[] {
  return tags.split(',').map((tag) => tag.trim().toLowerCase());
}

export function projectMatchesFilter(tags: string, filter: string): boolean {
  const normalized = filter.toLowerCase();
  return parseProjectTags(tags).some(
    (tag) => tag === normalized || tag.startsWith(`${normalized} `) || tag.startsWith(normalized),
  );
}
