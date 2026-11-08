import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { goodDraft, hasHeifDec, jpeg, setup, SITE_URL } from './setup';

const POST_DIR = 'new-website/src/content/blog';
const today = () => new Date().toLocaleDateString('sv-SE');

describe('dostęp', () => {
  it('bez sesji: 401 z prośbą o zalogowanie', async () => {
    const { get, publish, github } = setup();
    for (const path of ['/me', '/moje-wpisy']) {
      const response = await get(path);
      expect(response.status).toBe(401);
      expect((await response.json()).error).toMatch(/Zaloguj się/);
    }
    expect((await publish('', goodDraft(), [{ name: 'a.jpg', content: await jpeg(), alt: 'Opis' }])).status).toBe(401);
    expect(github.state.pulls).toHaveLength(0);
  });

  it('konto spoza zespołu redakcja-strony: 403 z wyjaśnieniem, nic nie trafia do repo', async () => {
    const { get, publish, login, github } = setup();
    const cookie = await login('obcy');
    const response = await get('/me', cookie);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('obcy');
    expect(body.error).toContain('redakcja-strony');
    expect((await get('/moje-wpisy', cookie)).status).toBe(403);
    expect((await publish(cookie, goodDraft(), [{ name: 'a.jpg', content: await jpeg(), alt: 'Opis' }])).status).toBe(403);
    expect(github.state.blobs.size).toBe(0);
  });

  it('członek zespołu i admin (maintainer zespołu)', async () => {
    const { get, login } = setup();
    expect(await (await get('/me', await login('jan-testowy'))).json()).toEqual({ login: 'jan-testowy', name: 'Jan Testowy', admin: false });
    expect(await (await get('/me', await login('anna-admin'))).json()).toEqual({ login: 'anna-admin', name: 'Anna Admin', admin: true });
  });

  it('usunięcie z zespołu działa od razu, bez ponownego logowania', async () => {
    const { get, login, github } = setup();
    const cookie = await login('jan-testowy');
    expect((await get('/me', cookie)).status).toBe(200);
    delete github.state.users['jan-testowy'].role;
    expect((await get('/me', cookie)).status).toBe(403);
  });

  it('podrobione ciasteczko sesji: 401', async () => {
    const { get, login } = setup();
    const cookie = await login('jan-testowy');
    const forged = cookie.replace('jan-testowy', 'anna-admin');
    expect(forged).not.toBe(cookie);
    expect((await get('/me', forged)).status).toBe(401);
  });

  it('ciasteczko sesji: HttpOnly, Secure, SameSite=Lax', async () => {
    const { app, github } = setup();
    const start = await app.request('/auth/login');
    const authorize = await github.app.request(start.headers.get('location')!);
    const callback = new URL(authorize.headers.get('location')!);
    const done = await app.request(callback.pathname + callback.search, { headers: { cookie: start.headers.getSetCookie()[0].split(';')[0] } });
    expect(done.headers.get('location')).toBe(`${SITE_URL}/redakcja/`);
    const session = done.headers.getSetCookie().find((cookie) => cookie.startsWith('knml_sesja='))!;
    expect(session).toMatch(/HttpOnly/);
    expect(session).toMatch(/Secure/);
    expect(session).toMatch(/SameSite=Lax/);
  });

  it('logowanie z obcym parametrem state: bez sesji, powrót do kreatora z informacją o błędzie', async () => {
    const { app } = setup();
    const response = await app.request('/auth/callback?code=kod-jan-testowy&state=podrobiony');
    expect(response.headers.get('location')).toBe(`${SITE_URL}/redakcja/?logowanie=blad`);
    expect(response.headers.getSetCookie().some((cookie) => cookie.startsWith('knml_sesja=') && !cookie.startsWith('knml_sesja=;'))).toBe(false);
  });

  it('CORS tylko dla adresu strony', async () => {
    const { app } = setup();
    const preflight = (origin: string) =>
      app.request('/wpisy', { method: 'OPTIONS', headers: { origin, 'access-control-request-method': 'POST' } });
    expect((await preflight(SITE_URL)).headers.get('access-control-allow-origin')).toBe(SITE_URL);
    expect((await preflight(SITE_URL)).headers.get('access-control-allow-credentials')).toBe('true');
    expect((await preflight('https://zla-strona.example')).headers.get('access-control-allow-origin')).toBeNull();
  });

  it('formularz wysłany z innej strony: 403', async () => {
    const { app, login } = setup();
    const cookie = await login('jan-testowy');
    const form = new FormData();
    form.set('wpis', '{}');
    const response = await app.request('/wpisy', { method: 'POST', body: form, headers: { cookie, origin: 'https://zla-strona.example' } });
    expect(response.status).toBe(403);
  });
});

