// Leonida Ledger — an offline GTA VI trophy guide & tracker.
// Plain browser JavaScript, no library and no build step. The only files it
// loads are its own data files sitting beside it; progress lives in
// localStorage and the app never touches the network at run time.

const SAVE_KEY = 'leonida-ledger-save-v1';
const GRADES = ['platinum', 'gold', 'silver', 'bronze'];
const KIND_NAMES = {
  story: 'Story', strangers: 'Strangers', collectibles: 'Collectibles',
  activities: 'Activities', crime: 'Crime', money: 'Money',
  exploration: 'Exploration', misc: 'Misc', completion: '100%', platinum: 'Platinum',
};

// The six roadmap stages. Order and hours are this guide's own estimates,
// reasoned from the official descriptions: story first, the 100% sweep last.
const ROADMAP = [
  { n: 1, title: 'Story — Chapters 1–4 and the finale', hours: 35,
    text: 'Play the campaign straight through. The chapter, mission and finale trophies unlock as you go; clear the partner trophies flagged in the Missable Watch before the final mission, not after it.' },
  { n: 2, title: 'Stranger strands', hours: 8,
    text: 'Finish the stranger strands — Andy, Kenton, Billy, Randy, Tyrone and Bret — and the 8-strand silver. Start a strand when it appears instead of stockpiling them for the end.' },
  { n: 3, title: 'Collectibles & exploration', hours: 12,
    text: 'One long map sweep banks five counters together: 18 meditation spots, 3 card sets, 100 WAiNK locations, 100 vehicles discovered, 10 Scooter Bros registrations and all 52 areas of Leonida.' },
  { n: 4, title: 'Activities', hours: 15,
    text: 'The skill grinds: 250 stunts, 42 Shooting Range golds, 14 drone-race locations, 20 different races won, 50 challenges and all 9 activity types, fishing, arcade and bowling included.' },
  { n: 5, title: 'Crime, partners & money', hours: 10,
    text: '5 bank vaults, the armored truck, 9 gangs, $250,000 laundered and $100,000 spent in shops, 8 garage properties, the partner one-offs — and the unconfirmed trophies, chased honestly rather than guessed at.' },
  { n: 6, title: '100% cleanup & the platinum', hours: 8,
    text: 'Sweep whatever the counters still show as short, close A Long Road at 100% completion, and Vice Got a Price! — the platinum — lands on its own the moment the 54th other trophy does.' },
];
const ROADMAP_HOURS = ROADMAP.reduce((sum, s) => sum + s.hours, 0);

