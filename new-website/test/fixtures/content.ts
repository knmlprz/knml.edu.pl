// Zmyślone wpisy, partnerzy i projekty do testów src/lib (test/lib/*.test.ts).
// Pola jak po wczytaniu przez Astro: daty z YAML są już obiektami Date.

const post = (id: string, date: string, extra: object = {}) => ({
  id,
  body: 'Treść wpisu.',
  data: { title: `Wpis ${id}`, date: new Date(date), author: 'Test', category: 'aktualnosci', tags: [], draft: false, ...extra },
});

export const posts = [
  post('stary', '2021-03-01'),
  // Ten sam dzień co „rano”, ale później: musi być wyżej na liście.
  post('wieczor', '2026-10-19T20:00:00+02:00'),
  post('rano', '2026-10-19T08:00:00+02:00'),
  post('szkic', '2026-12-24', { draft: true }),
];

const partner = (id: string, validUntil?: string) => ({
  id,
  data: {
    name: `Partner ${id}`,
    url: 'https://example.com',
    tier: 'partner',
    validUntil: validUntil ? new Date(validUntil) : undefined,
    en: { name: `Partner ${id} EN` },
  },
});

// Testy ustawiają „dziś” na 2026-11-30.
export const partners = [
  partner('bez-daty'),
  partner('do-wczoraj', '2026-11-29'),
  partner('do-dzis', '2026-11-30'),
  partner('do-jutra', '2026-12-01'),
];

const project = (id: string, order: number, postId?: string) => ({
  id,
  data: {
    title: `Projekt ${id}`,
    category: 'NLP',
    description: 'Opis',
    tags: [],
    meta: '2026',
    order,
    post: postId ? { collection: 'blog', id: postId } : undefined,
    en: { title: `Project ${id}` },
  },
});

export const projects = [
  project('z-wpisem', 2, 'rano'),
  project('bez-wpisu', 1),
];

export const projectWithMissingPost = project('literowka', 3, 'nie-ma-takiego-wpisu');
export const projectWithDraftPost = project('do-szkicu', 4, 'szkic');
