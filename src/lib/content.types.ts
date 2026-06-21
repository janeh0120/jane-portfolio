export type NavItem = {
  label: string;
  href: string;
  external?: boolean;
};

export type Project = {
  slug: string;
  tags: string[];
  title: string;
  image: string;
  comingSoon: boolean;
};

export type SiteContent = {
  name: string;
  title: string;
  description: string;
  email: string;
  year: number;
  logo: string;
  links: Record<string, string>;
  nav: NavItem[];
  hero: {
    intro: string;
    role: string;
    middle: string;
    outro: string;
    filters: { label: string; tag: string }[];
  };
  experience: {
    current: { label: string; href: string };
    previous: { label: string; href: string }[];
  };
  projects: Project[];
  about: {
    heading: string;
    paragraphs: string[];
  };
  extra: {
    heading: string;
  };
  footer: {
    links: (
      | { label: string; type: 'email' }
      | { label: string; hrefKey: string }
    )[];
  };
};

export type GalleryItemMeta = {
  slug: string;
  title: string;
  description: string;
  year: string;
};

export type ChangelogEntry = {
  label: string;
  summary: string;
};

export type ChangelogContent = {
  entries: ChangelogEntry[];
};
