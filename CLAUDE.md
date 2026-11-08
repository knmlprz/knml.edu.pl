# CLAUDE.md: strona KNML (knml.edu.pl)

Ten plik czyta Claude Code przy każdej sesji. Opisuje **co budujemy, jak i czego nie robić**.
Leży w **katalogu głównym repo** `knmlprz/knml.edu.pl`.

## Czym jest projekt

Strona **Koła Naukowego Machine Learning Politechniki Rzeszowskiej** (KNML, WMiFS PRz).
Odbiorcy: studenci, którzy mogą dołączyć, uczelnia, sponsorzy i partnerzy, jury konkursów.
Stronę utrzymują **studenci, którzy zmieniają się co rok**. Kod ma być zrozumiały dla osoby
z 1. roku, która otworzy repo za 3 lata bez żadnego kontekstu.

Przepisujemy starą stronę z Hugo na **Astro**. Wzorzec wyglądu strony głównej:
`new-website/design/index.html`. To źródło prawdy, odwzoruj go 1:1.

## Układ repo i gałęzie (przeczytaj najpierw)

```text
knml.edu.pl/                 jedno repo, jeden .git (tylko tutaj)
├── .github/workflows/          deploy.yml (publikacja Astro), ci.yml (check + build przy PR)
├── CNAME                        domena knml.edu.pl
├── CLAUDE.md                    ten plik
├── .dockerignore                co trafia do obrazu API (budowanego z katalogu głównego)
├── old-website/                 stara strona Hugo, TYLKO DO ODCZYTU
├── new-website/                 nowa strona Astro, tu pracujesz
│   └── design/                  wzorzec: index.html, assets/ (nie trafia do builda)
├── services/api/                API publikacji wpisów z kreatora (Node 22 + Hono, Docker)
└── docs/                        plan-kreator.md, adr/ (decyzje)
```

- Komendy `npm` strony uruchamiaj w `new-website/` (`cd new-website`), API w `services/api/`.
- `old-website/` służy tylko jako źródło treści. Nie zmieniaj tam niczego i niczego nie usuwaj.
- Pracujemy na gałęzi **`przebudowastrony`**. **Nigdy** nie pushuj ani nie merguj do `main`.
  Merge do `main` robi człowiek po testach, gdy nowa strona jest gotowa.
- **Bez pytania nie ruszaj:** `.github/workflows/`, `CNAME`, DNS, ustawień GitHub Pages.
- Osoba, z którą pracujesz, jest **początkująca** (Fedora, terminal w VS Code). Przy każdej
  operacji git krótko wyjaśnij, co robi komenda. Przed czymkolwiek nieodwracalnym
  (`reset --hard`, `push --force`, usuwanie plików) zatrzymaj się i zapytaj.
- Commituj małymi krokami, po polsku, w trybie rozkazującym („Dodaj sekcję Hero”).

## Hosting

- **Teraz:** GitHub Pages, deploy przez GitHub Actions: `.github/workflows/deploy.yml`
  (`withastro/action`, `path: ./new-website`) przy pushu na `main`, ręcznie i codziennie
  o 03:00 UTC (żeby partnerzy po `validUntil` znikali sami). `ci.yml` uruchamia `npm ci`,
  `check` i `build` przy każdym PR i pushu na `przebudowastrony`, bez publikacji.
  Stary `hugo.yml` usunięty (stara strona zostaje w `old-website/` i w historii gita).
  Gałąź `przebudowastrony` się nie publikuje. Domena bez zmian.
- **Strona zostaje statyczna** na GitHub Pages, także po uruchomieniu API.
- **API publikacji** (`services/api/`) działa osobno na serwerze koła pod `api.knml.edu.pl`
  (kontener z `services/api/Dockerfile`, `podman compose up`). Dziś tylko lokalnie (faza 4
  z `docs/plan-kreator.md`); uruchomienie na serwerze to faza 5, lista kroków w
  `services/api/README.md`. Szczegóły serwera: **TODO, zarząd koła.**
