// Leonida Ledger — handover program for gta6-trophy-guide-01 (Node, standard
// library only). The guide itself is the static app in app/; this program is
// what hands it in. It copies app/ and screenshots/ into the output directory
// and writes dossier.json there with the kit's vendored buildDossier, so the
// dossier on disk is byte-for-byte the one the sealed scorer rebuilds.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// vendor/makefun-frontend.ts is the kit's file and must stay untouched.

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const EXPECTED_TROPHY_TOTAL = 55;

// Refuse to hand in an incomplete guide. The trophy data must carry all 55
// official trophies, each with a name and a non-blank guide, and the step
// data must cover the same 55 — anything less fails the gate anyway, so it
// is cheaper to fail here, loudly, before a single file is copied.
const trophyFile = JSON.parse(readFileSync(join(root, 'app', 'data', 'trophies.json'), 'utf-8'));
const trophyList = Array.isArray(trophyFile) ? trophyFile : trophyFile.trophies;
if (!Array.isArray(trophyList) || trophyList.length !== EXPECTED_TROPHY_TOTAL) {
  throw new Error(`Leonida Ledger: expected ${EXPECTED_TROPHY_TOTAL} trophies, found ${trophyList?.length ?? 0}`);
}
for (const t of trophyList) {
  if (!t.name || typeof t.guide !== 'string' || !t.guide.trim()) {
    throw new Error(`Leonida Ledger: a trophy is missing its name or its guide: ${JSON.stringify(t).slice(0, 80)}`);
  }
}
const stepFile = JSON.parse(readFileSync(join(root, 'app', 'data', 'steps.json'), 'utf-8'));
const stepSets = Object.keys(stepFile.steps ?? {});
if (stepSets.length !== 55) {
  throw new Error(`Leonida Ledger: steps.json covers ${stepSets.length} trophies, expected 55`);
}
if (!existsSync(join(root, 'screenshots'))) {
  throw new Error('Leonida Ledger: screenshots/ is missing — a dossier needs 3 or 4 real renders');
}

mkdirSync(outDir, { recursive: true });
cpSync(join(root, 'app'), join(outDir, 'app'), { recursive: true });
cpSync(join(root, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

// The gate's caps, from the kit's RULES.txt: dossier text at most 163,840
// bytes, at most 4 screenshots of 256 KiB each, app/ at most 993 entries and
// 48 MiB. The build is deterministic — the same tree always produces the
// same dossier bytes.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
const stepCount = Object.values(stepFile.steps as Record<string, unknown[]>)
  .reduce((sum, arr) => sum + arr.length, 0);

// The same "next trophy" ranking the app uses, from a blank save: bronze
// before silver and gold, early roadmap stages first, short estimated
// steps before long grinds, a counted trophy's full target still ahead,
// and a missable-watch trophy pulled forward. The platinum (weight 1000)
// never wins. Hidden story trophies are skipped, exactly as the app does
// while spoilers are hidden — a suggestion the reader cannot identify by
// name is no suggestion. This is the suggested first trophy for a fresh player.
const GRADE_WEIGHT: Record<string, number> = { bronze: 0, silver: 30, gold: 60, platinum: 1000 };
let firstPick = trophyList[0];
let firstScore = Infinity;
for (const t of trophyList) {
  if (t.hidden && t.kind === 'story') continue;
  const tSteps = (stepFile.steps as Record<string, { estMin?: number }[]>)[t.id] ?? [];
  const est = tSteps.reduce((s, st) => s + (Number(st.estMin) || 0), 0);
  const score = (GRADE_WEIGHT[t.grade] ?? 0) + (t.stage ?? 6) * 20 + Math.min(est, 120)
    + (t.target ? 15 : 0) - (t.missableRisk === 'watch' ? 8 : 0);
  if (score < firstScore) { firstScore = score; firstPick = t; }
}
console.log(`Leonida Ledger: handed in 55 trophies and ${stepCount} cited steps; dossier written to ${outDir}`);
console.log(`Leonida Ledger: suggested first trophy: ${firstPick.name} (${firstPick.grade}, stage ${firstPick.stage})`);
