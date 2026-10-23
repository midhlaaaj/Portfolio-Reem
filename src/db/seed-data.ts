/**
 * Initial content, taken from the Claude Design prototype so the first deploy matches the designs.
 * Media points at /assets (shipped in public/); anything uploaded later goes to object storage.
 */
import type { AboutContent, HomeContent, ServicesContent, SiteSettings } from '@/lib/content';

export type SeedMedia = { id: string; url: string; width: number; height: number; alt: string; name: string };

const M: SeedMedia[] = [];
const m = (id: string, file: string, width: number, height: number, alt: string) => {
  M.push({ id, url: `/assets/${file}`, width, height, alt, name: file });
  return id;
};
const each = (alts: string[], mk: (i: number, alt: string) => void) => alts.forEach((a, i) => mk(i, a));

m('m-cover', 'p01-0.jpg', 1920, 1080, 'Red portfolio folder held in a hand');
m('m-og', 'og.jpg', 1200, 630, 'Reem Fathima, graphic designer and social media designer, over a red portfolio folder');
m('m-expo-entrance', 'p05-0.jpg', 1439, 914, 'Expo entrance with two branded pillars and a red carpet');
each(
  [
    'Study MBBS in Uzbekistan poster',
    'NEET score poster',
    'MBBS seat in India poster',
    'Nursing in Germany poster',
    'NEET qualified poster',
    'MBBS in Georgia for 2.5 lakh poster',
    'Scholarship poster',
    'Expo event calendar poster',
  ],
  (i, a) => m(`m-expo-post-${i}`, `p06-${i}.jpg`, 304, 380, a),
);
m('m-expo-mbbs', 'p07-0.jpg', 1431, 786, 'MBBS in Georgia brochure spreads');
m('m-expo-nursing', 'p08-0.jpg', 1431, 786, 'Nursing in Georgia brochure spreads');
[0, 1, 2, 3].forEach((i) => m(`m-rollup-${i}`, `rollup-${i}.jpg`, 473, 653, `Study abroad roll-up banner ${i + 1}`));
m('m-expo-flyer', 'p10-0.jpg', 1455, 915, 'Study abroad flyer mockup');
m('m-to-entrance', 'p11-0.jpg', 691, 388, 'Take Off entrance pillars');
m('m-to-install-1', 'p12-0.jpg', 890, 694, 'Go where you grow installation');
m('m-to-install-2', 'p12-1.jpg', 527, 694, 'Pillar installation with motivational lines');
m('m-to-brochure', 'p13-0.jpg', 1918, 602, 'Take Off four-page brochure');
m('m-cb-mark', 'p14-0.jpg', 362, 428, 'CB Perfume fingerprint monogram');
m('m-cb-guide', 'p15-0.jpg', 1435, 815, 'CB Perfume brand guideline pages');
m('m-cb-bottles', 'p16-0.jpg', 1435, 903, 'CB Perfume bottles in warm amber light');
m('m-ss-cover', 'p17-0.jpg', 596, 844, 'Sugar Sisters menu cover');
m('m-ss-spreads', 'p18-0.jpg', 1258, 904, 'Sugar Sisters menu spreads on lilac stripes');
m('m-ss-pets', 'p19-0.jpg', 1918, 904, 'Paws and Pastries pet menu');
m('m-roost-cover', 'p20-0.jpg', 715, 896, 'Less sad story, more Roostory rooster poster');
m('m-roost-sheet', 'p21-0.jpg', 1047, 876, 'Roostory campaign posters');
each(
  [
    'Classic flame grilled chicken poster',
    'We are hiring poster',
    'Grand opening poster',
    'Less sad story, more Roostory poster',
    'Winter special poster',
    'Fine dine ceremony poster',
  ],
  (i, a) => m(`m-roost-${i}`, `roostory-${i}.jpg`, 343, 432, a),
);
m('m-asaas-sheet', 'p22-0.jpg', 1014, 885, 'ASAAS campaign posters in deep blue and green');
each(
  [
    'Bookkeeping and financial reviews poster',
    'VAT registration poster',
    'E-invoicing poster',
    'Traditional invoicing poster',
    'Our services poster',
    'Services list poster',
  ],
  (i, a) => m(`m-asaas-${i}`, `asaas-${i}.jpg`, 330, 434, a),
);

