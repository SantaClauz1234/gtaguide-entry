# Leonida Ledger — GTA VI Trophy Guide & Tracker

A self-contained, offline trophy guide and progress tracker for all 55
official GTA VI trophies (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden).
The app is static files only — it opens in a desktop browser with no network
access and no external assets, and uses no Rockstar logo or artwork.

## What it does

- **Tracker** — the full 55-trophy list with a checklist that persists in
  `localStorage`, including per-trophy counters for the 20 trophies that
  track a numeric target (100% completion, 250 stunts, 42 Shooting Range
  golds, $250,000 laundered, and more).
- **Guide detail pane** — every trophy carries a guide written in our own
  words that cites its sources, plus 125 individually cited steps (2–3 per
  trophy) with estimated minutes; steps that rest on estimates are marked
  as such.
- **Platinum roadmap** — a six-stage route from first boot to platinum,
  ordered so missable content is handled at the right time.
- **Missable Watch** — a dedicated view of trophies flagged by missable risk
  (derived only from the official trophy descriptions, never invented).
- **Statistics** — a stats page computed live from the trophy data:
  completion by grade, kind and roadmap stage, and total estimated time.
- **Spoiler mode** — hides story-trophy names and descriptions until they
  are earned.
- **Search & filters** — filter by kind and grade, search by name.
- **Export / import** — back up the checklist to a file and restore it,
  with validation on import; a private note can be kept per trophy.

## Data

`app/data/trophies.json` names all 55 official trophies with their official
names, descriptions and grades, hidden flags, roadmap stage, counted targets
where they exist, and a cited guide per trophy. `app/data/steps.json` holds
the 125 cited steps. Sources are keyed in the data (Exophase, PSNProfiles,
the official PlayStation descriptions, and this guide's own derived advice).

## How to run

Open `app/index.html` in a desktop browser, or use the bundled preview
server:

```sh
node serve.ts        # local preview of the tracker
```

For the make.fun hand-in, `main.ts` is the entry point: it copies `app/` and
`screenshots/` to the output directory and writes `dossier.json` using the
kit's `vendor/makefun-frontend.ts` helper.

## Layout of this repo

- `app/` — the tracker (`index.html`, `style.css`, `app.js`) and `data/`
  (trophies + steps)
- `screenshots/` — rendered shots: tracker, roadmap, missable watch, stats
- `main.ts` / `serve.ts` — hand-in entry point / local preview server
- `research.md` — data verification notes and the competition requirements

## License

MIT — see `LICENSE`.
