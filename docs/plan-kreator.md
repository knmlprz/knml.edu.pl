# Plan: kreator wpisów na stronie KNML

Stan na 31.10.2026. Zastępuje wcześniejszy plan z TinaCMS i postami na social media.
Do repo jako `docs/plan-kreator.md`, decyzję opisać w `docs/adr/0003-kreator-zamiast-tiny.md`.

## Cel

Kilka osób z koła dodaje wpisy na stronę przez prosty kreator w stylu Facebooka:
tytuł, tekst, zdjęcia, podgląd, „Opublikuj”. Bez gita i terminala. Wpis wygląda jak obecne
wpisy i nie rozjeżdża strony. Lista osób z dostępem jest przejrzysta i łatwa do zmiany.

Poza zakresem (na przyszłość): publikacja na Facebooku, Instagramie i LinkedInie.

## Decyzja: własny kreator zamiast TinaCMS

- Kreator ma tylko pola potrzebne do wpisu, więc nowa osoba nie ma się w czym zgubić.
- Podgląd używa tego samego szablonu co strona, więc to, co widzisz, to to, co się opublikuje.
- Na serwerze koła działa jedna mała usługa bez bazy danych.
- Wpis nadal trafia do repo jako `src/content/blog/<adres>/index.md` ze zdjęciami. Treść,
  historia i kopie zapasowe zostają w gicie, jak dziś.

## Jak to działa

```text
autor ──► knml.edu.pl/redakcja/          (strona statyczna: kreator, podgląd)
            │ logowanie przez GitHub
            ▼
          api.knml.edu.pl                (serwer koła, mała usługa Node)
            ├─ sprawdza: czy autor jest w zespole GitHub „redakcja-strony”
            ├─ sprawdza wpis tymi samymi zasadami co build
            ├─ zmniejsza i obraca zdjęcia
            └─ przez GitHub App: gałąź + PR z wpisem, auto-merge po zielonym CI
                          ▼
          GitHub Actions: CI → merge → deploy → wpis na stronie po 2-3 minutach
```

- **GitHub App, nie token czyjegoś konta.** Gdy ktoś odejdzie z koła, publikacja dalej działa.
- **Auto-merge:** wpis z kreatora wchodzi sam, ale tylko gdy CI jest zielone. Zły wpis nie
  trafi na stronę.

## Dostęp

- Zespół **`redakcja-strony`** w organizacji `knmlprz` na GitHubie. Kto jest w zespole, ten może
  dodawać wpisy. Admin dodaje i usuwa osoby w ustawieniach zespołu, bez zmian w kodzie.
- Lista osób i historia zmian są widoczne na GitHubie.
- Uprawnienia: każdy z redakcji dodaje wpisy i edytuje swoje. Maintainerzy zespołu
  (admini) edytują i usuwają wszystkie.
- Autor wpisu wpisuje się sam z konta (imię i nazwisko z profilu), można go zmienić,
  np. „J. Kowalski, A. Nowak”.
- Warunek: każda osoba z dostępem ma konto GitHub.

## Kreator (UX)

- Pola: tytuł, kategoria (Aktualności / Projekty), tekst, zdjęcia, tagi, opcjonalnie krótki
  opis na kartę i link do GitHuba projektu.
- Tekst: proste formatowanie przyciskami (pogrubienie, nagłówek, lista, link). Pod spodem
  Markdown, ale autor go nie widzi.
- Zdjęcia: przeciągnij i upuść albo wybierz z telefonu, zmiana kolejności, pierwsze = okładka,
  przy każdym pole „Opisz zdjęcie” (wymagane, dla osób niewidomych i Google).
- Tagi: wybór z listy, nowy tag tylko z potwierdzeniem (koniec z literówkami w tagach).
- Podgląd na żywo: telefon i komputer, tym samym szablonem co strona.
- Szkic zapisuje się sam w przeglądarce, więc zamknięcie karty nie kasuje pracy.
- Po „Opublikuj”: „Publikuję…”, potem „Gotowe” z linkiem. Błędy po polsku, z informacją,
  co poprawić.
- „Moje wpisy”: lista z możliwością edycji (admini: wszystkie wpisy).
- Działa na telefonie.

## Zasady wpisów

Jeden plik: `new-website/src/config/zasady-wpisow.ts`. Korzystają z niego kreator
(podpowiedzi na żywo), serwer (odrzuca złe wpisy) i build (Zod). Zmiana zasady = zmiana tego pliku.

Obowiązkowe od razu:
- tytuł, kategoria, tekst, co najmniej jedno zdjęcie (okładka), opis każdego zdjęcia,
- data i autor uzupełniane automatycznie,
- zdjęcia: JPG, PNG, WebP, HEIC; serwer zmniejsza do maks. 2000 px i usuwa dane GPS.

Do ustalenia na spotkaniu koła (wartości w pliku, na start rozsądne domyślne):
- maks. długość tytułu i krótkiego opisu,
- min. i maks. długość tekstu,
- maks. liczba zdjęć we wpisie i rozmiar pliku,
- lista dozwolonych tagów,
- czy wpis wymaga akceptacji admina przed publikacją (domyślnie: nie, wystarczy zielone CI).

## Odporność na zmiany designu

Dział designu może zmienić kolorystykę, układ, a nawet wygląd wpisów. Kreator i wpisy mają to
przetrwać bez przepisywania:

