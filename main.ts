// Leonida Ledger — gta6-trophy-guide-01 entry program (Node 22, standard library only).
// The guide is plain static files in app/ (index.html, style.css, app.js and
// data/trophies.json) that a browser opens with the network off. This program hands it in:
// it copies app/ and screenshots/ from beside this file into the output directory and
// writes dossier.json with the kit's vendored buildDossier library, byte for byte the
// dossier the sealed scorer rebuilds. Leave vendor/makefun-frontend.ts untouched.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Gate caps from the kit's RULES.txt: at most 4 screenshots of 256 KiB each, app/ at most
// 993 files and directories and 48 MiB, dossier text at most 163,840 bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
