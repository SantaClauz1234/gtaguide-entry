# gta6-trophy-guide-01 — Step 1: teardown + data verification

Session: 2026-11-20 (build session, GAS order from user via parent).
Repo anchor verified before any write: `177f046 makefun anchor: drand round 34102910`
(+ `e3a71b3 LICENSE: MIT`), branch `submission`, tree clean.

## Kit facts (read in full: kit.json, RULES.txt, competition.yaml)

- Format program/v1. Program `main.ts` copies `app/` + `screenshots/` to output and writes
  `dossier.json` via unchanged `vendor/makefun-frontend.ts` (buildDossier).
- App: static files under `app/`, offline, zero network at runtime, no Rockstar logo/art.
- `app/data/trophies.json`: object with `trophies` array; each item needs `name` (official)
  and non-blank `guide`. Gate checks all 55 official names (normalised compare).
- Judge (pairwise, superbot / glm-5.3-flash) reads ONLY screenshots + source outline;
  a JSON file appears in the outline by path+size alone — guide text is judged only as
  screenshots show it. Rubric order: (1) tracker & data, (2) roadmap + missables built
  from official descriptions, (3) cited guidance — an uncited specific claim earns no
  credit, a guide that merely repeats the description adds nothing, (4) polish/speed.
- Screenshots: 3–4, each ≤256 KiB, long side ≤1280, short side ≥480.
- Transcript gate: ≥5 text turns, entrypoint revised in ≥2 messages, ≥30% authored lines.

## Live board (make.fun API, GET /api/competitions/gta6-trophy-guide-01/leaderboard, 2026-11-20 ~18:40 WIB)

- 5,000 entries listed on the board snapshot; @kei not on the board yet.
- #1 tidy-meteor-25 — 0.9548 ("Trophy tracker")
- #2 swift-pika-45 — 0.9523 (was #1 in the earlier Step-1 session)
- #3 kiencx — 0.9523, title advertises "446 claims cited, 300 backed by 2+ sites, 65 pages read"
- #50 = 0.9405 · #100 = 0.9343 · #200 = 0.9179 (final-heat seat cutoff; was 0.9100 earlier today — rising fast)
- Title keywords in top 200: guide 123, tracker 92, cited/cit 73, roadmap 47, missable 39,
  source 35, step 33. The citation arms race is the field's centre of gravity.

## Teardown of the top 3 hosted data files (makefun.sh, data/trophies.json read directly)

| Entry | Guide avg | Steps total | Structure that wins |
|---|---|---|---|
| #1 tidy-meteor-25 | 129 chars | 239 steps | per-step source indexes (`s:[...]`), `gate` on 36, `disputes` on 24, `count` on 22, `missable` on 9, `unconfirmed` on 3, `tags/kindLabel/stage/chapterLabel` |
| #2 swift-pika-45 | 76 chars | 174 steps | per-step `cites[]` (533 cite refs total), `sources[]` per trophy, `missable_status` + `confirm_status` enums, `disagree` + `disagree_note` (4), `count` on 16 |
| #3 kiencx | 109 chars | 317 steps | per-step `src[]` with named source keys (PowerPyx etc.), `where` field, `disputes` on 18, `unconfirmed` on 3, `count`+`unit` on 27, `missable` on 14 |

Lessons locked for our build:
1. Short guides + rich structure beat long prose. Every step carries its own citations.
2. Honesty machinery is visible and rewarded: disputes shown, unconfirmed flagged,
   confirm_status per trophy. We adopt that — and we do NOT adopt invented locations:
   any specific place/step we cannot source is labelled estimate/unconfirmed.
3. Hidden flags, counts and roadmap stage are data fields on all/most trophies.

## Trophy list verification (55/55)

- Names, descriptions, grades: kit starter `app/data/trophies.json` is the frozen official
  list; competition.yaml states Exophase and PSNProfiles agree on every name, description
  and grade. Cross-checks run this session:
  - Live Exophase page (exophase.com/game/grand-theft-auto-vi-psn/trophies/): the 55 trophy
    descriptions appear in exactly the starter's order, 55/55 matching the starter text.
  - Hosted data of board #1, #2 and #3: names/descriptions/grades match the starter 55/55,
    zero mismatches in all three independent entries.
  - Grade split counted from the starter: 1 platinum, 2 gold, 6 silver, 46 bronze = 55. ✔
- Hidden flags (28 hidden per kit): the starter carries NO hidden field. Triangulated from
  the hosted data of #1, #2, #3 — all three agree exactly, 28 true, zero pairwise diffs.
  Adopted as `hidden` in our data, cited as cross-checked across those three listings of
  the same official list.
- Counted trophies (20 with a PSN-tracked target, from the official descriptions):
  100% completion; 250 stunts; 9 activity types; 42 Shooting Range golds; 14 Top Fun drone
  locations; 20 races; 8 stranger strands; 18 meditation spots; 3 card sets; 100 WAiNK
  locations; 50 challenges; 100 vehicles; 5 bank vaults; 52 Leonida areas; 9 gangs;
  500 choices; $250,000 laundered; $100,000 spent; 8 garage properties; 10 Scooter Bros
  registrations.

## Our data plan (committed this step as app/data/trophies.json)

Per trophy: `id, name, description, grade` (byte-faithful to the official list), `hidden`,
`kind` (story / strangers / collectibles / activities / crime / money / exploration / misc /
completion / platinum), `stage` (1–6 roadmap stage), `target`+`unit` for the 20 counted
trophies, `missableRisk` (honest: derived from the official description only, labelled
not-confirmed where the description gives no window), `confidence`
(official / derived / unconfirmed), `sources` (named: Exophase official list, PSNProfiles
trophy list, official PSN description), and a `guide` in our own words that states what to
do and cites those sources — no invented locations, no copied text.

Step 2 (next turn): the offline app — checklist + localStorage, search, kind/grade filters,
spoiler toggle, per-trophy counters, roadmap page, missable watch, export/import.
Step 3 (turn after): enrichment pass — per-step cited guides, progress stats, notes.
