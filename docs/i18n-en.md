# Wersja angielska strony KNML: plan i tłumaczenia

Plik dla Claude Code. Wrzuć go do repo jako `docs/i18n-en.md` i daj Claude'owi prompt z sekcji 1.

## 1. Prompt dla Claude Code

```text
Dodajemy angielską wersję strony. Plan i gotowe tłumaczenia są w docs/i18n-en.md, przeczytaj cały plik.
Pracujemy na gałęzi wersja-en (utworzonej od aktualnego main). Commitów nie rób.

Zakres:
- Przetłumaczone są tylko teksty interfejsu i dane z kolekcji (osiągnięcia, projekty, partnerzy, O nas).
- Wpisy na blogu zostają po polsku i NIE dostają wersji /en/.
- Nazwa „Koło Naukowe Machine Learning” i skrót KNML się nie tłumaczą.

Kroki (po każdym check + build):
1. Routing: wbudowane i18n Astro w astro.config.mjs: locales ['pl','en'], defaultLocale 'pl',
   prefixDefaultLocale: false. Polski zostaje pod tymi samymi adresami, angielski pod /en/.
   Strony EN: /en/ (główna) i /en/404 jeśli się da. Bez nowych zależności.
2. Słowniki: src/i18n/pl.ts (wszystkie teksty interfejsu wyciągnięte z komponentów i sekcji)
   i src/i18n/en.ts, typowany tak, żeby BRAK klucza w en.ts był błędem npm run check.
   Funkcja t(locale, key) i getLocale(Astro) w src/i18n/index.ts. Sekcje dostają locale przez props.
   Tłumaczenia bierz z tabel w sekcji 3. Teksty, których tam nie ma, przetłumacz sam
   wg słowniczka z sekcji 2 i pokaż mi ich listę do akceptacji.
3. Kolekcje: w schematach achievements, projects i partners dodaj opcjonalny obiekt en
   (te same pola tekstowe co po polsku). Gdy en brak, pokazuj wersję polską.
   Wpisz tłumaczenia z sekcji 4 do plików yaml/md. Dostęp nadal tylko przez src/lib/.
4. Blog w wersji EN: na /en/ sekcja z wpisami pokazuje karty z polskimi tytułami
   i etykietą „In Polish”; linki prowadzą do /blog/<slug>/. „Blog” w menu EN → /blog/ z oznaczeniem (PL).
5. Przełącznik języka w nagłówku (desktop i menu mobilne): tekst „PL / EN”, aktywny język
   wyróżniony, bez flag. Link prowadzi do odpowiednika bieżącej strony
   (/ ↔ /en/; na stronach bloga, tagów i 404 do /en/). Cel dotyku min. 44 px, aria-label
   „Zmień język na angielski” / „Switch language to Polish”. Bez zapamiętywania i bez cookies.
6. SEO: <html lang="pl|en">, og:locale pl_PL / en_GB, link rel="alternate" hreflang
   (pl, en, x-default=pl) na głównej, /en/ w sitemap.xml, osobny og:description po angielsku.
7. Daty w EN przez Intl.DateTimeFormat('en-GB'), np. „16 Sep 2026”.
8. Zaktualizuj CLAUDE.md: usuń zakaz przełącznika języka, dopisz zasadę „każdy nowy tekst
   interfejsu dodajesz do pl.ts i en.ts”. W README dopisz krótko, jak dodać/zmienić tłumaczenie.
9. Na koniec: zrzuty / i /en/ na desktopie i w emulacji telefonu (Pixel 7) oraz lista zmian.
Zasady z CLAUDE.md obowiązują: tokeny kolorów, najmniej kodu, zwykły myślnik „-” zamiast „—” i „–”.
```

## 2. Słowniczek (stałe tłumaczenia)

