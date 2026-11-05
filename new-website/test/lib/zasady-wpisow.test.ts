import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import {
  ALLOWED_IMAGE_FORMATS,
  findImages,
  IMAGE_FORMAT_EXCEPTIONS,
  MAX_BODY_LENGTH,
  MAX_EXCERPT_LENGTH,
  MAX_IMAGE_FILE_MB,
  MAX_IMAGES,
  MAX_TITLE_LENGTH,
  MIN_BODY_LENGTH,
  validatePost,
  type PostToValidate,
} from '../../src/config/zasady-wpisow';
import { checkPostFile, withPostRules } from '../../src/content.config';

const validFrontmatter = {
  title: 'Zwycięstwo na HackYeah',
  date: '2026-10-19',
  author: 'Jan Kowalski',
  category: 'aktualnosci',
  tags: ['hackathon'],
  cover: './okladka.jpg',
  excerpt: 'Krótki opis wpisu.',
};
const validBody = 'Treść wpisu. '.repeat(30);

function errorsFor(frontmatterChanges: object, post: Partial<PostToValidate> = {}): string[] {
  return validatePost({
    slug: 'nowy-wpis',
    frontmatter: { ...validFrontmatter, ...frontmatterChanges },
    body: validBody,
    imageSizes: { './okladka.jpg': 1000, 'a.jpg': 1000 },
    ...post,
  });
}

// Sprawdza, że jest dokładnie jeden błąd i że mówi, co poprawić.
const expectOnlyError = (errors: string[], message: RegExp) => {
  expect(errors).toHaveLength(1);
  expect(errors[0]).toMatch(message);
};

describe('poprawny wpis', () => {
  it('przechodzi wszystkie zasady', () => {
    expect(errorsFor({})).toEqual([]);
  });

  it('przechodzi bez pól opcjonalnych', () => {
    const { tags, excerpt, ...required } = validFrontmatter;
    expect(validatePost({ slug: 'x', frontmatter: required, body: validBody, imageSizes: { './okladka.jpg': 1 } })).toEqual([]);
  });

  it('przechodzi z wartościami dokładnie na limicie', () => {
    expect(errorsFor({ title: 'a'.repeat(MAX_TITLE_LENGTH), excerpt: 'a'.repeat(MAX_EXCERPT_LENGTH) })).toEqual([]);
    expect(errorsFor({}, { body: 'a'.repeat(MIN_BODY_LENGTH) })).toEqual([]);
    expect(errorsFor({}, { body: 'a'.repeat(MAX_BODY_LENGTH) })).toEqual([]);
  });
});

describe('pola obowiązkowe', () => {
  it.each([
    ['title', /Brakuje tytułu.*title/],
    ['category', /Brakuje kategorii.*aktualnosci, projekty/],
    ['cover', /Brakuje okładki.*cover: \.\/okladka\.jpg/],
    ['date', /Brakuje daty.*RRRR-MM-DD/],
    ['author', /Brakuje autora.*imię i nazwisko/],
  ])('%s: brak pola daje czytelny błąd', (field, message) => {
    const { [field as keyof typeof validFrontmatter]: _removed, ...frontmatter } = validFrontmatter;
    expectOnlyError(validatePost({ slug: 'x', frontmatter, body: validBody, imageSizes: { './okladka.jpg': 1 } }), message);
  });

  it.each([
    ['title', /Brakuje tytułu/],
    ['author', /Brakuje autora/],
    ['cover', /Brakuje okładki/],
  ])('%s: same spacje to jak brak pola', (field, message) => {
    expectOnlyError(errorsFor({ [field]: '   ' }), message);
  });

  it('kategoria spoza listy (z polskim znakiem) podaje poprawne wartości', () => {
    expectOnlyError(errorsFor({ category: 'aktualności' }), /jedno z: aktualnosci, projekty/);
  });

  it.each([null, '19 października 2026'])('błędna data %s podaje format', (date) => {
    expectOnlyError(errorsFor({ date }), /RRRR-MM-DD/);
  });

  it('brak treści', () => {
    expectOnlyError(errorsFor({}, { body: '  \n' }), /Brakuje treści/);
  });
});

