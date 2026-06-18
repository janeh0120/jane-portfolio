export const site = {
  name: 'Jane Hou',
  title: "Jane Hou's Portfolio",
  description:
    "I'm Jane Hou, I build creative design solutions fuelled by a passion for design's power to create positive change.",
  email: 'janeh0120@gmail.com',
  year: 2026,
  links: {
    intuit: 'https://www.intuit.com/ca/',
    gwsk: 'https://gwsk.studio/',
    simpleVentures: 'https://www.simpleventures.ca/',
    instagram: 'https://www.instagram.com/hsz_design/',
    x: 'https://x.com/jane09890',
    linkedin: 'https://www.linkedin.com/in/hou-jane/',
    resume: '#',
  },
  nav: [
    { label: 'Projects', href: '/#projects' },
    { label: 'About', href: '/about' },
    { label: 'Extra!', href: '/extra' },
    { label: 'Resume', href: 'https://drive.google.com/file/d/1GIoyNn6HADODpR-6b8PsSf7BwYmytnxg/view', external: false },
  ],
  hero: {
    intro: "I'm Jane, a ",
    role: 'systems thinker',
    middle: ' invested in designing ',
    outro: ' with intention.',
    filters: [
      { label: 'products', tag: 'product' },
      { label: 'branding', tag: 'brand' },
      { label: 'community', tag: 'community' },
    ],
  },
  experience: {
    current: { label: 'Intuit', href: 'https://www.intuit.com/ca/' },
    previous: [
      { label: 'GWSK', href: 'https://gwsk.studio/' },
      { label: 'Simple Ventures.', href: 'https://www.simpleventures.ca/' },
    ],
  },
  projects: [
    {
      slug: 'des-sys',
      tags: 'product, design systems, internship',
      title: 'Bridging design and code with AI',
      image: 'images/7UtMUHlfBYMyZYCFvm22bixCyVI.png',
      comingSoon: false,
    },
    {
      slug: 'ixd',
      tags: 'brand, community, concept',
      title: 'Building community through design',
      image: 'images/n2vRFBwXMxinRHvWMr4M300XMYQ.png',
      comingSoon: false,
    },
    {
      slug: 'designchall',
      tags: 'product, concept',
      title: 'Design large data tables',
      image: 'images/idJoFG559gccPL1RNMnuFQz3mvQ.png',
      comingSoon: false,
    },
    {
      slug: 'gwsk',
      tags: 'brand, internship',
      title: 'Building an enduring identity',
      image: 'images/3iUOparZSy8dbxSG8ObclzL8Q.png',
      comingSoon: false,
    },
  ],
  about: {
    heading: 'A little bit more about me!',
    paragraphs: [
      'Growing up in a family business, I became an eager self-starter with a strong drive for learning. I first explored design by creating social media posts, in-store displays, and managing the online presence for my family’s business. That experience sparked my freelance journey on Fiverr, where I helped small businesses with graphic design.',
      'In high school, noticing the lack of a strong design community, I founded a digital design club to introduce peers to creative tools and run workshops on free resources. Later, my involvement in hackathons inspired me to take on a leadership role as co-president of my college’s hackathon club—overseeing not only design, but also development, logistics, sponsorship, and social media.',
      'Alongside school, I volunteered my UX skills through Develop for Good, designing for a nonprofit organization, and gained professional experience interning at GWSK, a GTA-based design studio, where I contributed to visual and web design projects.',
      'Besides UX/product design, I love to apply my passion for design to drawing, crochet/knitting, scrapbooking, sewing, 3D modelling and more!',
      "I'm interested in Fall 2026 and Summer 2027 internships that can push my design craft and process to the next level, so feel free to connect with me!",
    ],
  },
  extra: {
    heading: 'Extra Stuff!',
  },
} as const;

export type Project = (typeof site.projects)[number];