| PL | EN |
|---|---|
| Koło Naukowe Machine Learning | **bez tłumaczenia** (nazwa własna) |
| KNML | KNML |
| koło / koło naukowe (ogólnie) | club / student club |
| Politechnika Rzeszowska (PRz) | Rzeszow University of Technology |
| Wydział Matematyki i Fizyki Stosowanej (WMiFS) | Faculty of Mathematics and Applied Physics |
| Inżynieria i analiza danych | Data Engineering and Analytics |
| Miasto Rzeszów | City of Rzeszów |
| Rzeszów - stolica innowacji | Rzeszów - capital of innovation |
| Partner strategiczny | Strategic partner |
| hackathon | hackathon |
| I miejsce / II miejsce | 1st place / 2nd place |
| Nagroda | Award |
| Wyróżnienie | Honourable mention |
| wpis | post |
| uczenie maszynowe | machine learning |
| sieci neuronowe | neural networks |

Pisownia brytyjska (en-GB): honour, centre, analyse. Myślnik zwykły „-”.

## 3. Teksty interfejsu

### Nagłówek, menu, dostępność

| PL | EN |
|---|---|
| Przejdź do treści | Skip to content |
| KNML - strona główna | KNML - home page |
| Główna nawigacja | Main navigation |
| Otwórz menu / Zamknij menu | Open menu / Close menu |
| Menu mobilne | Mobile menu |
| Menu | Menu |
| Blog | Blog (PL) |
| Projekty | Projects |
| Osiągnięcia | Achievements |
| O nas | About |
| Kontakt | Contact |
| Wiki ↗ | Wiki ↗ |
| Dołącz | Join |
| Dołącz do nas | Join us |

### Hero

| PL | EN |
|---|---|
| 2× I miejsce na hackathonach w 2026 | 2× 1st place at hackathons in 2026 |
| Uczenie maszynowe do niecodziennych problemów. | Machine learning for uncommon problems. |
| (podkreślone słowo: „niecodziennych”) | (podkreślone słowo: „uncommon”) |
| Koło Naukowe Machine Learning Politechniki Rzeszowskiej. Analiza danych, sieci neuronowe, wykrywanie dronów i algorytmy jazdy autonomicznej. | Koło Naukowe Machine Learning, the machine learning student club at Rzeszow University of Technology. Data analysis, neural networks, drone detection and autonomous driving algorithms. |
| Zobacz projekty | See our projects |
| Partner strategiczny | Strategic partner |

### O nas

| PL | EN |
|---|---|
| O nas | About us |
| Jesteśmy grupą studentów zafascynowanych analizą danych, uczeniem maszynowym i sieciami neuronowymi. Uczymy się w praktyce: na konkursach, hackathonach i we własnych projektach. | We are a group of students fascinated by data analysis, machine learning and neural networks. We learn by doing: in competitions, at hackathons and in our own projects. |
| (podkreślenie: „własnych projektach”) | (podkreślenie: „our own projects”) |
| Poznaj koło | Meet the club |
| rok założenia przy WMiFS | founded at the Faculty of Mathematics and Applied Physics |
| nagród i wyróżnień w konkursach | awards and honourable mentions in competitions |
| I miejsce na międzynarodowych hackathonach w 2026 | 1st place at international hackathons in 2026 |

### Wpisy, osiągnięcia, projekty

| PL | EN |
|---|---|
| Z życia koła | Club news |
| Wszystkie wpisy (N) | All posts (N) |
| Aktualności | News |
| Projekty (kategoria wpisu) | Projects |
| (etykieta na karcie wpisu w EN) | In Polish |
| Osiągnięcia | Achievements |
| Przewiń w bok → | Scroll sideways → |
| Osiągnięcia koła, lista przewijana w poziomie | Club achievements, horizontally scrollable list |
| Projekty | Projects |
| Wszystkie projekty | All projects |
| Wszystkie tagi | All tags |

### Dołącz

| PL | EN |
|---|---|
| Każdy jest mile widziany | Everyone is welcome |
| Dołącz do KNML | Join KNML |
| W zespole są głównie studenci Inżynierii i analizy danych, ale nie musisz studiować na WMiFS, żeby z nami działać. | Most of our members study Data Engineering and Analytics, but you don't have to be at the Faculty of Mathematics and Applied Physics to join us. |
| Napisz do nas | Write to us |
| Wejdź na nasz serwer Discord | Join our Discord server |
| Przyjdź na spotkanie koła | Come to a club meeting |
| Dołącz do projektu albo drużyny na hackathon | Join a project or a hackathon team |

