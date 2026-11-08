import { z } from 'zod';

// Ustawienia z pliku .env (opis każdej zmiennej: .env.example). Brak albo błąd zatrzymuje
// start serwera z listą zmiennych do poprawienia, zamiast błędu przy pierwszym wpisie.

const required = (name: string) => z.string({ error: `Brakuje ${name}.` }).trim().min(1, { error: `Brakuje ${name}.` });
const address = (name: string) => z.url({ error: `${name} musi być pełnym adresem, np. https://knml.edu.pl.` }).transform((url) => url.replace(/\/$/, ''));

const envSchema = z.object({
  SITE_URL: address('SITE_URL'),
  API_URL: address('API_URL'),
  SESSION_SECRET: required('SESSION_SECRET').min(32, { error: 'SESSION_SECRET musi mieć co najmniej 32 znaki (np. openssl rand -hex 32).' }),
  GITHUB_APP_ID: required('GITHUB_APP_ID'),
  // W .env klucz PEM w jednej linijce, z \n zamiast nowych linii.
  GITHUB_APP_PRIVATE_KEY: required('GITHUB_APP_PRIVATE_KEY').transform((key) => key.replace(/\\n/g, '\n')),
  GITHUB_CLIENT_ID: required('GITHUB_CLIENT_ID'),
  GITHUB_CLIENT_SECRET: required('GITHUB_CLIENT_SECRET'),
  GITHUB_REPO: z.string().regex(/^[\w.-]+\/[\w.-]+$/, { error: 'GITHUB_REPO musi mieć postać właściciel/repo, np. knmlprz/knml.edu.pl.' }).default('knmlprz/knml.edu.pl'),
  GITHUB_BRANCH: z.string().default('main'),
  GITHUB_TEAM: z.string().default('redakcja-strony'),
  GITHUB_API_URL: address('GITHUB_API_URL').default('https://api.github.com'),
  GITHUB_WEB_URL: address('GITHUB_WEB_URL').default('https://github.com'),
});

export type Config = {
  siteUrl: string;
  apiUrl: string;
  sessionSecret: string;
  appId: string;
  privateKey: string;
  clientId: string;
  clientSecret: string;
  owner: string;
  repo: string;
  branch: string;
  team: string;
  githubApiUrl: string;
  githubWebUrl: string;
  // Ile czekać na odpowiedź GitHuba, zanim pokażemy autorowi błąd.
  timeoutMs: number;
};

export function readConfig(env: Record<string, string | undefined>): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Błędne ustawienia w .env (opis: .env.example):\n${parsed.error.issues.map((issue) => `- ${issue.message}`).join('\n')}`);
  }
  const e = parsed.data;
  const [owner, repo] = e.GITHUB_REPO.split('/');
  return {
    siteUrl: e.SITE_URL,
    apiUrl: e.API_URL,
    sessionSecret: e.SESSION_SECRET,
    appId: e.GITHUB_APP_ID,
    privateKey: e.GITHUB_APP_PRIVATE_KEY,
    clientId: e.GITHUB_CLIENT_ID,
    clientSecret: e.GITHUB_CLIENT_SECRET,
    owner,
    repo,
    branch: e.GITHUB_BRANCH,
    team: e.GITHUB_TEAM,
    githubApiUrl: e.GITHUB_API_URL,
    githubWebUrl: e.GITHUB_WEB_URL,
    timeoutMs: 20_000,
  };
}
