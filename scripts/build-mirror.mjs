import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Separate output: the Pages artifact and source manifest remain untouched.
const output = resolve('dist-mirror');
const temporary = await mkdtemp(join(tmpdir(), 'piclex-mirror-'));
const sha = data => createHash('sha256').update(data).digest('hex');
try {
  await mkdir(output); // Refuse to overwrite a previous release.
  execFileSync('npm', ['run', 'build', '--', '--base=/web/', `--outDir=${join(temporary, 'web')}`], { stdio: 'inherit' });
  const web = join(temporary, 'web');
  const sourcePath = join(web, 'source.json');
  const source = JSON.parse(await readFile(sourcePath, 'utf8'));
  for (const deck of source.decks) {
    for (const field of ['packageURL', 'coverURL']) {
      const url = new URL(deck[field]);
      if (url.origin !== 'https://zhaoolee.com' || !url.pathname.startsWith('/piclex-web/')) throw new Error('Unexpected example URL');
      deck[field] = `https://piclex.v2fy.com/web/${url.pathname.slice('/piclex-web/'.length)}`;
    }
  }
  await writeFile(sourcePath, JSON.stringify(source, null, 2) + '\n');
  const creditsPath = join(web, 'credits.html');
  await writeFile(creditsPath, (await readFile(creditsPath, 'utf8')).replace('href="./"', 'href="/"'));
  await cp(web, join(output, 'web'), { recursive: true });
  await cp(join(web, 'index.html'), join(output, 'index.html'));
  const files = {};
  async function collect(directory, prefix = '') {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const relative = prefix + entry.name;
      if (entry.isDirectory()) await collect(join(directory, entry.name), relative + '/');
      else if (entry.isFile()) {
        const bytes = await readFile(join(directory, entry.name));
        files[relative] = { bytes: bytes.length, sha256: sha(bytes) };
      } else throw new Error('Release may contain only regular files');
    }
  }
  await collect(output);
  const sourceRevision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const releaseID = `${sourceRevision.slice(0, 12)}-${sha(JSON.stringify(files)).slice(0, 12)}`;
  await writeFile(join(output, 'release.json'), JSON.stringify({ releaseID, sourceRevision, origin: 'https://piclex.v2fy.com', files }, null, 2) + '\n');
  console.log(`Mirror ready: ${output}\nRelease: ${releaseID}`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