describe('limity', () => {
  it('za długi tytuł podaje długość i limit', () => {
    const title = 'a'.repeat(MAX_TITLE_LENGTH + 1);
    expectOnlyError(errorsFor({ title }), new RegExp(`Tytuł ma ${MAX_TITLE_LENGTH + 1} znaków.*najwyżej ${MAX_TITLE_LENGTH}. Skróć`));
  });

  it('za długi excerpt podaje długość i limit', () => {
    const excerpt = 'a'.repeat(MAX_EXCERPT_LENGTH + 1);
    expectOnlyError(errorsFor({ excerpt }), new RegExp(`excerpt\\) ma ${MAX_EXCERPT_LENGTH + 1} znaków.*najwyżej ${MAX_EXCERPT_LENGTH}`));
  });

  it('za krótka treść', () => {
    expectOnlyError(errorsFor({}, { body: 'Krótko.' }), new RegExp(`Treść ma 7 znaków.*co najmniej ${MIN_BODY_LENGTH}`));
  });

  it('składnia obrazków nie liczy się do długości treści', () => {
    const body = '![Bardzo długi opis zdjęcia, który nie jest treścią wpisu](a.jpg)\n'.repeat(5) + 'Krótko.';
    expectOnlyError(errorsFor({}, { body: body.replace(/a\.jpg/g, './okladka.jpg') }), /Treść ma 7 znaków/);
  });

  it('za długa treść', () => {
    expectOnlyError(errorsFor({}, { body: 'a'.repeat(MAX_BODY_LENGTH + 1) }), new RegExp(`najwyżej ${MAX_BODY_LENGTH}.*podziel`));
  });

  it('dopuszcza limit zdjęć, odrzuca o jedno więcej (okładka się liczy)', () => {
    const postWithImages = (count: number) => {
      const paths = Array.from({ length: count }, (_, index) => `${index}.jpg`);
      const body = validBody + paths.map((path) => `![Opis](${path})`).join('\n');
      return { body, imageSizes: Object.fromEntries([...paths, './okladka.jpg'].map((path) => [path, 1])) };
    };
    expect(errorsFor({}, postWithImages(MAX_IMAGES - 1))).toEqual([]);
    expectOnlyError(errorsFor({}, postWithImages(MAX_IMAGES)), new RegExp(`${MAX_IMAGES + 1} zdjęć.*najwyżej ${MAX_IMAGES}`));
  });

  it('okładka powtórzona w treści liczy się raz', () => {
    const paths = Array.from({ length: MAX_IMAGES - 1 }, (_, index) => `${index}.jpg`);
    const body = `${validBody}![Opis](okladka.jpg)\n${paths.map((path) => `![Opis](${path})`).join('\n')}`;
    const imageSizes = Object.fromEntries([...paths, './okladka.jpg', 'okladka.jpg'].map((path) => [path, 1]));
    expect(errorsFor({}, { body, imageSizes })).toEqual([]);
  });

  it('za duży plik zdjęcia podaje rozmiar i limit', () => {
    const imageSizes = { './okladka.jpg': (MAX_IMAGE_FILE_MB + 0.5) * 1024 * 1024 };
    expectOnlyError(errorsFor({}, { imageSizes }), new RegExp(`okladka\\.jpg” ma 10,5 MB.*najwyżej ${MAX_IMAGE_FILE_MB} MB`));
  });

  it('plik dokładnie na limicie przechodzi', () => {
    expect(errorsFor({}, { imageSizes: { './okladka.jpg': MAX_IMAGE_FILE_MB * 1024 * 1024 } })).toEqual([]);
  });
});

