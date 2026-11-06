# new-website: kod strony (Astro)

Jak uruchomić stronę, dodać wpis, partnera czy projekt i wysłać zmiany: [README.md w katalogu
głównym](../README.md). Zasady kodu i kolorów: [CLAUDE.md](../CLAUDE.md).
Ten plik opisuje, jak zbudowany jest kod. Przeczytaj go, zanim zmienisz coś poza treścią.

**Astro** to narzędzie, które z plików w `src/` buduje gotowe strony HTML. Strona nie ma
serwera ani bazy danych: `npm run build` tworzy folder `dist/` z gotowymi plikami, a te
trafiają na GitHub Pages. Dlaczego Astro: [docs/adr/0001-astro.md](../docs/adr/0001-astro.md).

## Struktura `src/`

```text
src/
├── content/           TREŚĆ: wpisy, osiągnięcia, projekty, partnerzy (pliki .md i .yaml)
├── content.config.ts  schematy treści: jakie pola musi mieć wpis, partner itd.
├── lib/               jedyne miejsce, które czyta treść (patrz niżej)
├── pages/             adresy strony: plik = adres (np. pages/blog/index.astro → /blog/)
├── sections/          bloki strony głównej: Hero, About, LatestPosts, Achievements…
├── components/        małe, powtarzalne elementy: nagłówek, stopka, logo, ui/ (przyciski, tagi)
├── layouts/           BaseLayout.astro, szkielet każdej strony (<head>, menu, stopka)
├── data/site.ts       stałe: e-mail, linki social, Discord, Wiki, menu, statystyki „O nas”
├── i18n/              teksty interfejsu po polsku (pl.ts) i angielsku (en.ts), funkcja t()
├── config/            zasady-wpisow.ts: zasady wpisów (build, kreator, później serwer)
├── redakcja/          logika kreatora /redakcja/: wpis.ts (index.md, adres, sprawdzanie), edytor.ts (Tiptap)
├── styles/            tokens.css, global.css (style wspólne), post.css (wpis i podgląd w kreatorze)
└── assets/            logo i obrazki używane w kodzie (logo PRz w assets/partners/)
```

Plik `.astro` ma dwie części: między liniami `---` kod (pobranie danych), pod spodem HTML,
a na końcu `<style>`, który działa **tylko w tym pliku**.

- `pages/index.astro` tylko składa sekcje z `sections/`, a każda sekcja to jeden plik.
- Komponenty dostają dane z zewnątrz (przez *propsy*, czyli atrybuty, np.
  `<SiteFooter partners={partners} />`) i same niczego nie pobierają.
- `public/`: pliki kopiowane bez zmian pod ten sam adres (favicony, `robots.txt`, obraz podglądu
  linku `og-default.png`, PDF w `public/blog/`).

## Kolory i style: tylko tokeny

Wszystkie kolory, fonty, promienie i odstępy są w **`src/styles/tokens.css`** jako zmienne,
np. `var(--color-brand)`. W komponentach nie wpisujemy kolorów (`#242030`), tylko tokeny.
Który kolor wolno gdzie użyć (np. limonka `--color-highlight`), opisuje tabela w CLAUDE.md.
Nowy kolor = nowy token z nazwą mówiącą o roli (`--color-danger`), nie o wyglądzie.

## `src/lib/`: jedyne miejsce dostępu do danych

Sekcje i strony nigdy nie czytają `src/content/` bezpośrednio, tylko wołają funkcje z `lib/`:

| Plik | Najważniejsze funkcje |
|---|---|
| `posts.ts` | `getPosts()` (bez szkiców, od najnowszego), `getTags()`, `postUrl()`, `postDescription()` |
| `achievements.ts` | `getAchievements(locale)` (od najnowszego roku, w roku od najwyższego miejsca) |
| `projects.ts` | `getProjects(locale)` (wg `order`), `projectUrl()` |
| `partners.ts` | `getPartners(locale)` (tylko aktualni, bez tych po `validUntil`), `isStrategic()` |
| `feed.ts` | kanał RSS (`/index.xml`, `/blog/index.xml`) |

Funkcje z `locale` zwracają dla `'en'` pola z obiektu `en` (patrz niżej).

Dlaczego tak: dziś dane są w plikach, a w przyszłości mogą przyjść z panelu do dodawania
wpisów albo z bazy danych. Wtedy zmienimy tylko `lib/`, a sekcje i strony zostaną bez zmian.

## Wersja angielska (`src/i18n/`)

Polski jest pod zwykłymi adresami, angielski pod `/en/` (`i18n` w `astro.config.mjs`).
Dziś po angielsku jest tylko strona główna: `pages/en/index.astro` renderuje tę samą
`pages/index.astro`, a ta ustala język z adresu przez `getLocale(Astro)` i przekazuje go
sekcjom (`<Hero locale={locale} />`). Decyzja: [docs/adr/0002-wersja-en.md](../docs/adr/0002-wersja-en.md).

- `t(locale, 'klucz')`: tekst interfejsu z `pl.ts` albo `en.ts`. Typ `Dictionary` pilnuje,
  żeby `en.ts` miał wszystkie klucze z `pl.ts`.
- `localizeEntry()`: wpis z kolekcji z polami z `en` zamiast polskich (wołają ją funkcje z `lib/`).
- `homeUrl()`, `localizeHref()`: linki do strony głównej i jej sekcji (`/#projekty` → `/en/#projekty`).
- Przełącznik „PL / EN”: `components/LanguageSwitch.astro`. Z każdej polskiej strony prowadzi
  do `/en/`, z angielskiej do `/`. Gdy powstaną kolejne strony EN, trzeba tu dodać ich odpowiedniki
  (i linki `hreflang` w `BaseLayout.astro`, które dziś ma tylko strona główna).
