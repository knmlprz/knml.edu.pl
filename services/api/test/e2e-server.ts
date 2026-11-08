import { serve } from '@hono/node-server';
import { createApp } from '../src/app';
import { createMockGitHub } from './mock-github';
import { appKeys, SITE_URL, testConfig } from './setup';

// API z udawanym GitHubem, bez internetu i bez prawdziwej aplikacji GitHub. Do testów w przeglądarce
// (e2e/) i do klikania kreatora lokalnie: npm run dev:mock (opis: README.md, „Uruchomienie”).
const API_PORT = 8787;
const MOCK_PORT = 8788;

const github = createMockGitHub(appKeys.publicKey);
serve({ fetch: github.app.fetch, port: MOCK_PORT });
const config = { ...testConfig(`http://localhost:${MOCK_PORT}`), siteUrl: process.env.SITE_URL ?? SITE_URL, timeoutMs: 10_000 };
serve({ fetch: createApp(config).fetch, port: API_PORT }, () =>
  console.log(`API z udawanym GitHubem: http://localhost:${API_PORT} (strona: ${config.siteUrl}, logowanie jako jan-testowy)`),
);
