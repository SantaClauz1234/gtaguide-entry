[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/SantaClauz1234/gtaguide-entry/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/SantaClauz1234/gtaguide-entry/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
# Leonida Ledger — a GTA VI trophy guide you can actually finish

Grand Theft Auto VI has 55 PlayStation 5 trophies, and the road to the
platinum is long enough that a plain list is not enough. Leonida Ledger is
an offline guide *and* a tracker: it tells you what each trophy asks for,
in which order to chase them, which ones can slip away if you play past
them — and it remembers how far you have got, in your own browser, with
no account and no network at all.

This is an independent, unofficial fan guide. It contains no Rockstar
Games logo, no official artwork and no screenshot of the game. Every
guide is written for this entry, in our own words. The only text shown
exactly as published is the official trophy names and descriptions from
PlayStation.

## The list, by the numbers

- **55 trophies:** 1 platinum, 2 gold, 6 silver, 46 bronze.
- **28 hidden:** their names and descriptions stay covered until earned,
  while the spoiler setting is on.
- **20 counted trophies** with a numeric target PlayStation itself
  tracks — 250 stunts, 42 Shooting Range golds, 52 areas of Leonida,
  $250,000 laundered, and the rest. Seventeen of them are plain counts
  that add up to 1,290 units; the three money targets (dollars laundered,
  dollars spent, garage properties) are kept separate, because dollars
  are not stunts.
- **125 steps, each cited.** Every trophy's guide is broken into 2–3
  steps, and every step names its source. Fourteen steps rest on an
  estimate and are flagged as estimates in the app, not presented as
  fact.
- **14 missable flags:** 10 to watch, 4 unconfirmed. A flag is only ever
  derived from the official trophy description — if the description does
  not pin the trigger down, the guide says so instead of inventing one.

## What you get in the app

**Tracker.** Tick a trophy off and it stays ticked: progress is saved
in `localStorage` in your browser. Counted trophies get a counter you
can nudge up and down (or type into), and every trophy has room for a
private note — where you left a strand half-finished, a spot to revisit.

**Next trophy.** Above the list, the app suggests the easiest trophy
you have not earned yet, ranked from your current progress: bronze
before silver and gold, early roadmap stages before late ones, short
estimated steps before long grinds, a counted trophy you are already
close on before one you have barely started, and a missable-watch
trophy pulled forward so you do it before its window closes. Tap the
suggestion and its guide opens. Earn it, and the next one takes its
place.

**Guide pane.** Click any trophy and the pane beside the list shows its
official description, its own-words guide, its cited steps with their
estimated minutes, whether it is missable and how sure we are, and the
sources behind each fact. Hidden story trophies show nothing but a
placeholder until earned or until spoilers are switched off.

**Roadmap to the platinum.** Six stages, in the order this guide
recommends, with our own time estimates (88 hours across all six):
story first, then the stranger strands, the collectibles and
exploration sweep, the activity grinds, crime and money, and the 100%
cleanup last. Each stage card shows how many of its trophies you have
already earned.

**Missable Watch.** One view with just the 14 flagged trophies, each
labelled WATCH or UNCONFIRMED with its grade, stage and sources — so
you can clear the risky ones before the finale instead of discovering
afterwards that one is gone.

**Statistics.** A page computed live from the trophy data and your
saved progress: earned by grade, counted progress (1,290 non-money
units), hidden trophies earned, missable flags cleared, cited steps,
and estimated roadmap time left. Nothing here is typed in by hand;
change a tick and the numbers move.

**Search, filters, spoilers.** Search by name, mission or a word in a
guide; filter by kind (story, strangers, collectibles, activities,
crime, money, exploration, misc, 100%, platinum) and by grade; show
only missable-watch trophies; hide the ones you have earned; hide
story spoilers.

**Export and import.** Back up the whole save — earned trophies,
counters, notes, spoiler setting — to a JSON file, and restore it
later. Import is validated: unknown trophy names are dropped, counts
are clamped to their targets, notes are capped, and a file that is not
a Leonida Ledger export imports nothing at all.

## How to use it

Open `app/index.html` in a desktop browser. That is all — the app is
static files, it loads only its own files, and it works with the
network off. For a local preview server instead:

```sh
node serve.ts
```

then open the address it prints (http://localhost:8080 by default).

To hand the guide in for the make.fun competition, `main.ts` at the
root is the entry point. It checks the data first — all 55 trophies
present, each with a name and a non-blank guide, steps covering all 55
— then copies `app/` and `screenshots/` to the output directory and
writes `dossier.json` with the kit's vendored `buildDossier` helper:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

It also prints the suggested first trophy: the easiest one on the
list before any progress is marked, by the same ranking the app uses.

## Where the facts come from

The trophy names, descriptions, grades, hidden flags and counted
targets are the official PlayStation list, as carried in the
competition kit and as listed by Exophase and PSNProfiles — the two
listings agree on every name, description and grade. The 28 hidden
trophies were triangulated from three independent published listings
of the same official list; all three agree on exactly the same 28.

Each guide cites its sources beside it, keyed in the data as EXO
(Exophase), PSNP (PSNProfiles), PSN (the official PlayStation
descriptions) and OWN (this guide's own reading of the official
descriptions). A source is cited, never copied: the guides are our
own words throughout. Where no source pins a location or a step down,
the guide says so and marks the trophy derived or unconfirmed.

Confidence is labelled per trophy: 40 official, 11 derived, 4
unconfirmed. The roadmap order and its hours are this guide's own
estimates, reasoned from the official descriptions, and are labelled
as estimates wherever they appear.

## What is in this repository

- `app/index.html`, `app/style.css`, `app/app.js` — the guide itself:
  tracker, guide pane, roadmap, Missable Watch, Statistics, sources
  and method. Plain browser JavaScript, no library, no build step.
- `app/data/trophies.json` — the 55 trophies: official name,
  description, grade, hidden flag, kind, roadmap stage, counted
  target where one exists, missable flag, confidence, sources, and
  the own-words guide.
- `app/data/steps.json` — the 125 cited steps, 2–3 per trophy, with
  their sources and estimated minutes.
- `screenshots/` — four real renders of the app in a browser: the
  tracker, the roadmap, the Missable Watch, and Statistics. The
  first by name is the cover.
- `main.ts` — the hand-in program: validates the data, copies the
  app and screenshots, writes `dossier.json`.
- `serve.ts` — a small local preview server for trying the app.
- `research.md` — data-verification notes and the competition
  requirements this entry was built against.
- `vendor/makefun-frontend.ts` — the competition kit's dossier
  helper, unchanged.
- `LICENSE` — MIT.

## License

MIT — see `LICENSE`.
