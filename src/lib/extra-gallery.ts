import type { GalleryItem } from '../data/gallery';
import { galleryMeta } from '../data/gallery';

/** Gallery items for Play. Image paths live in content/gallery.json (not scanned from disk at runtime). */
export function buildGalleryItems(): GalleryItem[] {
  return galleryMeta.map((item, index) => ({
    id: index + 1,
    slug: item.slug,
    title: item.title,
    description: item.description,
    year: item.year,
    images: item.images ?? [],
  }));
}

export const galleryItems = buildGalleryItems();
