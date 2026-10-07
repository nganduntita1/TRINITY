// Turns the raw Instagram downloads in /source-images into optimized WebP
// assets in /assets/img (a large + medium width for each).
// Usage: node scripts/process-images.mjs   (needs `sharp` resolvable)
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const src = (f) => join(root, 'source-images', f);
const out = join(root, 'assets', 'img');

// name: output basename, file: source, crop: { left, top, width, height } in source px
const jobs = [
  // Full editorial frames
  { name: 'look-duo', file: 'DcL6-LGxR0m-01.jpg' },
  { name: 'look-trio', file: 'DXVZwSAEQFp-02.jpg' },
  { name: 'look-group', file: 'DXVZwSAEQFp-01.jpg' },
  { name: 'nahar-brown-set', file: 'Dd3_K2Vx2G0-01.jpg' },
  { name: 'wisdom-top', file: 'DeHfUSNxSYz-01.jpg' },
  { name: 'studio-hall', file: 'DdmDTulRdEl-01.jpg' },
  { name: 'bts-collage', file: 'Dd1cye4xDQG-01.jpg' },

  // Product crops
  { name: 'nahar-detail', file: 'Dd3_K2Vx2G0-01.jpg', crop: { left: 614, top: 200, width: 1843, height: 2457 } },
  { name: 'wisdom-detail', file: 'DeHfUSNxSYz-01.jpg', crop: { left: 768, top: 0, width: 1536, height: 2048 } },
  { name: 'havilah-shirt', file: 'DcL6-LGxR0m-01.jpg', crop: { left: 661, top: 300, width: 912, height: 1216 } },
  { name: 'havilah-shirt-2', file: 'DXVZwSAEQFp-02.jpg', crop: { left: 648, top: 330, width: 792, height: 1056 } },
  { name: 'havilah-shirt-3', file: 'DXVZwSAEQFp-01.jpg', crop: { left: 115, top: 560, width: 576, height: 768 } },
  { name: 'cedar-longsleeve', file: 'DcL6-LGxR0m-01.jpg', crop: { left: 0, top: 300, width: 818, height: 1090 } },
  { name: 'cedar-longsleeve-2', file: 'DXVZwSAEQFp-02.jpg', crop: { left: 72, top: 150, width: 677, height: 903 } },
  { name: 'sky-shirt', file: 'DXVZwSAEQFp-01.jpg', crop: { left: 605, top: 90, width: 520, height: 693 } },
  { name: 'eden-dress', file: 'Ddtv7grxC1g-01.jpg', crop: { left: 0, top: 150, width: 640, height: 853 } },
  { name: 'flourish-emblem', file: 'DWt25MokZzf-13.jpg', crop: { left: 280, top: 250, width: 520, height: 800 } }
];

await mkdir(out, { recursive: true });

for (const job of jobs) {
  const base = () => (job.crop ? sharp(src(job.file)).extract(job.crop) : sharp(src(job.file)));
  const { width } = job.crop ?? (await sharp(src(job.file)).metadata());
  for (const [suffix, w] of [['lg', 1400], ['md', 720]]) {
    await base()
      .resize({ width: Math.min(w, width), withoutEnlargement: true })
      .webp({ quality: suffix === 'lg' ? 80 : 74 })
      .toFile(join(out, `${job.name}-${suffix}.webp`));
  }
  console.log('✓', job.name);
}
