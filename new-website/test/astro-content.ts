// Zastępuje astro:content w testach Vitest (alias w vitest.config.ts).
// Test wkłada fixtures do `collections`, a funkcje z src/lib czytają je przez getCollection().
export const collections: Record<string, { id: string; data: object; body?: string }[]> = {};

export async function getCollection(name: string, filter?: (entry: never) => boolean) {
  const entries = collections[name] ?? [];
  return filter ? entries.filter((entry) => filter(entry as never)) : entries;
}

// Potrzebne tylko dlatego, że src/content.config.ts je importuje.
export const defineCollection = <Config>(config: Config) => config;
export const reference = () => ({ optional: () => ({}) });
