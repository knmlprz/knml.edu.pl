import { writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';

// Kreator /redakcja/ z prawdziwym API (test/e2e-server.ts) i udawanym GitHubem: logowanie,
// wypełnienie, „Opublikuj” i sprawdzenie plików, które API wysłało do GitHuba.

const MOCK = 'http://localhost:8788';
const POST_DIR = 'new-website/src/content/blog';
const loginAs = (page: Page, login: string) => page.request.post(`${MOCK}/_test/zaloguj-jako/${login}`);

test('logowanie przez GitHub, wypełnienie, „Opublikuj”: wpis trafia do GitHuba jako PR', async ({ page }, testInfo) => {
  await loginAs(page, 'jan-testowy');
  await page.goto('/redakcja/');
  await expect(page.getByRole('button', { name: 'Opublikuj' })).toBeHidden();
  await expect(page.locator('#account')).toContainText('Zaloguj się, żeby opublikować wpis.');

  await page.getByRole('link', { name: 'Zaloguj się przez GitHub' }).click();
  await expect(page).toHaveURL('/redakcja/');
  await expect(page.locator('#account')).toContainText('Zalogowano jako Jan Testowy (jan-testowy).');
  // Autor z profilu GitHub, do zmiany.
  await expect(page.getByLabel('Autor')).toHaveValue('Jan Testowy');

  const title = `Publikacja z kreatora ${Date.now()}`;
  await page.getByLabel('Tytuł').fill(title);
  await page.locator('#body-editor [contenteditable]').fill('Opis projektu, zespołu i nagrody. '.repeat(12));
  // Zdjęcie większe niż 2000 px: serwer ma je zmniejszyć.
  const photo = testInfo.outputPath('duze-zdjecie.jpg');
  writeFileSync(photo, await sharp({ create: { width: 3000, height: 2000, channels: 3, background: '#4b2a8a' } }).jpeg().toBuffer());
  await page.locator('#images').setInputFiles(photo);
  await page.locator('#alt-0').fill('Zespół na scenie');
  await expect(page.locator('#errors')).toContainText('Wpis spełnia zasady. Możesz go opublikować.');

  await page.getByRole('button', { name: 'Opublikuj' }).click();
  const status = page.locator('#status');
  await expect(status).toContainText('Gotowe!');
  await expect(status.getByRole('link', { name: 'Pull Requeście na GitHubie' })).toHaveAttribute('href', /\/pull\/\d+$/);
  const slug = (await status.getByRole('link').first().textContent())!.match(/\/blog\/([^/]+)\//)![1];
  // Szkic wyczyszczony, żeby drugi klik nie opublikował tego samego wpisu jeszcze raz.
  await expect(page.getByLabel('Tytuł')).toHaveValue('');

  const files: Record<string, string> = await (await page.request.get(`${MOCK}/_test/pliki`)).json();
  expect(Object.keys(files).sort()).toEqual([`${POST_DIR}/${slug}/duze-zdjecie.jpg`, `${POST_DIR}/${slug}/index.md`]);
  const markdown = Buffer.from(files[`${POST_DIR}/${slug}/index.md`], 'base64').toString();
  expect(markdown).toContain(`title: "${title}"`);
  expect(markdown).toContain('author: "Jan Testowy"');
  expect(markdown).toContain('cover: "./duze-zdjecie.jpg"');
  expect(markdown).toContain('coverAlt: "Zespół na scenie"');
  const cover = await sharp(Buffer.from(files[`${POST_DIR}/${slug}/duze-zdjecie.jpg`], 'base64')).metadata();
  expect([cover.width, cover.height]).toEqual([2000, 1333]);

  // Wylogowanie chowa „Opublikuj”.
  await page.getByRole('button', { name: 'Wyloguj' }).click();
  await expect(page.getByRole('link', { name: 'Zaloguj się przez GitHub' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Opublikuj' })).toBeHidden();
});

test('konto spoza zespołu redakcja-strony: wyjaśnienie zamiast „Opublikuj”, „Pobierz wpis” działa', async ({ page }) => {
  await loginAs(page, 'obcy');
  await page.goto('/redakcja/');
  await page.getByRole('link', { name: 'Zaloguj się przez GitHub' }).click();
  await expect(page.locator('#account')).toContainText('Konto GitHub obcy nie należy do zespołu redakcja-strony');
  await expect(page.getByRole('button', { name: 'Opublikuj' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Pobierz wpis' })).toBeVisible();
});
