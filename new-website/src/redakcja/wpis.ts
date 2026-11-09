import { MIN_BODY_LENGTH, POST_CATEGORIES, tagKey, validatePost } from '../config/zasady-wpisow';

// Tworzenie pliku wpisu z danych kreatora (/redakcja/). Nic tu nie wie o wyglądzie ani o przeglądarce,
// więc ten sam kod może później działać na serwerze.

export type DraftImage = {
  // Nazwa pliku z dysku autora, np. IMG_1234.HEIC.
  name: string;
  size: number;
  alt: string;
};

export type Draft = {
  title: string;
  category: (typeof POST_CATEGORIES)[number];
  author: string;
  // Treść w Markdownie, z edytora.
  body: string;
  tags: string[];
  excerpt: string;
  githubLink: string;
  // Pierwsze zdjęcie to okładka, reszta trafia na koniec treści w tej kolejności.
  images: DraftImage[];
};

export type PostFile = {
  // Nazwa pliku w paczce.
  fileName: string;
  // Ścieżka, którą wskazuje index.md.
  postPath: string;
  // HEIC: index.md wskazuje już .jpg, plik trzeba przekonwertować (w fazie 4 zrobi to serwer).
  needsConversion: boolean;
};

const MAX_SLUG_LENGTH = 80;
const CONVERTED_FORMATS = ['heic', 'heif'];

// „Zwycięstwo w Łodzi” → „zwyciestwo-w-lodzi”. Ł nie rozkłada się na literę i ogonek, stąd osobna zamiana.
function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Kolejny wolny wariant nazwy: nazwa, nazwa-2, nazwa-3…
function firstFree(name: string, taken: Iterable<string>, withNumber = (n: number) => `${name}-${n}`): string {
  const used = new Set(taken);
  if (!used.has(name)) return name;
  let number = 2;
  while (used.has(withNumber(number))) number++;
  return withNumber(number);
}

// Adres wpisu /blog/<slug>/ z tytułu. Istniejącego wpisu nie nadpisuje.
export function postSlug(title: string, existingSlugs: string[]): string {
  let slug = slugify(title);
  if (slug.length > MAX_SLUG_LENGTH) slug = slug.slice(0, slug.lastIndexOf('-', MAX_SLUG_LENGTH));
  return firstFree(slug || 'nowy-wpis', existingSlugs);
}

function postFiles(images: DraftImage[]): PostFile[] {
  const taken: string[] = [];
  return images.map(({ name }) => {
    const dot = name.lastIndexOf('.');
    const extension = dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
    const base = slugify(dot >= 0 ? name.slice(0, dot) : name) || 'zdjecie';
    const needsConversion = CONVERTED_FORMATS.includes(extension);
    const postExtension = needsConversion ? 'jpg' : extension;
    const postName = firstFree(`${base}.${postExtension}`, taken, (n) => `${base}-${n}.${postExtension}`);
    taken.push(postName);
    const fileName = needsConversion ? postName.replace(/jpg$/, extension) : postName;
    return { fileName, postPath: `./${postName}`, needsConversion };
  });
}

// Istniejące tagi pasujące do tego, co autor wpisuje (bez wpisanego tekstu: wszystkie), bez już wybranych.
export function suggestTags(query: string, existingTags: readonly string[], selectedTags: readonly string[]): string[] {
  const key = tagKey(query);
  return existingTags.filter((tag) => !selectedTags.includes(tag) && tagKey(tag).includes(key));
}

// Data w strefie czasowej autora (toISOString dałby datę UTC, czyli po 23:00 już jutrzejszą).
const localDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// Tekst w cudzysłowie JSON to poprawny tekst YAML, więc dwukropek czy # w tytule nie psuje metadanych.
const yamlText = (text: string) => JSON.stringify(text);

const escapeAlt = (alt: string) => alt.trim().replace(/[\\[\]]/g, '\\$&');

export function buildPost(draft: Draft, { today, existingSlugs }: { today: Date; existingSlugs: string[] }) {
  const slug = postSlug(draft.title, existingSlugs);
  const files = postFiles(draft.images);
  const [coverImage, ...otherImages] = draft.images;
  const [coverFile, ...otherFiles] = files;

  const frontmatter: Record<string, string | string[]> = {
    title: draft.title.trim(),
    date: localDate(today),
    author: draft.author.trim(),
    category: draft.category,
    tags: draft.tags,
  };
  if (coverFile) {
    frontmatter.cover = coverFile.postPath;
    frontmatter.coverAlt = coverImage.alt.trim();
  }
  if (draft.excerpt.trim()) frontmatter.excerpt = draft.excerpt.trim();
  if (draft.githubLink.trim()) frontmatter.githubLink = draft.githubLink.trim();

  const imageLines = otherFiles.map((file, index) => `![${escapeAlt(otherImages[index].alt)}](${file.postPath})`);
  const body = [draft.body.trim(), ...imageLines].filter(Boolean).join('\n\n');

  const yaml = Object.entries(frontmatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) return value.length ? `${key}:\n${value.map((item) => `  - ${yamlText(item)}`).join('\n')}` : `${key}: []`;
      // Data i kategoria bez cudzysłowu, jak w ręcznie pisanych wpisach.
      return `${key}: ${key === 'date' || key === 'category' ? value : yamlText(value)}`;
    })
    .join('\n');

  return { slug, frontmatter, body, files, markdown: `---\n${yaml}\n---\n\n${body}\n` };
}

// Wszystkie błędy szkicu naraz. Braki opisujemy językiem kreatora (pola formularza), a limity,
// tagi i formaty sprawdza validatePost, tak samo jak build.
export function validateDraft(draft: Draft, existingSlugs: string[]): string[] {
  const errors: string[] = [];
  if (!draft.title.trim()) errors.push('Wpisz tytuł wpisu.');
  if (!draft.author.trim()) errors.push('Wpisz autora: imię i nazwisko albo np. „Zarząd KNML”.');
  if (!draft.body.trim()) errors.push('Napisz treść wpisu.');
  if (!draft.images.length) errors.push('Dodaj co najmniej jedno zdjęcie. Pierwsze będzie okładką.');
  draft.images.forEach((image, index) => {
    if (!image.alt.trim()) {
      errors.push(`Opisz zdjęcie ${index + 1} (${image.name}): napisz, co na nim widać. Opis czyta osobom niewidomym czytnik ekranu.`);
    }
  });

  // Braki są już zgłoszone wyżej, więc validatePost dostaje w ich miejscu wartości zastępcze,
  // żeby nie zgłosił ich drugi raz komunikatem o polach pliku index.md.
  const withStandIns: Draft = {
    ...draft,
    title: draft.title.trim() || '-',
    author: draft.author.trim() || '-',
    body: draft.body.trim() || '-'.repeat(MIN_BODY_LENGTH),
    images: draft.images.length ? draft.images.map((image) => ({ ...image, alt: image.alt.trim() || '-' })) : [{ name: 'okladka.jpg', size: 1, alt: '-' }],
  };
  const { slug, frontmatter, body, files } = buildPost(withStandIns, { today: new Date(), existingSlugs });
  const imageSizes = Object.fromEntries(files.map((file, index) => [file.postPath, withStandIns.images[index].size]));
  return [...errors, ...validatePost({ slug, frontmatter, body, imageSizes })];
}
