import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts, postUrl } from './posts';

// Kanał RSS z wpisami bloga. Ten sam kanał jest pod /index.xml i /blog/index.xml,
// bo tak było w Hugo i ktoś może mieć zapisany którykolwiek z tych adresów.
export async function blogFeed(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: 'Koło Naukowe Machine Learning Politechniki Rzeszowskiej',
    description: 'Wpisy i aktualności Koła Naukowego Machine Learning PRz',
    site: context.site!,
    customData: '<language>pl-PL</language>',
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      link: postUrl(post),
      description: post.data.excerpt,
      categories: post.data.tags,
    })),
  });
}
