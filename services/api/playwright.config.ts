import { defineConfig } from '@playwright/test';

// Kreator na stronie (build z wpisami testowymi, new-website/dist-test) + API z udawanym GitHubem.
// npm run test:e2e buduje oba sam. Opis: README.md, „Testy”.
const SITE_URL = 'http://localhost:4322';

export default defineConfig({
  testDir: 'e2e',
  // Udawany GitHub ma jeden stan dla wszystkich testów, więc po kolei.
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: SITE_URL },
  webServer: [
    { command: 'node dist/e2e-server.js', url: 'http://localhost:8788/_test/pulls', reuseExistingServer: false },
    { command: 'npm --prefix ../../new-website run preview:test -- --port 4322 --ignore-lock', url: SITE_URL, reuseExistingServer: !process.env.CI },
  ],
});
