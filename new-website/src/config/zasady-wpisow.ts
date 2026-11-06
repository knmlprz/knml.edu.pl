import { z } from 'zod';

// Zasady wpisów na blogu: jedno miejsce dla buildu (src/content.config.ts), a później także
// kreatora i API. Dlatego plik nie importuje niczego z Astro ani z Node. Opis zasad po ludzku:
// README.md w katalogu głównym, sekcja „Zasady wpisów”.
//
// DO USTALENIA NA SPOTKANIU KOŁA (wartości startowe, zmiana = zmiana liczby lub listy poniżej):
export const MAX_TITLE_LENGTH = 100;
export const MAX_EXCERPT_LENGTH = 155;
export const MIN_BODY_LENGTH = 300;
export const MAX_BODY_LENGTH = 20_000;
// Liczymy okładkę i zdjęcia w treści, każdy plik raz.
export const MAX_IMAGES = 15;
export const MAX_IMAGE_FILE_MB = 10;
// HEIC z telefonu przyjmie dopiero kreator: serwer zamieni go na JPG, bo w pliku wpisu
// nie obsługuje go ani Astro, ani większość przeglądarek.
export const ALLOWED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
// Tagi wpisuje autor. Podpowiedzi to tagi z istniejących wpisów (getTags() w src/lib/posts.ts),
// a normalizeTag() niżej pilnuje, żeby „Hackathon” nie stał się drugim tagiem obok „hackathon”.
export const MAX_TAG_LENGTH = 30;
export const MAX_TAGS = 8;

// Stare wpisy z formatem spoza listy. Nowych tu nie dopisujemy, koło decyduje, co z tymi zrobić.
export const IMAGE_FORMAT_EXCEPTIONS: Record<string, string[]> = {
  'hackyeah2023-quantum-art': ['gif'],
  'mnist-demo-jak-komputer-widzi-tekst': ['svg'],
};

// Tych zasad nie ustalamy na spotkaniu: bez nich wpis nie zadziała na stronie.
export const POST_CATEGORIES = ['aktualnosci', 'projekty'] as const;

export const DATE_HINT = 'Wpisz istniejącą datę w formacie RRRR-MM-DD, np. 2026-10-19 (opcjonalnie z godziną: 2026-10-19T12:00:00+02:00).';

// Tu trafia to, czego YAML nie rozpoznał jako daty (np. „19 października 2026”); nieistniejące
// daty, które YAML po cichu „naprawia”, łapie withDateCheck w content.config.ts.
// Pusta linijka „date:” to w YAML null, a new Date(null) po cichu dałoby rok 1970.
export const dateField = () =>
  z.preprocess((value) => value ?? undefined, z.coerce.date({ error: `Brakuje daty albo jest błędna. ${DATE_HINT}` }));

const requiredText = (message: string) => z.string({ error: message }).trim().min(1, { error: message });

// Litery (także polskie), cyfry, myślniki i pojedyncze spacje w środku, np. „quantum computing”.
const TAG_CHARACTERS = /^[\p{L}\p{N}]+(?:[ -][\p{L}\p{N}]+)*$/u;

const textLength = (input: unknown) => (typeof input === 'string' ? input.trim().length : 0);

const TITLE_MISSING = 'Brakuje tytułu (pole title). Dopisz go w metadanych wpisu.';
const EXCERPT_NOT_TEXT = 'Krótki opis (pole excerpt) musi być tekstem. Wpisz go albo usuń całą linijkę.';

// Pola wpisu. Sam ten schemat przechodzą też wpisy testowe z test/fixtures/blog, które celowo
// przekraczają limity (sprawdzają, czy zbyt długi tytuł nie rozsadzi strony).
export const postFieldsSchema = z.object({
  title: requiredText(TITLE_MISSING),
  // Krótszy tytuł do kart na stronie głównej.
  shortTitle: z.string({ error: 'Krótki tytuł (pole shortTitle) musi być tekstem. Wpisz go albo usuń całą linijkę.' }).optional(),
  date: dateField(),
  author: requiredText('Brakuje autora (pole author). Wpisz imię i nazwisko albo np. „Zarząd KNML”.'),
  category: z.enum(POST_CATEGORIES, {
    error: `Brakuje kategorii albo jest błędna (pole category). Wpisz dokładnie jedno z: ${POST_CATEGORIES.join(', ')}.`,
  }),
  tags: z.array(z.string(), { error: 'Tagi (pole tags) muszą być listą. Każdy tag w osobnej linijce, zaczynając od „- ”.' }).default([]),
  cover: requiredText('Brakuje okładki (pole cover). Dodaj zdjęcie do folderu wpisu i wpisz np. cover: ./okladka.jpg.'),
  // Opis okładki dla czytników ekranu. Kreator wymaga go zawsze; w starszych wpisach go nie ma.
  coverAlt: z.string({ error: 'Opis okładki (pole coverAlt) musi być tekstem. Wpisz go albo usuń całą linijkę.' }).optional(),
  excerpt: z.string({ error: EXCERPT_NOT_TEXT }).optional(),
  githubLink: z.url({ error: 'Błędny link do GitHuba (pole githubLink). Wpisz pełny adres zaczynający się od https://.' }).optional(),
  draft: z.boolean({ error: 'Pole draft może mieć tylko wartość true albo false.' }).default(false),
});

