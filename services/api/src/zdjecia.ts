import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';

// Zdjęcia przed zapisem w repo: obrót według telefonu, najwyżej 2000 px, bez metadanych (GPS,
// model telefonu, data). Sharp domyślnie nie przepisuje metadanych do nowego pliku.
// Rozmiary do konkretnego układu strony robi Astro przy buildzie, tu nie kadrujemy.

const MAX_SIDE = 2000;
const OUTPUT_FORMATS = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', webp: 'webp' } as const;
const INPUT_FORMATS = ['jpeg', 'png', 'webp', 'heif'];

export class ImageError extends Error {
  // 400: problem z plikiem autora, 500: problem z serwerem.
  constructor(
    message: string,
    readonly status: 400 | 500 = 400,
  ) {
    super(message);
  }
}

const notAnImage = (name: string) => new ImageError(`Plik „${name}” nie jest zdjęciem albo jest uszkodzony. Dodaj zdjęcie JPG, PNG, WebP albo HEIC.`);

// Sharp z npm czyta HEIC, ale nie umie zdekodować HEVC (kompresji zdjęć z iPhone'a). Robi to
// heif-dec z libheif, zainstalowany w obrazie Docker (Dockerfile). Wynik ma już zastosowany obrót.
async function heicToJpeg(input: Uint8Array, name: string): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), 'heic-'));
  try {
    await writeFile(join(dir, 'zdjecie.heic'), input);
    await promisify(execFile)('heif-dec', ['--quality', '95', join(dir, 'zdjecie.heic'), join(dir, 'zdjecie.jpg')], { timeout: 60_000 });
    return await readFile(join(dir, 'zdjecie.jpg'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT' && (error as NodeJS.ErrnoException).syscall?.startsWith('spawn')) {
      console.error('Brak programu heif-dec: uruchom usługę z obrazu Docker (services/api/Dockerfile).');
      throw new ImageError(`Serwer nie umie teraz odczytać zdjęć HEIC („${name}”). Zapisz zdjęcie jako JPG i dodaj je ponownie, a adminowi strony daj znać o problemie.`, 500);
    }
    throw notAnImage(name);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// name: nazwa pliku od autora (do komunikatów), postPath: ścieżka we wpisie, np. ./okladka.jpg.
// Format wyniku wynika z postPath (HEIC → .jpg ustala już buildPost w src/redakcja/wpis.ts).
export async function processImage(input: Uint8Array, name: string, postPath: string): Promise<Buffer> {
  const metadata = await sharp(input)
    .metadata()
    .catch(() => null);
  if (!metadata || !INPUT_FORMATS.includes(metadata.format ?? '')) throw notAnImage(name);

  const source = metadata.format === 'heif' && metadata.compression === 'hevc' ? await heicToJpeg(input, name) : input;
  const extension = postPath.split('.').pop()!.toLowerCase() as keyof typeof OUTPUT_FORMATS;
  try {
    return await sharp(source)
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      .toFormat(OUTPUT_FORMATS[extension], { quality: 85 })
      .toBuffer();
  } catch {
    throw notAnImage(name);
  }
}
