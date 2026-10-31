import type { TranslationKey } from '../i18n';

export const email = 'contact.knml.prz@gmail.com';
export const discordUrl = 'https://discord.gg/ZYJdXXgE6H';
export const wikiUrl = 'https://wiki.knml.edu.pl';
export const linktreeUrl = 'https://linktr.ee/knml.prz';
// Dokąd prowadzą wszystkie przyciski „Dołącz”. Zmiana tutaj zmienia je wszystkie.
export const joinUrl = linktreeUrl;

export const socials = [
  { label: 'Discord', href: discordUrl },
  { label: 'GitHub', href: 'https://github.com/knmlprz' },
  { label: 'Facebook', href: 'https://www.facebook.com/knmlprz' },
  { label: 'Instagram', href: 'https://www.instagram.com/knml.prz/' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/knmlprz/' },
];

// "/#..." zamiast "#...", żeby linki działały też z podstron (np. /blog/).
// labelKey: klucz tekstu w src/i18n/pl.ts i en.ts.
export const mainNav: { labelKey: TranslationKey; href: string }[] = [
  { labelKey: 'nav.blog', href: '/blog/' },
  { labelKey: 'nav.projects', href: '/#projekty' },
  { labelKey: 'nav.achievements', href: '/#osiagniecia' },
  { labelKey: 'nav.about', href: '/#o-nas' },
  { labelKey: 'nav.contact', href: '/#kontakt' },
  { labelKey: 'nav.wiki', href: wikiUrl },
];

// Kontakt to sama stopka, więc w stopce zamiast niego jest „Dołącz”.
// Wiki jest w stopce w kolumnie „Zasoby”.
export const footerNav: typeof mainNav = [
  ...mainNav.filter((link) => link.href !== '/#kontakt' && link.href !== wikiUrl),
  { labelKey: 'nav.join', href: '/#dolacz' },
];

// Statystyki prawdziwe (z repo): założenie 2020, 7 osiągnięć w config.toml,
// I miejsca: SpaceShield Hack 2026 + EDTH Detect & Defend 2026.
export const stats: { value: string; labelKey: TranslationKey; highlighted?: boolean }[] = [
  { value: '2020', labelKey: 'about.statFounded' },
  { value: '7', labelKey: 'about.statAwards' },
  { value: '2×', labelKey: 'about.statFirstPlaces', highlighted: true },
];