- Strona zna API tylko przez `PUBLIC_API_URL` przy buildzie. Bez niej kreator ma tylko
  „Pobierz wpis”.
- W `astro.config.mjs`: `site: 'https://knml.edu.pl'`, bez `base`.

## Zasady pisania kodu (najważniejsze)

1. **Najmniej kodu, który działa.** Bez abstrakcji „na zapas”, bez wzorców dla jednego
   przypadku, bez warstw pośrednich, których nikt nie potrzebuje.
2. **Najpierw HTML i CSS, potem JS.** Astro domyślnie wysyła 0 KB JS i tak ma zostać.
   Wyspa React (`client:visible`) tylko tam, gdzie jest prawdziwy stan, którego nie da się
   zrobić natywnie (`<details>`, `<dialog>`, kilka linijek `<script>`).
3. **Zero nowych zależności bez uzasadnienia.** Przed `npm install` sprawdź, czy Astro albo
   przeglądarka nie robi tego same. Każdą dodaną paczkę uzasadnij w opisie commita/PR.
4. **Czytelne nazwy zamiast komentarzy.** Komentarz tylko tam, gdzie wyjaśnia „dlaczego”.
   Identyfikatory w kodzie po angielsku, teksty na stronie po polsku.
5. **Jedno miejsce na jedną rzecz.** Kolor, link, e-mail czy tekst powtarzany na stronie
   definiujemy raz (token CSS albo `src/data/site.ts`) i tylko się do niego odwołujemy.
6. **Nie wymyślaj treści.** Brakujące dane zostawiaj jako widoczny placeholder `[TAK JAK TU]`
   i dopisz je do `TODO.md` w `new-website/`.
7. **Teksty stron publicznych dodajesz do `src/i18n/pl.ts` i `src/i18n/en.ts`** (ten sam klucz),
   w komponencie tylko `t(locale, 'klucz')`. Brak klucza w `en.ts` zatrzymuje `npm run check`.
   `/redakcja/` jest tylko po polsku i ma teksty w swoim pliku (`src/pages/redakcja/index.astro`).

## Kolory i style: tylko tokeny

Wszystkie kolory, fonty, promienie i odstępy są w `src/styles/tokens.css`
(wartości przepisz z `:root` w `design/index.html`).
**W komponentach nie ma żadnego koloru zapisanego jako hex.**

| Token | Rola | Gdzie wolno |
|---|---|---|
| `--color-brand` | kolor główny (ciemny fiolet) | przyciski, pas „Dołącz”, stopka |
| `--color-accent` | miękki akcent (lawenda) | podkreślenia, etykiety, linki na ciemnym tle. Nigdy jako tło przycisku |
| `--color-highlight` | wyróżnienie (limonka) | „2×” na kafelku, karty I miejsc, pas „Dołącz”. **Nigdy** w nawigacji, hero, jako tło przycisku na jasnym tle ani jako tekst na jasnym tle |
| `--color-logo` | logo w hero | tylko logo |
| `--ink`, `--muted`, `--bg`, `--surface`, `--section`, `--line`, `--tag-bg` | neutralne | wszędzie |

- Nowy kolor tylko jako token o nazwie mówiącej o roli (`--color-danger`), nie o wyglądzie.
- Style komponentu: `<style>` w pliku `.astro` (scoped). Globalnie tylko `tokens.css`
  i `global.css`. Bez Tailwinda i bez bibliotek UI.
- Fonty: Unbounded (nagłówki), Geist (tekst). Self-hosted przez `@fontsource`, nie z Google CDN.
- Logo: oryginalny kształt z `src/assets/knml-logo.svg`, bez modyfikacji geometrii,
  bez obracania. Animacja tylko jak we wzorcu.

## Architektura (`new-website/`)

