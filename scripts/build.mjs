import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
await build({ root });
// Preserve attribution and third-party licenses alongside the deployed bundle.
for (const name of ['LICENSE', 'licenses']) {
  await fs.cp(path.join(root, name), path.join(root, 'dist', name), { recursive: true });
}
const notices = await fs.readFile(path.join(root, 'THIRD_PARTY_NOTICES.md'), 'utf8');
await fs.writeFile(path.join(root, 'dist/THIRD_PARTY_NOTICES.md'), notices.replaceAll('(public/assets/', '(assets/'));
await fs.writeFile(path.join(root, 'dist/.nojekyll'), '');
