import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { MAX_TAGS, MAX_TITLE_LENGTH, MIN_BODY_LENGTH, validatePost } from '../../src/config/zasady-wpisow';
import { buildPost, postSlug, suggestTags, validateDraft, type Draft } from '../../src/redakcja/wpis';

const TODAY = new Date(2026, 10, 6, 23, 30);
const body = 'Treść wpisu z kreatora. '.repeat(20).trim();

const draft = (changes: Partial<Draft> = {}): Draft => ({
  title: 'Zwycięstwo w Łodzi',
  category: 'aktualnosci',
  author: 'Jan Kowalski',
  body,
  tags: ['hackathon'],
  excerpt: '',
  githubLink: '',
  images: [
    { name: 'Okładka.JPG', size: 1000, alt: 'Zespół na scenie' },
    { name: 'IMG_1234.HEIC', size: 2000, alt: 'Laptop z kodem' },
  ],
  ...changes,
});

const frontmatterOf = (markdown: string) => parse(markdown.split('---\n')[1]);
const bodyOf = (markdown: string) => markdown.split('---\n').slice(2).join('---\n');

describe('adres wpisu', () => {
  it('bez polskich znaków, małe litery, myślniki zamiast spacji', () => {
    expect(postSlug('Zwycięstwo w Łodzi', [])).toBe('zwyciestwo-w-lodzi');
    expect(postSlug('Żółć, gęś i ŹDŹBŁO: ćma ńa śnie', [])).toBe('zolc-ges-i-zdzblo-cma-na-snie');
    expect(postSlug('  HackYeah 2026 - I miejsce!  ', [])).toBe('hackyeah-2026-i-miejsce');
  });

  it('nie nadpisuje istniejącego wpisu', () => {
    expect(postSlug('Zwycięstwo w Łodzi', ['zwyciestwo-w-lodzi'])).toBe('zwyciestwo-w-lodzi-2');
    expect(postSlug('Zwycięstwo w Łodzi', ['zwyciestwo-w-lodzi', 'zwyciestwo-w-lodzi-2'])).toBe('zwyciestwo-w-lodzi-3');
  });

  it('pusty tytuł albo same znaki specjalne dają adres zastępczy', () => {
    expect(postSlug('', [])).toBe('nowy-wpis');
    expect(postSlug('!!!', ['nowy-wpis'])).toBe('nowy-wpis-2');
  });

  it('długi tytuł daje adres najwyżej 80 znaków, bez urwanego słowa', () => {
    const slug = postSlug('Bardzo długi tytuł wpisu '.repeat(8), []);
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(slug.endsWith('wpisu') || slug.endsWith('tytul') || slug.endsWith('dlugi') || slug.endsWith('bardzo')).toBe(true);
  });
});

describe('plik index.md', () => {
  it('ma metadane: dzisiejsza data, autor, kategoria, tagi, okładka z opisem', () => {
    const { slug, markdown } = buildPost(draft(), { today: TODAY, existingSlugs: [] });
    expect(slug).toBe('zwyciestwo-w-lodzi');
    expect(frontmatterOf(markdown)).toEqual({
      title: 'Zwycięstwo w Łodzi',
      date: '2026-11-06',
      author: 'Jan Kowalski',
      category: 'aktualnosci',
      tags: ['hackathon'],
      cover: './okladka.jpg',
      coverAlt: 'Zespół na scenie',
    });
    expect(markdown).toMatch(/^---\ntitle: .*\ndate: 2026-11-06\n/);
  });

  it('pola opcjonalne trafiają do pliku tylko, gdy są wypełnione', () => {
    const { markdown } = buildPost(draft({ excerpt: ' Krótko. ', githubLink: 'https://github.com/knmlprz/x', tags: [] }), {
      today: TODAY,
      existingSlugs: [],
    });
    const frontmatter = frontmatterOf(markdown);
    expect(frontmatter.excerpt).toBe('Krótko.');
    expect(frontmatter.githubLink).toBe('https://github.com/knmlprz/x');
    expect(frontmatter.tags).toEqual([]);
  });

  it('cudzysłowy, dwukropki i znaki YAML w tekście nie psują metadanych', () => {
    const title = 'HackYeah: "wygraliśmy" # 1 - [test] \\ {x}';
    const { markdown } = buildPost(draft({ title, author: 'J. Kowalski, A. Nowak' }), { today: TODAY, existingSlugs: [] });
    expect(frontmatterOf(markdown).title).toBe(title);
    expect(frontmatterOf(markdown).author).toBe('J. Kowalski, A. Nowak');
  });

  it('zdjęcia poza okładką są na końcu treści, w kolejności z listy', () => {
    const images = [
      { name: 'a.jpg', size: 1, alt: 'Okładka' },
      { name: 'b.png', size: 1, alt: 'Drugie [ze sceny]' },
      { name: 'c.webp', size: 1, alt: 'Trzecie' },
    ];
    const { markdown } = buildPost(draft({ images }), { today: TODAY, existingSlugs: [] });
    expect(bodyOf(markdown)).toBe(`\n${body}\n\n![Drugie \\[ze sceny\\]](./b.png)\n\n![Trzecie](./c.webp)\n`);
  });

  it('nazwy plików zdjęć bez polskich znaków i spacji, bez powtórzeń', () => {
    const images = [
      { name: 'Zdjęcie z Łodzi.JPEG', size: 1, alt: 'x' },
      { name: 'zdjecie-z-lodzi.jpeg', size: 1, alt: 'y' },
      { name: '.jpg', size: 1, alt: 'z' },
    ];
    const { files } = buildPost(draft({ images }), { today: TODAY, existingSlugs: [] });
    expect(files.map((file) => file.fileName)).toEqual(['zdjecie-z-lodzi.jpeg', 'zdjecie-z-lodzi-2.jpeg', 'zdjecie.jpg']);
  });

  it('HEIC: wpis wskazuje plik .jpg, w paczce zostaje .heic do przekonwertowania', () => {
    const { markdown, files } = buildPost(draft(), { today: TODAY, existingSlugs: [] });
    expect(bodyOf(markdown)).toContain('![Laptop z kodem](./img-1234.jpg)');
    expect(files[1]).toEqual({ fileName: 'img-1234.heic', postPath: './img-1234.jpg', needsConversion: true });
    expect(files[0].needsConversion).toBe(false);
  });

  it('gotowy wpis spełnia zasady wpisów', () => {
    const { slug, frontmatter, body: postBody, files } = buildPost(draft(), { today: TODAY, existingSlugs: [] });
    const imageSizes = Object.fromEntries(files.map((file) => [file.postPath, 1000]));
    expect(validatePost({ slug, frontmatter, body: postBody, imageSizes })).toEqual([]);
  });
});

