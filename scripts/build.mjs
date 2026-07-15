import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import './check.mjs';

const output = join(process.cwd(), 'public');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const entry of ['index.html', 'qualifier.html', 'robots.txt', 'sitemap.xml', 'assets', 'components', 'pages']) {
  await cp(entry, join(output, entry), { recursive: true });
}

const vercel = JSON.parse(await readFile('vercel.json', 'utf8'));
if (vercel.outputDirectory !== 'public') {
  throw new Error('vercel.json outputDirectory must be "public"');
}

console.log(`Static deployment output created at ${output}`);
