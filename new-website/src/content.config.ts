import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Każdy wpis to folder: src/content/blog/<slug>/index.md + zdjęcia obok.
// Nazwa folderu = adres wpisu /blog/<slug>/ (taki sam jak w Hugo).
const blog = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // Krótszy tytuł do kart na stronie głównej.
      shortTitle: z.string().optional(),
      date: z.coerce.date(),
      author: z.string(),
      category: z.enum(['aktualnosci', 'projekty']),
      tags: z.array(z.string()).default([]),
      cover: image(),
      excerpt: z.string().optional(),
      githubLink: z.url().optional(),
      draft: z.boolean().default(false),
    }),
});

const achievements = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/achievements' }),
  schema: z.object({
    year: z.number().int(),
    // 'I miejsce' daje limonkową kartę („gold”).
    place: z.enum(['I miejsce', 'II miejsce', 'Nagroda', 'Wyróżnienie']),
    // Duży znak na karcie, np. '1.', 'PCI', 'W'.
    mark: z.string(),
    title: z.string(),
    description: z.string(),
    url: z.url(),
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
      // Strona główna pokazuje pierwsze 3 projekty wg order (rosnąco).
      order: z.number().int(),
    }),
});

const partners = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/partners' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      logo: image(),
      url: z.url(),
      tier: z.enum(['strategic', 'partner', 'university']),
      description: z.string().optional(),
      // Po tej dacie partner sam znika ze strony (np. koniec umowy sponsorskiej).
      validUntil: z.coerce.date().optional(),
    }),
});

export const collections = { blog, achievements, projects, partners };
