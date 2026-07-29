import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { AboutTimelineContent, TimelineMilestone } from '../../lib/about-timeline.types';
import '../../styles/about-story.css';

type Props = {
  content: AboutTimelineContent;
  base: string;
};

const spring = {
  type: 'spring' as const,
  stiffness: 120,
  damping: 24,
  mass: 0.7,
};

function resolveHref(base: string, href: string) {
  if (href.startsWith('mailto:') || href.startsWith('http')) return href;
  if (href.startsWith('/#')) return `${base.replace(/\/$/, '')}${href}`;
  if (href.startsWith('/')) return `${base.replace(/\/$/, '')}${href}`;
  return href;
}

function displayYear(milestone: TimelineMilestone, index: number) {
  if (index === 0) return 'Today';
  return milestone.year;
}

function ExperienceEntry({
  milestone,
  index,
  base,
  reducedMotion,
  onActivate,
  onHover,
  onLeave,
}: {
  milestone: TimelineMilestone;
  index: number;
  base: string;
  reducedMotion: boolean;
  onActivate: (id: string) => void;
  onHover: (milestone: TimelineMilestone) => void;
  onLeave: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { margin: '-42% 0px -42% 0px' });
  const imageSrc = milestone.image ? `${base}${milestone.image}` : '';

  useEffect(() => {
    if (inView) onActivate(milestone.id);
  }, [inView, milestone.id, onActivate]);

  return (
    <article
      ref={ref}
      id={milestone.id}
      className="cv-entry"
      data-comment-id={`about-${milestone.id}`}
      onMouseEnter={() => onHover(milestone)}
      onMouseLeave={onLeave}
      onFocus={() => onHover(milestone)}
      onBlur={onLeave}
      tabIndex={0}
    >
      <p className="cv-entry-year cv-entry-year--mobile">{displayYear(milestone, index)}</p>
      <h3 className="cv-entry-role">{milestone.role}</h3>
      {milestone.organization ? (
        <p className="cv-entry-org">{milestone.organization}</p>
      ) : null}
      <p className="cv-entry-description">{milestone.description}</p>
      <p className="cv-entry-learned">{milestone.learned}</p>

      {imageSrc ? (
        <div className="cv-entry-thumb cv-entry-thumb--mobile" aria-hidden="true">
          <img src={imageSrc} alt="" loading="lazy" />
        </div>
      ) : null}
    </article>
  );
}

export default function AboutStory({ content, base }: Props) {
  const reducedMotion = useReducedMotion();
  const [activeId, setActiveId] = useState(content.milestones[0]?.id ?? '');
  const [hovered, setHovered] = useState<TimelineMilestone | null>(null);

  const hoveredImage = hovered?.image ? `${base}${hovered.image}` : '';

  return (
    <div className="about-cv" data-comment-id="about-page">
      <section className="cv-layout" data-comment-id="about-timeline">
        <aside className="cv-years" aria-label="Timeline years">
          <div className="cv-years-rail">
            {content.milestones.map((milestone, index) => {
              const isActive = milestone.id === activeId;
              return (
                <button
                  key={milestone.id}
                  type="button"
                  className={`cv-year${isActive ? ' is-active' : ''}`}
                  onClick={() => {
                    document.getElementById(milestone.id)?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                    });
                  }}
                >
                  {displayYear(milestone, index)}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="cv-entries">
          {content.milestones.map((milestone, index) => (
            <ExperienceEntry
              key={milestone.id}
              milestone={milestone}
              index={index}
              base={base}
              reducedMotion={!!reducedMotion}
              onActivate={setActiveId}
              onHover={setHovered}
              onLeave={() => setHovered(null)}
            />
          ))}
        </div>

        <div className="cv-preview" aria-hidden={!hovered}>
          <AnimatePresence mode="wait">
            {hovered && (
              <motion.div
                key={hovered.id}
                className="cv-preview-card"
                initial={reducedMotion ? false : { opacity: 0, scale: 0.94, y: 12 }}
                animate={reducedMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, scale: 0.96, y: 8 }}
                transition={spring}
              >
                {hoveredImage ? (
                  <img src={hoveredImage} alt={hovered.imageAlt} className="cv-preview-image" />
                ) : (
                  <div className="cv-preview-image cv-preview-image--placeholder">
                    <span>{hovered.role}</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="cv-next" data-comment-id="about-next">
        <motion.div
          className="cv-next-inner"
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={spring}
        >
          <p className="cv-eyebrow">{content.next.eyebrow}</p>
          <h2 className="cv-next-headline">{content.next.headline}</h2>
          <p className="cv-next-description">{content.next.description}</p>
          <div className="cv-next-links">
            {content.next.links.map((link) => (
              <a key={link.label} href={resolveHref(base, link.href)} className="cv-next-link">
                {link.label}
                <span aria-hidden="true">→</span>
              </a>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
