// Teksty interfejsu po polsku. Nowy tekst dopisz tutaj i w en.ts (pod tym samym kluczem).
// Teksty z podkreśleniem (klasa marker) są podzielone na części: Before, Marked, After.
export const pl = {
  skipLink: 'Przejdź do treści',
  siteName: 'Koło Naukowe Machine Learning Politechniki Rzeszowskiej',
  'seo.title': 'KNML - Koło Naukowe Machine Learning Politechniki Rzeszowskiej',
  'seo.description':
    'Koło Naukowe Machine Learning Politechniki Rzeszowskiej. Analiza danych, sieci neuronowe, wykrywanie dronów i algorytmy jazdy autonomicznej.',

  'header.homeLabel': 'KNML - strona główna',
  'header.mainNav': 'Główna nawigacja',
  'header.mobileNav': 'Menu mobilne',
  'header.menu': 'Menu',
  'header.menuOpen': 'Otwórz menu',
  'header.menuClose': 'Zamknij menu',
  'header.switchLanguage': 'Zmień język na angielski',

  'nav.blog': 'Blog',
  'nav.projects': 'Projekty',
  'nav.achievements': 'Osiągnięcia',
  'nav.about': 'O nas',
  'nav.contact': 'Kontakt',
  'nav.wiki': 'Wiki ↗',
  'nav.join': 'Dołącz',
  joinUs: 'Dołącz do nas',
  strategicPartner: 'Partner strategiczny',

  'hero.badge': '2× I miejsce na hackathonach w 2026',
  'hero.titleBefore': 'Uczenie maszynowe do ',
  'hero.titleMarked': 'niecodziennych',
  'hero.titleAfter': ' problemów.',
  'hero.lead':
    'Koło Naukowe Machine Learning Politechniki Rzeszowskiej. Analiza danych, sieci neuronowe, wykrywanie dronów i algorytmy jazdy autonomicznej.',
  'hero.seeProjects': 'Zobacz projekty',
  'hero.logoLabel': 'Logo KNML: sieć neuronowa wpisana w okrąg',

  'about.title': 'O nas',
  'about.statementBefore':
    'Jesteśmy grupą studentów zafascynowanych analizą danych, uczeniem maszynowym i sieciami neuronowymi. Uczymy się w praktyce: na konkursach, hackathonach i we ',
  'about.statementMarked': 'własnych projektach',
  'about.statementAfter': '.',
  'about.statFounded': 'rok założenia przy WMiFS',
  'about.statAwards': 'nagród i wyróżnień w konkursach',
  'about.statFirstPlaces': 'I miejsce na międzynarodowych hackathonach w 2026',

  'posts.title': 'Z życia koła',
  'posts.all': 'Wszystkie wpisy',
  // Wpisy są tylko po polsku, więc tę etykietę pokazuje tylko wersja EN.
  'posts.inPolish': 'Po polsku',
  'category.aktualnosci': 'Aktualności',
  'category.projekty': 'Projekty',

  'achievements.title': 'Osiągnięcia',
  'achievements.hint': 'Przewiń w bok →',
  'achievements.listLabel': 'Osiągnięcia koła, lista przewijana w poziomie',
  // Klucze odpowiadają polu place w src/content/achievements/*.yaml.
  'place.I miejsce': 'I miejsce',
  'place.II miejsce': 'II miejsce',
  'place.Nagroda': 'Nagroda',
  'place.Wyróżnienie': 'Wyróżnienie',

  'join.eyebrow': 'Każdy jest mile widziany',
  'join.title': 'Dołącz do KNML',
  'join.lead':
    'W zespole są głównie studenci Inżynierii i analizy danych, ale nie musisz studiować na WMiFS, żeby z nami działać.',
  'join.writeToUs': 'Napisz do nas',
  'join.step1': 'Wejdź na nasz serwer Discord',
  'join.step2': 'Przyjdź na spotkanie koła',
  'join.step3': 'Dołącz do projektu albo drużyny na hackathon',

  'projects.title': 'Projekty',

  'partners.title': 'Partnerzy',
  'partners.website': 'Strona partnera ↗',

  'footer.university': 'Politechnika Rzeszowska',
  'footer.about':
    'Koło Naukowe Machine Learning działa przy Wydziale Matematyki i Fizyki Stosowanej PRz. Wykorzystujemy uczenie maszynowe do rozwiązywania niecodziennych problemów.',
  'footer.navLabel': 'Stopka',
  'footer.site': 'Strona',
  'footer.resources': 'Zasoby',
  'footer.hostedBy': 'Działamy przy',
  'footer.supportedBy': 'Wspierają nas',
  'footer.backToTop': 'Do góry ↑',
};

export type TranslationKey = keyof typeof pl;
// Słownik każdego języka musi mieć dokładnie te klucze co pl - inaczej `npm run check` zgłosi błąd.
export type Dictionary = Record<TranslationKey, string>;
