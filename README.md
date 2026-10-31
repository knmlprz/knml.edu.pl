# knml.edu.pl — strona Koła Naukowego Machine Learning PRz

To repozytorium (w skrócie „repo”, czyli folder z kodem i całą historią zmian) zawiera stronę
[knml.edu.pl](https://knml.edu.pl). Ten plik jest dla osoby, która przejmuje stronę i nie zna
jeszcze Astro ani gita. Przeczytaj go raz od początku do końca.

## Co jest gdzie

```text
knml.edu.pl/
├── new-website/     nowa strona (Astro) — tu pracujesz
├── old-website/     stara strona (Hugo) — tylko do odczytu, nic tu nie zmieniaj
├── docs/adr/        krótkie notatki „dlaczego tak zdecydowaliśmy”
├── .github/         automatyczna publikacja strony (nie ruszaj bez zgody zarządu)
├── CNAME            domena knml.edu.pl (nie ruszaj)
└── CLAUDE.md        zasady pisania kodu i wyglądu strony — obowiązują też ludzi
```

- **[new-website/README.md](new-website/README.md)** — jak zbudowany jest kod strony.
- **[new-website/TODO.md](new-website/TODO.md)** — czego jeszcze brakuje (dane od zarządu, decyzje).
- **[CLAUDE.md](CLAUDE.md)** — kolory, zasady kodu, czego nie robić.

## Uruchomienie strony na swoim komputerze

1. Zainstaluj **Node.js 22.22 lub nowszy** (program, który uruchamia narzędzia strony).
   Fedora: `sudo dnf install nodejs`. Windows i macOS: wersja „LTS” z [nodejs.org](https://nodejs.org).
   Sprawdź wersję: `node --version`.
2. Pobierz repo (raz): `git clone git@github.com:knmlprz/knml.edu.pl.git`
3. W terminalu, w folderze repo:

```bash
cd new-website
npm install      # pobiera biblioteki strony (raz, i po każdej zmianie package.json)
npm run dev      # podgląd na żywo: otwórz http://localhost:4321
```

Podgląd odświeża się sam po każdym zapisie pliku. Zatrzymujesz go klawiszami `Ctrl+C`.

Przed każdym wysłaniem zmian uruchom też:

```bash
npm run check    # sprawdza, czy wpisy i kod są poprawne
npm run build    # buduje gotową stronę do folderu dist/ — tak samo jak serwer
```

Obie komendy muszą skończyć się bez błędów.

## Jak strona trafia do internetu

Stronę publikuje **GitHub Actions** — automat na GitHubie. Instrukcje dla niego to
*workflowy*, pliki w `.github/workflows/`:

- **`deploy.yml`** buduje stronę z `new-website/` i publikuje ją pod knml.edu.pl
  (hosting: GitHub Pages). Uruchamia się po każdej zmianie na `main`, codziennie
  o 03:00 UTC (dzięki temu partner po dacie `validUntil` znika sam) i ręcznie:
  zakładka **Actions** → **Deploy** → **Run workflow**. Nikt nie wgrywa plików ręcznie.
- **`ci.yml`** przy każdym Pull Requeście uruchamia `npm run check` i `npm run build`.
  Czerwony krzyżyk przy PR = strona się nie buduje; kliknij **Details**, żeby zobaczyć
  błąd. Takiego PR nie mergujemy.

Codzienne uruchamianie GitHub wyłącza sam, jeśli przez 60 dni nic się w repo nie zmieni.
Wtedy włącz je z powrotem: **Actions** → **Deploy** → **Enable workflow**.

> Do merge'a gałęzi `przebudowastrony` do `main` na `main` działa jeszcze stary workflow
> Hugo i pod knml.edu.pl jest stara strona.

## Zasada pracy: nigdy bezpośrednio na `main`

**Gałąź** to osobna wersja kodu, na której możesz pracować, nie psując strony innym.
`main` = to, co jest w internecie. Dlatego każda zmiana idzie tak:

1. **Nowa gałąź** od aktualnej wersji.
2. **Zmiany** w plikach, sprawdzone `npm run check` i `npm run build`.
3. **Commit** (zapisanie paczki zmian z opisem) i **push** (wysłanie jej na GitHuba).
4. **Pull Request** (w skrócie PR) — prośba na GitHubie: „przejrzyjcie i dołączcie moje zmiany”.
5. Ktoś z zespołu sprawdza i robi **merge** (dołączenie zmian). Dopiero wtedy strona się aktualizuje.

> **Do startu nowej strony** gałęzią bazową jest `przebudowastrony` (nie `main`): od niej
> tworzysz swoją gałąź i do niej kierujesz Pull Request. Po starcie bazą będzie `main`.

Komendy krok po kroku są w przykładzie poniżej (dodanie wpisu). Opisy commitów piszemy
po polsku, w trybie rozkazującym: „Dodaj wpis o hackathonie X”.

## Jak dodać wpis na blog

### 1. Nowa gałąź

```bash
git switch przebudowastrony   # przejdź na gałąź bazową (po starcie: main)
git pull                      # pobierz najnowsze zmiany z GitHuba
git switch -c wpis-hackyeah-2026   # utwórz własną gałąź i przejdź na nią
```

### 2. Folder wpisu

Każdy wpis to osobny folder w `new-website/src/content/blog/`. **Nazwa folderu = adres wpisu**.
Zasady nazwy:

- małe litery, **bez polskich znaków**, zamiast spacji myślniki,
- krótko i opisowo, np. `zwyciestwo-na-hackyeah-2026` → adres `knml.edu.pl/blog/zwyciestwo-na-hackyeah-2026/`,
- **nie zmieniaj nazwy po publikacji** — linkują do nas uczelnia i media, stary adres przestałby działać.

```text
new-website/src/content/blog/zwyciestwo-na-hackyeah-2026/
├── index.md         treść wpisu
├── okladka.jpg      zdjęcie główne (okładka)
└── zdjecie-2.jpg    pozostałe zdjęcia (dowolne nazwy, bez spacji i polskich znaków)
```

### 3. Plik `index.md`

Skopiuj szablon. Część między liniami `---` to **metadane** (opis wpisu dla strony),
pod nimi piszesz treść w **Markdownie** (prosty zapis tekstu: `**pogrubienie**`, `## Nagłówek`,
`[tekst linku](https://adres)`).

```markdown
---
# WYMAGANE
title: Zwycięstwo studentów KNML na HackYeah 2026
date: 2026-10-19
author: Jan Kowalski
category: aktualnosci
cover: ./okladka.jpg

# OPCJONALNE (możesz usunąć całą linijkę)
shortTitle: Wygrana na HackYeah 2026
excerpt: Nasz zespół zajął I miejsce w kategorii AI na największym hackathonie w Polsce.
tags:
  - aktualności
  - hackathon
githubLink: https://github.com/knmlprz/nazwa-repo
draft: false
---

Pierwszy akapit — krótko: co, kiedy, kto. Jeśli nie ma `excerpt`, to ten akapit
pokaże Google i podgląd linku na Facebooku czy Discordzie.

![Zespół KNML z czekiem za I miejsce na scenie HackYeah](./zdjecie-2.jpg)
*Zespół po ogłoszeniu wyników.*

## Co zbudowaliśmy

Dalsza treść…
```

| Pole | Co znaczy |
|---|---|
| `title` | Pełny tytuł wpisu. |
| `date` | Data publikacji w formacie **`RRRR-MM-DD`**, np. `2026-10-19` (opcjonalnie z godziną: `2026-10-19T12:00:00+02:00`). Inny format zatrzyma build. Wpisy na stronie są ułożone od najnowszego. |
| `author` | Imię i nazwisko albo np. `Zarząd KNML`. |
| `category` | Dokładnie jedno z dwóch: `aktualnosci` (wydarzenia, sukcesy) albo `projekty` (opis projektu). Bez polskich znaków. |
| `cover` | Okładka: `./` + nazwa pliku z tego samego folderu. Pokazuje się na liście wpisów i w podglądzie linku. |
| `shortTitle` | Krótszy tytuł na kafelek na stronie głównej, gdy `title` jest długi. |
| `excerpt` | 1–2 zdania zajawki (do ok. 155 znaków). Trafia do Google, podglądu linku i na duży kafelek najnowszego wpisu. |
| `tags` | Słowa kluczowe. Używaj istniejących (lista: `knml.edu.pl/tags/`), żeby wpisy się grupowały. |
| `githubLink` | Link do kodu — pod wpisem pojawi się „Kod na GitHubie ↗”. |
| `draft` | `true` = szkic: wpis **w ogóle się nie pojawi** (ani na stronie, ani w podglądzie). `false` albo brak linijki = opublikowany. |

### 4. Zdjęcia

- Wrzuć pliki `.jpg`/`.png` do folderu wpisu. Nie musisz ich zmniejszać — strona sama robi lżejsze wersje.
- W treści: `![opis zdjęcia](./nazwa-pliku.jpg)`. **Opis w nawiasie kwadratowym (tzw. alt) jest
  obowiązkowy**: czyta go osobom niewidomym czytnik ekranu. Napisz, co widać, np. „Trzy osoby
  przy laptopie na sali hackathonu”, a nie „zdjęcie”.
- Podpis pod zdjęciem (opcjonalny): osobna linijka *kursywą* zaraz pod obrazkiem, jak w szablonie.

### 5. Podgląd i sprawdzenie

```bash
cd new-website
npm run dev      # otwórz http://localhost:4321/blog/<nazwa-folderu>/
npm run check
npm run build
```

Obejrzyj wpis w podglądzie: czy zdjęcia się wyświetlają i jak wygląda na wąskim ekranie
(w przeglądarce `F12` → ikona telefonu).

### 6. Wysłanie i Pull Request

```bash
git add new-website/src/content/blog/zwyciestwo-na-hackyeah-2026   # wybierz pliki do zapisania
git commit -m "Dodaj wpis o zwycięstwie na HackYeah 2026"          # zapisz je z opisem
git push -u origin wpis-hackyeah-2026                               # wyślij gałąź na GitHuba
```

Po `push` terminal pokaże link do utworzenia Pull Requesta. Otwórz go, jako bazę (*base*)
wybierz `przebudowastrony` (po starcie: `main`), dopisz krótki opis i kliknij **Create pull request**.

### Najczęstsze błędy

| Co widzisz | Co to znaczy | Co zrobić |
|---|---|---|
| `[ImageNotFound] Could not find requested image ./okladka.jpg` | Nie ma pliku o takiej nazwie w folderze wpisu. | Sprawdź nazwę i rozszerzenie (`.jpg` ≠ `.jpeg` ≠ `.JPG`) i czy plik jest w tym samym folderze. |
| `data does not match collection schema` + `category: Invalid option: expected one of "aktualnosci"\|"projekty"` | Literówka w kategorii (np. `aktualności` z polskim znakiem). | Wpisz dokładnie `aktualnosci` albo `projekty`. Pod tym komunikatem zawsze jest nazwa pola, które trzeba poprawić. |
| `data does not match collection schema` + `cover: Required` (lub `title`, `author`, `date`) | Brakuje wymaganego pola. | Dodaj brakującą linijkę z szablonu. |
| `błędna data w polu date: „2026-31-12”. Wpisz istniejącą datę w formacie RRRR-MM-DD…` albo `date: błędna data…` (u partnerów to samo dla `validUntil`) | Data w złym formacie (`12.10.2026`, `19 października 2026`) albo nieistniejąca (`2026-02-30`, `2026-31-12`). | Wpisz `RRRR-MM-DD`, np. `2026-10-19`. Godzina jest opcjonalna: `2026-10-19T12:00:00+02:00`. |
| `Projekt „…”: pole post wskazuje wpis „…”, którego nie ma na blogu` (tylko przy `npm run build`) | W projekcie pole `post` ma literówkę albo wskazuje wpis ze statusem `draft: true`. | Wpisz dokładną nazwę folderu wpisu z `src/content/blog/`. |
| `Nested mappings are not allowed in compact mappings` + linijka z `^` | Dwukropek w tekście metadanych (np. w tytule) psuje zapis. | Weź tekst w cudzysłów: `title: "HackYeah: wygraliśmy"`. |

Komunikat błędu zawsze podaje ścieżkę do pliku, w którym jest problem (linijka `Location`).

## Jak dodać lub zmienić partnera, osiągnięcie, projekt

Zasada jak przy wpisie: zmieniasz plik w `new-website/src/content/`, sprawdzasz podgląd,
robisz Pull Request. Strona sama układa dane w odpowiednich miejscach.

### Partner — `src/content/partners/<nazwa>.yaml`

```yaml
name: Miasto Rzeszów
logo: ./miasto-rzeszow.jpg          # plik obok, w tym samym folderze
url: https://www.erzeszow.pl
tier: strategic                    # strategic | partner | university
description: Miasto Rzeszów jest partnerem strategicznym Koła Naukowego Machine Learning.
validUntil: 2026-11-30             # opcjonalne: ostatni dzień współpracy
```

- `strategic` — partner strategiczny: kafelek pod logo na górze strony i duża karta w sekcji
  Partnerzy. Powinien być jeden.
- `partner` — mały kafelek w sekcji Partnerzy; `university` — uczelnia („Działamy przy” w stopce).
- `validUntil` — po tej dacie partner **sam znika** ze strony przy najbliższej publikacji.
  Przedłużenie umowy = zmiana daty; współpraca bezterminowa = usunięcie linijki.
- Logo najlepiej w SVG albo PNG z przezroczystym tłem i bez pustego marginesu.

### Osiągnięcie — `src/content/achievements/<nazwa>-<rok>.yaml`

```yaml
year: 2026
place: I miejsce            # I miejsce | II miejsce | Nagroda | Wyróżnienie
mark: "1."                  # duży znak na karcie, np. "1.", PCI, "★" (wyróżnienie)
title: SpaceShield Hack
description: Dostępność transportu publicznego w Stalowej Woli z danych satelitarnych
url: https://adres-artykulu-o-sukcesie
```

Karty są ułożone od najnowszego roku. `I miejsce` daje wyróżnioną, limonkową kartę.

### Projekt — `src/content/projects/<nazwa>/index.md` (+ `cover.jpg` obok)

```markdown
---
title: Sieć czujników do wykrywania dronów
category: Drony                          # główna etykieta na karcie
description: Rozproszona sieć czujników w architekturze mesh, wykrywająca drony.
tags:
  - czujniki akustyczne
  - mesh
meta: 2026 · I miejsce EDTH Detect & Defend
cover: ./cover.jpg
post: studenci-z-kola-naukowego-machine-learning-zwyciezcami-hackathonu-detect-defend
order: 1
---

Pełny opis projektu (dziś jeszcze niewyświetlany — patrz TODO.md).
```

- `order` — kolejność; strona główna pokazuje 4 projekty z najmniejszym `order`.
- `post` (opcjonalne) — nazwa folderu wpisu na blogu; karta projektu prowadzi wtedy do tego wpisu.
  Literówka albo wpis-szkic zatrzyma `npm run build` (patrz „Najczęstsze błędy”).

## Jak dodać lub zmienić tłumaczenie (wersja angielska)

Po angielsku jest tylko strona główna: [knml.edu.pl/en/](https://knml.edu.pl/en/). Wpisy na blogu
zostają po polsku. Tłumaczymy na brytyjski angielski (*honour*, *centre*); nazwy
„Koło Naukowe Machine Learning” i KNML się nie tłumaczą.

**Teksty strony** (menu, nagłówki, przyciski, stopka) są w dwóch plikach:
`new-website/src/i18n/pl.ts` i `new-website/src/i18n/en.ts`. Każdy tekst ma klucz, np.:

```ts
// pl.ts                                // en.ts
'join.title': 'Dołącz do KNML',         'join.title': 'Join KNML',
```

- **Zmiana tłumaczenia** = zmiana tekstu po prawej stronie klucza w `en.ts`.
- **Nowy tekst** = nowy klucz w **obu** plikach, a w komponencie `{t(locale, 'nowy.klucz')}`.
  Jeśli zapomnisz o `en.ts`, `npm run check` pokaże błąd `Property '"nowy.klucz"' is missing`.

**Partnerzy, osiągnięcia, projekty**: w pliku z `src/content/` dopisz obiekt `en:` z angielską
wersją pól tekstowych. Pola, którego nie ma w `en:`, strona EN pokazuje po polsku.

```yaml
title: StRuNa - Debiut Roku
description: Wyróżnienie dla nowego koła naukowego
en:
  title: StRuNa - Debut of the Year
  description: Distinction for a new student club
```

Pola, które można tłumaczyć: osiągnięcie `title`, `description`; projekt `title`, `category`,
`description`, `tags`, `meta`; partner `name`, `description`.
