export type GalleryItem = {
  id: number;
  title: string;
  images: string[];
  description: string;
  year: string;
};

/** Placeholder tiles — swap `images` paths with files in public/images/extra/ */
export const galleryItems: GalleryItem[] = [
  {
    id: 1,
    title: 'A Zestie Festie',
    images: [
      'images/extra/zestie-festie.png',
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Crect fill='%23FFE8A3' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='14' fill='%23000' text-anchor='middle' dominant-baseline='middle'%3EZestie Festie%3C/text%3E%3C/svg%3E",
    ],
    description:
      'A vibrant community event celebrating diverse perspectives and creative expression through collaborative art and design.',
    year: '2023',
  },
  {
    id: 2,
    title: 'Community Project',
    images: [
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Crect fill='%23E8E8E8' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='16' fill='%23000' text-anchor='middle' dominant-baseline='middle'%3ECommunity Project%3C/text%3E%3C/svg%3E",
    ],
    description:
      'Collaborative design initiative bringing together community members to create meaningful visual experiences.',
    year: '2023',
  },
  {
    id: 3,
    title: 'Puzzle Exploration',
    images: [
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Crect fill='%23FFD700' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='16' fill='%23000' text-anchor='middle' dominant-baseline='middle'%3EPuzzle Design%3C/text%3E%3C/svg%3E",
    ],
    description:
      'Exploring interactive puzzle mechanics and spatial design thinking through hands-on prototyping.',
    year: '2023',
  },
  {
    id: 4,
    title: 'Calculator UI',
    images: [
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Crect fill='%236366F1' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='16' fill='%23FFF' text-anchor='middle' dominant-baseline='middle'%3ECalculator Design%3C/text%3E%3C/svg%3E",
    ],
    description:
      'Minimalist calculator interface design focusing on usability and visual clarity in functional applications.',
    year: '2023',
  },
  {
    id: 5,
    title: 'Product Photography',
    images: [
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Crect fill='%23E8E8E8' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='14' fill='%23000' text-anchor='middle' dominant-baseline='middle'%3EProduct Shot%3C/text%3E%3C/svg%3E",
    ],
    description: 'Clean product photography and styling for e-commerce and brand storytelling.',
    year: '2023',
  },
  {
    id: 6,
    title: 'Social & Print',
    images: [
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Crect fill='%23FFE0E6' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='14' fill='%23D4693C' text-anchor='middle' dominant-baseline='middle'%3EBrand Identity%3C/text%3E%3C/svg%3E",
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Crect fill='%23E0E8FF' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='14' fill='%234369D4' text-anchor='middle' dominant-baseline='middle'%3EMockup 2%3C/text%3E%3C/svg%3E",
    ],
    description:
      'Comprehensive social media and print collateral design for brand consistency across channels.',
    year: '2023-2024',
  },
  {
    id: 7,
    title: 'Sky View Series',
    images: [
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Crect fill='%236DB3F2' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='16' fill='%23FFF' text-anchor='middle' dominant-baseline='middle'%3ESky Series%3C/text%3E%3C/svg%3E",
    ],
    description:
      'Atmospheric photography series exploring perspectives and natural elements through design lens.',
    year: '2023',
  },
  {
    id: 8,
    title: 'Framed Memories',
    images: [
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Crect fill='%23FF6B6B' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='14' fill='%23FFF' text-anchor='middle' dominant-baseline='middle'%3EFramed Moment%3C/text%3E%3C/svg%3E",
    ],
    description:
      'Personal photography project capturing candid moments and human connection through framing.',
    year: '2023',
  },
  {
    id: 9,
    title: 'Product Display',
    images: [
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Crect fill='%23F0F0F0' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='14' fill='%23666' text-anchor='middle' dominant-baseline='middle'%3EDisplay Design%3C/text%3E%3C/svg%3E",
    ],
    description:
      'Retail and digital product display strategies emphasizing visual hierarchy and user engagement.',
    year: '2023',
  },
  {
    id: 10,
    title: 'Ceramics & Crafts',
    images: [
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Crect fill='%23F5E6D3' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='14' fill='%23B8956A' text-anchor='middle' dominant-baseline='middle'%3EHandmade%3C/text%3E%3C/svg%3E",
    ],
    description:
      'Exploring tactile design through ceramics, craftsmanship, and material exploration.',
    year: '2023',
  },
  {
    id: 11,
    title: 'Besties Brunch',
    images: [
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Crect fill='%238B4513' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='14' fill='%23FFF' text-anchor='middle' dominant-baseline='middle'%3EBesties Brunch%3C/text%3E%3C/svg%3E",
    ],
    description:
      'Branding and design identity for a local cafe focusing on community and connection.',
    year: '2023',
  },
  {
    id: 12,
    title: 'Floral Studies',
    images: [
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Crect fill='%234B0082' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='14' fill='%23FFF' text-anchor='middle' dominant-baseline='middle'%3EFloral Study%3C/text%3E%3C/svg%3E",
    ],
    description: 'Nature-inspired design studies exploring color, form, and botanical aesthetics.',
    year: '2023',
  },
  {
    id: 13,
    title: 'Creative Tools',
    images: [
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Crect fill='%23FFD700' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='14' fill='%23000' text-anchor='middle' dominant-baseline='middle'%3ECreative Tools%3C/text%3E%3C/svg%3E",
    ],
    description: 'Design exploration of artistic tools, materials, and creative workflows.',
    year: '2023',
  },
  {
    id: 14,
    title: 'Data Visualization',
    images: [
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Crect fill='%23000' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='14' fill='%23FFF' text-anchor='middle' dominant-baseline='middle'%3EData Viz%3C/text%3E%3C/svg%3E",
    ],
    description: 'Complex data visualization and information design for meaningful storytelling.',
    year: '2023-2024',
  },
];
