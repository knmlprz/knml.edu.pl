export const email = 'contact.knml.prz@gmail.com';
export const discordUrl = 'https://discord.gg/ZYJdXXgE6H';
export const wikiUrl = 'https://wiki.knml.edu.pl';
export const linktreeUrl = 'https://linktr.ee/knml.prz';

export const socials = [
  { label: 'Discord', href: discordUrl },
  { label: 'GitHub', href: 'https://github.com/knmlprz' },
  { label: 'Facebook', href: 'https://www.facebook.com/knmlprz' },
  { label: 'Instagram', href: 'https://www.instagram.com/knml.prz/' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/knmlprz/' },
];

// "/#..." zamiast "#...", żeby linki działały też z podstron (np. /blog/).
export const mainNav = [
  { label: 'Blog', href: '/blog/' },
  { label: 'Projekty', href: '/#projekty' },
  { label: 'Osiągnięcia', href: '/#osiagniecia' },
  { label: 'O nas', href: '/#o-nas' },
  { label: 'Kontakt', href: '/#kontakt' },
  { label: 'Wiki ↗', href: wikiUrl },
];

// Kontakt to sama stopka, więc w stopce zamiast niego jest „Dołącz”.
// Wiki jest w stopce w kolumnie „Zasoby”.
export const footerNav = [
  ...mainNav.filter((link) => link.href !== '/#kontakt' && link.href !== wikiUrl),
  { label: 'Dołącz', href: '/#dolacz' },
];

// Statystyki prawdziwe (z repo): założenie 2020, 7 osiągnięć w config.toml,
// I miejsca: SpaceShield Hack 2026 + EDTH Detect & Defend 2026.
export const stats = [
  { value: '2020', label: 'rok założenia przy WMiFS' },
  { value: '7', label: 'nagród i wyróżnień w konkursach' },
  { value: '2×', label: 'I miejsce na międzynarodowych hackathonach w 2026', highlighted: true },
];
