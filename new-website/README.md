# new-website — kod strony (Astro)

Jak uruchomić stronę, dodać wpis, partnera czy projekt i wysłać zmiany: **[README.md w katalogu
głównym](../README.md)**. Zasady kodu i kolorów: **[CLAUDE.md](../CLAUDE.md)**.
Ten plik opisuje, jak zbudowany jest kod — przeczytaj go, zanim zmienisz coś poza treścią.

**Astro** to narzędzie, które z plików w `src/` buduje gotowe strony HTML. Strona nie ma
serwera ani bazy danych: `npm run build` tworzy folder `dist/` z gotowymi plikami, a te
trafiają na GitHub Pages. Dlaczego Astro: [docs/adr/0001-astro.md](../docs/adr/0001-astro.md).

## Struktura `src/`

```text
src/
├── content/           TREŚĆ: wpisy, osiągnięcia, projekty, partnerzy (pliki .md i .yaml)
├── content.config.ts  schematy treści — jakie pola musi mieć wpis, partner itd.
├── lib/               jedyne miejsce, które czyta treść (patrz niżej)
├── pages/             adresy strony: plik = adres (np. pages/blog/index.astro → /blog/)
├── sections/          bloki strony głównej: Hero, About, LatestPosts, Achievements…
├── components/        małe, powtarzalne elementy: nagłówek, stopka, logo, ui/ (przyciski, tagi)
├── layouts/           BaseLayout.astro — szkielet każdej strony (<head>, menu, stopka)
├── data/site.ts       stałe: e-mail, linki social, Discord, Wiki, menu, statystyki „O nas”
├── i18n/              teksty interfejsu po polsku (pl.ts) i angielsku (en.ts), funkcja t()
├── styles/            tokens.css (kolory, fonty, odstępy) i global.css (style wspólne)
└── assets/            logo i obrazki używane w kodzie (logo PRz w assets/partners/)
```

Plik `.astro` ma dwie części: między liniami `---` kod (pobranie danych), pod spodem HTML,
a na końcu `<style>`, który działa **tylko w tym pliku**.

- `pages/index.astro` tylko składa sekcje z `sections/` — każda sekcja to jeden plik.
- Komponenty dostają dane z zewnątrz (przez *propsy*, czyli atrybuty, np.
  `<SiteFooter partners={partners} />`) i same niczego nie pobierają.
- `public/` — pliki kopiowane bez zmian pod ten sam adres (favicony, `robots.txt`, obraz podglądu
  linku `og-default.png`, PDF w `public/blog/`).

## Kolory i style: tylko tokeny

Wszystkie kolory, fonty, promienie i odstępy są w **`src/styles/tokens.css`** jako zmienne,
np. `var(--color-brand)`. W komponentach nie wpisujemy kolorów (`#242030`) — tylko tokeny.
Który kolor wolno gdzie użyć (np. limonka `--color-highlight`), opisuje tabela w CLAUDE.md.
Nowy kolor = nowy token z nazwą mówiącą o roli (`--color-danger`), nie o wyglądzie.

## `src/lib/` — jedyne miejsce dostępu do danych

Sekcje i strony nigdy nie czytają `src/content/` bezpośrednio, tylko wołają funkcje z `lib/`:

| Plik | Najważniejsze funkcje |
|---|---|
| `posts.ts` | `getPosts()` (bez szkiców, od najnowszego), `getTags()`, `postUrl()`, `postDescription()` |
| `achievements.ts` | `getAchievements(locale)` (od najnowszego roku, w roku od najwyższego miejsca) |
| `projects.ts` | `getProjects(locale)` (wg `order`), `projectUrl()` |
| `partners.ts` | `getPartners(locale)` (tylko aktualni — pomija tych po `validUntil`), `isStrategic()` |
| `feed.ts` | kanał RSS (`/index.xml`, `/blog/index.xml`) |