describe('formaty zdjęć', () => {
  it.each(ALLOWED_IMAGE_FORMATS)('%s przechodzi', (format) => {
    const cover = `./okladka.${format}`;
    expect(errorsFor({ cover }, { imageSizes: { [cover]: 1 } })).toEqual([]);
  });

  it('wielkość liter w rozszerzeniu nie ma znaczenia', () => {
    expect(errorsFor({ cover: './A.JPG' }, { imageSizes: { './A.JPG': 1 } })).toEqual([]);
  });

  it.each(['gif', 'svg', 'heic', 'bmp'])('%s na okładce daje błąd z listą dozwolonych', (format) => {
    const cover = `./okladka.${format}`;
    expectOnlyError(errorsFor({ cover }, { imageSizes: { [cover]: 1 } }), /niedozwolony format.*jpg, jpeg, png, webp/);
  });

  it('niedozwolony format w treści też jest błędem', () => {
    const body = `${validBody}![Opis](anim.gif)`;
    expectOnlyError(errorsFor({}, { body, imageSizes: { './okladka.jpg': 1, 'anim.gif': 1 } }), /„anim\.gif” ma niedozwolony format/);
  });

  it('wyjątek działa tylko dla wskazanego wpisu i formatu', () => {
    const body = `${validBody}![Opis](anim.gif)`;
    const imageSizes = { './okladka.jpg': 1, 'anim.gif': 1 };
    expect(errorsFor({}, { slug: 'hackyeah2023-quantum-art', body, imageSizes })).toEqual([]);
    const otherFormat = `${validBody}![Opis](a.svg)`;
    expectOnlyError(errorsFor({}, { slug: 'hackyeah2023-quantum-art', body: otherFormat, imageSizes: { './okladka.jpg': 1, 'a.svg': 1 } }), /niedozwolony format/);
  });

  it('obrazek z internetu nie jest sprawdzany jak plik', () => {
    expect(errorsFor({}, { body: `${validBody}![Opis](https://example.com/a.gif)` })).toEqual([]);
  });

  it('brak pliku zdjęcia podpowiada, co sprawdzić', () => {
    expectOnlyError(errorsFor({}, { imageSizes: {} }), /Nie ma pliku „\.\/okladka\.jpg”.*Sprawdź nazwę/);
  });
});

describe('tagi', () => {
  it('tag spoza listy pokazuje, który i gdzie go dopisać', () => {
    expectOnlyError(errorsFor({ tags: ['hackaton'] }), /Tagu „hackaton” nie ma.*ALLOWED_TAGS/);
  });

  it('wielkość liter ma znaczenie, żeby nie było dwóch wersji jednego tagu', () => {
    expectOnlyError(errorsFor({ tags: ['Python'] }), /Tagu „Python”/);
  });

  it('tagi muszą być listą', () => {
    expectOnlyError(errorsFor({ tags: 'python' }), /muszą być listą/);
  });
});

describe('opis zdjęcia w treści (alt)', () => {
  it.each([
    ['Markdown', '![](a.jpg)'],
    ['same spacje', '![   ](a.jpg)'],
    ['z tytułem', '![](a.jpg "Tytuł")'],
    ['zdjęcie jako link', '[![](a.jpg)](https://example.com)'],
    ['etykieta', '![][foto]\n\n[foto]: a.jpg'],
    ['HTML bez alt', '<img src="a.jpg">'],
    ['HTML z pustym alt', '<img alt="" src="a.jpg" />'],
  ])('%s: brak opisu to błąd z nazwą pliku', (_case, image) => {
    expectOnlyError(errorsFor({}, { body: `${validBody}\n\n${image}` }), /„a\.jpg” nie ma opisu.*Wpisz, co na nim widać/);
  });

  it('każde zdjęcie bez opisu to osobny błąd', () => {
    const body = `${validBody}\n\n![](a.jpg)\n\n![](b.jpg)\n\n![Opis](c.jpg)`;
    const errors = errorsFor({}, { body, imageSizes: { './okladka.jpg': 1, 'a.jpg': 1, 'b.jpg': 1, 'c.jpg': 1 } });
    expect(errors.filter((error) => error.includes('nie ma opisu'))).toHaveLength(2);
    expect(errors).toHaveLength(2);
  });

  it.each([
    ['Markdown', '![Zespół na scenie](a.jpg)'],
    ['nawias w opisie', '![Zespół [KNML] na scenie](a.jpg)'],
    ['HTML', "<img src='a.jpg' alt='Zespół na scenie'>"],
  ])('%s: opis jest zaakceptowany', (_case, image) => {
    expect(errorsFor({}, { body: `${validBody}\n\n${image}` })).toEqual([]);
  });

  it.each([
    ['blok ```', '```md\n![](a.jpg)\n```'],
    ['blok ~~~', '~~~\n![](a.jpg)\n~~~'],
    ['kod w linii', 'Zapis `![](a.jpg)` wstawia obrazek.'],
    ['zwykły tekst', 'Ten ![tekst] to nie obrazek, a to \\![](a.jpg) też nie.'],
  ])('%s: przykład w treści to nie obrazek', (_case, text) => {
    expect(findImages(text)).toEqual([]);
  });

  it('nieparzysty backtick nie chowa obrazka bez opisu w dalszej części wpisu', () => {
    expect(findImages('Znak ` w tekście.\n\n![](a.jpg)\n\nI drugi ` tutaj.')).toEqual([{ alt: '', src: 'a.jpg' }]);
  });

  it('niezamknięty blok kodu trwa do końca tekstu', () => {
    expect(findImages('```\n![](a.jpg)')).toEqual([]);
  });

  it('nawias w nazwie pliku nie ucina ścieżki', () => {
    expect(findImages('![Opis](zdjecie(1).jpg)')).toEqual([{ alt: 'Opis', src: 'zdjecie(1).jpg' }]);
  });
});

