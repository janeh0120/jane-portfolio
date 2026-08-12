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
  milestones: TimelineMilestone[];
  next: {
    eyebrow: string;
    headline: string;
    description: string;
    links: AboutTimelineLink[];
  };
};
