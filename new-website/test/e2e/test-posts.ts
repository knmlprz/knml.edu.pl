import { readdirSync } from 'node:fs';

// Adresy wpisów testowych: nazwy folderów w test/fixtures/blog. Nowy folder = nowy wpis w testach.
export const testPostUrls = readdirSync(new URL('../fixtures/blog/', import.meta.url)).map((slug) => `/blog/${slug}/`);

export const widths = [360, 1440];
