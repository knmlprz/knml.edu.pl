import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { strFromU8, unzipSync } from 'fflate';
import { widths } from './test-posts';

// Kreator wpisów /redakcja/ (src/pages/redakcja/index.astro). Uruchamiany na buildzie z wpisami
// testowymi, żeby podgląd dało się porównać z prawdziwą stroną wpisu testowego.

const ROOT = new URL('../../', import.meta.url).pathname;
const FIXTURES = join(ROOT, 'test/fixtures/blog');
// Klucze szkicu z kreatora (localStorage).
const DRAFT_KEY = 'knml-redakcja-szkic';
const AUTHOR_KEY = 'knml-redakcja-autor';

const fixtureBody = (slug: string) => readFileSync(join(FIXTURES, slug, 'index.md'), 'utf8').split(/^---$/m).slice(2).join('---').trim();

async function openWithDraft(page: Page, draft: object, author = 'Jan Testowy') {
  await page.addInitScript(
    ([draftKey, authorKey, draftJson, authorName]) => {
      // Tylko przy pierwszym wejściu: po przeładowaniu kreator ma czytać to, co sam zapisał.
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem(draftKey, draftJson);
      localStorage.setItem(authorKey, authorName);
    },
    [DRAFT_KEY, AUTHOR_KEY, JSON.stringify(draft), author],
  );
  await page.goto('/redakcja/');
}

// Wymiary i wygląd elementów treści, które w obu wersjach mają ten sam HTML (bez atrybutów).
const describeArticle = (page: Page) =>
  page.locator('article.article').evaluate((article) => {
    const box = (el: Element | null) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        left: Math.round(rect.left),
        style: [style.fontFamily, style.fontSize, style.lineHeight, style.fontWeight, style.color, style.marginTop, style.marginBottom].join(' | '),
      };
    };
    const normalized = (el: Element) => el.outerHTML.replace(/\s[a-z-]+="[^"]*"/g, '').replace(/\s+/g, ' ');
    const blocks = Object.fromEntries([...article.querySelectorAll('.prose > *, .prose li, .prose strong, .prose a')].map((el) => [normalized(el), box(el)]));
    return { article: box(article), title: box(article.querySelector('.article__title')), cover: box(article.querySelector('.article__cover')), prose: box(article.querySelector('.prose')), blocks };
  });

for (const width of widths) {
  test.describe(`${width} px`, () => {
    test.use({ viewport: { width, height: 900 } });

    for (const fixture of ['test-bez-zdjec-w-tresci', 'test-formatowanie']) {
      test(`podgląd wygląda jak strona wpisu ${fixture}`, async ({ page }) => {
        await page.goto(`/blog/${fixture}/`);
        const title = await page.locator('h1').textContent();
        const real = await describeArticle(page);

        await openWithDraft(page, { title, category: 'aktualnosci', tags: [], body: fixtureBody(fixture) });
        await page.locator('#images').setInputFiles(join(FIXTURES, fixture, 'cover.jpg'));
        await expect(page.locator('#podglad .article__cover')).toBeVisible();
        const preview = await describeArticle(page);

        // Wysokość całości się różni: podgląd nie ma linku „Wszystkie wpisy”, a edytor usuwa np. kursywę.
        const { height: _articleHeight, ...realArticle } = real.article!;
        const { height: _proseHeight, ...realProse } = real.prose!;
        expect(preview.article).toMatchObject(realArticle);
        expect(preview.prose).toMatchObject(realProse);
        expect(preview.title).toEqual(real.title);
        // Okładka na stronie jest zmniejszona przez Astro, w podglądzie to oryginał: wysokość może się różnić o zaokrąglenie.
        expect(preview.cover!.width).toBe(real.cover!.width);
        expect(Math.abs(preview.cover!.height - real.cover!.height)).toBeLessThanOrEqual(1);

        // Elementy, których edytor nie zmienia (akapity, nagłówki, listy, linki, pogrubienia), wyglądają tak samo.
        const shared = Object.keys(preview.blocks).filter((html) => html in real.blocks);
        expect(shared.length).toBeGreaterThanOrEqual(4);
        for (const html of shared) expect(preview.blocks[html], html.slice(0, 80)).toEqual(real.blocks[html]);
      });
    }
  });
}