// Pola wpisu razem z limitami i listą tagów.
const postRulesSchema = postFieldsSchema.extend({
  title: requiredText(TITLE_MISSING).max(MAX_TITLE_LENGTH, {
    error: ({ input }) => `Tytuł ma ${textLength(input)} znaków, a może mieć najwyżej ${MAX_TITLE_LENGTH}. Skróć go.`,
  }),
  excerpt: z
    .string({ error: EXCERPT_NOT_TEXT })
    .max(MAX_EXCERPT_LENGTH, {
      error: ({ input }) => `Krótki opis (pole excerpt) ma ${textLength(input)} znaków, a może mieć najwyżej ${MAX_EXCERPT_LENGTH}. Skróć go.`,
    })
    .optional(),
  tags: z
    .array(
      z
        .string({ error: 'Każdy tag musi być tekstem.' })
        .regex(TAG_CHARACTERS, {
          error: ({ input }) => `Tag „${String(input)}” może mieć tylko litery, cyfry, spacje i myślniki (z tagu powstaje adres strony /tags/…/).`,
        })
        .max(MAX_TAG_LENGTH, {
          error: ({ input }) => `Tag „${String(input)}” ma ${textLength(input)} znaków, a może mieć najwyżej ${MAX_TAG_LENGTH}. Skróć go.`,
        }),
      { error: 'Tagi (pole tags) muszą być listą. Każdy tag w osobnej linijce, zaczynając od „- ”.' },
    )
    .max(MAX_TAGS, { error: ({ input }) => `Wpis ma ${(input as unknown[]).length} tagów, a może mieć najwyżej ${MAX_TAGS}. Zostaw najważniejsze.` })
    .default([]),
});

