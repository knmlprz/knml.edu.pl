// Jednorazowa migracja treści ze starej strony Hugo (old-website/) do src/content/.
// Uruchom z katalogu new-website/:  node scripts/migrate-hugo.mjs
// Skrypt tylko czyta old-website/ i nic tam nie zmienia. Można go puścić ponownie —
// nadpisze wygenerowane pliki w src/content/ i public/blog/.

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { parse as parseToml } from 'smol-toml';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const OLD = '../old-website';
const CONTENT = 'src/content';
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];

const config = parseToml(readFileSync(join(OLD, 'config.toml'), 'utf8'));

function migrateBlog() {
  const blogDir = join(OLD, 'content/blog');
  const skipped = [];
  for (const slug of readdirSync(blogDir)) {
    const source = join(blogDir, slug);
    const [, frontmatter, rawBody] = readFileSync(join(source, 'index.md'), 'utf8').match(
      /^---\n([\s\S]*?)\n---\n([\s\S]*)$/,
    );
    const hugo = parseYaml(frontmatter);
    const body = fixRawImages(rawBody);

    // Hugo: /blog/<slug>/plik.jpg → Astro: ścieżka względna do pliku obok index.md.
    const cover = hugo.image?.replace(`/blog/${slug}/`, '');
    const missingImages = findMissingImages(source, cover, body);
    if (missingImages.length > 0) {
      skipped.push(`${slug}: ${missingImages.join(', ')}`);
      continue;
    }

    const data = {
      title: hugo.title,
      date: hugo.date,
      author: hugo.author,
      // W Hugo kategoria była tylko tagiem. Tagi zostają bez zmian, kategoria to nowe pole.
      category: hugo.tags.includes('aktualności') ? 'aktualnosci' : 'projekty',
      tags: hugo.tags,
      cover: `./${cover}`,
      ...(hugo.github_link && { githubLink: hugo.github_link }),
      draft: hugo.draft,
    };

    const target = join(CONTENT, 'blog', slug);
    mkdirSync(target, { recursive: true });
    writeFileSync(join(target, 'index.md'), `---\n${stringifyYaml(data)}---\n${body}`);
    copyAttachments(source, target, slug);
  }
  if (skipped.length > 0) {
    console.warn('Pominięte wpisy (brak zdjęcia) — dopisz je do TODO.md:\n  ' + skipped.join('\n  '));
  }
}

// Brak okładki albo brak lokalnego obrazka z treści wywróciłby build, więc taki wpis pomijamy.
function findMissingImages(source, cover, body) {
  if (!cover) return ['brak pola image'];
  const localImages = [...body.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)]
    .map((match) => match[1])
    .filter((src) => !/^https?:\/\//.test(src));
  return [cover, ...localImages].filter((file) => !existsSync(join(source, file)));
}

// Astro optymalizuje tylko obrazki zapisane w Markdownie (![](...)), nie w surowym HTML.
// Pusta linia wokół obrazka sprawia, że Markdown wewnątrz <figure> zostaje przetworzony.
function fixRawImages(markdown) {
  return markdown.replace(/[ \t]*<image\s+([^>]*?)\s*\/?>/g, (_, attributes) => {
    const src = attributes.match(/src="([^"]*)"/)[1];
    const alt = attributes.match(/alt="([^"]*)"/)?.[1].trim() ?? '';
    return `\n![${alt}](${src})\n`;
  });
}

// Obrazki lądują obok index.md (przetwarza je Astro). Inne pliki (np. PDF) trafiają
// do public/blog/<slug>/, żeby działały pod tym samym adresem co w Hugo.
function copyAttachments(source, target, slug, subdir = '') {
  for (const entry of readdirSync(join(source, subdir), { withFileTypes: true })) {
    const path = join(subdir, entry.name);
    if (entry.isDirectory()) {
      copyAttachments(source, target, slug, path);
    } else if (IMAGE_EXTENSIONS.includes(extname(entry.name).toLowerCase())) {
      mkdirSync(join(target, subdir), { recursive: true });
      copyFileSync(join(source, path), join(target, path));
    } else if (entry.name !== 'index.md') {
      const publicDir = join('public/blog', slug, subdir);
      mkdirSync(publicDir, { recursive: true });
      copyFileSync(join(source, path), join(publicDir, entry.name));
    }
  }
}