export const seedMedia = M;

export const seedCategories = [
  { id: 'c-branding', name: 'Branding', slug: 'branding' },
  { id: 'c-events', name: 'Events & installations', slug: 'events-and-installations' },
  { id: 'c-print', name: 'Print', slug: 'print' },
  { id: 'c-social', name: 'Social media', slug: 'social-media' },
  { id: 'c-motion', name: 'Motion', slug: 'motion' },
];

type SeedSection = { type: 'full' | 'grid' | 'strip' | 'video'; title: string; text: string; media: string[] };
const S = (type: SeedSection['type'], title: string, text: string, media: string[] = []): SeedSection => ({
  type,
  title,
  text,
  media,
});
const range = (p: string, n: number) => Array.from({ length: n }, (_, i) => p + i);

export type SeedProject = {
  slug: string;
  title: string;
  client: string;
  scope: string;
  year: string;
  cats: string[];
  tab: string;
  cover: string | null;
  featured: boolean;
  overview: string;
  /** Search title (shown before the site name) and meta description, max 120 / 160 characters. */
  seoTitle: string;
  seoDesc: string;
  sections: SeedSection[];
};

export const seedProjects: SeedProject[] = [
  {
    slug: 'study-abroad-expo-2026',
    title: 'Study Abroad Expo 2026',
    client: 'Bayroot International Study Abroad',
    scope: 'Event identity, social media, print',
    year: '2026',
    cats: ['c-events', 'c-social', 'c-print'],
    tab: 'Events & installations',
    cover: 'm-expo-entrance',
    featured: true,
    overview:
      'Event branding for Kerala’s Biggest Study Abroad Expo 2026, a tour from Kasaragod to Trivandrum for Bayroot International. I designed the expo logo, the entrance pillars, Malayalam and English social media posters for MBBS and nursing abroad, two brochures, roll-up banners and a flyer, all in red, white and blue.',
    seoTitle: 'Study Abroad Expo 2026: Event Branding and Print',
    seoDesc:
      'Logo, entrance pillars, social media posters, brochures and roll-up banners for Bayroot International’s Study Abroad Expo 2026 tour across Kerala.',
    sections: [
      S(
        'full',
        'Event logo',
        'A logo built from bold, dynamic type and bright colour, set up to work on banners, social posts and print.',
      ),
      S(
        'full',
        'Event entrance',
        'Two custom pillars with destination visuals and bold type, plus a red carpet, set the tone as soon as visitors walk in.',
        ['m-expo-entrance'],
      ),
      S(
        'strip',
        'Social media posters',
        'A Malayalam and English series covering scholarships, MBBS and nursing seats, and tour dates across Kerala.',
        range('m-expo-post-', 8),
      ),
      S(
        'grid',
        'Brochure: Study MBBS in Georgia',
        'Cover, university profiles, fee comparisons and the application process, in a red and white layout that keeps the facts easy to find.',
        ['m-expo-mbbs'],
      ),
      S(
        'grid',
        'Brochure: Study Nursing in Georgia',
        'Programme benefits, fee structures and living costs, laid out so students can compare their options quickly.',
        ['m-expo-nursing'],
      ),
      S(
        'grid',
        'Roll-up banners',
        'Banners for the UK, Bulgaria and other destinations, each in its own colour scheme so they are easy to tell apart on the exhibition floor.',
        range('m-rollup-', 4),
      ),
      S(
        'full',
        'Flyer',
        'A Malayalam flyer covering Georgia, Uzbekistan, Bulgaria, the UK and the UAE, in purple and white.',
        ['m-expo-flyer'],
      ),
    ],
  },
  {
    slug: 'take-off-2026',
    title: 'Take Off 2026',
    client: 'Bayroot International Study Abroad',
    scope: 'Event branding, print, installations',
    year: '2026',
    cats: ['c-events', 'c-print'],
    tab: 'Events & installations',
    cover: 'm-to-install-1',
    featured: false,
    overview:
      'Event branding and print for Take Off, a 2026 send-off for students leaving for the UK, Georgia, Uzbekistan, Egypt and other countries. The work covers entrance pillars, a country-by-country guidebook, a folded brochure, and motivational installations and backdrops in blue, red, orange and yellow.',
    seoTitle: 'Take Off 2026: Student Send-Off Event Branding',
    seoDesc:
      'Entrance pillars, installations, backdrops and a bilingual brochure for Take Off 2026, a send-off event for students heading abroad.',
    sections: [
      S(
        'grid',
        'Entrance branding',
        'An aviation-themed entrance in blue and yellow, with oversized lettering and cloud graphics to welcome the students.',
        ['m-to-entrance'],
      ),
      S(
        'grid',
        'Event installations',
        'Travel illustrations, motivational lines and geometric structures set up around the venue as a send-off for the students.',
        ['m-to-install-1', 'm-to-install-2'],
      ),
      S(
        'full',
        '4-page brochure',
        'A bilingual brochure listing each country’s benefits, flag and key facts in a layout that is quick to scan.',
        ['m-to-brochure'],
      ),
    ],
  },
  {
    slug: 'cb-perfume',
    title: 'CB Perfume',
    client: 'CB Perfume',
    scope: 'Logo design, brand guidelines',
    year: '',
    cats: ['c-branding'],
    tab: 'Branding',
    cover: 'm-cb-bottles',
    featured: true,
    overview:
      'Logo and brand guidelines for CB Perfume, a personalised fragrance brand. The mark is a fingerprint containing the CB monogram, a nod to the idea that everyone is different and so is their scent. The identity uses black and gold, with logo variations, a colour palette and packaging mockups.',
    seoTitle: 'CB Perfume: Logo Design and Brand Guidelines',
    seoDesc:
      'A fingerprint monogram logo, black and gold colour palette and brand guidelines for CB Perfume, a personalised fragrance brand.',
    sections: [
      S(
        'grid',
        'Logo and brand guidelines',
        'A fingerprint holding the CB monogram, shown with logo variations, a colour palette and usage rules in black and gold.',
        ['m-cb-mark', 'm-cb-guide'],
      ),
      S(
        'full',
        'Product mockups',
        'The identity applied to the bottles, with amber light, gold details and reflective glass.',
        ['m-cb-bottles'],
      ),
    ],
  },
  {
    slug: 'sugar-sisters',
    title: 'Sugar Sisters',
    client: 'Sugar Sisters',
    scope: 'Menu design, layout, illustration',
    year: '',
    cats: ['c-print', 'c-branding'],
    tab: 'Print',
    cover: 'm-ss-spreads',
    featured: true,
    overview:
      'A cake menu for Sugar Sisters, a bakery run by two sisters. It uses lilac stripes, soft textures and hand-drawn illustrations to tell the brand story, lists the 1 kg and 500 g signature cakes by chocolate and vanilla, and ends with ordering details.',
    seoTitle: 'Sugar Sisters: Bakery Menu Design',
    seoDesc:
      'A cake menu with lilac stripes and hand-drawn illustrations for Sugar Sisters, plus a matching Paws & Pastries menu for dogs.',
    sections: [
      S(
        'grid',
        'Cake menu',
        'Signature cakes grouped into chocolate and vanilla, with the brand story and ordering details on lilac stripes.',
        ['m-ss-cover', 'm-ss-spreads'],
      ),
      S(
        'full',
        'Paws & Pastries pet menu',
        'A menu for dogs that extends the brand with pet-safe cakes, ingredient lists and the same friendly tone.',
        ['m-ss-pets'],
      ),
    ],
  },
  {
    slug: 'roostory',
    title: 'Roostory',
    client: 'Roostory',
    scope: 'Campaign, posters, social media',
    year: '',
    cats: ['c-social'],
    tab: 'Social media',
    cover: 'm-roost-sheet',
    featured: true,
    overview:
      'A social media campaign for Roostory, a grilled chicken restaurant. The posters pair elegant type with a red and cream palette and a playful rooster mascot, and cover the grand opening, a hiring call, menu highlights, winter specials and a fine-dining night.',
    seoTitle: 'Roostory: Restaurant Campaign Posters',
    seoDesc:
      'Grand opening, hiring and menu posters for Roostory, a grilled chicken restaurant, built around a red and cream palette and a rooster mascot.',
    sections: [
      S(
        'strip',
        'Campaign posters',
        'Posters for the grand opening, a hiring call, menu highlights, winter specials and a fine-dining night, in red and cream.',
        range('m-roost-', 6),
      ),
    ],
  },
  {
    slug: 'asaas',
    title: 'ASAAS',
    client: 'ASAAS Auditing',
    scope: 'Campaign, posters, social media',
    year: '',
    cats: ['c-social'],
    tab: 'Social media',
    cover: 'm-asaas-sheet',
    featured: false,
    overview:
      'A social media campaign for ASAAS Auditing, a tax consultancy in the UAE, explaining its accounting, bookkeeping, VAT registration, e-invoicing and advisory services. The posters use deep blue with bright green accents.',
    seoTitle: 'ASAAS Auditing: Social Media Posters for a UAE Tax Firm',
    seoDesc:
      'Poster series for ASAAS Auditing, a UAE tax consultancy, explaining bookkeeping, VAT registration and e-invoicing in deep blue and green.',
    sections: [
      S(
        'strip',
        'Campaign posters',
        'Posters explaining bookkeeping, VAT registration, e-invoicing and the firm’s other services, in deep blue with bright green accents.',
        range('m-asaas-', 6),
      ),
    ],
  },
  {
    slug: 'motion',
    title: 'Motion reel',
    client: 'Various clients',
    scope: 'Animated promos and reels',
    year: '',
    cats: ['c-motion'],
    tab: 'Motion',
    cover: null,
    featured: false,
    overview:
      'Animated promos, logo reveals and reels made in After Effects and Premiere Pro. More pieces will be added here as the video files come in.',
    seoTitle: 'Motion Graphics Reel: Promos, Logo Reveals and Reels',
    seoDesc: 'Animated promos, logo reveals and social media reels made in After Effects and Premiere Pro.',
    sections: [S('video', 'Showreel', 'A reel of recent motion work, 45 to 90 seconds long.')],
  },
];