test.describe('360 px', () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test('kreator na telefonie: nic nie wystaje w bok, cele dotyku min. 44 px', async ({ page }) => {
    await page.goto('/redakcja/');
    await page.locator('#images').setInputFiles([join(FIXTURES, 'test-galeria/cover.jpg'), join(FIXTURES, 'test-galeria/zdjecie-01.jpg')]);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth, 'strona przewija się w bok').toBeLessThanOrEqual(clientWidth);
    const tooSmall = await page.locator('#kreator').evaluate((form) =>
      [...form.querySelectorAll('button, input:not(.sr-only):not([type="radio"]):not([type="checkbox"]), textarea, .choice, .dropzone')]
        .filter((el) => el.checkVisibility())
        .map((el) => ({ el: el.outerHTML.slice(0, 60), rect: el.getBoundingClientRect() }))
        .filter(({ rect }) => Math.round(rect.width) < 44 || Math.round(rect.height) < 44)
        .map(({ el }) => el),
    );
    expect(tooSmall).toEqual([]);
  });
});

test('szkic zostaje po przeładowaniu, „Wyczyść szkic” go usuwa, autor zostaje', async ({ page }) => {
  await openWithDraft(page, {});
  await page.getByLabel('Tytuł').fill('Szkic do zapamiętania');
  await page.locator('#body-editor [contenteditable]').fill('Treść szkicu');
  await page.reload();
  await expect(page.getByLabel('Tytuł')).toHaveValue('Szkic do zapamiętania');
  await expect(page.locator('#body-editor')).toContainText('Treść szkicu');

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Wyczyść szkic' }).click();
  await expect(page.getByLabel('Tytuł')).toHaveValue('');
  await page.reload();
  await expect(page.getByLabel('Tytuł')).toHaveValue('');
  await expect(page.locator('#body-editor')).not.toContainText('Treść szkicu');
  await expect(page.getByLabel('Autor')).toHaveValue('Jan Testowy');
});