Funkcje z `locale` zwracają dla `'en'` pola z obiektu `en` (patrz niżej).

Dlaczego tak: dziś dane są w plikach, a w przyszłości mogą przyjść z panelu do dodawania
wpisów albo z bazy danych. Wtedy zmienimy tylko `lib/`, a sekcje i strony zostaną bez zmian.

## Wersja angielska (`src/i18n/`)

Polski jest pod zwykłymi adresami, angielski pod `/en/` (`i18n` w `astro.config.mjs`).
Dziś po angielsku jest tylko strona główna: `pages/en/index.astro` renderuje tę samą
`pages/index.astro`, a ta ustala język z adresu przez `getLocale(Astro)` i przekazuje go
sekcjom (`<Hero locale={locale} />`). Decyzja: [docs/adr/0002-wersja-en.md](../docs/adr/0002-wersja-en.md).

- `t(locale, 'klucz')` — tekst interfejsu z `pl.ts` albo `en.ts`. Typ `Dictionary` pilnuje,
  żeby `en.ts` miał wszystkie klucze z `pl.ts`.
- `localizeEntry()` — wpis z kolekcji z polami z `en` zamiast polskich (wołają ją funkcje z `lib/`).
- `homeUrl()`, `localizeHref()` — linki do strony głównej i jej sekcji (`/#projekty` → `/en/#projekty`).
- Przełącznik „PL / EN”: `components/LanguageSwitch.astro`. Z każdej polskiej strony prowadzi
  do `/en/`, z angielskiej do `/`. Gdy powstaną kolejne strony EN, trzeba tu dodać ich odpowiedniki
  (i linki `hreflang` w `BaseLayout.astro`, które dziś ma tylko strona główna).
- Wpisy na blogu są tylko po polsku. Na `/en/` karty wpisów mają etykietę „In Polish”.

## Adresy specjalne

- `pages/sitemap.xml.ts` — mapa strony dla wyszukiwarek. **Nową podstronę dopisz do `staticPages`.**
- `pages/tags/[tag]/page/[page].astro` i `redirects` w `astro.config.mjs` — przekierowania
  starych adresów stronicowania z Hugo. Nie usuwaj: mogą do nich prowadzić stare linki.
- `pages/404.astro` — strona „nie znaleziono” (GitHub Pages pokazuje ją sam).

## Skrypty w `scripts/`

Uruchamiasz je z folderu `new-website/`: `node scripts/<nazwa>.mjs`.

- **`generate-icons.mjs`** — tworzy w `public/` favicony (`favicon.svg`, `favicon-32.png`,
  `apple-touch-icon.png`) i obraz podglądu linku `og-default.png` (1200×630). Uruchom go **po
  zmianie logo (`src/assets/knml-logo.svg`) albo kolorów w `tokens.css`**, a wygenerowane pliki
  zacommituj. Korzysta z bibliotek `sharp` (obróbka obrazów) i `fontkitten` (czytanie fontów),
  które instaluje samo Astro — nie są w naszym `package.json`. Jeśli po aktualizacji Astro skrypt
  zgłosi, że ich nie ma, dodaj je poleceniem `npm install --save-dev sharp fontkitten`.
- **`migrate-hugo.mjs`** — **jednorazowy**: przeniósł treść ze starej strony do `src/content/`.
  Migracja jest zrobiona, więc skrypt odmawia ponownego działania (nadpisałby ręczne zmiany).
  Do usunięcia razem z `old-website/` po starcie nowej strony.

## Komendy

| Komenda | Co robi |
|---|---|
| `npm install` | pobiera biblioteki |
| `npm run dev` | podgląd na żywo pod http://localhost:4321 |
| `npm run check` | sprawdza typy w kodzie i poprawność treści ze schematami |
| `npm run build` | buduje gotową stronę do `dist/` |
| `npm run preview` | pokazuje zbudowany `dist/` (tak, jak będzie w internecie) |
