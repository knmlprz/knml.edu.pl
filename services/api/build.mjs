import { build } from 'esbuild';

// Jeden plik JS do uruchomienia przez node: kod usługi razem z plikami z new-website/src,
// które importuje (zasady wpisów, tworzenie wpisu). Użycie: node build.mjs [plik wejściowy].
// sharp ma części natywne, więc zostaje w node_modules.
await build({
  entryPoints: [process.argv[2] ?? 'src/server.ts'],
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  external: ['sharp'],
  // Pliki z new-website importują zod, a w obrazie Docker nie ma new-website/node_modules.
  alias: { zod: './node_modules/zod' },
  logLevel: 'warning',
});
