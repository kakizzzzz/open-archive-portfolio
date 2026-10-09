export type Reason = {
  id: string;
  title: string;
  shortTitle: string;
  body: string;
  note: string;
  tag: string;
  author?: string;
  source?: string;
};

// Edit this profile and the entries below to make the template your own.
export const templateProfile = {
  brand: 'STUDIO',
  name: 'YOUR NAME',
  role: 'Independent creative',
  discipline: 'INDEPENDENT CREATIVE',
  disciplines: 'Visual design / Illustration / Creative practice',
  pageTitle: 'An Open Archive',
  website: 'https://example.com',
  location: 'Your city',
  introduction: 'A space for ideas, observations, and work in progress.',
  biography: 'Replace this with a short introduction to your creative practice. Describe what you make, what you notice, and what you would like to explore next.',
};

export const contactEmail = 'hello@example.com';
export const contactPhone = '+00 000 000 0000';
export const otherPortfolioUrl = templateProfile.website;

// Set both fields to null for the original text-only computer screen.
export const introMedia: { src: string | null; poster: string | null } = {
  src: `${import.meta.env.BASE_URL}assets/template/intro-pingpong.mp4`,
  poster: `${import.meta.env.BASE_URL}assets/template/intro-poster.jpg`,
};

export const reasons: Reason[] = [
  {
    id: '01',
    title: 'A Clear Midnight',
    shortTitle: 'Quiet things',
    body: 'This is thy hour O Soul, thy free flight into the wordless,',
    note: 'Leave room for a pause.',
    tag: 'Fragments',
    author: 'Walt Whitman',
    source: 'https://poets.org/poem/clear-midnight',
  },
  {
    id: '02',
    title: 'Look a little closer',
    shortTitle: 'Look closely',
    body: 'To see a World in a Grain of Sand\nAnd a Heaven in a Wild Flower',
    note: 'Attention is a beginning.',
    tag: 'Observation',
    author: 'William Blake',
    source: 'https://poets.org/poem/auguries-innocence',
  },
  {
    id: '03',
    title: 'Ideas become experiences',
    shortTitle: 'From idea to experience',
    body: 'Use this space to describe the questions behind a project. What did you explore, what did you learn, and what changed along the way?',
    note: 'Keep the question open.',
    tag: 'Exploration',
  },
  {
    id: '04',
    title: 'A small kind of hope',
    shortTitle: 'Make, notice, repeat',
    body: 'Hope is the thing with feathers\nThat perches in the soul,',
    note: 'One mark at a time.',
    tag: 'Practice',
    author: 'Emily Dickinson',
    source: 'https://poets.org/poem/hope-thing-feathers-254',
  },
  {
    id: '05',
    title: 'Another way to see a shape',
    shortTitle: 'A different angle',
    body: 'A familiar form can hold an unfamiliar possibility. Add an example of how you move between techniques, formats, or ways of seeing.',
    note: 'Turn the page.',
    tag: 'Form',
  },
  {
    id: '06',
    title: 'Let us make something together',
    shortTitle: 'Say hello',
    body: 'Replace this with your availability, the kinds of projects you welcome, and how you prefer to collaborate. The contact details here are placeholders.',
    note: 'Begin with a conversation.',
    tag: 'Collaboration',
  },
  {
    id: '07',
    title: 'Collecting the in-between',
    shortTitle: 'Notes from the everyday',
    body: 'References can arrive from anywhere: a book, a conversation, an unfinished thought. Share the things that shape your point of view.',
    note: 'Keep a small notebook.',
    tag: 'References',
  },
  {
    id: '08',
    title: 'A story beyond a single image',
    shortTitle: 'Beyond the frame',
    body: 'A project can continue through a series, an object, or a new context. Describe the directions you would like your work to take.',
    note: 'There is another page.',
    tag: 'Possibilities',
  },
  {
    id: '09',
    title: 'A point of view, still growing',
    shortTitle: 'A way of seeing',
    body: 'Use this space for your personal approach to making. A clear, thoughtful sentence is enough. Leave room for your practice to change.',
    note: 'Stay curious.',
    tag: 'Perspective',
  },
];

