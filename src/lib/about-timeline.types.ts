export type TimelineMilestone = {
  id: string;
  year: string;
  role: string;
  organization: string;
  description: string;
  learned: string;
  image: string;
  imageAlt: string;
};

export type AboutTimelineLink = {
  label: string;
  href: string;
};

export type AboutTimelineContent = {
  hero: {
    eyebrow: string;
    headline: string;
    intro: string;
    portraitAlt: string;
    portraitImage: string;
  };
  cta: {
    label: string;
    hint: string;
  };
  milestones: TimelineMilestone[];
  next: {
    eyebrow: string;
    headline: string;
    description: string;
    links: AboutTimelineLink[];
  };
};