describe('sprawdzanie w kreatorze', () => {
  const errors = (changes: Partial<Draft>) => validateDraft(draft(changes), []);

  it('poprawny szkic nie ma błędów (HEIC też, serwer go przekonwertuje)', () => {
    expect(errors({})).toEqual([]);
  });

  it('braki zgłasza jednym komunikatem, językiem kreatora, nie pliku index.md', () => {
    const all = errors({ title: ' ', author: '', body: '', images: [] });
    expect(all).toHaveLength(4);
    expect(all.join('\n')).not.toMatch(/pole |---|index\.md/);
  });

  it('zdjęcie bez opisu: numer i nazwa zdjęcia', () => {
    const all = errors({ images: [{ name: 'a.jpg', size: 1, alt: 'ok' }, { name: 'b.jpg', size: 1, alt: '  ' }] });
    expect(all).toEqual([expect.stringMatching(/^Opisz zdjęcie 2 \(b\.jpg\)/)]);
  });

  it('okładka bez opisu też jest błędem', () => {
    expect(errors({ images: [{ name: 'a.jpg', size: 1, alt: '' }] })).toEqual([expect.stringMatching(/^Opisz zdjęcie 1 \(a\.jpg\)/)]);
  });

  it(`więcej niż ${MAX_TAGS} tagów to błąd`, () => {
    const tags = Array.from({ length: MAX_TAGS + 1 }, (_, index) => `tag ${index}`);
    expect(errors({ tags })).toEqual([expect.stringMatching(/tagów/)]);
  });

  it('limity sprawdza validatePost z zasad wpisów', () => {
    expect(errors({ title: 'a'.repeat(MAX_TITLE_LENGTH + 1) })).toEqual([expect.stringMatching(/^Tytuł ma/)]);
    expect(errors({ body: 'a'.repeat(MIN_BODY_LENGTH - 1) })).toEqual([expect.stringMatching(/^Treść ma/)]);
    expect(errors({ githubLink: 'github.com/knml' })).toEqual([expect.stringMatching(/GitHuba/)]);
    expect(errors({ images: [{ name: 'a.gif', size: 1, alt: 'x' }] })).toEqual([expect.stringMatching(/niedozwolony format/)]);
  });
});

describe('podpowiedzi tagów', () => {
  const existing = ['aktualności', 'hackathon', 'hackyeah', 'NLP', 'python'];

  it('bez wpisanego tekstu: wszystkie istniejące tagi poza wybranymi', () => {
    expect(suggestTags('', existing, ['python'])).toEqual(['aktualności', 'hackathon', 'hackyeah', 'NLP']);
  });

  it('pasujące do wpisanego fragmentu, bez względu na wielkość liter i polskie znaki', () => {
    expect(suggestTags('HACK', existing, [])).toEqual(['hackathon', 'hackyeah']);
    expect(suggestTags('aktualnosci', existing, [])).toEqual(['aktualności']);
    expect(suggestTags('nl', existing, [])).toEqual(['NLP']);
    expect(suggestTags('  Yeah ', existing, [])).toEqual(['hackyeah']);
  });

  it('nic nie pasuje: pusta lista (kreator proponuje wtedy nowy tag)', () => {
    expect(suggestTags('rust', existing, [])).toEqual([]);
  });
});