describe('prawdziwe wpisy', () => {
  const blogFolder = resolve('src/content/blog');
  const slugs = readdirSync(blogFolder);

  it('jest ich co najmniej tyle, ile w chwili dodania zasad', () => {
    expect(slugs.length).toBeGreaterThanOrEqual(20);
  });

  it.each(slugs)('%s spełnia zasady', (slug) => {
    const filePath = join(blogFolder, slug, 'index.md');
    const frontmatter = parse(readFileSync(filePath, 'utf8').split(/^---\s*$/m)[1]);
    expect(checkPostFile(filePath, frontmatter)).toEqual([]);
  });

  it.each(Object.entries(IMAGE_FORMAT_EXCEPTIONS))('wyjątek %s jest nadal potrzebny', (slug) => {
    const filePath = join(blogFolder, slug, 'index.md');
    const [, frontmatterText, body] = readFileSync(filePath, 'utf8').split(/^---\s*$/m);
    const errors = validatePost({ slug: 'bez-wyjatku', frontmatter: parse(frontmatterText), body, imageSizes: {} });
    expect(errors.some((error) => error.includes('niedozwolony format'))).toBe(true);
  });
});

describe('build (withPostRules)', () => {
  async function runLoader(filePath: string, data: object) {
    let parsed = false;
    const loader = withPostRules({
      name: 'test',
      load: async ({ parseData }) => {
        await parseData({ id: 'wpis', data: data as Record<string, unknown>, filePath });
      },
    });
    const context = {
      store: { clear: () => {} },
      parseData: async () => {
        parsed = true;
        return {};
      },
    };
    await loader.load(context as never);
    return parsed;
  }

  function writeTemporaryPost(content: string): string {
    const folder = mkdtempSync(join(tmpdir(), 'knml-wpis-'));
    const filePath = join(folder, 'index.md');
    writeFileSync(filePath, content);
    return filePath;
  }

  it('zatrzymuje build i podaje nazwę pliku oraz wszystkie błędy', async () => {
    const filePath = writeTemporaryPost('---\ntitle: x\n---\n\n![](a.jpg)\n');
    await expect(runLoader(filePath, { ...validFrontmatter, cover: undefined, title: '' })).rejects.toThrow(
      /Wpis .*index\.md nie spełnia zasad wpisów:\n  - Brakuje tytułu[\s\S]*Brakuje okładki[\s\S]*nie ma opisu[\s\S]*README\.md, sekcja „Zasady wpisów”/,
    );
    rmSync(join(filePath, '..'), { recursive: true });
  });

  it('poprawny wpis idzie dalej do schematu', async () => {
    const filePath = writeTemporaryPost(`---\ntitle: x\n---\n${validBody}`);
    writeFileSync(join(filePath, '..', 'okladka.jpg'), 'x');
    await expect(runLoader(filePath, validFrontmatter)).resolves.toBe(true);
    rmSync(join(filePath, '..'), { recursive: true });
  });

  it('wpisy testowe nie podlegają limitom', async () => {
    await expect(runLoader(resolve('test/fixtures/blog/test-dlugi-tytul/index.md'), { title: 'a'.repeat(500) })).resolves.toBe(true);
  });
});