export const seedSettings: SiteSettings = {
  siteTitle: 'Reem Fathima | Graphic Designer and Social Media Designer',
  siteDesc:
    'Freelance graphic designer creating social media posters, brand identities, event branding and motion graphics for businesses in Kerala and the Gulf.',
  email: 'reemfathima66@gmail.com',
  phone: '+91 75104 49444',
  whatsapp: '917510449444',
  instagram: '',
  behance: '',
  linkedin: '',
  cvUrl: '',
  cvName: '',
  seoImageId: 'm-og',
  replyTime: 'I usually reply within a day.',
};

export const seedHome: Partial<HomeContent> = {
  tagline:
    'Graphic designer and social media creative. I design posters, brand identities, event branding and motion pieces for businesses in Kerala and the Gulf.',
  smallLine: 'Self-taught, with recent client work below.',
  showreelUrl: '',
  showreelPosterId: 'm-cover',
  heroLeftId: 'm-expo-post-6',
  heroRightId: 'm-roost-cover',
  clientsLine:
    'Past clients include a study abroad consultancy, a restaurant, a perfume brand, a bakery and a tax firm in the UAE.',
  introText: 'From a single poster to a full launch campaign, this is the work I do most.',
  selectedWorkTitle: 'Recent projects',
  ctaText:
    'Need a poster series, a logo, an event setup or a month of social media content? Tell me what you are planning.',
};