### Partnerzy i stopka

| PL | EN |
|---|---|
| Partnerzy | Partners |
| Strona partnera ↗ | Partner website ↗ |
| Stopka | Footer |
| Koło Naukowe Machine Learning działa przy Wydziale Matematyki i Fizyki Stosowanej PRz. Wykorzystujemy uczenie maszynowe do rozwiązywania niecodziennych problemów. | Koło Naukowe Machine Learning operates at the Faculty of Mathematics and Applied Physics, Rzeszow University of Technology. We use machine learning to solve uncommon problems. |
| Strona | Site |
| Zasoby | Resources |
| Statut i regulaminy | Statute and regulations |
| Polityka prywatności | Privacy policy |
| Działamy przy | Hosted by |
| Wspierają nas | Supported by |
| © 2026 Koło Naukowe Machine Learning Politechniki Rzeszowskiej | © 2026 Koło Naukowe Machine Learning, Rzeszow University of Technology |
| Do góry ↑ | Back to top ↑ |

### SEO

| PL | EN |
|---|---|
| (title głównej) | KNML - Koło Naukowe Machine Learning, Rzeszow University of Technology |
| (description głównej) | Machine learning student club at Rzeszow University of Technology. Data analysis, neural networks, drone detection and hackathon projects. |

## 4. Dane z kolekcji (pole `en`)

### Osiągnięcia

| Plik / wydarzenie | title (EN) | description (EN) |
|---|---|---|
| SpaceShield Hack 2026, I miejsce | SpaceShield Hack | Public transport accessibility in Stalowa Wola from satellite data |
| EDTH Detect & Defend 2026, I miejsce | EDTH Detect & Defend | Mesh sensor network for drone detection |
| PCI 2026, Nagroda | Podkarpackie Innovation Centre | Distributed sensor network for drone detection |
| BITEHack 2023 AI, Wyróżnienie | BITEHack - AI | Building energy consumption analysis |
| BITEHack 2022 AI, II miejsce | BITEHack - AI | Detecting negative emotions online |
| KoKoN 2022 Cyfryzacja, Nagroda | KoKoN - Digitalisation | LARKFiD - Open Gov Data and GPU applications |
| StRuNa 2021, Wyróżnienie | StRuNa - Debut of the Year | Distinction for a new student club |

### Projekty

| Projekt | title (EN) | description (EN) | meta (EN) |
|---|---|---|---|
| wykrywanie-dronow | Sensor network for drone detection | A distributed mesh network of sensors, including acoustic ones, that detects drones. | 2026 · 1st place EDTH Detect & Defend · PCI Award |
| transport-stalowa-wola | Public transport from space | Analysis of public transport accessibility in Stalowa Wola using satellite and geospatial data. | 2026 · 1st place SpaceShield Hack |
| larkfid | LARKFiD | A regional knowledge base: web data collection, natural language processing and an OpenSearch search engine. | 2022-2023 · KoKoN Award |
| mnist | MNIST Demo | An interactive demo showing how a neural network recognises handwritten digits. | 2023 · demo for PRz events |

Tagi projektów: „czujniki akustyczne” → acoustic sensors, „Dane satelitarne” → Satellite data, „analiza danych” → data analysis, „Drony” → Drones. Reszta (mesh, GIS, NLP, Python, OpenSearch, Computer vision, PyTorch, Streamlit) bez zmian.

### Partnerzy

| Partner | description (EN) |
|---|---|
| Miasto Rzeszów | The City of Rzeszów is a strategic partner of Koło Naukowe Machine Learning. It supports student artificial intelligence projects in Rzeszów, the capital of innovation. |
| Politechnika Rzeszowska | name: Rzeszow University of Technology |