- **Wpis to czysta treść.** Plik `index.md` zawiera tylko tekst, nagłówki, listy, linki i zdjęcia
  z opisami. Autor nie wybiera kolorów, czcionek, rozmiarów ani układu. Dzięki temu nowy design
  obejmuje automatycznie wszystkie stare i nowe wpisy, bez migracji treści.
- **Jeden szablon wpisu.** Strona wpisu i podgląd w kreatorze używają tego samego komponentu
  (`PostLayout`). Zmiana designu wpisu = zmiana w jednym miejscu, podgląd zmienia się sam.
- **Kreator korzysta z tokenów i wspólnych komponentów strony.** Nowa kolorystyka w `tokens.css`
  zmienia też kreator.
- **Zdjęcia zapisujemy w dobrej jakości (do 2000 px), bez kadrowania na stałe.** Rozmiary
  i kadry do konkretnego układu generuje Astro przy buildzie, więc nowy układ nie wymaga
  ponownego wgrywania zdjęć.
- **Testy sprawdzają zasady, nie piksele.** Główne testy wyglądu pilnują rzeczy niezależnych od
  designu: nic nie wystaje w bok, zdjęcia mieszczą się w kolumnie, tekst ma czytelny rozmiar,
  cele dotyku mają min. 44 px. Zrzuty porównawcze są pomocnicze: po zamierzonej zmianie designu
  aktualizuje się je w tym samym PR (`npx playwright test --update-snapshots`).
- **Logika osobno od wyglądu.** Zasady wpisów, tworzenie pliku, zdjęcia i dostęp nie wiedzą nic
  o designie, więc redesign ich nie dotyka.

## Testy

Pisane przed kodem każdej części. CI uruchamia wszystkie przy każdym PR.

| Rodzaj | Narzędzie | Co sprawdza |
|---|---|---|
| Zasady | Vitest | każda zasada z `zasady-wpisow.ts`: poprawny wpis przechodzi, każdy błąd ma czytelny polski komunikat |
| Tworzenie wpisu | Vitest | z danych formularza powstaje poprawny `index.md` (frontmatter, data, autor, kategoria), adres bez polskich znaków („Zwycięstwo w Łodzi” → `zwyciestwo-w-lodzi`), ten sam tytuł nie nadpisuje istniejącego wpisu |
| Zdjęcia | Vitest + sharp | zmniejszanie, obrót wg EXIF, usunięcie GPS, HEIC z iPhone'a, odrzucenie za dużych i nie-obrazów |
| Dostęp | Vitest | spoza zespołu → odmowa; edycja cudzego wpisu bez roli admina → odmowa; admin może |
| Integracja z GitHubem | Vitest + mock HTTP | API tworzy gałąź i PR z właściwymi plikami, obsługa błędów GitHuba |
| Wygląd wpisów | Playwright | przykładowe wpisy (długi tytuł, 10 zdjęć pionowych i poziomych, panorama, bez zdjęć w treści, lista, link, cytat) na 360 px i 1440 px: nic nie wystaje, zdjęcia mieszczą się w kolumnie, czytelny tekst; zrzuty porównawcze jako pomoc, aktualizowane przy zmianach designu |
| Kreator E2E | Playwright | logowanie (testowe), wypełnienie, zdjęcie z dysku, podgląd, opublikowanie, sprawdzenie plików wysłanych do (testowego) API |

Przykładowe wpisy testowe leżą w `test/fixtures/` i nie trafiają na stronę.

## Fazy

| Faza | Co | Potrzebny serwer? |
|---|---|---|
| 1 | Infrastruktura testów (Vitest, Playwright w CI) + testy wyglądu wpisów na fixtures; poprawki szablonu wpisu, jeśli testy coś pokażą | nie |
| 2 | Plik zasad + testy zasad; build używa tych zasad | nie |
| 3 | Kreator: interfejs, podgląd, szkic w przeglądarce; na razie bez wysyłki (przycisk „Pobierz wpis” jako plik do testów) | nie |
| 4 | API: tworzenie wpisu, zdjęcia, dostęp; testy z mockiem GitHuba; uruchamiane lokalnie w Dockerze | nie (lokalnie) |
| 5 | Serwer koła: Docker, `api.knml.edu.pl`, HTTPS, GitHub App, zespół `redakcja-strony`, auto-merge w repo | **tak** |
| 6 | Edycja i usuwanie wpisów, „Moje wpisy” | tak |
| 7 | Instrukcja dla redakcji („jak dodać wpis”, 1 strona ze zrzutami) i dla adminów („jak dodać osobę do redakcji”, „co gdy API nie działa”) | nie |

Fazy 1-4 da się zrobić bez serwera. Faza 5 czeka na dane od zarządu.

## Do rozstrzygnięcia

| # | Pytanie | Kto |
|---|---|---|
| S1 | Serwer koła: system, Docker, publiczny adres, kto ma dostęp, kopie zapasowe | zarząd |
| S2 | Subdomena `api.knml.edu.pl` w DNS | kto zarządza domeną |
| S3 | Kto jest adminem redakcji i kto na start w zespole `redakcja-strony` | zarząd |
| S4 | Zasady wpisów (lista wyżej) | spotkanie koła |
| S5 | Uprawnienia admina repo do: GitHub App, auto-merge, reguł gałęzi `main` | admin organizacji |