test('od pustego formularza do paczki, z której wpis przechodzi npm run build', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const title = 'Test kreatora: zażółć gęślą jaźń';
  const slug = 'test-kreatora-zazolc-gesla-jazn';
  await openWithDraft(page, {}, '');

  await page.getByLabel('Tytuł').fill(title);
  await expect(page.locator('#slug')).toHaveText(`knml.edu.pl/blog/${slug}/`);
  await page.getByLabel('Autor').fill('Jan Testowy');
  await page.locator('#kreator').getByText('Projekty', { exact: true }).click();
  await page.locator('#kreator').getByText('#hackathon', { exact: true }).click();

  const editor = page.locator('#body-editor [contenteditable]');
  await editor.click();
  await page.getByRole('button', { name: 'Nagłówek' }).click();
  await page.keyboard.type('Co zrobiliśmy');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Pogrubienie' }).click();
  await page.keyboard.type('Pierwsze miejsce');
  await page.getByRole('button', { name: 'Pogrubienie' }).click();
  await page.keyboard.insertText(' na hackathonie. ' + 'Opis projektu, zespołu i nagrody. '.repeat(10));
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Lista' }).click();
  await page.keyboard.type('model');
  await page.keyboard.press('Enter');
  await page.keyboard.type('aplikacja');

  // Zdjęcia z dysku: okładka z opisem, drugie bez opisu.
  await page.locator('#images').setInputFiles([join(FIXTURES, 'test-galeria/cover.jpg'), join(FIXTURES, 'test-galeria/zdjecie-01.jpg')]);
  await page.locator('#alt-0').fill('Zespół na scenie');
  await expect(page.locator('#errors')).toContainText('Opisz zdjęcie 2 (zdjecie-01.jpg)');

  // Pobranie z błędem: nic się nie pobiera, focus na liście błędów.
  let downloaded = false;
  page.on('download', () => (downloaded = true));
  await page.getByRole('button', { name: 'Pobierz wpis' }).click();
  await expect(page.locator('#errors')).toBeFocused();
  expect(downloaded).toBe(false);

  await page.locator('#alt-1').fill('Laptop z kodem');
  await expect(page.locator('#errors')).toContainText('Wpis spełnia zasady');

  // Podgląd.
  const preview = page.locator('#podglad');
  await expect(preview.locator('h1')).toHaveText(title);
  await expect(preview.locator('.article__meta')).toContainText('Projekty');
  await expect(preview.locator('.article__meta')).toContainText('Jan Testowy');
  await expect(preview.locator('.article__tags')).toHaveText('#hackathon');
  await expect(preview.locator('.prose h2')).toHaveText('Co zrobiliśmy');
  await expect(preview.locator('.prose strong')).toHaveText('Pierwsze miejsce');
  await expect(preview.locator('.prose li')).toHaveText(['model', 'aplikacja']);
  const bodyImage = preview.locator('.prose img');
  await expect(bodyImage).toHaveAttribute('alt', 'Laptop z kodem');
  await expect.poll(() => bodyImage.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

  // Pobranie paczki.
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Pobierz wpis' }).click()]);
  expect(download.suggestedFilename()).toBe(`${slug}.zip`);
  const files = unzipSync(readFileSync(await download.path()));
  expect(Object.keys(files).sort()).toEqual([`${slug}/cover.jpg`, `${slug}/index.md`, `${slug}/zdjecie-01.jpg`]);
  expect(files[`${slug}/cover.jpg`]).toEqual(new Uint8Array(readFileSync(join(FIXTURES, 'test-galeria/cover.jpg'))));
  const markdown = strFromU8(files[`${slug}/index.md`]);
  expect(markdown).toContain(`title: "${title}"`);
  expect(markdown).toContain('category: projekty');
  expect(markdown).toContain('cover: "./cover.jpg"');
  expect(markdown).toContain('## Co zrobiliśmy\n\n**Pierwsze miejsce** na hackathonie.');
  expect(markdown).toContain('- model\n- aplikacja');
  expect(markdown.trimEnd().endsWith('![Laptop z kodem](./zdjecie-01.jpg)')).toBe(true);
  await expect(page.locator('#status')).toContainText(`Pobrano ${slug}.zip`);

  // Wpis z paczki w prawdziwym folderze wpisów i prawdziwy build, do folderu wyników testu (nie do dist/).
  // Folder musi być na tym samym dysku co projekt, bo Astro przenosi do niego pliki.
  const postDir = join(ROOT, 'src/content/blog', slug);
  const outDir = testInfo.outputPath('build');
  expect(existsSync(postDir), `${postDir} już istnieje`).toBe(false);
  try {
    for (const [path, content] of Object.entries(files)) {
      mkdirSync(join(ROOT, 'src/content/blog', path, '..'), { recursive: true });
      writeFileSync(join(ROOT, 'src/content/blog', path), content);
    }
    execFileSync('npx', ['astro', 'build', '--outDir', outDir], { cwd: ROOT, stdio: 'pipe', env: { ...process.env, KNML_TEST_POSTS: '' } });
    const html = readFileSync(join(outDir, 'blog', slug, 'index.html'), 'utf8');
    expect(html).toContain('Co zrobiliśmy');
    expect(html).toContain('alt="Zespół na scenie"');
  } finally {
    rmSync(postDir, { recursive: true, force: true });
    rmSync(outDir, { recursive: true, force: true });
  }
});
