# ADR 0004: API publikacji wpisów

- **Status:** przyjęta
- **Data:** 2026-11-08
- **Szczegóły:** [services/api/README.md](../../services/api/README.md), faza 4 w [planie](../plan-kreator.md)

## Kontekst

- Kreator `/redakcja/` (ADR 0003) ma publikować wpis jednym kliknięciem, a strona ma zostać
  statyczna na GitHub Pages.
- Wpisy mają trafiać do repo tak jak dziś, przez Pull Request i CI.
- Stronę i serwer utrzymują studenci, którzy zmieniają się co rok: mniej części, mniej awarii.

## Decyzja

1. **Osobna usługa `services/api`** (Node 22, Hono) w kontenerze, poza stroną. Importuje
   `zasady-wpisow.ts` i `src/redakcja/wpis.ts` z `new-website`, zamiast kopiować logikę.
2. **Jedna GitHub App** do publikacji (gałąź, commit, PR, auto-merge) i do logowania redakcji
   (OAuth tej samej aplikacji). Nie token czyjegoś konta.
3. **Dostęp = zespół `redakcja-strony`** w organizacji, sprawdzany przy każdym żądaniu,
   więc usunięcie z zespołu działa od razu. Maintainerzy zespołu są adminami.
4. **Bez bazy danych.** Sesja w podpisanym ciasteczku (HttpOnly, Secure, SameSite=Lax, 12 h),
   właściciel wpisu wynika z nazwy gałęzi `wpis/<login>/<adres>`.
5. **HEIC przez `heif-dec` z libheif w obrazie Debian trixie.** Sharp z npm nie dekoduje HEVC,
   a libheif 1.15 z bookworma obraca zdjęcia z iPhone'a dwa razy.
6. **Testy bez internetu:** udawany GitHub (`test/mock-github.ts`) w Vitest i w Playwright.

## Konsekwencje

- Potrzebny serwer koła, subdomena z HTTPS i ustawienia GitHuba (faza 5, lista w README usługi).
- Bez działającego API kreator dalej pobiera wpis jako `.zip`.
- Zmiana `src/config/` albo `src/redakcja/` w `new-website` zmienia też API: jego testy są w CI.