```text
src/
├── assets/            logo, zdjęcia (optymalizowane przez astro:assets)
├── components/        małe, powtarzalne: SiteHeader, SiteFooter, KnmlLogo, ui/Button, ui/Tag
├── sections/          bloki strony głównej: Hero, About, LatestPosts, Achievements, JoinCta, Projects, Partners
├── content/           treść w plikach: blog/, achievements/, projects/, partners/
├── content.config.ts  schematy treści (Zod), walidacja przy buildzie
├── data/site.ts       stałe: e-mail, linki social, statystyki „O nas”
├── i18n/              teksty interfejsu: pl.ts, en.ts, index.ts (t(), getLocale())
├── lib/               jedyne miejsce, gdzie pobieramy dane (patrz „Backend”)
├── layouts/           BaseLayout.astro
├── pages/             routing: index, en/ (wersja angielska), blog/, blog/[...slug], projekty/, o-nas, 404
└── styles/            tokens.css, global.css
```

- **Sekcja = jeden plik** w `src/sections/`. `pages/index.astro` tylko je składa.
- **Komponent dostaje dane przez propsy**, sam niczego nie pobiera (wyjątek: sekcje
  wołają funkcje z `src/lib/`).
- Typy treści wynikają ze schematów w `content.config.ts`, nie duplikujemy ich ręcznie.

## Wersja angielska

- Polski bez prefiksu (`/`, `/blog/`), angielski pod `/en/` (i18n w `astro.config.mjs`).
  Po angielsku jest tylko strona główna; blog zostaje po polsku i nie ma wersji `/en/`.
- Sekcje i komponenty dostają `locale` przez props. Strona ustala go przez `getLocale(Astro)`.
- Kolekcje `achievements`, `projects`, `partners` mają opcjonalny obiekt `en` z tymi samymi
  polami tekstowymi. Brakujące pole strona EN pokazuje po polsku (`localizeEntry()` z `src/i18n/`, wołane w `src/lib/`).
- Nazwa „Koło Naukowe Machine Learning” i skrót KNML się nie tłumaczą. Angielski: en-GB.

## Backend: API publikacji (`services/api/`)

Wpisy dodaje się kreatorem `/redakcja/` (zamiast TinaCMS, `docs/adr/0003-kreator-zamiast-tiny.md`).
„Opublikuj” wysyła wpis do API, które przez GitHub App tworzy gałąź `wpis/<login>/<adres>`,
commit i PR z auto-merge po zielonym CI (`docs/adr/0004-api-publikacji.md`). Zasady:

- **Strona:** `output: 'static'`, czysty HTML. Bez adaptera `@astrojs/node` i bez tras API
  w `new-website/src/pages/api/`: serwerowy kod jest tylko w `services/api/`.
- **Logika wpisów tylko w `new-website/src/config/zasady-wpisow.ts` i `new-website/src/redakcja/wpis.ts`.**
  API je importuje, nie kopiuje. Nowa zasada albo zmiana pliku wpisu = zmiana tam, nie w API.
  Te pliki nie mogą importować niczego z Astro ani z przeglądarki (używa ich też Node).
- **Sekrety tylko w `.env`** (`services/api/.env`, `new-website/.env`, oba w `.gitignore`, poza
  obrazem Docker przez `.dockerignore`). Każda nowa zmienna trafia do `.env.example` z opisem.
  Klucze `.pem` nigdy do repo. W kodzie i testach żadnych prawdziwych tokenów.
- **Dostęp:** zespół `redakcja-strony` w `knmlprz`, sprawdzany przy każdym żądaniu;
  maintainerzy zespołu = admini. Bez bazy danych, sesja w podpisanym ciasteczku.
- **Testy API bez internetu:** udawany GitHub w `services/api/test/mock-github.ts`. Testy HEIC
  wymagają `heif-dec`, więc w pełni przechodzą w kontenerze (zadanie `api` w `ci.yml`).
- Akceptacja admina zamiast auto-merge: `REQUIRES_ADMIN_APPROVAL` w `zasady-wpisow.ts`.
- **Cały dostęp do danych strony przez `src/lib/`** (`getLatestPosts()`, `getAchievements()`).
  Dziś czytają Content Collections, a komponenty nie wiedzą, skąd są dane.

