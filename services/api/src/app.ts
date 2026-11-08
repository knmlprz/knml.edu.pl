import { randomBytes } from 'node:crypto';
import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { HTTPException } from 'hono/http-exception';
import { createMiddleware } from 'hono/factory';
import { z } from 'zod';
// Te same zasady i ten sam plik wpisu co w kreatorze i w buildzie strony.
import { MAX_IMAGE_FILE_MB, MAX_IMAGES, REQUIRES_ADMIN_APPROVAL } from '../../../new-website/src/config/zasady-wpisow';
import { buildPost, validateDraft, type Draft } from '../../../new-website/src/redakcja/wpis';
import type { Config } from './config';
import { createGitHub, GitHubError, GitHubTimeout, type GitHubUser, type Role } from './github';
import { ImageError, processImage } from './zdjecia';

const SESSION_COOKIE = 'knml_sesja';
const STATE_COOKIE = 'knml_logowanie';
const SESSION_HOURS = 12;
const DRAFT_SAVED = 'Szkic jest zapisany w przeglądarce.';
const RELOAD = 'Kreator wysłał niepełne dane. Odśwież stronę (szkic się nie skasuje) i spróbuj ponownie.';

// Pola, które wysyła kreator (src/pages/redakcja/index.astro). Zdjęcia osobno, jako pliki „zdjecia”,
// w tej samej kolejności co ich opisy w „alts”. Treść sprawdza dopiero validateDraft.
const draftSchema = z.object({
  title: z.string(),
  category: z.string(),
  author: z.string(),
  body: z.string(),
  tags: z.array(z.string()),
  excerpt: z.string(),
  githubLink: z.string(),
  alts: z.array(z.string()),
});

type Session = GitHubUser & { expires: number };

