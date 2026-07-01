import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from 'framer-motion';
import { useRef } from 'react';
import type { AboutTimelineContent, TimelineMilestone } from '../../lib/about-timeline.types';
import '../../styles/about-story.css';

type Props = {
  content: AboutTimelineContent;
  base: string;
  name: string;
};

const spring = {
  type: 'spring' as const,
  stiffness: 90,
  damping: 22,
  mass: 0.8,
};

const softSpring = {
  type: 'spring' as const,
  stiffness: 70,
  damping: 20,
  mass: 1,
};

const reveal: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { ...spring, delay },
  }),
};

const textReveal: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { ...softSpring, delay: index * 0.06 },
  }),
};

function resolveHref(base: string, href: string) {
  if (href.startsWith('mailto:') || href.startsWith('http')) return href;
  if (href.startsWith('/#')) return `${base.replace(/\/$/, '')}${href}`;
  if (href.startsWith('/')) return `${base.replace(/\/$/, '')}${href}`;
  return href;
}

function HeadlineWords({ text, reducedMotion }: { text: string; reducedMotion: boolean }) {
  const words = text.split(' ');

  if (reducedMotion) {
    return <>{text}</>;
  }

  return (
    <>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className="story-hero-headline-word"
          initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ ...spring, delay: 0.12 + index * 0.045 }}
        >
          {word}
          {index < words.length - 1 ? '\u00a0' : ''}
        </motion.span>
      ))}
    </>
  );
}

function MilestoneCard({
  milestone,
  index,
  base,
  isBeginning,
  beginningRef,
  reducedMotion,
}: {
  milestone: TimelineMilestone;
  index: number;
  base: string;
  isBeginning: boolean;
  beginningRef?: React.RefObject<HTMLElement | null>;
  reducedMotion: boolean;
}) {
  const side = index % 2 === 0 ? 'left' : 'right';
  const imageSrc = milestone.image ? `${base}${milestone.image}` : '';
  const inViewProps = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 48 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-12% 0px' as const },
        transition: { ...spring, delay: 0.05 },
      };

  return (
    <article
      ref={isBeginning ? beginningRef : undefined}
      id={isBeginning ? 'story-beginning' : undefined}
      className={`story-milestone story-milestone--${side}`}
      data-comment-id={`about-${milestone.id}`}
    >
      <div className="story-milestone-marker" aria-hidden="true">
        <motion.span
          className="story-milestone-dot"
          initial={reducedMotion ? false : { scale: 0, opacity: 0 }}
          whileInView={reducedMotion ? undefined : { scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={spring}
        />
      </div>

      <motion.div
        className="story-milestone-card"
        {...inViewProps}
        whileHover={reducedMotion ? undefined : { y: -6, transition: { duration: 0.25 } }}
      >
        <motion.div
          className="story-milestone-image-wrap"
          initial={reducedMotion ? false : { opacity: 0, scale: 0.94 }}
          whileInView={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ ...softSpring, delay: 0.12 }}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={milestone.imageAlt}
              className="story-milestone-image"
              loading="lazy"
            />
          ) : (
            <div className="story-milestone-image story-milestone-image--placeholder" aria-hidden="true">
              <span className="story-milestone-image-label">Image</span>
            </div>
          )}
        </motion.div>

        <div className="story-milestone-copy">
          <motion.p
            className="story-milestone-year"
            variants={textReveal}
            initial={reducedMotion ? false : 'hidden'}
            whileInView={reducedMotion ? undefined : 'visible'}
            viewport={{ once: true }}
            custom={0}
          >
            {milestone.year}
          </motion.p>
          <motion.h3
            className="story-milestone-role"
            variants={textReveal}
            initial={reducedMotion ? false : 'hidden'}
            whileInView={reducedMotion ? undefined : 'visible'}
            viewport={{ once: true }}
            custom={1}
          >
            {milestone.role}
          </motion.h3>
          {milestone.organization ? (
            <motion.p
              className="story-milestone-org"
              variants={textReveal}
              initial={reducedMotion ? false : 'hidden'}
              whileInView={reducedMotion ? undefined : 'visible'}
              viewport={{ once: true }}
              custom={2}
            >
              {milestone.organization}
            </motion.p>
          ) : null}
          <motion.p
            className="story-milestone-description"
            variants={textReveal}
            initial={reducedMotion ? false : 'hidden'}
            whileInView={reducedMotion ? undefined : 'visible'}
            viewport={{ once: true }}
            custom={3}
          >
            {milestone.description}
          </motion.p>
          <motion.p
            className="story-milestone-learned"
            variants={textReveal}
            initial={reducedMotion ? false : 'hidden'}
            whileInView={reducedMotion ? undefined : 'visible'}
            viewport={{ once: true }}
            custom={4}
          >
            <span className="story-milestone-learned-label">What I learned</span>
            {milestone.learned}
          </motion.p>
        </div>
      </motion.div>
    </article>
  );
}