describe('walidacja wpisu', () => {
  it('zły wpis: 400 z listą polskich komunikatów, nic nie trafia do repo', async () => {
    const { login, publish, github } = setup();
    const response = await publish(await login('jan-testowy'), goodDraft({ title: ' ', body: 'Za krótko.', tags: ['zły/tag'] }), []);
    expect(response.status).toBe(400);
    const { errors } = await response.json();
    expect(errors).toEqual(
      expect.arrayContaining([
        'Wpisz tytuł wpisu.',
        'Dodaj co najmniej jedno zdjęcie. Pierwsze będzie okładką.',
        expect.stringMatching(/^Treść ma \d+ znaków, a musi mieć co najmniej 300/),
        expect.stringMatching(/^Tag „zły\/tag” może mieć tylko litery/),
      ]),
    );
    expect(github.state.blobs.size).toBe(0);
  });

  it('zdjęcie bez opisu: 400', async () => {
    const { login, publish } = setup();
    const response = await publish(await login('jan-testowy'), goodDraft(), [{ name: 'okladka.jpg', content: await jpeg(), alt: ' ' }]);
    expect(response.status).toBe(400);
    expect((await response.json()).errors[0]).toMatch(/^Opisz zdjęcie 1 \(okladka\.jpg\)/);
  });

  it('niepełne dane z kreatora: 400 z prośbą o odświeżenie', async () => {
    const { app, login } = setup();
    const cookie = await login('jan-testowy');
    for (const wpis of [null, 'to nie JSON', JSON.stringify({ title: 'Bez reszty pól' })]) {
      const form = new FormData();
      if (wpis) form.set('wpis', wpis);
      const response = await app.request('/wpisy', { method: 'POST', body: form, headers: { cookie, origin: SITE_URL } });
      expect(response.status).toBe(400);
      expect((await response.json()).errors[0]).toMatch(/Odśwież stronę/);
    }
  });
});

describe('zdjęcia we wpisie', () => {
  it('za duży plik: 400 z rozmiarem i limitem', async () => {
    const { login, publish } = setup();
    const big = new Uint8Array(11 * 1024 * 1024);
    const response = await publish(await login('jan-testowy'), goodDraft(), [{ name: 'duze.jpg', content: big, alt: 'Duże zdjęcie' }]);
    expect(response.status).toBe(400);
    expect((await response.json()).errors).toEqual(['Zdjęcie „./duze.jpg” ma 11 MB, a może mieć najwyżej 10 MB. Zmniejsz je.']);
  });

  it('plik, który nie jest zdjęciem: 400', async () => {
    const { login, publish, github } = setup();
    const response = await publish(await login('jan-testowy'), goodDraft(), [
      { name: 'okladka.jpg', content: await jpeg(), alt: 'Okładka' },
      { name: 'notatki.jpg', content: new TextEncoder().encode('to jest tekst, nie zdjęcie'), alt: 'Notatki' },
    ]);
    expect(response.status).toBe(400);
    expect((await response.json()).errors).toEqual(['Plik „notatki.jpg” nie jest zdjęciem albo jest uszkodzony. Dodaj zdjęcie JPG, PNG, WebP albo HEIC.']);
    expect(github.state.pulls).toHaveLength(0);
  });

  it.skipIf(!hasHeifDec)('HEIC z iPhone\'a: w repo jako JPG, obrócone, bez GPS', async () => {
    const { login, publish, github } = setup();
    const heic = readFileSync(new URL('./fixtures/iphone-obrot-gps.heic', import.meta.url));
    const response = await publish(await login('jan-testowy'), goodDraft(), [{ name: 'IMG_0001.HEIC', content: heic, alt: 'Zdjęcie z telefonu', type: 'image/heic' }]);
    expect(response.status).toBe(201);
    const files = github.committedFiles();
    const photo = files[`${POST_DIR}/zwyciestwo-w-lodzi/img-0001.jpg`];
    const metadata = await sharp(photo).metadata();
    expect([metadata.format, metadata.width, metadata.height, metadata.exif]).toEqual(['jpeg', 200, 300, undefined]);
    expect(files[`${POST_DIR}/zwyciestwo-w-lodzi/index.md`].toString()).toContain('cover: "./img-0001.jpg"');
  });
});

