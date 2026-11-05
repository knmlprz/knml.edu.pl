import { expect, test, type Page } from '@playwright/test';
import { testPostUrls, widths } from './test-posts';

// Zasady niezależne od designu: mają przejść przy każdym wyglądzie strony.
// Gdy test nie przechodzi po zmianie designu, popraw CSS, nie test.

const MIN_TEXT_PX = 16;
const MIN_TARGET_PX = 44;
// Treść wpisu z Markdowna (src/pages/blog/[...slug].astro). Zmienisz klasę w szablonie, zmień ją tutaj.
const POST_CONTENT = 'main article .prose';

// Elementy treści wpisu z tekstem mniejszym niż MIN_TEXT_PX.
const tooSmallText = (page: Page) =>
  page.locator(POST_CONTENT).evaluate((content, minPx) => {
    const hasOwnText = (el: Element) => [...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent!.trim());
    return [content, ...content.querySelectorAll('*')]
      .filter(hasOwnText)
      .map((el) => ({ tag: el.tagName, text: el.textContent!.trim().slice(0, 40), px: parseFloat(getComputedStyle(el).fontSize) }))
      .filter(({ px }) => px < minPx);
  }, MIN_TEXT_PX);

// Linki i przyciski w <main> mniejsze niż 44 px. Link w środku zdania jest zwolniony (jak w WCAG 2.5.8),
// bo powiększenie go rozsunęłoby linijki tekstu.
const tooSmallTargets = (page: Page) =>
  page.locator('main').evaluate((main, minPx) => {
    const insideSentence = (el: Element) =>
      [...el.parentElement!.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent!.trim());
    return [...main.querySelectorAll('a, button')]
      .filter((el) => el.checkVisibility() && !insideSentence(el))
      .map((el) => ({ text: el.textContent!.trim().slice(0, 40), rect: el.getBoundingClientRect() }))
      .filter(({ rect }) => Math.round(rect.width) < minPx || Math.round(rect.height) < minPx)
      .map(({ text, rect }) => ({ text, width: Math.round(rect.width), height: Math.round(rect.height) }));
  }, MIN_TARGET_PX);

for (const width of widths) {
  test.describe(`${width} px`, () => {
    test.use({ viewport: { width, height: 900 } });

    for (const url of [...testPostUrls, '/blog/']) {
      test(`${url}: nic nie wystaje w bok`, async ({ page }) => {
        await page.goto(url);
        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(scrollWidth, 'strona przewija się w bok').toBeLessThanOrEqual(clientWidth);
      });

      test(`${url}: cele dotyku min. ${MIN_TARGET_PX} px`, async ({ page }) => {
        await page.goto(url);
        expect(await tooSmallTargets(page)).toEqual([]);
      });
    }

    for (const url of testPostUrls) {
      test(`${url}: zdjęcia mieszczą się w kolumnie tekstu`, async ({ page }) => {
        await page.goto(url);
        const overflowing = await page.locator(POST_CONTENT).evaluate((content) => {
          const column = content.getBoundingClientRect();
          return [...content.querySelectorAll('img')]
            .map((img) => ({ src: img.getAttribute('src'), rect: img.getBoundingClientRect() }))
            .filter(({ rect }) => rect.left < column.left - 1 || rect.right > column.right + 1)
            .map(({ src, rect }) => ({ src, width: Math.round(rect.width), column: Math.round(column.width) }));
        });
        expect(overflowing).toEqual([]);
      });

      test(`${url}: plik zdjęcia najwyżej 2× szerszy niż na ekranie`, async ({ page }) => {
        await page.goto(url);
        const tooLarge = await page.locator(`${POST_CONTENT} img`).evaluateAll(async (images: HTMLImageElement[]) => {
          // Zdjęcia ładują się leniwie, więc wymuszamy pobranie, żeby znać plik wybrany z srcset.
          images.forEach((img) => (img.loading = 'eager'));
          await Promise.all(images.map((img) => img.decode()));
          return images
            .map((img) => ({ file: img.currentSrc, fileWidth: img.naturalWidth, shownWidth: Math.round(img.getBoundingClientRect().width) }))
            .filter(({ fileWidth, shownWidth }) => fileWidth > 2 * shownWidth);
        });
        expect(tooLarge).toEqual([]);
      });

      test(`${url}: tekst wpisu min. ${MIN_TEXT_PX} px`, async ({ page }) => {
        await page.goto(url);
        expect(await tooSmallText(page)).toEqual([]);
      });
    }
  });
}