// W config.toml osiągnięcia mają tylko długi tytuł i opis. Krótkie teksty na karty
// (znak, tytuł, opis) pochodzą z zatwierdzonego wzorca design/index.html.
const achievementCards = {
  'https://w.prz.edu.pl/uczelnia/aktualnosci/kolejny-sukces-kola-naukowego-machine-learning-3023.html':
    { file: 'spaceshield-hack-2026', mark: '1.', title: 'SpaceShield Hack', description: 'Dostępność transportu publicznego w Stalowej Woli z danych satelitarnych' },
  'https://prz.edu.pl/uczelnia/aktualnosci/sukces-studentow-kola-naukowego-machine-learninga-2978.html':
    { file: 'edth-detect-defend-2026', mark: '1.', title: 'EDTH Detect & Defend', description: 'Sieć czujników mesh do wykrywania dronów' },
  'https://prz.edu.pl/uczelnia/aktualnosci/pci-nagrodzilo-innowacyjne-projekty-kol-naukowych-2997.html':
    { file: 'pci-2026', mark: 'PCI', title: 'Podkarpackie Centrum Innowacji', description: 'Rozproszona sieć czujników wykrywających drony' },
  'https://wmifs.prz.edu.pl/aktualnosci/wyroznienie-dla-kola-naukowego-machine-learning-381.html':
    { file: 'bitehack-2023', mark: 'W', title: 'BITEHack | AI', description: 'Analiza zużycia energii w budynkach' },
  'https://w.prz.edu.pl/uczelnia/aktualnosci/sukces-studentow-kola-naukowego-machine-learning-2131.html':
    { file: 'bitehack-2022', mark: '2.', title: 'BITEHack | AI', description: 'Wykrywanie negatywnych emocji w sieci' },
  'https://wmifs.prz.edu.pl/aktualnosci/pierwsza-nagroda-dla-kola-naukowego-machine-learning-363.html':
    { file: 'kokon-2022', mark: 'KoKoN', title: 'Cyfryzacja', description: 'LARKFiD — Open Gov Data i aplikacje na GPU' },
  'https://wmifs.prz.edu.pl/aktualnosci/kolo-naukowe-machine-learning-wyroznione-w-kategorii-debiut-roku-2021-298.html':
    { file: 'struna-2021', mark: 'W', title: 'StRuNa — Debiut Roku', description: 'Wyróżnienie dla nowego koła naukowego' },
};

function migrateAchievements() {
  const target = join(CONTENT, 'achievements');
  mkdirSync(target, { recursive: true });
  for (const item of config.params.achievements.items) {
    const card = achievementCards[item.url];
    if (!card) throw new Error(`Brak krótkiego tekstu karty dla: ${item.title}`);
    // Najpierw „II miejsce”, bo „I miejsce” jest jego początkiem.
    const place = ['II miejsce', 'I miejsce', 'Nagroda', 'Wyróżnienie'].find((p) => item.title.startsWith(p));
    const data = {
      year: Number(item.title.match(/\b(\d{4})\b/)[1]),
      place,
      mark: card.mark,
      title: card.title,
      description: card.description,
      url: item.url,
    };
    writeFileSync(join(target, `${card.file}.yaml`), stringifyYaml(data));
  }
}

function migratePartners() {
  const target = join(CONTENT, 'partners');
  mkdirSync(target, { recursive: true });
  for (const item of config.params.partners.items) {
    const file = slugify(item.name);
    const logoFile = file + extname(item.logo);
    copyFileSync(join(OLD, 'static', item.logo), join(target, logoFile));
    const data = { name: item.name, logo: `./${logoFile}`, url: item.url, tier: 'partner' };
    writeFileSync(join(target, `${file}.yaml`), stringifyYaml(data));
  }
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

migrateBlog();
migrateAchievements();
migratePartners();