## Treść i migracja z Hugo

Źródła w `old-website/`:

- wpisy: `old-website/content/blog/*/index.md` (+ zdjęcia w tym samym folderze),
- reszta (hero, o nas, osiągnięcia, partnerzy, kontakt, social): `params` w `old-website/config.toml`.

Zasady:

- Migrujemy skryptem `new-website/scripts/migrate-hugo.mjs` (czyta stare pliki, zapisuje do
  `src/content/`), nie ręcznie. Skrypt nic nie zmienia w `old-website/`.
- Adresy wpisów zostają jak w Hugo: `/blog/<slug>/` (linkuje do nich uczelnia).
- RSS zostaje pod starymi adresami: `/index.xml` i `/blog/index.xml` (`@astrojs/rss`).
- Plik/odwołanie do obrazka, którego nie ma (np. `hackyeach2026.jpeg` ze starej strony),
  zgłoś w `TODO.md` zamiast zgadywać.
- Schematy (do zatwierdzenia, opis pól w `design/index.html`): `blog`, `achievements`,
  `projects`, `partners` (sponsor z polem `validUntil`, który znika sam po dacie).
- Brakujące dane (czekamy na zarząd): sponsor (nazwa, logo, link, umowa do 30.11.2026),
  logo PRz w SVG, kroki „Jak dołączyć”, opisy projektów, pole kategorii wpisu, strony prawne.

## Jakość, której pilnujemy

- Dostępność: semantyczny HTML, `alt` przy zdjęciach treściowych, kontrast ≥ 4.5:1,
  widoczny focus, cele dotyku ≥ 44 px, `prefers-reduced-motion`.
- Responsywność: od 360 px szerokości, bez przewijania w bok.
- Wydajność: Lighthouse ≥ 95; obrazy przez `<Image />`.
- Przed commitem: `npm run check` i `npm run build` muszą przejść.

## Dokumentacja

- `README.md` w katalogu głównym: co jest gdzie (old/new), jak uruchomić, jak dodać wpis.
- `new-website/README.md`: szczegóły Astro.
- `docs/adr/`: krótki plik na każdą ważną decyzję.

## Komendy (w `new-website/`)

```bash
npm install
npm run dev      # podgląd lokalny: http://localhost:4321
npm run check    # typy i schematy treści
npm run build    # build produkcyjny do dist/
```

API (w `services/api/`, szczegóły w `services/api/README.md`):

```bash
npm run check && npm test   # typy i Vitest (HEIC pominięte bez heif-dec)
npm run test:e2e            # kreator + API z udawanym GitHubem (Playwright)
npm run dev:mock            # API z udawanym GitHubem do klikania kreatora
podman compose up --build   # kontener jak na serwerze (docker compose też działa)
```

Stara strona (z katalogu głównego): `hugo server --source old-website`.

## Czego nie robić

- Nie pushować ani nie mergować do `main`; nie ruszać workflowów, CNAME, DNS bez pytania.
- Nie zmieniać ani nie usuwać niczego w `old-website/`.
- Nie dodawać kolorów spoza tokenów ani limonki poza wskazanymi miejscami.
- Nie zmieniać kształtu logo ani nie obracać go.
- Nie osadzać feedów z Facebooka, Instagrama ani LinkedIna.
- Nie używać długich myślników (pauza i półpauza, U+2014 i U+2013) nigdzie: w tekstach interfejsu,
  tytułach, dokumentacji (.md), komentarzach w kodzie i komunikatach commitów. W tekstach interfejsu
  i tytułach zamiast nich zwykły -. W dokumentacji, komentarzach i commitach przepisz zdanie
  (kropka, przecinek, dwukropek, nawias); zwykły - tylko w zakresach (2022-2023) i nazwach.
- Nie przepisywać działającego kodu „przy okazji”. Zmiany tylko w zakresie zadania.
