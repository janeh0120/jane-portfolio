import siteJson from '../../content/site.json';
import galleryJson from '../../content/gallery.json';
import changelogJson from '../../content/changelog.json';
import type {
  ChangelogContent,
  GalleryItemMeta,
  SiteContent,
} from './content.types';

export type { GalleryItemMeta, Project, SiteContent } from './content.types';

export const site = siteJson as SiteContent;
export const galleryMeta = galleryJson as GalleryItemMeta[];
const changelog = changelogJson as ChangelogContent;

const changelogByLabel = new Map(
  changelog.entries.map((entry) => [entry.label.toLowerCase(), entry.summary]),
);

/** Human-readable summary for a portfolio version label (from content/changelog.json). */
export function getVersionSummary(label: string): string | undefined {
  return changelogByLabel.get(label.toLowerCase());
}
