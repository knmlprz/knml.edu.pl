# ADR 0002: Angielska wersja strony głównej

- **Status:** przyjęta
- **Data:** 2026-10-30

## Kontekst

- Stronę czytają też partnerzy, jury konkursów i studenci z zagranicy, którzy nie znają polskiego.
- Wpisy na blogu piszą studenci po polsku; tłumaczenie każdego wpisu to praca, której nikt
  nie będzie stale wykonywał.
- Strona ma zostać statyczna i bez nowych zależności.

## Decyzja

1. **Wbudowane i18n Astro**, polski bez prefiksu (adresy się nie zmieniają), angielski pod `/en/`.
2. **Po angielsku tylko strona główna.** Blog zostaje po polsku, bez wersji `/en/`; na `/en/`
   karty wpisów mają etykietę „In Polish”, a „Blog” w menu EN ma dopisek „(PL)”.
3. **Własne słowniki** `src/i18n/pl.ts` i `en.ts` zamiast biblioteki. Typ wymusza, żeby `en.ts`
   miał wszystkie klucze z `pl.ts` (brak klucza = błąd `npm run check`).
4. **Tłumaczenia danych w tych samych plikach** (obiekt `en` w YAML/Markdown), żeby dodając
   partnera czy osiągnięcie, od razu było widać, co trzeba przetłumaczyć.
5. Przełącznik „PL / EN” bez zapamiętywania wyboru i bez cookies.

## Konsekwencje

- Każdy nowy tekst interfejsu trzeba dopisać w dwóch plikach (zasada w CLAUDE.md).
- Nowa strona w wersji EN wymaga zmian w przełączniku języka i w `hreflang` (`BaseLayout.astro`).
- Angielskiej strony 404 nie da się podać na GitHub Pages (obsługuje tylko `/404.html`).
