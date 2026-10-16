import rzeszowLogo from '../assets/img/partner-rzeszow.jpg';

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
  { label: 'Blog', href: '/#blog' },
  { label: 'Projekty', href: '/#projekty' },
  { label: 'Osiągnięcia', href: '/#osiagniecia' },
  { label: 'O nas', href: '/#o-nas' },
  { label: 'Kontakt', href: '/#kontakt' },
];

// Kontakt to sama stopka, więc w stopce zamiast niego jest „Dołącz”.
export const footerNav = [
  ...mainNav.filter((link) => link.href !== '/#kontakt'),
  { label: 'Dołącz', href: '/#dolacz' },
];

// TODO: docelowo z kolekcji partners (etap 3).
export const cityPartner = {
  name: 'Miasto Rzeszów',
  href: 'https://www.erzeszow.pl',
  logo: rzeszowLogo,
  logoAlt: 'Rzeszów — stolica innowacji',
};
