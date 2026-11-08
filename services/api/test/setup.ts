import { generateKeyPairSync } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { createApp } from '../src/app';
import type { Config } from '../src/config';
import { CLIENT_ID, CLIENT_SECRET, createMockGitHub, fetchFor, OWNER, REPO, TEAM } from './mock-github';

export const SITE_URL = 'http://localhost:4322';

// Klucz aplikacji GitHub do testów, nowy przy każdym uruchomieniu.
export const appKeys = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

export function testConfig(githubUrl: string, apiUrl = 'http://localhost:8787'): Config {
  return {
    siteUrl: SITE_URL,
    apiUrl,
    sessionSecret: 'testowy-sekret-sesji-ktory-ma-co-najmniej-32-znaki',
    appId: '12345',
    privateKey: appKeys.privateKey,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    owner: OWNER,
    repo: REPO,
    branch: 'main',
    team: TEAM,
    githubApiUrl: githubUrl,
    githubWebUrl: githubUrl,
    timeoutMs: 300,
  };
}

// heif-dec jest w obrazie Docker (Dockerfile). Bez niego testy HEIC się pomijają, chyba że
// HEIC_WYMAGANY=1 (tak jest w kontenerze testowym): wtedy brak programu to błąd testu.
export const hasHeifDec = !spawnSync('heif-dec', ['--version']).error || process.env.HEIC_WYMAGANY === '1';
if (!hasHeifDec && process.env.VITEST) {
  console.warn('\n⚠ Pomijam testy HEIC: brak programu heif-dec. Uruchom je w kontenerze (services/api/README.md, „Testy”).\n');
}

const cookiesFrom = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .filter((cookie) => !cookie.endsWith('='))
    .join('; ');

export type DraftInput = {
  title: string;
  category: string;
  author: string;
  body: string;
  tags: string[];
  excerpt: string;
  githubLink: string;
};

export const goodDraft = (changes: Partial<DraftInput> = {}): DraftInput => ({
  title: 'Zwycięstwo w Łodzi',
  category: 'aktualnosci',
  author: 'Jan Testowy',
  body: '## Co zrobiliśmy\n\n' + 'Opis projektu, zespołu i nagrody. '.repeat(12).trim(),
  tags: ['hackathon'],
  excerpt: 'Zespół KNML wygrał hackathon.',
  githubLink: '',
  ...changes,
});

export type Upload = { name: string; content: Uint8Array<ArrayBuffer>; alt: string; type?: string };

export const jpeg = (width = 800, height = 600) =>
  sharp({ create: { width, height, channels: 3, background: { r: 120, g: 80, b: 200 } } }).jpeg().toBuffer();

// Wszystko, czego test potrzebuje: API, udawany GitHub i logowanie przez niego (jak w przeglądarce).
export function setup() {
  const github = createMockGitHub(appKeys.publicKey);
  const app = createApp(testConfig('http://github.test'), fetchFor(github.app));

  async function login(user: string) {
    github.loginAs(user);
    const start = await app.request('/auth/login');
    const authorize = await github.app.request(start.headers.get('location')!);
    const callback = new URL(authorize.headers.get('location')!);
    const done = await app.request(callback.pathname + callback.search, { headers: { cookie: cookiesFrom(start) } });
    return cookiesFrom(done);
  }

  function publish(cookie: string, draft: DraftInput, uploads: Upload[]) {
    const form = new FormData();
    form.set('wpis', JSON.stringify({ ...draft, alts: uploads.map((upload) => upload.alt) }));
    for (const { name, content, type } of uploads) form.append('zdjecia', new File([content], name, { type: type ?? 'image/jpeg' }));
    return app.request('/wpisy', { method: 'POST', body: form, headers: { cookie, origin: SITE_URL } });
  }

  const get = (path: string, cookie = '') => app.request(path, { headers: { cookie, origin: SITE_URL } });

  return { app, github, login, publish, get };
}
