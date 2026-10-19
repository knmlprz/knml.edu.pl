import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

export const categoryLabels: Record<Post['data']['category'], string> = {
  aktualnosci: 'Aktualności',
  projekty: 'Projekty',
};

// Wszystkie opublikowane wpisy, od najnowszego.
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', (post) => !post.data.draft);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

// Tak jak Hugo (urlize): małe litery, spacje → „-”, polskie znaki zostają.
// Dzięki temu adresy /tags/<tag>/ są takie same jak na starej stronie.
export function tagSlug(tag: string): string {
  return tag.toLowerCase().trim().replace(/\s+/g, '-');
}

export const postUrl = (post: Post) => `/blog/${post.id}/`;
export const tagUrl = (tag: string) => `/tags/${tagSlug(tag)}/`;

export const formatDate = (date: Date) =>
  date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
export const isoDate = (date: Date) => date.toISOString().slice(0, 10);