export function createApp(config: Config, fetchFn: typeof fetch = fetch) {
  const github = createGitHub(config, fetchFn);
  const app = new Hono<{ Variables: { user: GitHubUser; role: Role } }>();
  const cookieOptions = { httpOnly: true, secure: true, sameSite: 'Lax', path: '/' } as const;

  // Kreator działa na stronie (inny adres niż API), więc przeglądarka pyta o zgodę. Zgoda tylko dla strony koła.
  app.use(cors({ origin: config.siteUrl, credentials: true, allowMethods: ['GET', 'POST'] }));
  // Formularz wysłany z innej strony nie opublikuje wpisu w imieniu zalogowanej osoby.
  app.use(csrf({ origin: config.siteUrl }));

  async function readSession(c: Context): Promise<Session | null> {
    const value = await getSignedCookie(c, config.sessionSecret, SESSION_COOKIE);
    if (!value) return null;
    try {
      const session = JSON.parse(value) as Session;
      return session.expires > Date.now() ? session : null;
    } catch {
      return null;
    }
  }

  // Tylko zalogowani członkowie zespołu redakcji. Zespół sprawdzamy przy każdym żądaniu.
  const editorsOnly = createMiddleware<{ Variables: { user: GitHubUser; role: Role } }>(async (c, next) => {
    const session = await readSession(c);
    if (!session) return c.json({ error: 'Zaloguj się przez GitHub, żeby publikować wpisy.' }, 401);
    const role = await github.teamRole(session.login);
    if (!role) {
      return c.json(
        { error: `Konto GitHub ${session.login} nie należy do zespołu ${config.team}, więc nie może publikować wpisów. Poproś admina redakcji o dodanie do zespołu.` },
        403,
      );
    }
    c.set('user', { login: session.login, id: session.id, name: session.name });
    c.set('role', role);
    await next();
  });

  app.get('/auth/login', async (c) => {
    const state = randomBytes(16).toString('hex');
    await setSignedCookie(c, STATE_COOKIE, state, config.sessionSecret, { ...cookieOptions, maxAge: 600 });
    return c.redirect(github.authorizeUrl(state));
  });

  app.get('/auth/callback', async (c) => {
    const failed = () => c.redirect(`${config.siteUrl}/redakcja/?logowanie=blad`);
    const expectedState = await getSignedCookie(c, config.sessionSecret, STATE_COOKIE);
    deleteCookie(c, STATE_COOKIE, cookieOptions);
    const code = c.req.query('code');
    if (!expectedState || c.req.query('state') !== expectedState || !code) return failed();
    const user = await github.userFromCode(code);
    if (!user) return failed();
    const session: Session = { ...user, expires: Date.now() + SESSION_HOURS * 3600_000 };
    await setSignedCookie(c, SESSION_COOKIE, JSON.stringify(session), config.sessionSecret, { ...cookieOptions, maxAge: SESSION_HOURS * 3600 });
    return c.redirect(`${config.siteUrl}/redakcja/`);
  });

  app.post('/auth/logout', (c) => {
    deleteCookie(c, SESSION_COOKIE, cookieOptions);
    return c.body(null, 204);
  });

  app.get('/me', editorsOnly, (c) => {
    const { login, name } = c.get('user');
    return c.json({ login, name, admin: c.get('role') === 'admin' });
  });

  // Najwięcej, ile może mieć poprawny wpis: wszystkie zdjęcia o największym rozmiarze i tekst.
  const maxRequestMb = MAX_IMAGES * MAX_IMAGE_FILE_MB + 1;
  app.post(
    '/wpisy',
    editorsOnly,
    bodyLimit({
      maxSize: maxRequestMb * 1024 * 1024,
      onError: (c) => c.json({ errors: [`Wpis ze zdjęciami ma więcej niż ${maxRequestMb} MB. Zmniejsz zdjęcia albo usuń część z nich.`] }, 413),
    }),
    async (c) => {
      const form = await c.req.formData().catch(() => null);
      const files = (form?.getAll('zdjecia') ?? []).filter((file): file is File => file instanceof File);
      let input: z.infer<typeof draftSchema>;
      try {
        input = draftSchema.parse(JSON.parse(String(form?.get('wpis'))));
      } catch {
        return c.json({ errors: [RELOAD] }, 400);
      }
      if (input.alts.length !== files.length) return c.json({ errors: [RELOAD] }, 400);

      const { alts, ...fields } = input;
      const draft: Draft = {
        ...fields,
        category: fields.category as Draft['category'],
        images: files.map((file, i) => ({ name: file.name, size: file.size, alt: alts[i] })),
      };
      // Najpierw zasady (bez pytania GitHuba), potem zdjęcia, na końcu wolny adres.
      const errors = validateDraft(draft, []);
      if (errors.length) return c.json({ errors }, 400);

      const user = c.get('user');
      const post = buildPost(draft, { today: new Date(), existingSlugs: await github.takenSlugs() });
      const images: Buffer[] = [];
      const imageErrors: string[] = [];
      for (const [i, file] of files.entries()) {
        try {
          images.push(await processImage(new Uint8Array(await file.arrayBuffer()), file.name, post.files[i].postPath));
        } catch (error) {
          if (!(error instanceof ImageError)) throw error;
          if (error.status === 500) return c.json({ error: error.message }, 500);
          imageErrors.push(error.message);
        }
      }
      if (imageErrors.length) return c.json({ errors: imageErrors }, 400);

      const { prUrl, autoMerge } = await github.createPostPullRequest({
        slug: post.slug,
        title: draft.title.trim(),
        author: user,
        autoMerge: !REQUIRES_ADMIN_APPROVAL,
        files: [
          { path: 'index.md', content: Buffer.from(post.markdown) },
          ...post.files.map((file, i) => ({ path: file.postPath.replace(/^\.\//, ''), content: images[i] })),
        ],
      });
      return c.json({ slug: post.slug, postUrl: postUrl(post.slug), prUrl, autoMerge }, 201);
    },
  );

  const postUrl = (slug: string) => `${config.siteUrl}/blog/${slug}/`;

  // Wpisy z kreatora: autor widzi swoje, admin wszystkie. Edycja i usuwanie: faza 6 planu.
  app.get('/moje-wpisy', editorsOnly, async (c) => {
    const { login } = c.get('user');
    const all = c.get('role') === 'admin';
    const posts = (await github.postPullRequests()).filter((post) => all || post.login.toLowerCase() === login.toLowerCase());
    return c.json(posts.map((post) => ({ ...post, postUrl: postUrl(post.slug) })));
  });

  // Błędy GitHuba po ludzku. Szczegóły dla admina trafiają do logów (podman compose logs).
  app.onError((error, c) => {
    // Jedyny taki wyjątek rzuca csrf() powyżej.
    if (error instanceof HTTPException) return c.json({ error: 'Wpis można wysłać tylko z kreatora na stronie koła.' }, error.status);
    console.error(error);
    if (error instanceof GitHubTimeout) return c.json({ error: `GitHub nie odpowiada. Spróbuj ponownie za kilka minut. ${DRAFT_SAVED}` }, 504);
    if (error instanceof GitHubError) {
      if (error.status === 422 && error.path.endsWith('/git/refs')) {
        return c.json({ error: `Ktoś właśnie opublikował wpis pod tym samym adresem. Kliknij „Opublikuj” jeszcze raz: wpis dostanie kolejny wolny adres. ${DRAFT_SAVED}` }, 409);
      }
      if (error.status === 401 || error.status === 403) {
        return c.json({ error: `Serwer publikacji nie może zalogować się do GitHuba (klucz albo uprawnienia aplikacji). Daj znać adminowi strony. ${DRAFT_SAVED}` }, 502);
      }
      if (error.status === 422) {
        return c.json({ error: `GitHub odrzucił wpis. Spróbuj ponownie, a jeśli błąd wraca, pobierz wpis i wyślij go adminowi strony. ${DRAFT_SAVED}` }, 502);
      }
      return c.json({ error: `GitHub ma chwilowe problemy (błąd ${error.status}). Spróbuj ponownie za kilka minut. ${DRAFT_SAVED}` }, 502);
    }
    return c.json({ error: `Błąd serwera publikacji. Spróbuj ponownie, a jeśli błąd wraca, daj znać adminowi strony. ${DRAFT_SAVED}` }, 500);
  });

  return app;
}