describe('publikacja przez GitHub App', () => {
  it('jeden commit z index.md i zmniejszonymi zdjęciami na nowej gałęzi, PR do main z auto-merge', async () => {
    const { login, publish, github } = setup();
    const response = await publish(await login('jan-testowy'), goodDraft(), [
      { name: 'Okładka.JPG', content: await jpeg(4000, 3000), alt: 'Zespół na scenie' },
      { name: 'schemat.png', content: await sharp({ create: { width: 500, height: 300, channels: 4, background: '#fff' } }).png().toBuffer(), alt: 'Schemat modelu', type: 'image/png' },
    ]);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      slug: 'zwyciestwo-w-lodzi',
      postUrl: `${SITE_URL}/blog/zwyciestwo-w-lodzi/`,
      prUrl: 'https://github.com/knmlprz/knml.edu.pl/pull/1',
      autoMerge: true,
    });

    const files = github.committedFiles();
    const dir = `${POST_DIR}/zwyciestwo-w-lodzi`;
    expect(Object.keys(files).sort()).toEqual([`${dir}/index.md`, `${dir}/okladka.jpg`, `${dir}/schemat.png`]);
    const markdown = files[`${dir}/index.md`].toString();
    expect(markdown.startsWith(
      [
        '---',
        'title: "Zwycięstwo w Łodzi"',
        `date: ${today()}`,
        'author: "Jan Testowy"',
        'category: aktualnosci',
        'tags:',
        '  - "hackathon"',
        'cover: "./okladka.jpg"',
        'coverAlt: "Zespół na scenie"',
        'excerpt: "Zespół KNML wygrał hackathon."',
        '---',
        '',
        '## Co zrobiliśmy',
      ].join('\n'),
    )).toBe(true);
    expect(markdown.trimEnd().endsWith('![Schemat modelu](./schemat.png)')).toBe(true);
    const cover = await sharp(files[`${dir}/okladka.jpg`]).metadata();
    expect([cover.format, cover.width, cover.height]).toEqual(['jpeg', 2000, 1500]);
    expect((await sharp(files[`${dir}/schemat.png`]).metadata()).format).toBe('png');

    const [commit] = github.state.commits.values();
    expect(commit.message).toBe('Dodaj wpis „Zwycięstwo w Łodzi”');
    expect(commit.parents).toEqual(['commit-main']);
    expect(commit.author).toEqual({ name: 'Jan Testowy', email: '101+jan-testowy@users.noreply.github.com' });
    expect([...github.state.trees.values()][0].base_tree).toBe('tree-main');

    const [pull] = github.state.pulls;
    expect(pull).toMatchObject({ title: 'Nowy wpis: Zwycięstwo w Łodzi', head: 'wpis/jan-testowy/zwyciestwo-w-lodzi', base: 'main', autoMerge: 'MERGE' });
    expect(pull.body).toContain(`${SITE_URL}/blog/zwyciestwo-w-lodzi/`);
  });

  it('adres zajęty przez wpis na main albo wpis w trakcie publikacji: kolejny numer', async () => {
    const { login, publish, github } = setup();
    github.state.posts.push('zwyciestwo-w-lodzi');
    github.state.branches.push('wpis/anna-admin/zwyciestwo-w-lodzi-2');
    const response = await publish(await login('jan-testowy'), goodDraft(), [{ name: 'a.jpg', content: await jpeg(), alt: 'Opis' }]);
    expect((await response.json()).slug).toBe('zwyciestwo-w-lodzi-3');
    expect(Object.keys(github.committedFiles())).toContain(`${POST_DIR}/zwyciestwo-w-lodzi-3/index.md`);
  });

  it('dwie osoby publikują ten sam adres w tej samej chwili: 409 z prośbą o ponowienie', async () => {
    const { login, publish, github } = setup();
    github.fail('POST', /\/git\/refs$/, 422);
    const response = await publish(await login('jan-testowy'), goodDraft(), [{ name: 'a.jpg', content: await jpeg(), alt: 'Opis' }]);
    expect(response.status).toBe(409);
    expect((await response.json()).error).toMatch(/Kliknij „Opublikuj” jeszcze raz/);
  });

  it('auto-merge się nie włączył: wpis i tak wysłany, PR czeka na admina', async () => {
    const { login, publish, github } = setup();
    github.fail('POST', /^\/graphql$/, 403);
    const response = await publish(await login('jan-testowy'), goodDraft(), [{ name: 'a.jpg', content: await jpeg(), alt: 'Opis' }]);
    expect(response.status).toBe(201);
    expect((await response.json()).autoMerge).toBe(false);
  });

  it('Moje wpisy: autor widzi swoje, admin wszystkie', async () => {
    const { login, publish, get } = setup();
    const jan = await login('jan-testowy');
    const anna = await login('anna-admin');
    const photo = [{ name: 'a.jpg', content: await jpeg(), alt: 'Opis' }];
    await publish(jan, goodDraft({ title: 'Wpis Jana' }), photo);
    await publish(anna, goodDraft({ title: 'Wpis Anny' }), photo);

    const titles = async (cookie: string) => ((await (await get('/moje-wpisy', cookie)).json()) as { title: string }[]).map((post) => post.title);
    expect(await titles(jan)).toEqual(['Wpis Jana']);
    expect(await titles(anna)).toEqual(['Wpis Anny', 'Wpis Jana']);
    expect((await (await get('/moje-wpisy', jan)).json())[0]).toEqual({
      title: 'Wpis Jana',
      slug: 'wpis-jana',
      login: 'jan-testowy',
      status: 'w trakcie',
      prUrl: 'https://github.com/knmlprz/knml.edu.pl/pull/1',
      postUrl: `${SITE_URL}/blog/wpis-jana/`,
    });
  });
});

