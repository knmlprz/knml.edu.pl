import type { LocalImageService } from 'astro';
import sharpService from 'astro/assets/services/sharp';

// Domyślny serwis obrazów Astro (sharp) z jedną zmianą: obraz z `widths` (srcset) dostaje
// w `src` największy wariant z srcset, a nie pełny oryginał (np. 8000 px prosto z aparatu).
// Dzięki temu oryginał w pełnym rozmiarze nie trafia do dist/. Włączony w astro.config.mjs (image.service).
const imageService: LocalImageService = {
  ...sharpService,
  async validateOptions(options, imageConfig, logger) {
    const validated = await sharpService.validateOptions!(options, imageConfig, logger);
    const { src, width, height } = validated;
    if (typeof src !== 'object' || !validated.widths?.length || !width || !height) return validated;

    // Ze zdjęć w Markdownie (wtyczka w astro.config.mjs) szerokości przychodzą jako tekst ("1640").
    // Astro porównuje je z width przez ===, więc bez zamiany na liczby src byłby osobnym plikiem.
    const widths = validated.widths.map(Number);
    const largest = Math.min(Math.max(...widths), src.width);
    if (largest >= width) return { ...validated, widths };
    return { ...validated, widths, width: largest, height: Math.round((height * largest) / width) };
  },
};

export default imageService;