// ---------------------------------------------------------------- state
function blankSave() {
  return { earned: [], counts: {}, notes: {}, spoilersHidden: true };
}
function readSave() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (raw && Array.isArray(raw.earned)) {
      return {
        earned: raw.earned.filter((n) => typeof n === 'string'),
        counts: raw.counts && typeof raw.counts === 'object' ? raw.counts : {},
        notes: raw.notes && typeof raw.notes === 'object' ? raw.notes : {},
        spoilersHidden: raw.spoilersHidden !== false,
      };
    }
  } catch { /* a damaged save should never break the guide */ }
  return blankSave();
}
const save = readSave();
const earnedSet = new Set(save.earned);
function persist() {
  save.earned = [...earnedSet];
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

// ---------------------------------------------------------------- helpers
const byId = (id) => document.getElementById(id);
function node(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}
let trophies = [];
let sourceBook = {};
let stepsById = {};
let selectedId = null;

function isEarned(t) { return earnedSet.has(t.name); }
function masked(t) {
  // Spoiler rule: a hidden story trophy shows neither name nor description
  // until it is earned, while the spoiler setting is on.
  return save.spoilersHidden && t.hidden && t.kind === 'story' && !isEarned(t);
}
function shownName(t) { return masked(t) ? 'Hidden story trophy' : t.name; }
function shownDesc(t) {
  return masked(t)
    ? 'Name and description stay hidden until this trophy is earned — or until spoilers are switched off.'
    : t.description;
}
function countOf(t) { return Math.min(Number(save.counts[t.id]) || 0, t.target || 0); }
function citeNames(keys) {
  return (keys || []).map((k) => (sourceBook[k] || k).split(' — ')[0].split(':')[0]).join(', ');
}

// ---------------------------------------------------------------- header
function renderHeader() {
  const earned = earnedSet.size;
  byId('earnedTotal').textContent = String(earned);
  byId('meterFill').style.width = `${(earned / trophies.length) * 100}%`;
  byId('meterPct').textContent = `${Math.round((earned / trophies.length) * 100)}% of the way to platinum`;
  const left = Math.round((ROADMAP_HOURS * (trophies.length - earned)) / trophies.length);
  byId('meterTime').textContent = `≈ ${left} h of roadmap left (our estimate)`;
  const strip = byId('gradeStrip');
  strip.replaceChildren();
  for (const g of GRADES) {
    const all = trophies.filter((t) => t.grade === g);
    const got = all.filter(isEarned).length;
    const chip = node('div', 'grade-chip');
    chip.append(node('span', null, `${g} · ${all.length} on the list`));
    const line = node('div');
    line.append(node('i', `dot dot-${g}`), node('b', null, `${got} / ${all.length}`));
    chip.append(line);
    strip.append(chip);
  }
  byId('footNote').textContent =
    `${earned} earned · ${trophies.filter((t) => t.hidden).length} hidden · ` +
    `${trophies.filter((t) => t.target).length} counted · ${ROADMAP_HOURS} h roadmap estimate`;
}

// ---------------------------------------------------------------- tracker
function visibleTrophies() {
  const q = byId('searchBox').value.trim().toLowerCase();
  const kind = byId('kindSelect').value;
  const grade = byId('gradeSelect').value;
  const missOnly = byId('missableCheck').checked;
  const hideDone = byId('hideDoneCheck').checked;
  return trophies.filter((t) => {
    if (kind !== 'all' && t.kind !== kind) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (missOnly && t.missableRisk === 'none') return false;
    if (hideDone && isEarned(t)) return false;
    if (q) {
      const hay = `${t.name} ${t.description} ${t.guide} ${KIND_NAMES[t.kind] || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderList() {
  const list = visibleTrophies();
  byId('listCount').textContent =
    `Showing ${list.length} of ${trophies.length} trophies — tick a box to mark one earned; progress saves in this browser.`;
  const wrap = byId('trophyRows');
  wrap.replaceChildren();
  if (!list.length) {
    wrap.append(node('p', 'empty', 'No trophy matches those filters. Loosen one and the list comes back.'));
    return;
  }
  for (const t of list) {
    const row = node('div', `row${isEarned(t) ? ' is-earned' : ''}${t.id === selectedId ? ' is-selected' : ''}`);
    row.setAttribute('role', 'listitem');
    const box = node('input');
    box.type = 'checkbox';
    box.checked = isEarned(t);
    box.setAttribute('aria-label', `Mark ${shownName(t)} earned`);
    box.addEventListener('change', () => {
      if (box.checked) earnedSet.add(t.name); else earnedSet.delete(t.name);
      persist(); renderAll();
    });
    const main = node('button', 'row-main');
    main.type = 'button';
    main.style.cssText = 'background:none;border:0;text-align:left;padding:0;cursor:pointer';
    main.append(node('div', 'row-name', shownName(t)), node('div', 'row-desc', shownDesc(t)));
    const tags = node('div', 'row-tags');
    tags.append(node('span', 'tag tag-grade', t.grade));
    tags.append(node('span', 'tag', KIND_NAMES[t.kind] || t.kind));
    tags.append(node('span', 'tag', `Stage ${t.stage}`));
    if (t.hidden) tags.append(node('span', 'tag tag-hidden', 'Hidden'));
    if (t.missableRisk !== 'none') {
      tags.append(node('span', 'tag tag-miss', t.missableRisk === 'watch' ? 'Missable — watch' : 'Missable — unconfirmed'));
    }
    main.append(tags);
    main.addEventListener('click', () => { selectedId = t.id; renderList(); renderDetail(); });
    row.append(box, main);
    if (t.target) row.append(node('div', 'row-count', `${countOf(t)} / ${t.target} ${t.unit}`));
    wrap.append(row);
  }
}

function renderDetail() {
  const pane = byId('guidePane');
  const t = trophies.find((x) => x.id === selectedId) || trophies[0];
  if (!t) { pane.replaceChildren(node('p', 'empty', 'Loading the trophy list…')); return; }
  selectedId = t.id;
  pane.replaceChildren();
  pane.append(node('div', 'cites', `Trophy #${t.id} of 55 · ${t.grade} · ${KIND_NAMES[t.kind] || t.kind} · roadmap stage ${t.stage}`));
  pane.append(node('h2', null, shownName(t)));
  pane.append(node('p', 'guide-desc', `“${shownDesc(t)}” — official PlayStation description`));
  if (t.target) {
    const box = node('div', 'counter-box');
    box.append(node('strong', null, 'Your count:'));
    const minus = node('button', 'counter-btn', '−'); minus.type = 'button';
    const input = node('input'); input.type = 'number'; input.min = '0'; input.max = String(t.target);
    input.value = String(countOf(t)); input.setAttribute('aria-label', `Count for ${shownName(t)}`);
    const plus = node('button', 'counter-btn', '+'); plus.type = 'button';
    const apply = (v) => {
      save.counts[t.id] = Math.max(0, Math.min(t.target, Math.floor(Number(v) || 0)));
      persist(); renderHeader(); renderList(); input.value = String(countOf(t));
    };
    minus.addEventListener('click', () => apply(countOf(t) - 1));
    plus.addEventListener('click', () => apply(countOf(t) + 1));
    input.addEventListener('change', () => apply(input.value));
    box.append(minus, input, plus, node('span', null, `of ${t.target} ${t.unit} (PlayStation's target)`));
    pane.append(box);
  }
  pane.append(node('h3', null, 'Guide — in our own words, cited'));
  pane.append(node('p', 'guide-text', masked(t) ? 'The guide for a hidden story trophy stays covered while spoilers are hidden.' : t.guide));
  const steps = stepsById[t.id] || [];
  if (steps.length && !masked(t)) {
    pane.append(node('h3', null, `Steps (${steps.length})`));
    const ol = node('ol', 'step-list');
    for (const s of steps) {
      const li = node('li');
      li.append(node('span', null, s.text));
      if (s.estimate) li.append(node('span', 'est', ' estimate'));
      li.append(node('div', 'cites', `Sources: ${citeNames(s.cites)}${s.estMin ? ` · ≈ ${s.estMin} min (our estimate)` : ''}`));
      ol.append(li);
    }
    pane.append(ol);
  }
  const kv = node('dl', 'kv');
  const rows = [
    ['Missable', t.missableRisk === 'none' ? 'No — nothing in the official description closes a window on it'
      : t.missableRisk === 'watch' ? 'Watch — the description ties it to a window that may close'
      : 'Unconfirmed — the description does not pin the trigger down'],
    ['Confidence', t.confidence],
    ['Sources', (t.sources || []).map((k) => sourceBook[k] || k).join(' · ')],
  ];
  for (const [k, v] of rows) { kv.append(node('dt', null, k), node('dd', null, v)); }
  pane.append(kv);
  const noteSlot = node('div'); noteSlot.id = 'noteSlot';
  pane.append(noteSlot);
  if (window.__ledgerEnrich) window.__ledgerEnrich(t, noteSlot);
}

// ---------------------------------------------------------------- roadmap
function renderRoadmap() {
  const wrap = byId('roadmapStages');
  wrap.replaceChildren();
  for (const s of ROADMAP) {
    const inStage = trophies.filter((t) => t.stage === s.n);
    const got = inStage.filter(isEarned).length;
    const card = node('article', 'stage-card');
    const head = node('div', 'stage-head');
    head.append(node('h3', null, `Stage ${s.n} — ${s.title}`),
      node('span', 'stage-hours', `${got} / ${inStage.length} earned · ≈ ${s.hours} h (our estimate)`));
    card.append(head, node('p', null, s.text));
    card.append(node('p', 'stage-names', inStage.map(shownName).join(' · ')));
    wrap.append(card);
  }
}

// ---------------------------------------------------------------- missable
function renderMissable() {
  const wrap = byId('missableRows');
  wrap.replaceChildren();
  const flagged = trophies.filter((t) => t.missableRisk !== 'none');
  const intro = node('p', 'intro',
    `${flagged.length} of 55 trophies carry a flag: ${flagged.filter((t) => t.missableRisk === 'watch').length} watch, ` +
    `${flagged.filter((t) => t.missableRisk === 'unknown').length} unconfirmed. Every flag is derived from the official description alone.`);
  wrap.append(intro);
  for (const t of flagged) {
    const card = node('article', 'miss-card');
    card.append(node('h3', null, shownName(t)));
    card.append(node('p', 'cites',
      `${t.missableRisk === 'watch' ? 'WATCH' : 'UNCONFIRMED'} · ${t.grade} · stage ${t.stage} · sources: ${citeNames(t.sources)}`));
    card.append(node('p', null, masked(t) ? shownDesc(t) : t.guide));
    wrap.append(card);
  }
}

// ---------------------------------------------------------------- method
function renderMethod() {
  const wrap = byId('sourceCards');
  wrap.replaceChildren();
  for (const [key, text] of Object.entries(sourceBook)) {
    const card = node('article', 'source-card');
    card.append(node('b', null, key), node('span', null, text));
    wrap.append(card);
  }
}

// ---------------------------------------------------------------- wiring
function renderAll() {
  renderHeader(); renderList(); renderDetail(); renderRoadmap(); renderMissable(); renderMethod();
  if (window.__ledgerStats) window.__ledgerStats();
}
function switchView(name) {
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('is-active', b.dataset.view === name));
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('is-active', p.id === `panel-${name}`));
}
function bindControls() {
  document.querySelectorAll('.tab').forEach((b) =>
    b.addEventListener('click', () => switchView(b.dataset.view)));
  for (const id of ['searchBox', 'kindSelect', 'gradeSelect', 'missableCheck', 'hideDoneCheck']) {
    byId(id).addEventListener('input', renderList);
    byId(id).addEventListener('change', renderList);
  }
  const spoiler = byId('spoilerCheck');
  spoiler.checked = save.spoilersHidden;
  spoiler.addEventListener('change', () => { save.spoilersHidden = spoiler.checked; persist(); renderAll(); });
  byId('resetBtn').addEventListener('click', () => {
    earnedSet.clear(); save.counts = {}; save.notes = {};
    persist(); renderAll();
  });
  const wanted = new URLSearchParams(location.search).get('view');
  if (wanted && byId(`panel-${wanted}`)) switchView(wanted);
}

async function boot() {
  const trophyDoc = await (await fetch('data/trophies.json')).json();
  trophies = trophyDoc.trophies;
  sourceBook = trophyDoc.sources || {};
  const stepDoc = await (await fetch('data/steps.json')).json();
  stepsById = stepDoc.steps || {};
  // A counted, cited silver makes a good first detail pane: The Shootist.
  const first = trophies.find((t) => t.name === 'The Shootist') || trophies[0];
  selectedId = first.id;
  bindControls();
  renderAll();
}
boot();
