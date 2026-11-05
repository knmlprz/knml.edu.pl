import { expect, test } from '@playwright/test';

// Najważniejsze adresy prawdziwej strony (build produkcyjny, bez wpisów testowych).
const REAL_POST = '/blog/hackyeah2023-quantum-art/';

test('strona główna po polsku', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
  await expect(page.locator('h1')).toBeVisible();
});

test('strona główna po angielsku', async ({ page }) => {
  const response = await page.goto('/en/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toBeVisible();
});

test('lista wpisów, bez wpisów testowych', async ({ page }) => {
  await page.goto('/blog/');
  await expect(page.locator(`a[href="${REAL_POST}"]`).first()).toBeVisible();
  await expect(page.locator('a[href^="/blog/test-"]')).toHaveCount(0);
});

test('prawdziwy wpis', async ({ page }) => {
  const response = await page.goto(REAL_POST);
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveText('HackYeah 2023: Quantum Art');
  const cover = page.locator('main article img').first();
  await expect(cover).toBeVisible();
  expect(await cover.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
});

for (const feed of ['/index.xml', '/blog/index.xml']) {
  test(`RSS ${feed}`, async ({ request }) => {
    const response = await request.get(feed);
    expect(response.status()).toBe(200);
    const xml = await response.text();
    expect(xml).toContain('<rss');
    expect(xml).toContain(`https://knml.edu.pl${REAL_POST}`);
    expect(xml).not.toContain('/blog/test-');
  });
}

test('sitemap', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  const xml = await response.text();
  expect(xml).toContain('<urlset');
  expect(xml).toContain('<loc>https://knml.edu.pl/</loc>');
  expect(xml).toContain(`<loc>https://knml.edu.pl${REAL_POST}</loc>`);
  expect(xml).not.toContain('/blog/test-');
});

test('404 dla nieistniejącego adresu', async ({ page }) => {
  const response = await page.goto('/nie-ma-takiej-strony/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('Nie ma takiej strony');
});