const CODE = /^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:^ {0,3}\1[`~]*[ \t]*\r?$|(?![\s\S]))|(`+)[^\n]*?\2/gm;
const MARKDOWN_IMAGE = /(?<!\\)!\[((?:\\.|\[[^\]]*\]|[^[\]\\])*)\](?:\(\s*(<[^>]*>|(?:[^\s()]|\([^()]*\))*)(?:\s+(?:"[^"]*"|'[^']*'|\([^()]*\)))?\s*\)|\[([^\]]*)\])?/g;
const LINK_DEFINITION = /^ {0,3}\[([^\]]+)\]:\s*<?([^\s>]+)/gm;
const HTML_IMAGE = /<img\b[^>]*>/gi;

const htmlAttribute = (tag: string, name: string) =>
  tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'))?.slice(1).find((value) => value !== undefined);

// Obrazki z treści wpisu: zapis Markdown (![opis](plik), ![opis][etykieta]) i HTML (<img>).
// Przykłady w blokach kodu to nie obrazki, więc wycinamy kod przed szukaniem.
export function findImages(body: string): { alt: string; src: string }[] {
  const text = body.replace(CODE, ' ');
  const definitions = new Map([...text.matchAll(LINK_DEFINITION)].map(([, label, url]) => [label.toLowerCase(), url]));
  const images: { alt: string; src: string }[] = [];
  for (const [, alt, inlineSrc, label] of text.matchAll(MARKDOWN_IMAGE)) {
    const src = inlineSrc ?? definitions.get((label || alt).toLowerCase());
    // ![tekst] bez adresu i bez definicji etykiety Markdown pokazuje jako zwykły tekst.
    if (src !== undefined) images.push({ alt, src: src.replace(/^<|>$/g, '') });
  }
  for (const [tag] of text.matchAll(HTML_IMAGE)) {
    images.push({ alt: htmlAttribute(tag, 'alt') ?? '', src: htmlAttribute(tag, 'src') ?? '' });
  }
  return images;
}

// Obrazki z internetu (https://…) i z public/ (/…) nie są plikami wpisu, tak jak w astro.config.mjs.
const isPostFile = (src: string) => !/^([a-z]+:|\/)/i.test(src);

const coverOf = (frontmatter: unknown) => {
  const cover = (frontmatter as { cover?: unknown } | null | undefined)?.cover;
  return typeof cover === 'string' && cover.trim() ? [cover] : [];
};

// Pliki zdjęć, o których rozmiar validatePost musi zapytać: okładka i zdjęcia z folderu wpisu.
export function localImagePaths(frontmatter: unknown, body: string): string[] {
  return [...new Set([...coverOf(frontmatter), ...findImages(body).map((image) => image.src).filter(isPostFile)])];
}

const fileExtension = (path: string) => path.split(/[?#]/)[0].split('.').pop()!.toLowerCase();

const formatMb = (bytes: number) => (bytes / (1024 * 1024)).toLocaleString('pl-PL', { maximumFractionDigits: 1 });

function checkImages({ slug, frontmatter, body, imageSizes }: PostToValidate): string[] {
  const errors: string[] = [];
  const images = findImages(body);

  for (const { alt, src } of images) {
    if (!alt.trim()) {
      errors.push(`Obrazek „${src}” nie ma opisu. Wpisz, co na nim widać: ![np. Zespół KNML na scenie](${src}). Opis czyta osobom niewidomym czytnik ekranu.`);
    }
  }

  const exceptions = IMAGE_FORMAT_EXCEPTIONS[slug] ?? [];
  for (const path of localImagePaths(frontmatter, body)) {
    const extension = fileExtension(path);
    if (!ALLOWED_IMAGE_FORMATS.includes(extension) && !exceptions.includes(extension)) {
      errors.push(`Zdjęcie „${path}” ma niedozwolony format. Zapisz je jako: ${ALLOWED_IMAGE_FORMATS.join(', ')}.`);
    }
    const size = imageSizes[path];
    if (size === undefined) {
      errors.push(`Nie ma pliku „${path}” w folderze wpisu. Sprawdź nazwę i rozszerzenie (.jpg to nie to samo co .JPG).`);
    } else if (size > MAX_IMAGE_FILE_MB * 1024 * 1024) {
      errors.push(`Zdjęcie „${path}” ma ${formatMb(size)} MB, a może mieć najwyżej ${MAX_IMAGE_FILE_MB} MB. Zmniejsz je.`);
    }
  }

  const uniqueImages = new Set([...coverOf(frontmatter), ...images.map((image) => image.src)].map((src) => src.replace(/^\.\//, '')));
  if (uniqueImages.size > MAX_IMAGES) {
    errors.push(`Wpis ma ${uniqueImages.size} zdjęć (z okładką), a może mieć najwyżej ${MAX_IMAGES}. Usuń część z nich.`);
  }
  return errors;
}

function checkBodyLength(body: string): string[] {
  // Składnia obrazków to nie tekst: wpis z samych zdjęć nie może przejść minimum.
  const length = body.replace(MARKDOWN_IMAGE, '').replace(HTML_IMAGE, '').trim().length;
  if (length === 0) return ['Brakuje treści wpisu. Napisz ją pod drugą linią „---”.'];
  if (length < MIN_BODY_LENGTH) return [`Treść ma ${length} znaków, a musi mieć co najmniej ${MIN_BODY_LENGTH}. Rozwiń ją.`];
  if (length > MAX_BODY_LENGTH) return [`Treść ma ${length} znaków, a może mieć najwyżej ${MAX_BODY_LENGTH}. Skróć ją albo podziel na dwa wpisy.`];
  return [];
}

// Do porównywania tagów: bez wielkich liter, polskich znaków i nadmiarowych spacji.
export const tagKey = (tag: string) =>
  tag.trim().replace(/\s+/g, ' ').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/ł/g, 'l');

// Tag wpisany przez autora: małe litery, bez nadmiarowych spacji. Jeśli taki tag już jest
// (różni się tylko wielkością liter albo polskimi znakami), zwraca istniejący.
export function normalizeTag(input: string, existingTags: readonly string[]): string {
  return existingTags.find((tag) => tagKey(tag) === tagKey(input)) ?? input.trim().replace(/\s+/g, ' ').toLowerCase();
}

export type PostToValidate = {
  // Nazwa folderu wpisu (adres /blog/<slug>/).
  slug: string;
  // Metadane spomiędzy linii „---”, jeszcze niesprawdzone.
  frontmatter: unknown;
  body: string;
  // Rozmiar pliku w bajtach dla każdej ścieżki z localImagePaths(). Brak ścieżki = brak pliku.
  imageSizes: Record<string, number>;
};

// Sprawdza cały wpis. Zwraca wszystkie błędy naraz, żeby autor poprawił je za jednym podejściem.
export function validatePost(post: PostToValidate): string[] {
  const parsed = postRulesSchema.safeParse(post.frontmatter);
  const fieldErrors = parsed.success ? [] : parsed.error.issues.map((issue) => issue.message);
  return [...fieldErrors, ...checkBodyLength(post.body), ...checkImages(post)];
}
