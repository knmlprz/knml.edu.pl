// @ts-check
import { defineConfig } from 'astro/config';
// Procesor Markdowna, którego Astro używa domyślnie. Instaluje go samo Astro (jak sharp),
// więc nie ma go w naszym package.json.
import { satteri } from '@astrojs/markdown-satteri';

// Zdjęcia w treści wpisów (Markdown) jako responsywne obrazy Astro: kilka rozmiarów WebP
// w srcset, lazy loading. Szerokości liczone od kolumny tekstu wpisu: .article w
// src/pages/blog/[...slug].astro ma max. 900 px, minus odstępy po bokach = 820 px.
// Zmienisz szerokość kolumny, zmień też POST_IMAGE_SIZES; pilnuje tego test w test/e2e/wpisy.spec.ts.
const POST_IMAGE_SIZES = '(min-width: 900px) 820px, calc(100vw - 32px)';
// 1× i 2× (ekrany o dużej gęstości) dla telefonu i kolumny na komputerze.
const POST_IMAGE_WIDTHS = [480, 820, 1280, 1640];

// Zdjęcia z Markdowna nie przechodzą przez <Image />, więc ustawiamy im opcje tutaj.
// Tylko zdjęcia z folderu wpisu (./zdjecie.jpg); obrazków z internetu Astro nie przetwarza.
const responsivePostImages = {
  name: 'responsive-post-images',
  element: {
    filter: ['img'],
    /** @param {any} node @param {any} ctx */
    visit(node, ctx) {
      const src = String(node.properties?.src ?? '');
      if (/^([a-z]+:|\/)/i.test(src)) return;
      ctx.setProperty(node, 'layout', 'constrained');
      ctx.setProperty(node, 'widths', POST_IMAGE_WIDTHS);
      ctx.setProperty(node, 'sizes', POST_IMAGE_SIZES);
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: 'https://knml.edu.pl',
  output: 'static',
  // Build z wpisami testowymi (npm run build:test) idzie do osobnego folderu, żeby nie pomylić go z dist/.
  outDir: process.env.KNML_TEST_POSTS ? './dist-test' : './dist',
  markdown: {
    processor: satteri({ hastPlugins: [responsivePostImages] }),
  },
  // src obrazu z srcset = największy wariant, nie oryginał. Opis w pliku.
  image: { service: { entrypoint: './src/image-service.ts' } },
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
