import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Jak w build.mjs: zod dla plików z new-website/src bierzemy z tej usługi.
    alias: [{ find: /^zod$/, replacement: new URL('./node_modules/zod', import.meta.url).pathname }],
  },
  test: {
    include: ['test/**/*.test.ts'],
    // Data wpisu liczona w strefie czasowej koła, tak jak na serwerze (compose.yaml).
    env: { TZ: 'Europe/Warsaw' },
  },
});
