import rzeszowLogo from '../assets/img/partner-rzeszow.jpg';
import postPci from '../assets/img/post-pci.jpg';
import postSpaceshield from '../assets/img/post-spaceshield.jpg';
import postTuluza from '../assets/img/post-tuluza.jpg';
import projDrony from '../assets/img/proj-drony.jpg';
import projLarkfid from '../assets/img/proj-larkfid.jpg';
import projMnist from '../assets/img/proj-mnist.jpg';

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

// Wszystko poniżej to dane tymczasowe strony głównej (etap 2).
// W etapie 3 wpisy, osiągnięcia, projekty i partnerzy przejdą do Content Collections.

// Sponsor: wspólny dla hero i sekcji Partnerzy. Dane od zarządu koła (umowa do 30.11.2026).
export const sponsor = {
  name: '[Nazwa sponsora]',
  description: '[1–2 zdania o tym, jak wspiera koło]',
  href: '#',
};

// Statystyki prawdziwe (z repo): założenie 2020, 7 osiągnięć w config.toml,
// I miejsca: SpaceShield Hack 2026 + EDTH Detect & Defend 2026.
export const stats = [
  { value: '2020', label: 'rok założenia przy WMiFS' },
  { value: '7', label: 'nagród i wyróżnień w konkursach' },
  { value: '2×', label: 'I miejsce na międzynarodowych hackathonach w 2026', highlighted: true },
];

export const postCount = 20;

// Od najnowszego. Pierwszy wpis jest duży i pokazuje excerpt.
export const latestPosts = [
  {
    href: '/blog/studenci-kola-naukowego-machine-learning-z-wizyta-w-tuluzie/',
    title: 'Studenci KNML z wizytą w Tuluzie',
    excerpt: 'Trzy dni wśród przemysłu lotniczego i kosmicznego: Cité de l’Espace i Musée Aeroscopia.',
    category: 'Aktualności',
    date: new Date('2026-09-16'),
    cover: postTuluza,
  },
  {
    href: '/blog/zwyciestwo-studentow-kola-naukowego-machine-learning-w-hackathonie-spaceshield-hack/',
    title: 'Zwycięstwo w hackathonie Spaceshield Hack',
    category: 'Aktualności',
    date: new Date('2026-05-26'),
    cover: postSpaceshield,
  },
  {
    href: '/blog/innowacyjny-projekt-kola-naukowego-machine-learning-nagrodzony-przez-pci/',
    title: 'Nasz projekt nagrodzony przez PCI',
    category: 'Aktualności',
    date: new Date('2026-04-10'),
    cover: postPci,
  },
];

// Od najnowszego. place === 'I miejsce' daje limonkową kartę.
export const achievements = [
  { year: 2026, place: 'I miejsce', mark: '1.', title: 'SpaceShield Hack', description: 'Dostępność transportu publicznego w Stalowej Woli z danych satelitarnych', href: 'https://w.prz.edu.pl/uczelnia/aktualnosci/kolejny-sukces-kola-naukowego-machine-learning-3023.html' },
  { year: 2026, place: 'I miejsce', mark: '1.', title: 'EDTH Detect & Defend', description: 'Sieć czujników mesh do wykrywania dronów', href: 'https://prz.edu.pl/uczelnia/aktualnosci/sukces-studentow-kola-naukowego-machine-learninga-2978.html' },
  { year: 2026, place: 'Nagroda', mark: 'PCI', title: 'Podkarpackie Centrum Innowacji', description: 'Rozproszona sieć czujników wykrywających drony', href: 'https://prz.edu.pl/uczelnia/aktualnosci/pci-nagrodzilo-innowacyjne-projekty-kol-naukowych-2997.html' },
  { year: 2023, place: 'Wyróżnienie', mark: 'W', title: 'BITEHack | AI', description: 'Analiza zużycia energii w budynkach', href: 'https://wmifs.prz.edu.pl/aktualnosci/wyroznienie-dla-kola-naukowego-machine-learning-381.html' },
  { year: 2022, place: 'II miejsce', mark: '2.', title: 'BITEHack | AI', description: 'Wykrywanie negatywnych emocji w sieci', href: 'https://w.prz.edu.pl/uczelnia/aktualnosci/sukces-studentow-kola-naukowego-machine-learning-2131.html' },
  { year: 2022, place: 'Nagroda', mark: 'KoKoN', title: 'Cyfryzacja', description: 'LARKFiD — Open Gov Data i aplikacje na GPU', href: 'https://wmifs.prz.edu.pl/aktualnosci/pierwsza-nagroda-dla-kola-naukowego-machine-learning-363.html' },
  { year: 2021, place: 'Wyróżnienie', mark: 'W', title: 'StRuNa — Debiut Roku', description: 'Wyróżnienie dla nowego koła naukowego', href: 'https://wmifs.prz.edu.pl/aktualnosci/kolo-naukowe-machine-learning-wyroznione-w-kategorii-debiut-roku-2021-298.html' },
];

// Kolekcji projektów nie było w Hugo — treść złożona z wpisów i osiągnięć (wzorzec).
// Pierwszy tag to kategoria (lawendowa etykieta).
export const featuredProjects = [
  {
    href: '/projekty/wykrywanie-dronow',
    title: 'Sieć czujników do wykrywania dronów',
    description: 'Rozproszona sieć czujników, m.in. akustycznych, w architekturze mesh, wykrywająca drony.',
    tags: ['Drony', 'czujniki akustyczne', 'mesh'],
    meta: '2026 · I miejsce EDTH Detect & Defend · Nagroda PCI',
    cover: projDrony,
  },
  {
    href: '/projekty/transport-stalowa-wola',
    title: 'Transport publiczny z kosmosu',
    description: 'Analiza dostępności transportu publicznego w Stalowej Woli na danych satelitarnych i geoprzestrzennych.',
    tags: ['Dane satelitarne', 'GIS', 'analiza danych'],
    meta: '2026 · I miejsce SpaceShield Hack',
    cover: postSpaceshield,
  },
  {
    href: '/blog/larkfid-twoja-baza-wiedzy/',
    title: 'LARKFiD',
    description: 'Baza wiedzy o regionie: zbieranie danych z sieci, przetwarzanie języka i wyszukiwarka OpenSearch.',
    tags: ['NLP', 'Python', 'OpenSearch'],
    meta: '2022–2023 · Nagroda KoKoN',
    cover: projLarkfid,
  },
  {
    href: '/blog/mnist-demo-jak-komputer-widzi-tekst/',
    title: 'MNIST Demo',
    description: 'Interaktywne demo pokazujące, jak sieć neuronowa rozpoznaje odręcznie pisane cyfry.',
    tags: ['Computer vision', 'PyTorch', 'Streamlit'],
    meta: '2023 · demo na wydarzenia PRz',
    cover: projMnist,
  },
];
