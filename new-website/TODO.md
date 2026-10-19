# TODO — brakujące dane i rzeczy do zrobienia

Placeholdery `[TAK JAK TU]` widoczne na stronie czekają na dane od zarządu koła.

## Partnerzy (`src/content/partners/`)

- Partner strategiczny: Miasto Rzeszów (`miasto-rzeszow.yaml`, `validUntil: 2026-11-30`).
  Hero, sekcja Partnerzy i stopka czytają z kolekcji przez `src/lib/partners.ts`.
- [ ] Strona jest statyczna, więc po `validUntil` partner znika dopiero przy **następnym buildzie**.
      Decyzja: przy tworzeniu nowego workflow `deploy.yml` (withastro/action) dodać
      zaplanowany build (`on: schedule`, cron, np. codziennie), żeby partner znikał sam.
- [ ] Czy Miasto Rzeszów zostaje partnerem po 30.11.2026 (wtedy przedłużyć albo usunąć `validUntil`)?
- [ ] Logo PRz (`src/assets/partners/prz-logo.png`) to PNG z dużym przezroczystym marginesem,
      dlatego `Partners.astro` i `SiteFooter.astro` mają dla niego osobny rozmiar. Logo w SVG
      bez marginesu od uczelni pozwoliłoby usunąć te wyjątki.
- `scripts/migrate-hugo.mjs --force` nadpisałby `miasto-rzeszow.yaml` (`tier: partner`,
  bez opisu i daty) — bez `--force` skrypt odmawia działania, bo treść jest już zmigrowana.

## Treść do potwierdzenia przez zarząd

- [ ] Kroki „Dołącz do KNML” (`src/sections/JoinCta.astro`) — wpisane z wzorca, niepotwierdzone.
- [ ] Projekty (`src/content/projects/*/index.md`) — opisy kart złożone z wpisów i osiągnięć;
      treść każdego pliku to placeholder `[Pełny opis projektu: cel, zespół, użyte technologie,
      linki do GitHuba i demo]`. Brakuje pełnych opisów, technologii, zespołów, linków.

## Ukryte linki — przywrócić, gdy powstaną podstrony

- [ ] „Wszystkie projekty” → `/projekty/` (`src/sections/Projects.astro`, w `section-head`
      obok nagłówka: `<MoreLink href="/projekty/">Wszystkie projekty</MoreLink>`).
      Karty projektów prowadzą dziś do wpisów na blogu (pole `post`); po dodaniu stron
      `/projekty/<id>/` usuń `post` z projektów, które mają mieć własną stronę.
- [ ] „Poznaj koło” → `/o-nas/` (`src/sections/About.astro`, pod akapitem:
      `<MoreLink href="/o-nas/">Poznaj koło</MoreLink>`).
- [ ] „Statut i regulaminy” i „Polityka prywatności” (`src/components/SiteFooter.astro`,
      kolumna „Zasoby”) — czekają na treść od zarządu.
- [ ] Nowe podstrony dopisz do `staticPages` w `src/pages/sitemap.xml.ts`.

## Blog i migracja z Hugo

- [ ] Kategoria wpisu (`category`) wyliczona przez `scripts/migrate-hugo.mjs`: tag „aktualności”
      → `aktualnosci`, reszta → `projekty` (LARKFiD, MNIST Demo, HackYeah Quantum Art).
      Do potwierdzenia przez zarząd.
- Migracja (19.10.2026): żaden wpis nie został pominięty, wszystkie okładki i obrazki istnieją.
- [ ] RSS (`/index.xml`, `/blog/index.xml`) ma tylko tytuł, datę i tagi. Opis pojawi się,
      gdy wpisy dostaną pole `excerpt`.
- Stare adresy stronicowania Hugo (`/blog/page/N/`, `/tags/page/N/`, `/tags/<tag>/page/N/`)
  przekierowują na strony bez stronicowania. Lista tagów: `/tags/`.
- Świadomie pominięte (decyzja 19.10.2026): kanały RSS per tag i per wpis, `/categories/`,
  stare adresy zdjęć `/blog/<slug>/zdjecie-N.jpg` (Astro serwuje je z `/_astro/`).
- Opis wpisu (`<meta name="description">`, podgląd linku): `excerpt`, a bez niego początek
  pierwszego akapitu (`postDescription()` w `src/lib/posts.ts`).
- Strona główna bierze wpisy, osiągnięcia, projekty i partnerów z kolekcji (`src/lib/`).
- [ ] `shortTitle` i `excerpt` mają tylko 3 najnowsze wpisy (przeniesione z dawnych danych
      tymczasowych).
- [ ] `scripts/migrate-hugo.mjs` to skrypt jednorazowy — usunąć po starcie nowej strony.
- [ ] Kolejność osiągnięć: od najnowszego roku, w roku od najwyższego miejsca. Wzorzec miał
      w 2026 kolejność SpaceShield, EDTH, PCI — teraz jest EDTH, SpaceShield, PCI. Jeśli kolejność
      ma być ręczna, trzeba dodać pole (np. `order`) do schematu `achievements`.

## Ogólne

- Favicony i obrazek podglądu linku (`public/og-default.png`) generuje
  `node scripts/generate-icons.mjs` z `knml-logo.svg` i `tokens.css` — uruchom po zmianie logo
  albo kolorów. Skrypt korzysta z `sharp` i `fontkitten`, które instaluje Astro; jeśli po
  aktualizacji Astro ich zabraknie, trzeba je dodać do devDependencies.
- [ ] Ikony social mediów w stopce (dziś tekst). Wzorzec sugeruje Simple Icons — do decyzji,
      czy warto dodawać zależność.
- [ ] Statystyka „7 nagród i wyróżnień” (`src/data/site.ts` → `stats`) jest wpisana ręcznie,
      choć wynika z kolekcji `achievements` — do decyzji, czy liczyć ją automatycznie.
- [ ] Cele dotyku < 44 px (tak samo we wzorcu): linki w stopce (~19 px), social w stopce (40 px),
      „Strona partnera ↗”, linki w menu-pigułce (39 px). CLAUDE.md wymaga ≥ 44 px — do decyzji
      z zespołem, bo poprawka zmieni wygląd względem wzorca.
