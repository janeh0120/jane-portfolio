import fs from 'node:fs';
import path from 'node:path';
import { galleryMeta, type GalleryItem } from '../data/gallery';

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif)$/i;

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function listImages(dir: string, urlPrefix: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((name) => IMAGE_EXT.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((name) => `${urlPrefix}/${name}`);
}

export function buildGalleryItems(): GalleryItem[] {
  const extraDir = path.join(process.cwd(), 'public/images/extra');
  if (!fs.existsSync(extraDir)) return [];

  const metaBySlug = new Map(
    galleryMeta.map((item, index) => [normalizeSlug(item.slug), { ...item, order: index }]),
  );
  const discovered = new Map<string, { slug: string; images: string[]; order: number }>();

  for (const entry of fs.readdirSync(extraDir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;

    if (entry.isDirectory()) {
      const slug = entry.name;
      const normalized = normalizeSlug(slug);
      const images = listImages(path.join(extraDir, entry.name), `images/extra/${slug}`);
      if (images.length === 0) continue;

      const meta = metaBySlug.get(normalized);
      discovered.set(normalized, {
        slug,
        images,
        order: meta?.order ?? 1000 + discovered.size,
      });
      continue;
    }

    if (entry.isFile() && IMAGE_EXT.test(entry.name)) {
      const slug = entry.name.replace(/\.[^.]+$/, '');
      const normalized = normalizeSlug(slug);
      const meta = metaBySlug.get(normalized);

      discovered.set(normalized, {
        slug,
        images: [`images/extra/${entry.name}`],
        order: meta?.order ?? 1000 + discovered.size,
      });
    }
  }

  return [...discovered.entries()]
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([normalized, { slug, images }], index) => {
      const meta = metaBySlug.get(normalized);

      return {
        id: index + 1,
        slug: meta?.slug ?? slug,
        title:
          meta?.title ??
          slug.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase()),
        description: meta?.description ?? '',
        year: meta?.year ?? '',
        images,
      };
    });
}

export const galleryItems = buildGalleryItems();
