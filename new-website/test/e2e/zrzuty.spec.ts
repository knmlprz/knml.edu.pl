import { expect, test } from '@playwright/test';
import { testPostUrls, widths } from './test-posts';

// Zrzuty porównawcze: tylko pomoc przy przeglądaniu zmian, nie zasada.
// Po zamierzonej zmianie designu: npx playwright test --update-snapshots (README, „Testy”).
// W CI pomijane, bo fonty renderują się inaczej na każdym systemie.
test.skip(!!process.env.CI, 'zrzuty porównuje się lokalnie');

for (const width of widths) {
  test.describe(`${width} px`, () => {
    test.use({ viewport: { width, height: 900 } });

    for (const url of testPostUrls) {
      test(`${url}`, async ({ page }) => {
        await page.goto(url);
        // Zdjęcia w treści ładują się leniwie, a zrzut całej strony ich nie przewija.
        // decode() czeka, aż zdjęcie jest gotowe do narysowania (samo „pobrane” nie wystarcza).
        await page.locator('img').evaluateAll((images: HTMLImageElement[]) => {
          images.forEach((img) => (img.loading = 'eager'));
          return Promise.all(images.map((img) => img.decode()));
        });
        const name = `${url.split('/').at(-2)}-${width}.png`;
        await expect(page).toHaveScreenshot(name, { fullPage: true, maxDiffPixelRatio: 0.01 });
      });
    }
  });
}
