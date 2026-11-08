import { createSign } from 'node:crypto';
import type { Config } from './config';

// Cała rozmowa z GitHubem. Usługa działa jako GitHub App (nie token czyjegoś konta), więc
// publikacja działa dalej, gdy ktoś odejdzie z koła. Ta sama aplikacja służy do logowania.

export const POSTS_DIR = 'new-website/src/content/blog';
// Gałęzie wpisów z kreatora: wpis/<login autora>/<adres wpisu>. Z nazwy gałęzi wiemy, czyj jest wpis.
const BRANCH_PREFIX = 'wpis/';

export class GitHubError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    detail: string,
  ) {
    super(`GitHub ${status} ${path}: ${detail.slice(0, 300)}`);
  }
}

export class GitHubTimeout extends Error {
  constructor(readonly path: string) {
    super(`GitHub nie odpowiedział: ${path}`);
  }
}

export type GitHubUser = { login: string; id: number; name: string };
export type Role = 'admin' | 'member';
export type PostFile = { path: string; content: Buffer };
export type PostPullRequest = { title: string; slug: string; login: string; status: 'w trakcie' | 'opublikowany' | 'zamknięty'; prUrl: string };

export function createGitHub(config: Config, fetchFn: typeof fetch = fetch) {
  const repoPath = `/repos/${config.owner}/${config.repo}`;

  async function request<T>(path: string, { token, method = 'GET', body, baseUrl = config.githubApiUrl }: { token?: string; method?: string; body?: unknown; baseUrl?: string } = {}): Promise<T> {
    let response: Response;
    try {
      response = await fetchFn(baseUrl + path, {
        method,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'user-agent': 'knml-redakcja-api',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(config.timeoutMs),
      });
    } catch (error) {
      if (error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')) throw new GitHubTimeout(path);
      throw error;
    }
    if (!response.ok) throw new GitHubError(response.status, path, await response.text());
    return response.json() as Promise<T>;
  }

  // Krótki token (JWT) podpisany kluczem aplikacji, wymieniany na token instalacji w organizacji.
  function appJwt() {
    const now = Math.floor(Date.now() / 1000);
    const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
    // iat cofnięte o minutę na wypadek różnicy zegarów z GitHubem.
    const unsigned = `${part({ alg: 'RS256', typ: 'JWT' })}.${part({ iat: now - 60, exp: now + 540, iss: config.appId })}`;
    return `${unsigned}.${createSign('RSA-SHA256').update(unsigned).sign(config.privateKey, 'base64url')}`;
  }

  // Token instalacji ważny godzinę: trzymamy go w pamięci, żeby nie prosić o nowy przy każdym żądaniu.
  let installation: { token: string; expiresAt: number } | undefined;
  async function installationToken() {
    if (installation && installation.expiresAt > Date.now() + 5 * 60_000) return installation.token;
    const jwt = appJwt();
    const { id } = await request<{ id: number }>(`${repoPath}/installation`, { token: jwt });
    const { token, expires_at } = await request<{ token: string; expires_at: string }>(`/app/installations/${id}/access_tokens`, { token: jwt, method: 'POST' });
    installation = { token, expiresAt: Date.parse(expires_at) };
    return token;
  }

  const authorizeUrl = (state: string) =>
    `${config.githubWebUrl}/login/oauth/authorize?${new URLSearchParams({ client_id: config.clientId, redirect_uri: `${config.apiUrl}/auth/callback`, state })}`;

  // Logowanie: kod z GitHuba → token użytkownika → kim jest. Tokenu nie zapisujemy, sesja trzyma tylko login.
  async function userFromCode(code: string): Promise<GitHubUser | null> {
    const { access_token } = await request<{ access_token?: string }>('/login/oauth/access_token', {
      method: 'POST',
      baseUrl: config.githubWebUrl,
      body: { client_id: config.clientId, client_secret: config.clientSecret, code, redirect_uri: `${config.apiUrl}/auth/callback` },
    });
    if (!access_token) return null;
    const user = await request<{ login: string; id: number; name: string | null }>('/user', { token: access_token });
    return { login: user.login, id: user.id, name: user.name || user.login };
  }

  // Rola w zespole redakcji, sprawdzana przy każdym żądaniu: usunięcie z zespołu działa od razu.
  async function teamRole(login: string): Promise<Role | null> {
    try {
      const membership = await request<{ state: string; role: string }>(`/orgs/${config.owner}/teams/${config.team}/memberships/${login}`, {
        token: await installationToken(),
      });
      if (membership.state !== 'active') return null;
      return membership.role === 'maintainer' ? 'admin' : 'member';
    } catch (error) {
      if (error instanceof GitHubError && error.status === 404) return null;
      throw error;
    }
  }

  // Zajęte adresy: wpisy na głównej gałęzi i wpisy z kreatora, które czekają na scalenie.
  async function takenSlugs(): Promise<string[]> {
    const token = await installationToken();
    const [entries, refs] = await Promise.all([
      request<{ name: string; type: string }[]>(`${repoPath}/contents/${POSTS_DIR}?ref=${config.branch}`, { token }),
      request<{ ref: string }[]>(`${repoPath}/git/matching-refs/heads/${BRANCH_PREFIX}`, { token }),
    ]);
    return [...entries.filter((entry) => entry.type === 'dir').map((entry) => entry.name), ...refs.map((ref) => ref.ref.split('/').at(-1)!)];
  }

  // Gałąź z jednym commitem (wszystkie pliki wpisu naraz) i Pull Request do głównej gałęzi.
  async function createPostPullRequest({ slug, title, files, author, autoMerge }: { slug: string; title: string; files: PostFile[]; author: GitHubUser; autoMerge: boolean }) {
    const token = await installationToken();
    const { object } = await request<{ object: { sha: string } }>(`${repoPath}/git/ref/heads/${config.branch}`, { token });
    const { tree: baseTree } = await request<{ tree: { sha: string } }>(`${repoPath}/git/commits/${object.sha}`, { token });
    const blobs = await Promise.all(
      files.map((file) => request<{ sha: string }>(`${repoPath}/git/blobs`, { token, method: 'POST', body: { content: file.content.toString('base64'), encoding: 'base64' } })),
    );
    const tree = await request<{ sha: string }>(`${repoPath}/git/trees`, {
      token,
      method: 'POST',
      body: { base_tree: baseTree.sha, tree: files.map((file, i) => ({ path: `${POSTS_DIR}/${slug}/${file.path}`, mode: '100644', type: 'blob', sha: blobs[i].sha })) },
    });
    const commit = await request<{ sha: string }>(`${repoPath}/git/commits`, {
      token,
      method: 'POST',
      // Autor commita to osoba z kreatora (adres noreply łączy commit z jej kontem), zapisuje aplikacja.
      body: { message: `Dodaj wpis „${title}”`, tree: tree.sha, parents: [object.sha], author: { name: author.name, email: `${author.id}+${author.login}@users.noreply.github.com` } },
    });
    const branch = `${BRANCH_PREFIX}${author.login}/${slug}`;
    await request(`${repoPath}/git/refs`, { token, method: 'POST', body: { ref: `refs/heads/${branch}`, sha: commit.sha } });

    const postUrl = `${config.siteUrl}/blog/${slug}/`;
    const pull = await request<{ html_url: string; node_id: string }>(`${repoPath}/pulls`, {
      token,
      method: 'POST',
      body: {
        title: `Nowy wpis: ${title}`,
        head: branch,
        base: config.branch,
        body: [
          `Wpis z kreatora /redakcja/. Autor konta: ${author.name} (${author.login}).`,
          '',
          `Adres po publikacji: ${postUrl}`,
          '',
          autoMerge ? 'Scali się sam, gdy CI będzie zielone.' : 'Czeka na akceptację admina redakcji.',
        ].join('\n'),
      },
    });
    return { prUrl: pull.html_url, autoMerge: autoMerge && (await enableAutoMerge(pull.node_id, token)) };
  }

  // Auto-merge: GitHub scali PR sam, gdy CI przejdzie. Wymaga ustawień repo (README usługi).
  // Gdy się nie uda, wpis i tak czeka w PR, więc nie zgłaszamy autorowi błędu.
  async function enableAutoMerge(pullRequestId: string, token: string) {
    try {
      const result = await request<{ errors?: { message: string }[] }>('/graphql', {
        token,
        method: 'POST',
        body: {
          query: 'mutation($pullRequestId: ID!, $mergeMethod: PullRequestMergeMethod!) { enablePullRequestAutoMerge(input: {pullRequestId: $pullRequestId, mergeMethod: $mergeMethod}) { clientMutationId } }',
          variables: { pullRequestId, mergeMethod: 'MERGE' },
        },
      });
      if (!result.errors?.length) return true;
      console.error('Auto-merge się nie włączył:', result.errors.map((error) => error.message).join('; '));
    } catch (error) {
      console.error('Auto-merge się nie włączył:', error);
    }
    return false;
  }

  // Wpisy z kreatora (PR-y z gałęzi wpis/…), od najnowszego. Ostatnie 100 PR-ów w repo.
  async function postPullRequests(): Promise<PostPullRequest[]> {
    const pulls = await request<{ title: string; html_url: string; state: string; merged_at: string | null; head: { ref: string } }[]>(
      `${repoPath}/pulls?state=all&per_page=100`,
      { token: await installationToken() },
    );
    return pulls
      .filter((pull) => pull.head.ref.startsWith(BRANCH_PREFIX))
      .map((pull) => {
        const [, login, slug] = pull.head.ref.split('/');
        const status = pull.merged_at ? 'opublikowany' : pull.state === 'open' ? 'w trakcie' : 'zamknięty';
        return { title: pull.title.replace(/^Nowy wpis: /, ''), slug, login, status, prUrl: pull.html_url };
      });
  }

  return { authorizeUrl, userFromCode, teamRole, takenSlugs, createPostPullRequest, postPullRequests };
}

export type GitHub = ReturnType<typeof createGitHub>;
