# ADR 0001: Nowa strona w Astro, na razie statyczna

- **Status:** przyjęta
- **Data:** 2026-10-19

*ADR (Architecture Decision Record) to krótka notatka: jaka decyzja, dlaczego i co z niej wynika.
Kolejne decyzje dopisujemy jako `0002-…md`, `0003-…md`. Starych nie zmieniamy — jeśli decyzja
się zmieni, nowy ADR ją zastępuje.*

## Kontekst

- Stara strona jest w **Hugo** z gotowym motywem (`old-website/`). Wygląd i treść (osiągnięcia,
  partnerzy) siedzą w jednym dużym `config.toml` i w szablonach motywu, które trudno zmienić
  bez znajomości języka szablonów Hugo.
- Stronę utrzymują studenci, którzy zmieniają się co rok. Kod musi być zrozumiały dla osoby
  z 1. roku, a najbardziej znane studentom narzędzia to HTML, CSS i JavaScript.
- Mamy nowy projekt wyglądu (`new-website/design/index.html`), którego motyw Hugo nie odtwarza.
- W planach: wygodne dodawanie wpisów przez osoby nietechniczne, formularz kontaktowy,
  automatyczne posty w social mediach.

## Decyzja

1. **Astro zamiast Hugo.** Komponenty Astro to zwykły HTML i CSS z odrobiną JavaScriptu.
   Treść leży w plikach Markdown/YAML ze **schematami**, więc błąd we wpisie (literówka
   w kategorii, brak okładki) wychodzi przy `npm run build`, a nie dopiero na stronie.
   Astro domyślnie nie wysyła do przeglądarki JavaScriptu, więc strona jest szybka.
2. **Na razie strona statyczna** (`output: 'static'`): gotowe pliki HTML na GitHub Pages,
   jak dotąd. Bez serwera, bez kosztów, bez niczego do aktualizowania i zabezpieczania.
   Adresy wpisów i kanały RSS zostają takie jak w Hugo.
3. **TinaCMS i backend później.** Panel do dodawania wpisów (TinaCMS), formularz kontaktowy
   i automatyczne posty dodamy, gdy koło będzie miało własny serwer (adapter `@astrojs/node`
   i trasy w `src/pages/api/`). Żeby wtedy nie przepisywać strony, już teraz cały dostęp
   do danych idzie przez `src/lib/`, a schematy treści projektujemy tak, żeby przyjęła je TinaCMS
(do sprawdzenia przy wdrożeniu).

## Konsekwencje

- **Plusy:** prostszy kod, kontrola nad wyglądem, walidacja treści przy buildzie, szybka strona,
  hosting jak dotąd (GitHub Pages, ta sama domena).
- **Minusy:** strona statyczna zmienia się tylko po nowym buildzie — np. partner z minioną
  datą `validUntil` znika dopiero przy następnej publikacji. Rozwiązanie: zaplanowany build
  (cron) w nowym workflow publikacji. Wpis dodaje się dziś przez gita i Pull Request,
  co dla osób nietechnicznych jest progiem — do czasu wdrożenia TinaCMS.
- **Do zrobienia przy starcie:** zastąpić `.github/workflows/hugo.yml` workflow z
  `withastro/action` (`path: ./new-website`), potem usunąć `old-website/` i `scripts/migrate-hugo.mjs`.
