import type { APIContext } from 'astro';
import { getPosts, getTags, isoDate, postUrl, tagUrl } from '../lib/posts';

// Mapa strony pod tym samym adresem co w Hugo (/sitemap.xml). Własny endpoint zamiast
// @astrojs/sitemap, bo ta paczka tworzy /sitemap-index.xml i byłaby nową zależnością.
// Nową podstronę (np. /projekty/) dopisz do staticPages.
const staticPages = ['/', '/blog/', '/tags/'];

export async function GET(context: APIContext) {
  const posts = await getPosts();
  const tags = await getTags();
  const entries = [
    ...staticPages.map((path) => ({ path, lastmod: undefined })),
    ...posts.map((post) => ({ path: postUrl(post), lastmod: isoDate(post.data.date) })),
    ...tags.map((tag) => ({ path: tagUrl(tag.name), lastmod: undefined })),
  ];
  const urls = entries
    .map(({ path, lastmod }) => {
      const loc = new URL(path, context.site).href;
      return `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
    })
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
}
