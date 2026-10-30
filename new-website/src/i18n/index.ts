import { en } from './en';
import { pl, type TranslationKey } from './pl';

const dictionaries = { pl, en };

export type Locale = keyof typeof dictionaries;
export type { TranslationKey };

export const t = (locale: Locale, key: TranslationKey) => dictionaries[locale][key];

// Język bieżącej strony. Astro wylicza go z adresu (i18n w astro.config.mjs): /en/… → 'en', reszta → 'pl'.
export const getLocale = (astro: { currentLocale?: string }): Locale =>
  astro.currentLocale === 'en' ? 'en' : 'pl';

export const homeUrl = (locale: Locale) => (locale === 'en' ? '/en/' : '/');

// Linki do sekcji strony głównej („/#projekty”) w wersji EN prowadzą do /en/#projekty.
// Blog i linki zewnętrzne zostają bez zmian, bo nie mają wersji EN.
export const localizeHref = (locale: Locale, href: string) =>
  locale === 'en' && href.startsWith('/#') ? `/en${href}` : href;

// Wpis z kolekcji w danym języku: pola z obiektu `en` zastępują polskie,
// a pole, którego w `en` nie ma, zostaje po polsku.
export function localizeEntry<Entry extends { data: { en?: object } }>(entry: Entry, locale: Locale): Entry {
  if (locale === 'pl' || !entry.data.en) return entry;
  return { ...entry, data: { ...entry.data, ...entry.data.en } };
}
