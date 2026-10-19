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

export interface TagGroup {
  slug: string;
  name: string;
  posts: Post[];
}

// Wszystkie tagi z wpisami, alfabetycznie. Wpisy w każdym tagu od najnowszego.
export async function getTags(): Promise<TagGroup[]> {
  const tags = new Map<string, TagGroup>();
  for (const post of await getPosts()) {
    for (const tag of post.data.tags) {
      const slug = tagSlug(tag);
      if (!tags.has(slug)) tags.set(slug, { slug, name: tag, posts: [] });
      tags.get(slug)!.posts.push(post);
    }
  }
  return [...tags.values()].sort((a, b) => a.name.localeCompare(b.name, 'pl'));
}

// Tak jak Hugo (urlize): małe litery, spacje → „-”, polskie znaki zostają.
// Dzięki temu adresy /tags/<tag>/ są takie same jak na starej stronie.
export function tagSlug(tag: string): string {
  return tag.toLowerCase().trim().replace(/\s+/g, '-');
}

// Opis do <meta name="description"> i podglądu linku: excerpt, a bez niego początek
// pierwszego akapitu treści (bez nagłówków, obrazków, list i znaczników Markdowna).
export function postDescription(post: Post, maxLength = 155): string {
  if (post.data.excerpt) return post.data.excerpt;
  const firstParagraph = (post.body ?? '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !/^(#|!\[|<|\||```|[-*+]\s|\d+\.\s)/.test(block));
  const text = (firstParagraph ?? post.data.title)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\s*\[\^[^\]]*\]/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, text.lastIndexOf(' ', maxLength - 1))}…`;
}

export const postUrl = (post: Post) => `/blog/${post.id}/`;
export const tagUrl = (tag: string) => `/tags/${tagSlug(tag)}/`;

export const formatDate = (date: Date) =>
  date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
export const isoDate = (date: Date) => date.toISOString().slice(0, 10);
