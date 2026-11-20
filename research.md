# gta6-trophy-guide-01 — recorded rebuild: research & data notes

Session: 2026-11-20 (recorded rebuild of "Leonida Ledger"). This branch starts
from the make.fun anchor `177f046` (drand round 34102910) and rewrites the app
in this session; the verified trophy *data* is carried over from the earlier
unrecorded branch because it is fact, not code.

## What the kit demands (RULES.txt + competition.yaml, read this session)

- Format program/v1: `main.ts` copies `app/` + `screenshots/` to the output
  directory and writes `dossier.json` with the kit's unchanged
  `vendor/makefun-frontend.ts` (`buildDossier`, sha256
  4c8da1c8e76490b3a847670f49137d3ec23953e3c988fe6a6cb320fce5739240).
- The app is static files under `app/`, opens offline in desktop Chrome, loads
  nothing over the network, and uses no Rockstar logo or artwork.
- `app/data/trophies.json` must name all 55 official trophies, each with a
  non-blank `guide` in our own words that cites its sources. An uncited
  specific claim earns the judge no credit; a cited guide beats an uncited one.
- Required tracker behaviour: checklist saved in localStorage, export to a
  file and import back, filters by kind, and a spoiler setting that hides
  story-trophy names/descriptions until earned.
- Screenshots: 3 or 4 real renders, each at most 256 KiB, long side at most
  1280 px, short side at least 480 px. Dossier at most 1.5 MiB.

## The official list, verified

- 55 trophies: 1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden.
- Names, descriptions and grades are byte-faithful to the frozen official
  list in the kit starter, which the kit states agrees between the Exophase
  and PSNProfiles listings on every name, description and grade.
- 20 trophies carry a PSN-tracked count (target + unit in the data): 100%
  completion, 250 stunts, 42 Shooting Range golds, 52 Leonida areas,
  $250,000 laundered, $100,000 spent, 500 tracked choices, and 13 more.
- Hidden flags were triangulated from three independent published listings
  of the same official list, all agreeing on the same 28.

## Data carried into this branch (stage A)

- `app/data/trophies.json` — per trophy: id, official name/description/grade,
  hidden flag, kind, roadmap stage (1–6), target+unit for the 20 counted,
  missableRisk (none/watch/unconfirmed — derived from the official
  description only, never invented), confidence, named source keys, and a
  guide in our own words citing those sources. Guide average: 285 chars.
- `app/data/steps.json` — 125 cited steps across all 55 trophies (2–3 each);
  every step carries its own citation keys, 14 steps are marked as estimates,
  and the estimated minutes total 7,405. Guide + steps average: 480 chars
  per trophy.
- Source keys used in the data: EXO (Exophase official list), PSNP
  (PSNProfiles trophy list), PSN (the official PlayStation description),
  OWN (this guide's own advice, derived from the official description).

## Build plan for this branch

- Stage B: the app itself — tracker list + guide detail pane, localStorage
  checklist with per-trophy counters, search and kind/grade filters,
  spoiler toggle, six-stage platinum roadmap, Missable Watch page.
- Stage C: enrichment — Statistics page computed live from the data, a
  private note per trophy, validated export/import, four browser-rendered
  screenshots, and a fresh `main.ts`/`serve.ts` handover pair.
