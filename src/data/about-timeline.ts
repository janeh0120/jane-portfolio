import timelineJson from '../../content/about-timeline.json';
import type { AboutTimelineContent } from './about-timeline.types';

export type { AboutTimelineContent, TimelineMilestone } from './about-timeline.types';

export const aboutTimeline = timelineJson as AboutTimelineContent;
