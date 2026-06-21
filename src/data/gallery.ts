export type { GalleryItemMeta } from '../lib/content.types';
export { galleryMeta } from '../lib/content';

export type GalleryItem = import('../lib/content.types').GalleryItemMeta & {
  id: number;
  images: string[];
};
