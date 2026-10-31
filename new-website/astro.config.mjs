// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://knml.edu.pl',
  output: 'static',
  // Polski bez prefiksu (/, /blog/), angielski pod /en/. Teksty: src/i18n/.
  i18n: {
    locales: ['pl', 'en'],
    defaultLocale: 'pl',
    routing: { prefixDefaultLocale: false },
  },
  // Stare adresy stronicowania z Hugo (miał najwyżej 2 strony). Nowa strona pokazuje wszystko
  // na jednej stronie, więc przekierowujemy. Tagi: src/pages/tags/[tag]/page/[page].astro.
  redirects: {
    '/blog/page/1': '/blog/',
    '/blog/page/2': '/blog/',
    '/tags/page/1': '/tags/',
    '/tags/page/2': '/tags/',
  },
});
