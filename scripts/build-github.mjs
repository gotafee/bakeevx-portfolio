import { execFileSync } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = '/bakeevx-portfolio/';
const dist = path.resolve('dist');

execFileSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build'], { stdio: 'inherit' });

async function rewrite(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await rewrite(file);
    if (!entry.isFile() || !/\.(html|css)$/i.test(entry.name)) continue;
    const source = await readFile(file, 'utf8');
    const updated = source
      .replace(/((?:href|src)=['"])\/(?!\/)/g, `$1${base}`)
      .replace(/url\((['"]?)\/(?!\/)/g, `url($1${base}`);
    if (updated !== source) await writeFile(file, updated);
  }
}

await rewrite(dist);
