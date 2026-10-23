/**
 * Every fixed piece of wording on the public site: headings, button labels, short paragraphs, in one place.
 * Each entry is [key, group, description, text]. Edit the text here and redeploy.
 */
const ENTRIES = [
  ['nav.work', 'Navigation', 'Work link', 'Work'],
  ['nav.services', 'Navigation', 'Services link', 'Services'],
  ['nav.about', 'Navigation', 'About link', 'About'],
  ['nav.contact', 'Navigation', 'Contact link (menu)', 'Contact'],
  ['nav.home', 'Navigation', 'Home link (menu)', 'Home'],
  ['nav.start', 'Navigation', 'Start a project button', 'Start a project'],
  ['nav.menu', 'Navigation', 'Menu button (mobile)', 'Menu'],
  ['nav.close', 'Navigation', 'Close button (mobile menu)', 'Close'],

  ['home.viewWork', 'Home', 'Hero button: view work', 'View work'],
  ['home.startProject', 'Home', 'Hero button: start a project', 'Start a project'],
  ['home.whatLine1', 'Home', 'What I do heading, line 1', 'What'],
  ['home.whatLine2', 'Home', 'What I do heading, line 2', 'I do'],
  ['home.exploreServices', 'Home', 'Explore services button', 'Explore services'],
  ['home.seeAllWork', 'Home', 'See all work button', 'See all work'],
  ['home.viewProject', 'Home', 'View project label on cards (mobile)', 'View project'],

  ['work.title', 'Work page', 'Page heading', 'Work'],
  [
    'work.intro',
    'Work page',
    'Intro paragraph',
    "Posters, brand identities, event setups, print and motion work I've made for businesses in Kerala and the Gulf.",
  ],
  [
    'work.empty',
    'Work page',
    'Message when a category has no projects',
    'Nothing in this category yet. Check All to see everything.',
  ],
  ['work.all', 'Work page', 'First filter tab', 'All'],

  ['project.client', 'Project pages', 'Client label', 'Client'],
  ['project.scope', 'Project pages', 'Scope label', 'Scope'],
  ['project.year', 'Project pages', 'Year label', 'Year'],
  ['project.confirm', 'Project pages', 'Shown when scope or year is empty', '–'],
  ['project.next', 'Project pages', 'Next project label', 'Next project'],

  ['services.title', 'Services page', 'Page heading', 'Services'],
  ['services.deliverables', 'Services page', 'Deliverables label', 'Deliverables'],
  ['services.featured', 'Services page', 'Featured project label', 'Featured project'],
  ['services.howLine1', 'Services page', 'How I work heading, line 1', 'How I'],
  ['services.howLine2', 'Services page', 'How I work heading, line 2', 'work'],

  ['about.title', 'About page', 'Page heading', 'About'],
  ['about.tools', 'About page', 'Tools heading', 'Tools'],
  ['about.toolsDesign', 'About page', 'Design tools label', 'Design and video'],
  ['about.toolsAI', 'About page', 'AI tools label', 'AI tools'],
  ['about.experience', 'About page', 'Experience heading', 'Experience'],
  ['about.downloadCv', 'About page', 'Download CV button', 'Download CV'],

  ['contact.line1', 'Contact page', 'Heading, line 1', "Let's talk"],
  ['contact.line2', 'Contact page', 'Heading, line 2', 'about your project.'],
  [
    'contact.lead',
    'Contact page',
    'Intro (the reply-time line from Settings follows it)',
    "Tell me what you're making, when you need it and roughly what you have in mind for the budget.",
  ],
  ['contact.whatsapp', 'Contact page', 'WhatsApp button', 'Message on WhatsApp'],
  ['contact.sentTitle', 'Contact page', 'After sending: heading', "Thanks, it's sent."],
  [
    'contact.sentText',
    'Contact page',
    'After sending: text',
    "I'll read your message and reply by email as soon as I can.",
  ],
  ['contact.sendAnother', 'Contact page', 'After sending: button', 'Send another message'],

  ['privacy.title', 'Privacy page', 'Page heading', 'Privacy'],
  ['privacy.h1', 'Privacy page', 'Section 1 heading', 'What the contact form collects'],
  [
    'privacy.p1',
    'Privacy page',
    'Section 1 text',
    'When you send a message, I receive your name, email, phone number if you add one, project type, budget, timeline and message.',
  ],
  ['privacy.h2', 'Privacy page', 'Section 2 heading', "How it's used"],
  [
    'privacy.p2',
    'Privacy page',
    'Section 2 text',
    "I use these details only to reply to you and plan your project. I don't sell them or share them with anyone else.",
  ],
  ['privacy.h3', 'Privacy page', 'Section 3 heading', "How long it's kept"],
  [
    'privacy.p3',
    'Privacy page',
    'Section 3 text',
    "Messages stay in my inbox while we're in touch about your project.",
  ],
  ['privacy.h4', 'Privacy page', 'Section 4 heading', 'Asking for deletion'],
  ['privacy.p4a', 'Privacy page', 'Section 4 text, before the email', "To see or delete what you've sent, email"],
  ['privacy.p4b', 'Privacy page', 'Section 4 text, after the email', "and I'll remove it."],

  ['notfound.line1', '404 page', 'Heading, line 1', "This page isn't"],
  ['notfound.line2', '404 page', 'Heading, line 2', 'in the folder.'],
  ['notfound.tab', '404 page', 'Folder tab label', 'Missing'],
  ['notfound.back', '404 page', 'Button', 'Back to work'],

  ['footer.tab', 'Footer', 'Folder tab label', 'Get in touch'],
  ['footer.emailMe', 'Footer', 'Email label', 'Email me'],
  ['footer.elsewhere', 'Footer', 'Social links label', 'Elsewhere'],
  ['footer.pages', 'Footer', 'Page links label', 'Pages'],
  ['footer.privacy', 'Footer', 'Privacy link', 'Privacy'],
  ['footer.top', 'Footer', 'Back to top button', 'Back to top'],
] as const;

export type CopyKey = (typeof ENTRIES)[number][0];
export type Copy = Record<CopyKey, string>;

export const COPY_DEFAULTS = Object.fromEntries(ENTRIES.map(([k, , , d]) => [k, d])) as Copy;
