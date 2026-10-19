# TODO — brakujące dane i rzeczy do zrobienia

Placeholdery `[TAK JAK TU]` widoczne na stronie czekają na dane od zarządu koła.

## Sponsor (umowa do 30.11.2026) — `src/data/site.ts` → `sponsor`

- [ ] `[Nazwa sponsora]` — w hero (karta pod logo) i w sekcji Partnerzy.
- [ ] `[1–2 zdania o tym, jak wspiera koło]` — sekcja Partnerzy.
- [ ] Link „Strona partnera ↗” — dziś `#`.
- [ ] `[LOGO SPONSORA]` — hero i Partnerzy; `[SPONSOR]` — stopka.

## Politechnika Rzeszowska

- [ ] `[LOGO POLITECHNIKI RZESZOWSKIEJ]` (Partnerzy) i `[LOGO PRz]` (stopka) — logo w SVG od uczelni.

## Treść do potwierdzenia przez zarząd

- [ ] Kroki „Dołącz do KNML” (`src/sections/JoinCta.astro`) — wpisane z wzorca, niepotwierdzone.
- [ ] Projekty (`src/data/site.ts` → `featuredProjects`) — opisy złożone z wpisów i osiągnięć;
      brakuje pełnych opisów, technologii, zespołów, linków (GitHub/demo).

## Strony, do których już linkujemy, a których jeszcze nie ma (404)

- [ ] `/projekty`, `/projekty/wykrywanie-dronow`, `/projekty/transport-stalowa-wola`.
- [ ] `/o-nas` (link „Poznaj koło”).
- [ ] `[Statut i regulaminy]`, `[Polityka prywatności]` (stopka) — dziś `#`.

## Blog i migracja z Hugo

- [ ] Kategoria wpisu (`category`) wyliczona przez `scripts/migrate-hugo.mjs`: tag „aktualności”
      → `aktualnosci`, reszta → `projekty` (LARKFiD, MNIST Demo, HackYeah Quantum Art).
      Do potwierdzenia przez zarząd.
- Migracja (19.10.2026): żaden wpis nie został pominięty, wszystkie okładki i obrazki istnieją.
- [ ] RSS (`/index.xml`, `/blog/index.xml`) ma tylko tytuł, datę i tagi. Opis pojawi się,
      gdy wpisy dostaną pole `excerpt`.
- [ ] Hugo miało też: stronicowanie `/blog/page/2/`, listę `/tags/`, kanały `/tags/<tag>/index.xml`.
      Nowa strona tego nie odtwarza (wszystkie wpisy są na jednej stronie) — do decyzji, czy potrzebne.
- [ ] Strona główna nadal bierze wpisy, osiągnięcia i partnerów z `src/data/site.ts`.
      Następny krok: przełączyć sekcje na kolekcje (`src/lib/`) i usunąć dane tymczasowe.
- [ ] Kolekcja `projects` jest pusta (Hugo nie miało projektów) — Astro wypisuje ostrzeżenie
      przy buildzie, dopóki nie dodamy pierwszego projektu.

## Ogólne

- [ ] Favicon: w `public/` jest jeszcze domyślna ikona Astro. Stara strona używała `fav.png`
      (`old-website/themes/hugo-profile/static/fav.png`), ale to inna, starsza wersja znaku
      niż `src/assets/knml-logo.svg` — do decyzji, z czego zrobić nową ikonę.
- [ ] Ikony social mediów w stopce (dziś tekst). Wzorzec sugeruje Simple Icons — do decyzji,
      czy warto dodawać zależność.
- [ ] Liczba wpisów „Wszystkie wpisy (20)” jest wpisana ręcznie (`postCount`) — w etapie 3
      liczyć z kolekcji `blog`.
- [ ] Cele dotyku < 44 px (tak samo we wzorcu): linki w stopce (~19 px), social w stopce (40 px),
      „Strona partnera ↗”, linki w menu-pigułce (39 px). CLAUDE.md wymaga ≥ 44 px — do decyzji
      z zespołem, bo poprawka zmieni wygląd względem wzorca.
