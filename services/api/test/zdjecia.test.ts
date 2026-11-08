import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { ImageError, processImage } from '../src/zdjecia';
import { hasHeifDec, jpeg } from './setup';

// Zdjęcie 300×200: lewa połowa czerwona, prawa niebieska. Z EXIF Orientation=6 (telefon trzymany
// pionowo) ma się wyświetlać jako 200×300 z czerwienią na górze.
const RED_LEFT_BLUE_RIGHT = (() => {
  const [width, height] = [300, 200];
  const pixels = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) pixels[i * 3 + (i % width < width / 2 ? 0 : 2)] = 220;
  return { pixels, width, height };
})();

const GPS = { GPSLatitudeRef: 'N', GPSLatitude: '50/1 2/1 0/1', GPSLongitudeRef: 'E', GPSLongitude: '21/1 59/1 0/1' };

const rotatedPhoneJpeg = () => {
  const { pixels, width, height } = RED_LEFT_BLUE_RIGHT;
  return sharp(pixels, { raw: { width, height, channels: 3 } })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .withExif({ IFD0: { Make: 'Apple', Model: 'iPhone' }, IFD3: GPS })
    .toBuffer();
};

// Kolor piksela w połowie szerokości, przy górnej i dolnej krawędzi: 'czerwony' albo 'niebieski'.
async function topAndBottom(image: Buffer) {
  const { data, info } = await sharp(image).raw().toBuffer({ resolveWithObject: true });
  const colorAt = (y: number) => {
    const i = (y * info.width + Math.floor(info.width / 2)) * info.channels;
    return data[i] > data[i + 2] ? 'czerwony' : 'niebieski';
  };
  return [colorAt(5), colorAt(info.height - 5)];
}

// Znacznik GPS w bloku EXIF (tag 0x8825, zapis little- albo big-endian).
const hasGps = (exif?: Buffer) => !!exif && (exif.includes(Buffer.from([0x25, 0x88])) || exif.includes(Buffer.from([0x88, 0x25])));

describe('processImage', () => {
  it('zmniejsza duże zdjęcie do 2000 px po dłuższym boku', async () => {
    const landscape = await sharp(await processImage(await jpeg(4000, 3000), 'a.jpg', './a.jpg')).metadata();
    expect([landscape.width, landscape.height]).toEqual([2000, 1500]);
    const portrait = await sharp(await processImage(await jpeg(1000, 5000), 'a.jpg', './a.jpg')).metadata();
    expect([portrait.width, portrait.height]).toEqual([400, 2000]);
  });

  it('małego zdjęcia nie powiększa', async () => {
    const small = await sharp(await processImage(await jpeg(800, 600), 'a.jpg', './a.jpg')).metadata();
    expect([small.width, small.height]).toEqual([800, 600]);
  });

  it('obraca według EXIF i usuwa metadane razem z GPS', async () => {
    const input = await rotatedPhoneJpeg();
    const before = await sharp(input).metadata();
    expect([before.orientation, hasGps(before.exif)]).toEqual([6, true]);

    const output = await processImage(input, 'IMG_1.jpg', './img-1.jpg');
    const after = await sharp(output).metadata();
    expect([after.width, after.height, after.orientation, after.exif, after.xmp]).toEqual([200, 300, undefined, undefined, undefined]);
    expect(await topAndBottom(output)).toEqual(['czerwony', 'niebieski']);
  });

  it('zapisuje w formacie z nazwy pliku we wpisie (PNG zostaje PNG, WebP zostaje WebP)', async () => {
    const base = sharp({ create: { width: 50, height: 50, channels: 4, background: '#fff' } });
    expect((await sharp(await processImage(await base.clone().png().toBuffer(), 'a.png', './a.png')).metadata()).format).toBe('png');
    expect((await sharp(await processImage(await base.clone().webp().toBuffer(), 'a.webp', './a.webp')).metadata()).format).toBe('webp');
  });

  it('odrzuca plik, który nie jest zdjęciem, i GIF-a', async () => {
    await expect(processImage(new TextEncoder().encode('%PDF-1.7 to nie zdjęcie'), 'cv.jpg', './cv.jpg')).rejects.toThrow(
      new ImageError('Plik „cv.jpg” nie jest zdjęciem albo jest uszkodzony. Dodaj zdjęcie JPG, PNG, WebP albo HEIC.'),
    );
    const gif = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#000' } }).gif().toBuffer();
    await expect(processImage(gif, 'animacja.jpg', './animacja.jpg')).rejects.toThrow(/nie jest zdjęciem/);
  });

  it.skipIf(!hasHeifDec)('HEIC z iPhone\'a (HEVC, obrót, GPS): JPG, obrócony raz, bez metadanych', async () => {
    const input = readFileSync(new URL('./fixtures/iphone-obrot-gps.heic', import.meta.url));
    const before = await sharp(input).metadata();
    expect([before.format, before.compression, hasGps(before.exif)]).toEqual(['heif', 'hevc', true]);

    const output = await processImage(input, 'IMG_0001.HEIC', './img-0001.jpg');
    const after = await sharp(output).metadata();
    expect([after.format, after.width, after.height, after.exif]).toEqual(['jpeg', 200, 300, undefined]);
    expect(await topAndBottom(output)).toEqual(['czerwony', 'niebieski']);
  });

  it.skipIf(!hasHeifDec)('uszkodzony HEIC: czytelny błąd', async () => {
    const input = readFileSync(new URL('./fixtures/iphone-obrot-gps.heic', import.meta.url));
    await expect(processImage(input.subarray(0, 600), 'IMG_2.HEIC', './img-2.jpg')).rejects.toThrow(/IMG_2\.HEIC/);
  });
});
