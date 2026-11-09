import { createVerify } from 'node:crypto';
import { Hono, type Context } from 'hono';

// Udawany GitHub dla testów: tylko adresy, których używa src/github.ts. Działa bez internetu.
// Vitest woła go bez sieci (fetchFor() niżej), testy w przeglądarce jako zwykły serwer HTTP
// (test/e2e-server.ts). Stan jest w pamięci i można go podejrzeć w teście.

export const OWNER = 'knmlprz';
export const REPO = 'knml.edu.pl';
export const TEAM = 'redakcja-strony';
export const CLIENT_ID = 'test-client-id';
export const CLIENT_SECRET = 'test-client-secret';
const INSTALLATION_ID = 42;
const INSTALLATION_TOKEN = 'ghs_instalacja';

type User = { id: number; name: string | null; role?: 'member' | 'maintainer' };
type TreeEntry = { path: string; mode: string; type: string; sha: string };
type Failure = { method: string; path: RegExp; status: number | 'timeout' };

export function createMockGitHub(publicKey: string) {
  const state = {
    // Konta GitHub. Bez roli = konto spoza zespołu redakcja-strony.
    users: {
      'jan-testowy': { id: 101, name: 'Jan Testowy', role: 'member' },
      'anna-admin': { id: 102, name: 'Anna Admin', role: 'maintainer' },
      'obcy': { id: 103, name: null },
    } as Record<string, User>,
    // Foldery wpisów na main.
    posts: ['istniejacy-wpis'],
    // Gałęzie oprócz main, np. wpis/jan-testowy/zwyciestwo-w-lodzi.
    branches: [] as string[],
    blobs: new Map<string, Buffer>(),
    trees: new Map<string, { base_tree: string; tree: TreeEntry[] }>(),
    commits: new Map<string, { message: string; tree: string; parents: string[]; author?: { name: string; email: string } }>(),
    pulls: [] as { number: number; title: string; body: string; head: string; base: string; node_id: string; html_url: string; state: string; merged_at: string | null; autoMerge?: string }[],
    failures: [] as Failure[],
    nextId: 1,
  };

  const app = new Hono();
  const json = (c: Context, body: unknown, status = 200) => c.json(body, status as 200);
  const token = (c: Context) => c.req.header('authorization')?.replace(/^Bearer /, '') ?? '';

  const validAppJwt = (jwt: string) => {
    const [header, payload, signature] = jwt.split('.');
    if (!signature) return false;
    const signed = createVerify('RSA-SHA256').update(`${header}.${payload}`).verify(publicKey, signature, 'base64url');
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return signed && exp > Date.now() / 1000;
  };

  // Udawane awarie: fail('POST', /git\/refs/, 422) albo 'timeout' (GitHub nie odpowiada).
  app.use(async (c, next) => {
    const failure = state.failures.find((f) => f.method === c.req.method && f.path.test(c.req.path));
    if (!failure) return next();
    if (failure.status === 'timeout') return new Promise<Response>(() => {});
    return json(c, { message: 'Błąd testowy' }, failure.status);
  });

  const requireApp = (c: Context) => (validAppJwt(token(c)) ? null : json(c, { message: 'A JSON web token could not be decoded' }, 401));
  const requireInstallation = (c: Context) => (token(c) === INSTALLATION_TOKEN ? null : json(c, { message: 'Bad credentials' }, 401));

  // Logowanie: GitHub od razu odsyła z kodem, kod mówi, kto się loguje (loginAs).
  let loginAs = 'jan-testowy';
  app.get('/login/oauth/authorize', (c) => {
    const redirect = new URL(c.req.query('redirect_uri')!);
    redirect.searchParams.set('code', `kod-${loginAs}`);
    redirect.searchParams.set('state', c.req.query('state')!);
    return c.redirect(redirect.toString());
  });
  app.post('/login/oauth/access_token', async (c) => {
    const { client_id, client_secret, code } = await c.req.json();
    if (client_id !== CLIENT_ID || client_secret !== CLIENT_SECRET) return json(c, { error: 'incorrect_client_credentials' });
    const login = String(code).replace(/^kod-/, '');
    return state.users[login] ? json(c, { access_token: `gho_${login}` }) : json(c, { error: 'bad_verification_code' });
  });
  app.get('/user', (c) => {
    const login = token(c).replace(/^gho_/, '');
    const user = state.users[login];
    return user ? json(c, { login, id: user.id, name: user.name }) : json(c, { message: 'Bad credentials' }, 401);
  });

  app.get(`/repos/${OWNER}/${REPO}/installation`, (c) => requireApp(c) ?? json(c, { id: INSTALLATION_ID }));
  app.post(`/app/installations/${INSTALLATION_ID}/access_tokens`, (c) =>
    requireApp(c) ?? json(c, { token: INSTALLATION_TOKEN, expires_at: new Date(Date.now() + 3600_000).toISOString() }, 201),
  );

  app.get(`/orgs/${OWNER}/teams/${TEAM}/memberships/:login`, (c) => {
    const role = state.users[c.req.param('login')]?.role;
    return requireInstallation(c) ?? (role ? json(c, { state: 'active', role }) : json(c, { message: 'Not Found' }, 404));
  });

  const repo = `/repos/${OWNER}/${REPO}`;
  app.get(`${repo}/contents/new-website/src/content/blog`, (c) =>
    requireInstallation(c) ?? json(c, [...state.posts.map((name) => ({ name, type: 'dir' })), { name: '.gitkeep', type: 'file' }]),
  );
  app.get(`${repo}/git/matching-refs/heads/*`, (c) => {
    const prefix = c.req.path.split('/git/matching-refs/heads/')[1];
    const refs = state.branches.filter((branch) => branch.startsWith(prefix)).map((branch) => ({ ref: `refs/heads/${branch}` }));
    return requireInstallation(c) ?? json(c, refs);
  });
  app.get(`${repo}/git/ref/heads/main`, (c) => requireInstallation(c) ?? json(c, { object: { sha: 'commit-main' } }));
  app.get(`${repo}/git/commits/commit-main`, (c) => requireInstallation(c) ?? json(c, { tree: { sha: 'tree-main' } }));

  const newSha = (kind: string) => `${kind}-${state.nextId++}`;
  app.post(`${repo}/git/blobs`, async (c) => {
    const { content, encoding } = await c.req.json();
    const sha = newSha('blob');
    state.blobs.set(sha, Buffer.from(content, encoding));
    return requireInstallation(c) ?? json(c, { sha }, 201);
  });
  app.post(`${repo}/git/trees`, async (c) => {
    const sha = newSha('tree');
    state.trees.set(sha, await c.req.json());
    return requireInstallation(c) ?? json(c, { sha }, 201);
  });
  app.post(`${repo}/git/commits`, async (c) => {
    const sha = newSha('commit');
    state.commits.set(sha, await c.req.json());
    return requireInstallation(c) ?? json(c, { sha }, 201);
  });
  app.post(`${repo}/git/refs`, async (c) => {
    const branch = (await c.req.json()).ref.replace('refs/heads/', '');
    if (state.branches.includes(branch)) return json(c, { message: 'Reference already exists' }, 422);
    state.branches.push(branch);
    return requireInstallation(c) ?? json(c, { ref: `refs/heads/${branch}` }, 201);
  });
  app.post(`${repo}/pulls`, async (c) => {
    const { title, body, head, base } = await c.req.json();
    const number = state.pulls.length + 1;
    const pull = { number, title, body, head, base, node_id: `PR_${number}`, html_url: `https://github.com/${OWNER}/${REPO}/pull/${number}`, state: 'open', merged_at: null };
    state.pulls.push(pull);
    return requireInstallation(c) ?? json(c, pull, 201);
  });
  app.get(`${repo}/pulls`, (c) =>
    requireInstallation(c) ?? json(c, [...state.pulls].reverse().map((pull) => ({ ...pull, head: { ref: pull.head } }))),
  );
  app.post('/graphql', async (c) => {
    const { variables } = await c.req.json();
    const pull = state.pulls.find((p) => p.node_id === variables.pullRequestId);
    if (!pull) return json(c, { data: null, errors: [{ message: 'Could not resolve to a node' }] });
    pull.autoMerge = variables.mergeMethod;
    return requireInstallation(c) ?? json(c, { data: { enablePullRequestAutoMerge: { clientMutationId: null } } });
  });

  // Pliki z ostatniego commita, który dodał wpis: ścieżka → zawartość.
  function committedFiles(): Record<string, Buffer> {
    const commit = [...state.commits.values()].at(-1);
    if (!commit) return {};
    const tree = state.trees.get(commit.tree)!;
    return Object.fromEntries(tree.tree.map((entry) => [entry.path, state.blobs.get(entry.sha)!]));
  }

  // Tylko dla testów w przeglądarce: podgląd stanu przez HTTP.
  app.get('/_test/pliki', (c) => json(c, Object.fromEntries(Object.entries(committedFiles()).map(([path, content]) => [path, content.toString('base64')]))));
  app.get('/_test/pulls', (c) => json(c, state.pulls));
  app.post('/_test/zaloguj-jako/:login', (c) => {
    loginAs = c.req.param('login');
    return c.body(null, 204);
  });

  return {
    app,
    state,
    committedFiles,
    loginAs: (login: string) => (loginAs = login),
    fail: (method: string, path: RegExp, status: Failure['status']) => state.failures.push({ method, path, status }),
  };
}

// fetch, który zamiast sieci woła udawany GitHub. Szanuje limit czasu (signal), tak jak prawdziwy.
export function fetchFor(app: Hono): typeof fetch {
  return (input, init) => {
    const request = new Request(input, init);
    return new Promise((resolve, reject) => {
      request.signal.addEventListener('abort', () => reject(request.signal.reason));
      Promise.resolve(app.fetch(request)).then(resolve, reject);
    });
  };
}