describe('błędy GitHuba: czytelny komunikat zamiast awarii', () => {
  const cases = [
    { name: 'zły klucz aplikacji (401)', method: 'POST', path: /access_tokens$/, status: 401, expected: [502, /nie może zalogować się do GitHuba.*adminowi strony/] },
    { name: 'GitHub odrzuca dane (422)', method: 'POST', path: /\/pulls$/, status: 422, expected: [502, /GitHub odrzucił wpis/] },
    { name: 'GitHub nie odpowiada', method: 'POST', path: /\/git\/blobs$/, status: 'timeout', expected: [504, /GitHub nie odpowiada/] },
    { name: 'awaria GitHuba (500)', method: 'GET', path: /\/contents\//, status: 500, expected: [502, /GitHub ma chwilowe problemy/] },
  ] as const;

  for (const { name, method, path, status, expected } of cases) {
    it(name, async () => {
      const { login, publish, github } = setup();
      const cookie = await login('jan-testowy');
      github.fail(method, path, status);
      const response = await publish(cookie, goodDraft(), [{ name: 'a.jpg', content: await jpeg(), alt: 'Opis' }]);
      expect(response.status).toBe(expected[0]);
      const { error } = await response.json();
      expect(error).toMatch(expected[1]);
      expect(error).toMatch(/Szkic jest zapisany w przeglądarce/);
    });
  }

  it('GitHub nie odpowiada przy sprawdzaniu zespołu: 504, nie 403', async () => {
    const { login, get, github } = setup();
    const cookie = await login('jan-testowy');
    github.fail('GET', /memberships/, 'timeout');
    expect((await get('/me', cookie)).status).toBe(504);
  });
});
