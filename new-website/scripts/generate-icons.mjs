// Generuje favicony i domyślny obrazek podglądu linku (Open Graph) do public/:
//   favicon.svg, favicon-32.png, apple-touch-icon.png (180×180), og-default.png (1200×630).
// Uruchom z katalogu new-website/ po zmianie logo albo kolorów:  node scripts/generate-icons.mjs
//
// Kolory czyta z src/styles/tokens.css, logo z src/assets/knml-logo.svg — nic nie jest tu
// wpisane na sztywno. sharp i fontkitten to zależności samego Astro, nie dodajemy nowych paczek.
// Napis zamieniamy na ścieżki SVG przez fontkitten, bo sharp nie potrafi wczytać fontów woff2.

import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { create as openFont } from 'fontkitten';

const PUBLIC = 'public';
const tokensCss = readFileSync('src/styles/tokens.css', 'utf8');
const logoSvg = readFileSync('src/assets/knml-logo.svg', 'utf8');

function token(name) {
  const match = tokensCss.match(new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{3,8})`));
  if (!match) throw new Error(`Brak tokenu ${name} w tokens.css`);
  return match[1];
}

const brand = token('--color-brand');
const background = token('--bg');
const onDark = token('--on-dark');

const logoViewBox = logoSvg.match(/viewBox="([^"]+)"/)[1];
const logoInner = logoSvg.slice(logoSvg.indexOf('>') + 1, logoSvg.lastIndexOf('</svg>'));
// fill-rule jak w KnmlLogo.astro, inaczej węzły sieci wychodzą jako pełne koła.
const logo = (color, attrs = '') =>
  `<svg ${attrs} viewBox="${logoViewBox}" fill="${color}" fill-rule="evenodd">${logoInner}</svg>`;
const png = (svg) => sharp(Buffer.from(svg)).png();

// Favicony
const faviconSvg = logo(brand, 'xmlns="http://www.w3.org/2000/svg"');
writeFileSync(`${PUBLIC}/favicon.svg`, faviconSvg);
await png(faviconSvg).resize(32, 32).toFile(`${PUBLIC}/favicon-32.png`);
// iOS nie obsługuje przezroczystości w ikonie, więc dajemy tło strony i margines.
await png(
  `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect width="180" height="180" fill="${background}"/>${logo(brand, 'x="22" y="22" width="136" height="136"')}</svg>`,
).toFile(`${PUBLIC}/apple-touch-icon.png`);

// Obrazek Open Graph: logo i nazwa koła na tle koloru głównego.
// fontkitten nie umie zmienić grubości fontu zmiennego z woff2 (getVariation zwraca puste glify),
// więc bierzemy domyślną grubość 400 i pogrubiamy napis obrysem (≈ 600 jak w nagłówkach strony).
const fontFiles = ['latin', 'latin-ext'].map((subset) =>
  openFont(readFileSync(`node_modules/@fontsource-variable/unbounded/files/unbounded-${subset}-wght-normal.woff2`)),
);

// Każdą literę bierzemy z pierwszego pliku fontu, który ją ma („ł” jest tylko w latin-ext).
function textToPath(text, fontSize, x, y) {
  let d = '';
  let cursor = x;
  for (const char of text) {
    const font = fontFiles.find((f) => f.glyphsForString(char)[0].id !== 0) ?? fontFiles[0];
    const glyph = font.glyphsForString(char)[0];
    const scale = fontSize / font.unitsPerEm;
    d += glyph.path.scale(scale, -scale).translate(cursor, y).toSVG();
    cursor += glyph.advanceWidth * scale;
  }
  return { d, width: cursor - x };
}

const lines = ['Koło Naukowe', 'Machine Learning', 'PRz'];
const textX = 500;
const maxTextWidth = 1200 - textX - 80;
const widestAt100 = Math.max(...lines.map((line) => textToPath(line, 100, 0, 0).width));
const fontSize = Math.min(72, Math.floor((100 * maxTextWidth) / widestAt100));
const lineHeight = fontSize * 1.2;
const firstBaseline = 315 - (lineHeight * lines.length) / 2 + fontSize * 0.8;
const textPaths = lines
  .map((line, i) => `<path d="${textToPath(line, fontSize, textX, firstBaseline + i * lineHeight).d}"/>`)
  .join('');

await png(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect width="1200" height="630" fill="${brand}"/>
    ${logo(onDark, 'x="90" y="145" width="340" height="340"')}
    <g fill="${onDark}" stroke="${onDark}" stroke-width="${(fontSize * 0.035).toFixed(1)}" stroke-linejoin="round">${textPaths}</g>
  </svg>`,
).toFile(`${PUBLIC}/og-default.png`);

console.log('Zapisano favicon.svg, favicon-32.png, apple-touch-icon.png i og-default.png w public/.');
