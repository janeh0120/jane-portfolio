export const site = {
  name: 'Jane Hou',
  title: "Jane Hou's Portfolio",
  description:
    "I'm Jane Hou, I build creative design solutions fuelled by a passion for design's power to create positive change.",
  email: '', // Add your email for the footer copy button
  year: 2026,
  links: {
    intuit: 'https://www.intuit.com/ca/',
    gwsk: 'https://gwsk.studio/',
    simpleVentures: 'https://www.simpleventures.ca/',
    instagram: 'https://www.instagram.com/hsz_design/',
    x: 'https://x.com/jane09890',
    linkedin: 'https://www.linkedin.com/in/janehou/',
    resume: '#',
  },
  nav: [
    { label: 'Projects', href: '/#projects' },
    { label: 'About', href: '/about' },
    { label: 'Extra!', href: '/extra' },
    { label: 'Resume', href: '#resume', external: false },
  ],
  hero: {
    intro: "I'm Jane , a",
    emphasis: ['systems thinker', 'products', 'branding', 'community'],
    middle: 'invested in designing',
    joiner: 'and',
    outro: 'with intention.',
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
      slug: 'ixd',
      tags: 'brand, community, concept',
      title: 'Building community through design',
      image: 'images/n2vRFBwXMxinRHvWMr4M300XMYQ.png',
      comingSoon: false,
    },
    {
      slug: null,
      tags: 'product, design systems, internship',
      title: 'Bridging design and code with AI',
      image: 'images/7UtMUHlfBYMyZYCFvm22bixCyVI.png',
      comingSoon: true,
    },
    {
      slug: null,
      tags: 'product, internship',
      title: 'AI first product development',
      image: 'images/tt2ttvnMYWp8S50iil6NuJwqMh4.png',
      comingSoon: true,
    },
    {
      slug: 'designchall',
      tags: 'product, concept',
      title: 'Designing large data tables',
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
    {
      slug: null,
      tags: 'brand, internship',
      title: 'Expressing brand through illustration',
      image: 'images/SnkKucdW7H3JnnEfTOX4yJru7oA.png',
      comingSoon: true,
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