export const seedAbout: AboutContent = {
  lead: "I'm Reem, a self-taught graphic designer. I taught myself the Adobe tools, and now I design social media posters, logos, event branding and motion graphics for businesses in Kerala and the Gulf.",
  story:
    "I like posters that stand out in a feed and still get the offer across at a glance. Lately I've also been using AI tools for visuals, video and voice-overs, then finishing the work by hand so it doesn't look generated.",
  toolsDesign: ['Photoshop', 'Illustrator', 'After Effects', 'Premiere Pro'],
  toolsAI: ['ChatGPT', 'Gemini', 'Kling AI', 'Veo 3', 'Flow', 'ElevenLabs'],
  expRole: 'Freelance graphic and motion designer',
  expStart: '',
  expText:
    'Social media posts, ads, posters, brochures and animated promos for companies in education, food, fragrance and finance.',
  portraitId: null,
};

export const seedServices: ServicesContent = {
  intro: 'Everything I offer, from a one-off poster to a full campaign. Pick one service or combine a few.',
  pricingOn: false,
  items: [
    {
      id: 'sv-social',
      name: 'Social media creatives',
      short: 'Posters and post series in English and Malayalam.',
      desc: 'Posters and post series in English and Malayalam for launches, offers, hiring calls and event promotion. I design each campaign as a set, so the posts look related and the message stays clear.',
      deliverables: ['Launch and offer posters', 'Carousel and story sets', 'Bilingual post series'],
      projectSlug: 'roostory',
      imageId: 'm-expo-post-6',
      price: '',
    },
    {
      id: 'sv-brand',
      name: 'Brand identity',
      short: 'Logos, colour palettes and brand guidelines.',
      desc: 'Logo design, colour palettes, typography and a brand guidelines document, so your business looks the same on packaging, signage and social media.',
      deliverables: ['Logo and variations', 'Colour palette and typography', 'Brand book and packaging mockups'],
      projectSlug: 'cb-perfume',
      imageId: 'm-cb-mark',
      price: '',
    },
    {
      id: 'sv-event',
      name: 'Event branding',
      short: 'Entrance pillars, backdrops, roll-ups and stage graphics.',
      desc: 'Entrance pillars, stage backdrops, roll-up banners and printed material for expos, launches and send-off events. Everything shares one look, so visitors see the same brand at the entrance, on stage and in the brochure.',
      deliverables: ['Entrance arches and pillars', 'Stage backdrops', 'Roll-up banners'],
      projectSlug: 'study-abroad-expo-2026',
      imageId: 'm-to-install-2',
      price: '',
    },
    {
      id: 'sv-print',
      name: 'Print',
      short: 'Brochures, flyers and menus.',
      desc: 'Brochures, flyers and menus laid out for easy reading and delivered print-ready, with bleed and the correct colour profile.',
      deliverables: ['Folded brochures', 'Flyers', 'Menus'],
      projectSlug: 'sugar-sisters',
      imageId: 'm-ss-cover',
      price: '',
    },
    {
      id: 'sv-motion',
      name: 'Motion graphics',
      short: 'Animated promos, logo reveals and reels.',
      desc: 'Animated posters, logo reveals and short promos, made in After Effects and Premiere Pro and sized for whichever platform they will run on.',
      deliverables: ['Animated posters', 'Logo reveals', 'Reels and promos'],
      projectSlug: 'motion',
      imageId: null,
      price: '',
    },
    {
      id: 'sv-ai',
      name: 'AI-assisted content',
      short: 'Visuals, video ads and voice-overs made with AI tools and finished by hand.',
      desc: 'Visuals, short video ads and voice-overs made with tools like Kling, Veo, Gemini and ElevenLabs, then edited and cleaned up by hand. It lets a busy campaign get more content without looking generated.',
      deliverables: ['AI-generated visuals', 'Short video ads', 'Voice-overs'],
      projectSlug: '',
      imageId: 'm-roost-3',
      price: '',
    },
  ],
  process: [
    { title: 'Brief', text: 'You tell me the goal, audience, deadline and budget.' },
    { title: 'Concept', text: 'I send back a direction, references and rough layouts.' },
    { title: 'Design', text: 'I design the final pieces. Two rounds of revisions are included.' },
    { title: 'Delivery', text: 'You get print-ready and social-ready files in all the sizes you need.' },
  ],
};

/** Placeholder quotes from the design. Seeded hidden so no placeholder text ships live. */
export const seedTestimonials = [
  {
    quote:
      'A quote from Bayroot International on the Study Abroad Expo 2026: what the tour needed, and how the creative held together from Kasaragod to Trivandrum.',
    name: 'Name',
    role: 'Role',
    business: 'Bayroot International',
  },
  {
    quote:
      'A quote from Roostory on the opening campaign: the rooster, the posters, and what changed once they went live.',
    name: 'Name',
    role: 'Role',
    business: 'Roostory',
  },
  {
    quote: 'A quote from CB Perfume on the brand identity: how the fingerprint mark landed with their customers.',
    name: 'Name',
    role: 'Role',
    business: 'CB Perfume',
  },
];
