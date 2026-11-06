# ADR 0003: Własny kreator wpisów zamiast TinaCMS

- **Status:** przyjęta
- **Data:** 2026-11-06
- **Szczegóły:** [docs/plan-kreator.md](../plan-kreator.md)

## Kontekst

- Kilka osób z koła ma dodawać wpisy na stronę bez gita i terminala. Skład tej grupy zmienia się co rok.
- Wcześniejszy plan zakładał TinaCMS. To duże narzędzie z wieloma polami i własnym
  sposobem pracy, w którym nowa osoba łatwo się gubi.
- Wpisy mają wyglądać jak obecne i nie rozjeżdżać strony, także po zmianie designu.
- Wpisy leżą w repo (`src/content/blog/<adres>/index.md` ze zdjęciami) i tam mają zostać:
  historia i kopie zapasowe są w gicie.

## Decyzja

1. **Własny kreator na stronie `/redakcja/`** z polami tylko na to, czego potrzebuje wpis:
   tytuł, kategoria, treść, zdjęcia z opisami, tagi z listy, opcjonalnie krótki opis i link do GitHuba.
2. **Treść tylko z czterema formatowaniami** (pogrubienie, nagłówek, lista, link), zapisywana jako
   Markdown. Edytor Tiptap, wczytywany tylko na `/redakcja/`.
3. **Jeden plik zasad** `src/config/zasady-wpisow.ts` dla kreatora, buildu i przyszłego serwera.
4. **Podgląd z tymi samymi stylami co strona wpisu** (`src/styles/post.css`).
5. **Publikacja przez małą usługę na serwerze koła** (GitHub App, PR z wpisem, auto-merge po
   zielonym CI). Dostęp ma zespół `redakcja-strony` na GitHubie. Do czasu serwera kreator
   pobiera wpis jako paczkę `.zip` (faza 3 planu).

## Konsekwencje

- Kreator to nasz kod i trzeba go utrzymywać. Pomagają w tym testy (Vitest, Playwright) i
  oddzielenie logiki (`src/redakcja/`) od wyglądu.
- Autor nie wybiera kolorów ani układu, więc nowy design obejmuje od razu wszystkie wpisy.
- Strona `/redakcja/` ma kilkaset KB JS; reszta strony zostaje bez kodu edytora (pilnuje test).
- Publikacja jednym kliknięciem wymaga serwera koła (fazy 4-5 planu). Do tego czasu ktoś
  z dostępem do repo wrzuca pobraną paczkę przez Pull Request.
