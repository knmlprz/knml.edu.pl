# Pierwsza sesja Claude Code — prompt do wklejenia

Uruchom `claude` w katalogu głównym repo i wklej po kolei. Po każdym etapie sprawdź
`npm run dev`, zrób commit i dopiero wtedy wklej następny.

## Etap 1 — szkielet i tokeny

```text
Przeczytaj CLAUDE.md i new-website/design/index.html. Nie pisz jeszcze sekcji.
1. Skonfiguruj new-website/astro.config.mjs (site: https://knml.edu.pl, output static).
2. Utwórz src/styles/tokens.css i global.css na podstawie :root z design/index.html.
3. Dodaj fonty Unbounded i Geist przez @fontsource.
4. Utwórz BaseLayout, SiteHeader (z menu mobilnym), SiteFooter, KnmlLogo.
5. Przenieś logo i zdjęcia z design/assets do src/assets.
Na końcu uruchom npm run check i npm run build, pokaż listę plików i wyjaśnij,
jak mam to obejrzeć i zacommitować.
```

## Etap 2 — strona główna

```text
Odwzoruj stronę główną z design/index.html 1:1 jako sekcje w src/sections/,
na razie z danymi w src/data/site.ts (bez Content Collections). Placeholdery zostaw
jako [TAK JAK TU] i wpisz do TODO.md. Sprawdź widok 360 px i 1440 px.
```

## Etap 3 — treść z Hugo

```text
Dodaj content.config.ts ze schematami z design/index.html, napisz
scripts/migrate-hugo.mjs migrujący old-website/content/blog oraz params z
old-website/config.toml. Pokaż mi schematy, zanim uruchomisz migrację.
Potem strony /blog/ i /blog/<slug>/ oraz RSS /index.xml i /blog/index.xml.
```

## Etap 4 — dokumentacja

```text
Napisz README.md (katalog główny) i new-website/README.md dla osoby z 1. roku:
co jest gdzie, jak uruchomić, jak dodać wpis. Dodaj docs/adr/0001-astro.md.
```