export default function AboutStory({ content, base, name }: Props) {
  const timelineRef = useRef<HTMLElement>(null);
  const beginningRef = useRef<HTMLElement>(null);
  const presentMilestone = content.milestones[0];
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ['start 85%', 'end 25%'],
  });

  const lineScale = useTransform(scrollYProgress, [0, 1], [0.02, 1]);

  const scrollToBeginning = () => {
    beginningRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const portraitSrc = content.hero.portraitImage
    ? `${base}${content.hero.portraitImage}`
    : '';

  return (
    <div className="about-story" data-comment-id="about-page">
      <section className="story-hero" data-comment-id="about-hero">
        <div className="story-hero-glow" aria-hidden="true" />
        <div className="story-hero-mesh" aria-hidden="true" />

        <div className="story-hero-grid">
          <motion.div
            className="story-hero-portrait-wrap"
            initial={reducedMotion ? false : { opacity: 0, scale: 0.92 }}
            animate={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ ...spring, delay: 0.05 }}
          >
            {portraitSrc ? (
              <img
                src={portraitSrc}
                alt={content.hero.portraitAlt}
                className="story-hero-portrait"
              />
            ) : (
              <div className="story-hero-portrait story-hero-portrait--placeholder" aria-hidden="true">
                <span>{name.split(' ').map((part) => part[0]).join('')}</span>
              </div>
            )}
          </motion.div>

          <div className="story-hero-copy">
            <motion.p
              className="story-eyebrow"
              variants={reveal}
              initial={reducedMotion ? false : 'hidden'}
              animate={reducedMotion ? undefined : 'visible'}
              custom={0.1}
            >
              {content.hero.eyebrow}
            </motion.p>
            <motion.h1
              className="story-hero-headline"
              variants={reveal}
              initial={reducedMotion ? false : 'hidden'}
              animate={reducedMotion ? undefined : 'visible'}
              custom={0.18}
            >
              <HeadlineWords text={content.hero.headline} reducedMotion={!!reducedMotion} />
            </motion.h1>
            <motion.p
              className="story-hero-intro"
              variants={reveal}
              initial={reducedMotion ? false : 'hidden'}
              animate={reducedMotion ? undefined : 'visible'}
              custom={0.26}
            >
              {content.hero.intro}
            </motion.p>

            {presentMilestone && (
              <motion.div
                className="story-present-chip"
                variants={reveal}
                initial={reducedMotion ? false : 'hidden'}
                animate={reducedMotion ? undefined : 'visible'}
                custom={0.34}
              >
                <span className="story-present-chip-label">Now</span>
                <div>
                  <p className="story-present-chip-role">{presentMilestone.role}</p>
                  <p className="story-present-chip-org">{presentMilestone.organization}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <motion.div
          className="story-cta-wrap"
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.45 }}
        >
          <button type="button" className="story-cta" onClick={scrollToBeginning}>
            <span>{content.cta.label}</span>
            <span className="story-cta-arrow" aria-hidden="true">
              ↓
            </span>
          </button>
          <p className="story-cta-hint">{content.cta.hint}</p>
        </motion.div>
      </section>

      <section className="story-timeline-section" ref={timelineRef} data-comment-id="about-timeline">
        <div className="story-timeline-header">
          <p className="story-eyebrow">The journey</p>
          <h2 className="story-timeline-title">From family business to design systems.</h2>
          <p className="story-timeline-subtitle">
            Present at the top. Scroll down to travel back — or begin at the start and read upward toward now.
          </p>
        </div>

        <div className="story-timeline">
          <div className="story-timeline-rail" aria-hidden="true">
            <span className="story-timeline-rail-label story-timeline-rail-label--top">Present</span>
            <div className="story-timeline-rail-track" />
            <motion.div
              className="story-timeline-rail-fill"
              style={{ scaleY: lineScale, transformOrigin: 'top center' }}
            />
            <span className="story-timeline-rail-label story-timeline-rail-label--bottom">Beginning</span>
          </div>

          <div className="story-timeline-milestones">
            {content.milestones.map((milestone, index) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                index={index}
                base={base}
                isBeginning={index === content.milestones.length - 1}
                beginningRef={beginningRef}
                reducedMotion={!!reducedMotion}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="story-next" data-comment-id="about-next">
        <motion.div
          className="story-next-inner"
          initial={reducedMotion ? false : { opacity: 0, y: 32 }}
          whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={spring}
        >
          <p className="story-eyebrow">{content.next.eyebrow}</p>
          <h2 className="story-next-headline">{content.next.headline}</h2>
          <p className="story-next-description">{content.next.description}</p>
          <div className="story-next-links">
            {content.next.links.map((link) => (
              <a
                key={link.label}
                href={resolveHref(base, link.href)}
                className="story-next-link"
              >
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
