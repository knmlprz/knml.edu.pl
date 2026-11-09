import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // astro:content istnieje tylko w buildzie Astro. W testach podmieniamy go na fixtures.
    alias: { 'astro:content': new URL('./test/astro-content.ts', import.meta.url).pathname },
  },
  test: {
    include: ['test/lib/**/*.test.ts', 'test/redakcja/**/*.test.ts'],
    // Daty formatujemy w strefie czasowej maszyny, więc ustalamy ją, żeby testy dawały ten sam wynik wszędzie.
    env: { TZ: 'Europe/Warsaw' },
  },
});
