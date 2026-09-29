/** Projects shown on the single-page /brand portfolio, in order. */

export type BrandMedia = {
  src: string;
  /** Embed this YouTube video instead of showing `src` (which is unused). */
  youtubeId?: string;
  /** Dark-mode version of the same artwork, swapped in by the light/dark toggle. */
  darkSrc?: string;
  alt: string;
  width: number;
  height: number;
};

export type BrandLink = { label: string; href: string };

export type BrandProject = {
  slug: string;
  title: string;
  description: string[];
  details: { label: string; value: string }[];
  link?: BrandLink;
  /** Show a light/dark toggle above the images. */
  colorModes?: boolean;
  media: BrandMedia[];
};

const ixd = (file: string) => `images/case-studies/ixd/${file}`;
const gwsk = (file: string) => `images/case-studies/gwsk/${file}`;
const ids = (name: string, ext = 'png') => ({
  src: `images/case-studies/ids-illustrations/${name}-light.${ext}`,
  darkSrc: `images/case-studies/ids-illustrations/${name}-dark.${ext}`,
});

export const brandWork: BrandProject[] = [
  {
    slug: 'ixd',
    title: 'IXD Class of 2028',
    description: [
      'For the first time since COVID, my program didn’t have a year-end show. I took a hoodie design that won the popular vote among students in my program and used it to build a brand concept for a year-end show I’d run if our faculty doesn’t hold one.',
      'The concept stems from our collective struggle to explain what interaction design means to others. Its brand touchpoints consider not just the visual design, but how the audience interacts with it.',
    ],
    details: [
      { label: 'Role', value: 'Creative director & designer' },
      { label: 'Team', value: 'Solo' },
      { label: 'Timeline', value: '1 week' },
      { label: 'Recognition', value: 'RGD Student Awards Honourable Mention' },
    ],
    media: [
      {
        src: ixd('hoodie-back.png'),
        alt: "Black and white Sheridan IXD hoodies with please don't ask me what interaction design is printed on the back",
        width: 910,
        height: 1024,
      },
      {
        src: ixd('hoodie-award-pins.png'),
        alt: 'Students wearing Sheridan IXD hoodies with handmade award ribbons',
        width: 910,
        height: 1024,
      },
      {
        src: ixd('tote-bag.png'),
        alt: 'Black tote bag with IXD lattice icons, pin, and Best in Show ribbon',
        width: 1024,
        height: 576,
      },
      {
        src: ixd('name-tag.png'),
        alt: 'Name badge with skill radar chart on a Sheridan IXD sweatshirt',
        width: 910,
        height: 1024,
      },
      {
        src: ixd('portfolio-keychain.png'),
        alt: 'Portfolio keychain and ID holder clipped to jeans with ixd? yes tag',
        width: 910,
        height: 1024,
      },
      {
        src: ixd('connect-the-dots.png'),
        alt: 'Connect the dots attendee cards in blue and grey with frosted thank-you overlays',
        width: 1024,
        height: 576,
      },
      {
        src: ixd('graduation-directory-website.png'),
        alt: 'Laptop mockup of Sheridan IXD yes 2028 grad designer directory website',
        width: 1024,
        height: 576,
      },
      {
        src: ixd('event-branding-grid.png'),
        alt: 'Grid of event branding posts for award ribbons, merch drop, and year end party',
        width: 1024,
        height: 576,
      },
      {
        src: ixd('event-posters.png'),
        alt: 'Two wheatpaste-style posters for Sheridan IXD 2028 merch and year-end show',
        width: 1024,
        height: 576,
      },
      {
        src: ixd('sticker-sheet.png'),
        alt: 'IXD sticker sheet and year end party photo sticker',
        width: 1024,
        height: 576,
      },
    ],
  },
  {
    slug: 'ids-illustrations',
    title: 'Intuit Design System Illustrations',
    description: [
      'I designed illustrations for the Intuit Design System documentation site that use analogies to communicate the concept of design systems. Each one is adapted for both light and dark mode.',
    ],
    details: [
      { label: 'Client', value: 'Intuit' },
      { label: 'Role', value: 'Illustrator' },
      { label: 'Team', value: '2 designers' },
      { label: 'Timeline', value: '2 weeks' },
    ],
    colorModes: true,
    media: [
      { ...ids('site'), alt: 'Intuit Design System documentation homepage with the illustrations in place', width: 1920, height: 1080 },
      { ...ids('hero', 'webp'), alt: 'Isometric city intersection with autonomous vehicles, trams, and traffic lights', width: 2000, height: 699 },
      { ...ids('foundations'), alt: 'Isometric building-block house illustration for Foundations', width: 1416, height: 832 },
      { ...ids('theming'), alt: 'Isometric control panel with switches and cables illustration for Theming', width: 1412, height: 828 },
      { ...ids('components'), alt: 'Isometric Intuit Design System component board illustration for Components', width: 1412, height: 832 },
    ],
  },
  {
    slug: 'gwsk',
    title: 'GWSK',
    description: [
      'I rebranded GWSK, a product design studio, to position it as a studio that builds enduring products. The brand concept is inspired by the utilitarian design of public transit systems, mapping accent colours to Double Diamond stages to communicate the design process to clients.',
      'I worked on the brand guidelines, reusable templates, logo, and website.',
    ],
    details: [
      { label: 'Client', value: 'GWSK' },
      { label: 'Role', value: 'Design intern' },
      { label: 'Team', value: '2 designers' },
      { label: 'Timeline', value: '3.5 weeks' },
    ],
    media: [
      { src: gwsk('gwsk-logo.png'), alt: 'GWSK logo mark and wordmark on dark background', width: 1920, height: 1080 },
      {
        src: gwsk('gwsk-assets.png'),
        alt: 'GWSK brand assets including process step UI and presentation slide',
        width: 1920,
        height: 1080,
      },
      {
        src: gwsk('presentation-slides.png'),
        alt: 'GWSK brand guidelines presentation slides',
        width: 1920,
        height: 1080,
      },
      {
        src: gwsk('design-process.png'),
        alt: 'Transit-inspired GWSK design process map from Discover through Deliver',
        width: 1920,
        height: 1080,
      },
      {
        src: gwsk('brand-foundations.webp'),
        alt: 'GWSK brand foundations showing colour palette and typography hierarchy',
        width: 1920,
        height: 1080,
      },
      {
        src: 'videos/gwsk/website-laptop-web.mp4',
        alt: 'Screen recording of the final GWSK website on laptop',
        width: 1920,
        height: 1082,
      },
      {
        src: 'videos/gwsk/website-mobile-web.mp4',
        alt: 'Screen recording of the final GWSK website on mobile',
        width: 1280,
        height: 1136,
      },
    ],
  },
  {
    slug: 'dex',
    title: 'Dex',
    description: [
      'Dex is an occupational therapy tool that uses the sensors in your MacBook to create daily exercises that help kids practise dexterity in an accessible and engaging format.',
    ],
    details: [
      { label: 'Role', value: 'Brand, product & motion designer and engineer' },
      { label: 'Team', value: '2 designer-engineers' },
      { label: 'Timeline', value: '36 hours' },
      { label: 'Recognition', value: 'Hack the North Semi-finalist' },
    ],
    link: { label: 'Devpost', href: 'https://devpost.com/software/htn-2026' },
    media: [
      {
        src: '',
        youtubeId: 'faLR2IYWOWU',
        alt: 'Dex demo video from Hack the North',
        width: 16,
        height: 9,
      },
      {
        src: 'images/case-studies/dex/logo.png',
        alt: 'Dex logo: a smiling purple hand mark with the tagline Your daily dexterity progression tool',
        width: 1920,
        height: 1080,
      },
      {
        src: 'images/case-studies/dex/log.png',
        alt: 'Dex log screen with story cards for Grocery Day, It’s Celebratin’ Time, and Unlock Tomorrow',
        width: 1920,
        height: 1080,
      },
      {
        src: 'images/case-studies/dex/exercise.png',
        alt: 'Dex exercise screen: toss the tomato in the cart by folding your laptop screen down',
        width: 1920,
        height: 1080,
      },
      {
        src: 'images/case-studies/dex/daily-practice.png',
        alt: 'Dex home screen: Your daily practice is here, Harry, with the It’s Celebratin’ Time card',
        width: 1920,
        height: 1080,
      },
    ],
  },
];
