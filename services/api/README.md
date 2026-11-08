# API publikacji wpisów (`services/api`)

Mała usługa, dzięki której kreator `/redakcja/` ma przycisk **„Opublikuj”**. Strona zostaje
statyczna: API działa osobno (na serwerze koła pod `api.knml.edu.pl`, lokalnie w kontenerze).
Plan całości: [docs/plan-kreator.md](../../docs/plan-kreator.md), decyzje:
[ADR 0003](../../docs/adr/0003-kreator-zamiast-tiny.md) i [ADR 0004](../../docs/adr/0004-api-publikacji.md).

```text
autor ── /redakcja/ ──► API ──► GitHub (jako GitHub App koła)
          kreator        ├─ czy autor jest w zespole redakcja-strony?
                         ├─ zasady wpisu (te same pliki co kreator i build strony)
                         ├─ zdjęcia: obrót, max 2000 px, bez GPS, HEIC → JPG
                         └─ gałąź wpis/<login>/<adres> + commit + Pull Request (+ auto-merge)
```

Bez bazy danych: wpisy są w repo, lista redakcji to zespół na GitHubie, sesja to podpisane
ciasteczko.

## Co jest gdzie

```text
services/api/
├── src/
│   ├── server.ts      start serwera (czyta .env)
│   ├── config.ts      zmienne z .env i ich sprawdzenie
│   ├── app.ts         adresy API, logowanie, sesja, komunikaty błędów po polsku
│   ├── github.ts      cała rozmowa z GitHubem
│   └── zdjecia.ts     obróbka zdjęć (sharp + heif-dec dla HEIC)
├── test/              testy Vitest, udawany GitHub (mock-github.ts), zdjęcie HEIC z obrotem i GPS
├── e2e/               test w przeglądarce: kreator + API + udawany GitHub
├── Dockerfile         obraz do uruchomienia (budowany z katalogu głównego repo)
├── compose.yaml       podman compose up / docker compose up
└── .env.example       opis każdej zmiennej (kopia jako .env, nie trafia do repo)
```

API nie kopiuje logiki wpisów, tylko importuje
[`new-website/src/config/zasady-wpisow.ts`](../../new-website/src/config/zasady-wpisow.ts) i
[`new-website/src/redakcja/wpis.ts`](../../new-website/src/redakcja/wpis.ts). Zmiana zasady
w tym pliku zmienia kreator, build strony i API naraz.

## Adresy API

| Adres | Co robi |
|---|---|
| `GET /auth/login` | przekierowuje do logowania na GitHubie |
| `GET /auth/callback` | powrót z GitHuba: zapisuje sesję i wraca do `/redakcja/` |
| `POST /auth/logout` | wylogowanie |
| `GET /me` | kto jest zalogowany: `{ login, name, admin }` |
| `POST /wpisy` | publikacja: `multipart/form-data` z polem `wpis` (JSON) i plikami `zdjecia` |
| `GET /moje-wpisy` | wpisy z kreatora: autor widzi swoje, admin wszystkie |

Odpowiedzi: `401` bez sesji, `403` konto spoza zespołu `redakcja-strony`, `400` wpis łamie
zasady (`{ errors: [...] }`, polskie komunikaty), `409` ktoś w tej samej chwili zajął ten adres,
`502`/`504` problem z GitHubem (`{ error }`, polski komunikat). Edycja i usuwanie wpisów: faza 6.

## Uruchomienie

### Lokalnie z udawanym GitHubem (bez konta i aplikacji GitHub)

Do klikania kreatora i sprawdzania zmian. Logujesz się jako testowy `jan-testowy`, „opublikowany”
wpis zostaje w pamięci udawanego GitHuba.

```bash
cd services/api
npm install
SITE_URL=http://localhost:4321 npm run dev:mock
```

W drugim terminalu:

```bash
cd new-website
PUBLIC_API_URL=http://localhost:8787 npm run dev
```

Otwórz http://localhost:4321/redakcja/. Pliki, które API wysłało do udawanego GitHuba:
http://localhost:8788/_test/pliki (base64).

### W kontenerze (tak jak na serwerze)

Na tym komputerze jest **podman**; `docker compose` działa tak samo.

```bash
cd services/api
cp .env.example .env     # i uzupełnij (opis przy każdej zmiennej)
podman compose up --build
```

API działa na http://localhost:8787. Bez poprawnego `.env` kontener zatrzyma się z listą zmiennych
do poprawienia (`podman compose logs`). Prawdziwe logowanie wymaga aplikacji GitHub
(niżej, „Faza 5”). Zatrzymanie: `Ctrl+C`, potem `podman compose down`.

## Testy

```bash
cd services/api
npm run check      # TypeScript
npm test           # Vitest: dostęp, walidacja, zdjęcia, pliki w commicie, błędy GitHuba
npm run test:e2e   # buduje stronę testową i usługę, uruchamia test w przeglądarce
```

Testy nie łączą się z internetem: GitHub udaje [`test/mock-github.ts`](test/mock-github.ts)
(Vitest woła go bez sieci, test w przeglądarce jako serwer na porcie 8788).