export type PortfolioWork = {
  id: string;
  category: 'fragments' | 'illustration' | 'character-illustration' | 'red-envelope' | 'branding' | 'platform' | 'product' | 'pet-design' | '3d';
  title: string;
  caption: string;
  image: string;
  thumbnail: string;
  alt: string;
  width: number;
  height: number;
};

export const workCategories: Array<{
  id: 'all' | PortfolioWork['category'];
  label: string;
}> = [
  { id: 'all', label: 'All work' },
  { id: 'fragments', label: 'Fragments' },
  { id: 'illustration', label: 'Studies' },
  { id: 'branding', label: 'Visual systems' },
  { id: 'product', label: 'Experiments' },
];

const workAsset = (filename: string) => `${import.meta.env.BASE_URL}assets/template/${filename}`;

export const portfolioWorks: PortfolioWork[] = [
  {
    id: 'silence',
    category: 'fragments',
    title: 'Silence',
    caption: 'A study in stillness',
    image: workAsset('01-silence.svg'),
    thumbnail: workAsset('01-silence.svg'),
    alt: 'Black and white typographic study titled Silence.',
    width: 900,
    height: 1200,
  },
  {
    id: 'feathers',
    category: 'fragments',
    title: 'Feathers',
    caption: 'A small beginning',
    image: workAsset('02-feathers.svg'),
    thumbnail: workAsset('02-feathers.svg'),
    alt: 'Black and white typographic study titled Feathers.',
    width: 900,
    height: 1200,
  },
  {
    id: 'horizon',
    category: 'illustration',
    title: 'Horizon',
    caption: 'An open field',
    image: workAsset('03-horizon.svg'),
    thumbnail: workAsset('03-horizon.svg'),
    alt: 'Monochrome graphic study of a horizon.',
    width: 1200,
    height: 1200,
  },
  {
    id: 'grain',
    category: 'branding',
    title: 'Grain',
    caption: 'Rhythm and repetition',
    image: workAsset('04-grain.svg'),
    thumbnail: workAsset('04-grain.svg'),
    alt: 'Black and white graphic study titled Grain.',
    width: 1600,
    height: 1000,
  },
  {
    id: 'orbit',
    category: 'illustration',
    title: 'Orbit',
    caption: 'A different angle',
    image: workAsset('05-orbit.svg'),
    thumbnail: workAsset('05-orbit.svg'),
    alt: 'Monochrome graphic study of orbital forms.',
    width: 1000,
    height: 1400,
  },
  {
    id: 'room',
    category: 'product',
    title: 'Room',
    caption: 'Space to imagine',
    image: workAsset('06-room.svg'),
    thumbnail: workAsset('06-room.svg'),
    alt: 'Black and white graphic composition titled Room.',
    width: 1200,
    height: 900,
  },
  {
    id: 'margin',
    category: 'branding',
    title: 'Margin',
    caption: 'Notes around the edges',
    image: workAsset('07-margin.svg'),
    thumbnail: workAsset('07-margin.svg'),
    alt: 'Monochrome typographic composition titled Margin.',
    width: 900,
    height: 1200,
  },
  {
    id: 'beginning',
    category: 'illustration',
    title: 'Beginning',
    caption: 'The next blank page',
    image: workAsset('08-beginning.svg'),
    thumbnail: workAsset('08-beginning.svg'),
    alt: 'Black and white typographic composition titled Beginning.',
    width: 1200,
    height: 1200,
  },
];

export const templateResume = {
  experience: {
    title: 'YOUR STUDIO / YOUR ROLE',
    period: 'YEAR — YEAR',
    bullets: [
      'Describe a selected project and your part in it.',
      'Add the process, responsibilities, and deliverables that matter.',
      'Share a result or lesson, using your own verified details.',
    ],
  },
  education: {
    title: 'YOUR SCHOOL / YOUR SUBJECT',
    period: 'YEAR',
  },
  practice: 'Add a short description of your independent projects, interests, or ongoing experiments. Use only the experience you want to share.',
  tools: ['YOUR SKILLS / YOUR SPECIALISMS', 'YOUR SOFTWARE / YOUR MATERIALS'],
};
