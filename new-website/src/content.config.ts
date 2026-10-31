import { defineCollection, reference } from 'astro:content';
import { glob, type Loader } from 'astro/loaders';
import { z } from 'astro/zod';

// RRRR-MM-DD, opcjonalnie z godziną: 2026-10-19T12:00, 2026-10-19 12:00:00+02:00.
const DATE_FORMAT = /^(\d{4})-(\d{2})-(\d{2})(?:[T ]\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})?)?$/;

function isValidDate(text: string): boolean {
  const match = text.match(DATE_FORMAT);
  if (!match) return false;
  const [year, month, day] = match.slice(1, 4).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Date „naprawia” nieistniejące daty (31.02 → 03.03), więc porównujemy z tym, co wpisano.
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const DATE_HINT = 'Wpisz istniejącą datę w formacie RRRR-MM-DD, np. 2026-10-19 (opcjonalnie z godziną: 2026-10-19T12:00:00+02:00).';

// Pole daty w schemacie. Tu trafia tylko to, czego YAML nie rozpoznał jako daty
// (np. „19 października 2026”); resztę błędów łapie withDateCheck.
const dateField = () => z.coerce.date({ error: `błędna data. ${DATE_HINT}` });

// YAML zamienia datę na obiekt Date, zanim zobaczy ją schemat, i po cichu „naprawia” błędne
// (2026-31-12 → 12.07.2028). Schemat nie ma jak tego wykryć, więc po wczytaniu kolekcji
// sprawdzamy pole w surowym tekście pliku i zatrzymujemy build z czytelnym komunikatem.
// rawFiles: import.meta.glob(…, { query: '?raw' }) z plikami kolekcji. Musi być wywołane
// przy kolekcji, bo Vite wymaga wzorca wpisanego wprost. Klucze są względem tego pliku (./content/…).
function withDateCheck(loader: Loader, field: string, rawFiles: Record<string, string>): Loader {
  return {
    name: `${loader.name}-with-date-check`,
    load: async (context) => {
      await loader.load(context);
      for (const entry of context.store.values()) {
        const raw = rawFiles[entry.filePath?.replace(/^src\//, './') ?? ''];
        if (raw === undefined) throw new Error(`Nie udało się wczytać ${entry.filePath}, żeby sprawdzić datę.`);
        const value = raw.match(new RegExp(`^${field}:\\s*['"]?([^'"\\n#]*)`, 'm'))?.[1].trim();
        if (value !== undefined && !isValidDate(value)) {
          throw new Error(`${entry.filePath}: błędna data w polu ${field}: „${value}”. ${DATE_HINT}`);
        }
      }
    },
  };
}

// Każdy wpis to folder: src/content/blog/<slug>/index.md + zdjęcia obok.
// Nazwa folderu = adres wpisu /blog/<slug>/ (taki sam jak w Hugo).
const blog = defineCollection({
  loader: withDateCheck(
    glob({ pattern: '*/index.md', base: './src/content/blog' }),
    'date',
    import.meta.glob<string>('./content/blog/*/index.md', { query: '?raw', import: 'default', eager: true }),
  ),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // Krótszy tytuł do kart na stronie głównej.
      shortTitle: z.string().optional(),
      date: dateField(),
      author: z.string(),
      category: z.enum(['aktualnosci', 'projekty']),
      tags: z.array(z.string()).default([]),
      cover: image(),
      excerpt: z.string().optional(),
      githubLink: z.url().optional(),
      draft: z.boolean().default(false),
    }),
});

// Tłumaczenie na wersję /en/: obiekt `en` z tymi samymi polami tekstowymi co po polsku.
// Każde pole jest opcjonalne; czego nie ma w `en`, strona EN pokazuje po polsku (src/i18n/index.ts).
const translation = <Shape extends z.ZodRawShape>(shape: Shape) => z.object(shape).partial().optional();

// Od najwyższego miejsca. Ta kolejność ustala też kolejność kart w obrębie jednego roku.
export const achievementPlaces = ['I miejsce', 'II miejsce', 'Nagroda', 'Wyróżnienie'] as const;

const achievements = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/achievements' }),
  schema: z.object({
    year: z.number().int(),
    // 'I miejsce' daje limonkową kartę („gold”).
    place: z.enum(achievementPlaces),
    // Duży znak na karcie, np. '1.', 'PCI', '★' (wyróżnienie).
    mark: z.string(),
    title: z.string(),
    description: z.string(),
    url: z.url(),
    en: translation({ title: z.string(), description: z.string() }),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      category: z.string(),
      description: z.string(),
      tags: z.array(z.string()).default([]),
      // Linijka pod opisem, np. '2026 · I miejsce EDTH'.
      meta: z.string(),
      cover: image(),
      // Wpis na blogu o projekcie. Gdy jest, karta prowadzi do wpisu zamiast do /projekty/<id>/.
      post: reference('blog').optional(),
      // Strona główna pokazuje pierwsze 4 projekty wg order (rosnąco), jak we wzorcu.
      order: z.number().int(),
      en: translation({
        title: z.string(),
        category: z.string(),
        description: z.string(),
        tags: z.array(z.string()),
        meta: z.string(),
      }),
    }),
});

const partners = defineCollection({
  loader: withDateCheck(
    glob({ pattern: '*.yaml', base: './src/content/partners' }),
    'validUntil',
    import.meta.glob<string>('./content/partners/*.yaml', { query: '?raw', import: 'default', eager: true }),
  ),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      logo: image(),
      url: z.url(),
      tier: z.enum(['strategic', 'partner', 'university']),
      description: z.string().optional(),
      // Po tej dacie partner sam znika ze strony (np. koniec umowy sponsorskiej).
      validUntil: dateField().optional(),
      en: translation({ name: z.string(), description: z.string() }),
    }),
});

export const collections = { blog, achievements, projects, partners };