- Wpisy na blogu są tylko po polsku. Na `/en/` karty wpisów mają etykietę „In Polish”.

## Adresy specjalne

- `pages/sitemap.xml.ts`: mapa strony dla wyszukiwarek. **Nową podstronę dopisz do `staticPages`.**
- `pages/tags/[tag]/page/[page].astro` i `redirects` w `astro.config.mjs`: przekierowania
  starych adresów stronicowania z Hugo. Nie usuwaj: mogą do nich prowadzić stare linki.
- `pages/404.astro`: strona „nie znaleziono” (GitHub Pages pokazuje ją sam).
- `pages/redakcja/index.astro`: kreator wpisów. Jedyna strona z większym JS (edytor Tiptap,
  podgląd przez `marked`, paczka `.zip` przez `fflate`), wczytywanym tylko na niej. Tylko po
  polsku, `noindex`, celowo poza menu i poza `staticPages` w sitemapie. Podgląd ma ten sam
  układ i te same klasy co `pages/blog/[...slug].astro`: zmieniasz jedno, zmień drugie
  (`test/e2e/redakcja.spec.ts` to wyłapie).

## Skrypty w `scripts/`

Uruchamiasz je z folderu `new-website/`: `node scripts/<nazwa>.mjs`.

- `generate-icons.mjs` tworzy w `public/` favicony (`favicon.svg`, `favicon-32.png`,
  `apple-touch-icon.png`) i obraz podglądu linku `og-default.png` (1200×630). Uruchom go **po
  zmianie logo (`src/assets/knml-logo.svg`) albo kolorów w `tokens.css`**, a wygenerowane pliki
  zacommituj. Korzysta z bibliotek `sharp` (obróbka obrazów) i `fontkitten` (czytanie fontów),
  które instaluje samo Astro, więc nie ma ich w naszym `package.json`. Jeśli po aktualizacji Astro skrypt
  zgłosi, że ich nie ma, dodaj je poleceniem `npm install --save-dev sharp fontkitten`.
- `migrate-hugo.mjs` jest **jednorazowy**: przeniósł treść ze starej strony do `src/content/`.
  Migracja jest zrobiona, więc skrypt odmawia ponownego działania (nadpisałby ręczne zmiany).
  Do usunięcia razem z `old-website/` po starcie nowej strony.

## Zdjęcia i aktualizacja Astro

Zdjęcia w treści wpisów (Markdown) mają `srcset` w kilku rozmiarach WebP dopasowanych do
kolumny tekstu, a `src` każdego obrazu z `srcset` wskazuje największy wariant zamiast oryginału.
Robią to dwie rzeczy:

- **wtyczka `responsivePostImages` w `astro.config.mjs`** ustawia zdjęciom z Markdowna
  `layout`, `widths` i `sizes`. Zależy od **wewnętrznej paczki Astro `@astrojs/markdown-satteri`**
  (procesor Markdowna, który instaluje samo Astro, nie ma jej w naszym `package.json`) i od jej
  API wtyczek (`element.filter`, `visit(node, ctx)`, `ctx.setProperty`). Zwykłe
  `markdown.rehypePlugins` nie wchodzą w grę: w Astro 7 wymagają dodatkowej paczki
  `@astrojs/markdown-remark` i są oznaczone jako przestarzałe;
- **`src/image-service.ts`** to domyślny serwis obrazów Astro (sharp) z jedną zmianą: `src` wskazuje
  największy wariant z `srcset`. Korzysta z publicznego API (`astro/assets/services/sharp`, `image.service`).

**Po aktualizacji Astro sprawdź:**

1. `npm run build` przechodzi. Błąd importu `@astrojs/markdown-satteri` = Astro zmieniło
   procesor Markdowna; sprawdź w dokumentacji Astro („Markdown processor”), jak teraz dodaje się
   wtyczki, i przenieś `responsivePostImages`.
2. `npm run test:e2e` przechodzi, zwłaszcza test „plik zdjęcia najwyżej 2× szerszy niż na
   ekranie” w `test/e2e/wpisy.spec.ts`. Gdy wtyczka po cichu przestanie działać, zdjęcia wrócą
   do pełnego rozmiaru i ten test to wykaże.
3. W `dist/blog/<wpis>/index.html` zdjęcie z treści ma `srcset` z `480w … 1640w`, a jego `src`
   jest tym samym plikiem co wariant `1640w` (albo oryginałem, jeśli zdjęcie jest mniejsze).

## Komendy

| Komenda | Co robi |
|---|---|
| `npm install` | pobiera biblioteki |
| `npm run dev` | podgląd na żywo pod http://localhost:4321 |
| `npm run check` | sprawdza typy w kodzie i poprawność treści ze schematami |
| `npm run build` | buduje gotową stronę do `dist/` |
| `npm run preview` | pokazuje zbudowany `dist/` (tak, jak będzie w internecie) |
| `npm test` | testy `src/lib/` (Vitest) |
| `npm run build:test` | build z wpisami testowymi do `dist-test/` (podgląd: `npm run preview:test`) |
| `npm run test:e2e` | oba buildy + testy w przeglądarce (Playwright); opis w README w katalogu głównym, „Testy” |