**HEIC.** Sharp z npm czyta zdjęcia HEIC, ale nie umie zdekodować HEVC (kompresja zdjęć
z iPhone'a). Robi to program `heif-dec` z libheif, zainstalowany w obrazie Docker. Na komputerze
bez `heif-dec` testy HEIC się pomijają (Vitest pokazuje ostrzeżenie). Wszystkie testy, z HEIC,
w kontenerze:

```bash
# z katalogu głównego repo
podman build --target test -t knml-api-test -f services/api/Dockerfile .
podman run --rm knml-api-test
```

CI (`.github/workflows/ci.yml`, zadanie `api`) robi to samo przy każdym PR. W kontenerze
brak `heif-dec` to błąd, nie pominięcie (`HEIC_WYMAGANY=1`).

Testowe zdjęcie `test/fixtures/iphone-obrot-gps.heic` (300×200 z EXIF Orientation=6 i GPS,
lewa połowa czerwona) zrobiono w kontenerze Debiana trixie: obraz JPG z tymi metadanymi
(sharp, `withMetadata({ orientation: 6 })` i `withExif`) zamieniony przez `heif-enc`. Tak jak
iPhone, plik ma obrót zapisany w HEIC (`irot`) i w EXIF; poprawny wynik to 200×300, czerwień
na górze. libheif 1.15 z Debiana bookworm obracał go dwa razy, dlatego obraz bazuje na trixie.

## Ustawienia repo na GitHubie

Wpis z kreatora to Pull Request z gałęzi `wpis/<login>/<adres>` do `main`. Co dalej, ustala
`REQUIRES_ADMIN_APPROVAL` w `new-website/src/config/zasady-wpisow.ts` (decyzja na spotkaniu koła):

**`false` (teraz): auto-merge po zielonym CI.** API włącza auto-merge (metoda „merge commit”),
GitHub scala PR sam, gdy CI przejdzie, a `deploy.yml` publikuje stronę. W repo trzeba ustawić:

1. **Settings → General → Pull Requests:** zaznacz „Allow auto-merge” i „Allow merge commits”;
   warto też „Automatically delete head branches” (gałęzie wpisów znikną po scaleniu).
2. **Settings → Rules → Rulesets → New branch ruleset** dla `main`: „Require a pull request
   before merging” i „Require status checks to pass” z zadaniami `check` i `api` z CI.
   Bez wymaganych testów auto-merge scaliłby PR od razu, przed CI.
3. Jeśli reguły `main` wymagają zatwierdzenia PR (approvals ≥ 1), wpisy z kreatora będą na nie
   czekać. Wtedy albo approvals = 0, albo wariant `true` niżej. **Nie dodawaj** aplikacji do
   „Bypass list”: obejście reguł pomija też wymagane testy, więc zły wpis mógłby wejść na stronę.

Gdy auto-merge się nie włączy (np. wyłączony w repo), wpis i tak czeka w PR, a kreator mówi,
że czeka na akceptację. Powód jest w logach API.

**`true`: PR czeka na admina redakcji.** API nie włącza auto-merge. W regułach `main`:
„Require approvals” = 1. Admin redakcji przegląda PR i klika „Merge”.

## Faza 5: co ustawia admin organizacji

Lista do zrobienia przy uruchomieniu na serwerze koła (pytania S1-S5 w planie):

1. **Zespół `redakcja-strony`** w organizacji `knmlprz` (Teams → New team). Członkowie = osoby
   z dostępem do kreatora, maintainerzy zespołu = admini redakcji. Każdy potrzebuje konta GitHub.
2. **GitHub App** w organizacji (Settings → Developer settings → GitHub Apps → New):
   - Homepage URL: `https://knml.edu.pl`, Callback URL: `https://api.knml.edu.pl/auth/callback`,
     bez zaznaczania „Request user authorization (OAuth) during installation”, webhook wyłączony.
   - Uprawnienia repo: **Contents: Read and write**, **Pull requests: Read and write**.
     Uprawnienia organizacji: **Members: Read-only** (sprawdzanie zespołu).
   - „Where can this GitHub App be installed?”: Only on this account.
   - Po utworzeniu: zapisz App ID i Client ID, wygeneruj Client secret i klucz prywatny (.pem).
   - **Install App** → tylko repo `knml.edu.pl`.
3. **Ustawienia repo** z sekcji wyżej (auto-merge, ruleset `main`).
4. **Serwer koła:** podman albo Docker, kopia repo (wystarczy `git clone`), plik
   `services/api/.env` z wartościami z punktu 2 i `SESSION_SECRET` (`openssl rand -hex 32`),
   `podman compose up -d --build`. Aktualizacja: `git pull` i to samo polecenie.
5. **DNS i HTTPS:** subdomena `api.knml.edu.pl` na serwer koła i reverse proxy z certyfikatem
   (np. Caddy) do portu 8787. HTTPS jest konieczny: ciasteczko sesji ma flagę `Secure`.
6. **Strona:** zmienna `PUBLIC_API_URL=https://api.knml.edu.pl` przy buildzie w
   `.github/workflows/deploy.yml` (bez niej kreator ma tylko „Pobierz wpis”).
7. **Sprawdzenie:** zalogować się na `/redakcja/` kontem z zespołu, opublikować wpis testowy,
   zobaczyć PR, zielone CI i wpis na stronie. Potem usunąć wpis testowy zwykłym PR.

Kopie zapasowe API nie są potrzebne: nie ma w nim danych, tylko `.env` (trzymać u zarządu).
