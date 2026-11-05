import { defineConfig } from '@playwright/test';

// Testy w przeglądarce. Przed nimi muszą być zbudowane obie wersje strony
// (npm run test:e2e robi to sam). Opis: README.md, sekcja „Testy”.
const PROD_URL = 'http://localhost:4321';
const TEST_POSTS_URL = 'http://localhost:4322';

export default defineConfig({
  testDir: 'test/e2e',
  // Zrzuty porównawcze leżą obok testów, bez nazwy systemu w nazwie pliku.
  snapshotPathTemplate: '{testDir}/zrzuty/{arg}{ext}',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  projects: [
    // Prawdziwa strona, taka jak po publikacji.
    { name: 'smoke', testMatch: 'smoke.spec.ts', use: { baseURL: PROD_URL } },
    // Strona z wpisami testowymi z test/fixtures/blog.
    { name: 'wpisy', testMatch: ['wpisy.spec.ts', 'zrzuty.spec.ts'], use: { baseURL: TEST_POSTS_URL } },
  ],
  // --ignore-lock: Astro domyślnie pozwala na jeden podgląd naraz, a tu potrzebne są dwa.
  webServer: [
    { command: 'npm run preview -- --port 4321 --ignore-lock', url: PROD_URL, reuseExistingServer: !process.env.CI },
    { command: 'npm run preview:test -- --port 4322 --ignore-lock', url: TEST_POSTS_URL, reuseExistingServer: !process.env.CI },
  ],
});
