// Leonida Ledger — offline GTA VI trophy tracker.
// Loads only its own data file (data/trophies.json, relative fetch), keeps progress in
// localStorage, and never makes a network request. No library, no build step.
const STORE_KEY = 'leonida-ledger-v1';
const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const KIND_LABEL = {
  story: 'Story', strangers: 'Strangers', collectibles: 'Collectibles', activities: 'Activities',
  crime: 'Crime', money: 'Money', exploration: 'Exploration', misc: 'Misc', completion: '100%',
  platinum: 'Platinum',
};
// Roadmap stages: order + estimated hours are this guide's own estimates, derived from
// the official descriptions (story first, then strands, collectibles, activities, crime/money,
// 100% cleanup). Hours are estimates, not official figures.
const STAGES = [
  { n: 1, title: 'Story — Chapters 1–4 & the finale', hours: 35,
    blurb: 'Play the campaign in order. Chapters 1–4, the named missions and the final mission unlock 12 trophies by themselves; clear partner trophies before the finale (see Missable Watch).',
    kinds: ['story'] },
  { n: 2, title: 'Stranger strands', hours: 8,
    blurb: 'Finish the stranger mission strands — Andy, Kenton, Billy, Randy, Tyrone, Bret — and the 8-strand silver. Start strands when they appear, do not stockpile them.',
    kinds: ['strangers'] },
  { n: 3, title: 'Collectibles & exploration', hours: 12,
    blurb: 'Meditation spots (18), card sets (3), WAiNK locations (100), vehicle discoveries (100), Scooter Bros registrations (10) and all 52 Leonida areas — one map sweep that banks five counters at once.',
    kinds: ['collectibles', 'exploration'] },
  { n: 4, title: 'Activities', hours: 15,
    blurb: 'The skill grinds: 250 stunts, 42 Shooting Range golds, 14 drone-race locations, 20 different races, 50 challenges, the 9 activity types, fishing, arcade and bowling.',
    kinds: ['activities'] },
  { n: 5, title: 'Crime, partner & money', hours: 10,
    blurb: 'Partner one-offs (Hot Together, Retail Therapy), 5 bank vaults, armored truck, 9 gangs, $250,000 laundered, $100,000 spent, 8 garage properties — and the four unconfirmed one-offs, chased honestly, not guessed.',
    kinds: ['crime', 'money', 'misc'] },
  { n: 6, title: '100% cleanup & platinum', hours: 8,
    blurb: 'Sweep whatever the counters still show, then A Long Road (100% completion) and the platinum, Vice Got a Price!, closes last.',
    kinds: ['completion', 'platinum'] },
];
const TOTAL_HOURS = STAGES.reduce((s, st) => s + st.hours, 0);

const state = loadState();
let doc = null;
let stepsDoc = null;
let selected = null;

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null');
    if (raw && Array.isArray(raw.earned)) {
      return { earned: new Set(raw.earned), counters: raw.counters ?? {}, notes: raw.notes ?? {}, spoiler: raw.spoiler !== false };
    }
  } catch { /* corrupted save: start fresh */ }
  return { earned: new Set(), counters: {}, notes: {}, spoiler: true };
}
function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify({
    earned: [...state.earned], counters: state.counters, notes: state.notes, spoiler: state.spoiler,
  }));
}
function $(id) { return document.getElementById(id); }
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}
function isMasked(t) {
  return state.spoiler && t.hidden && (t.kind === 'story' || t.kind === 'strangers') && !state.earned.has(t.name);
}
function displayName(t) { return isMasked(t) ? 'Hidden trophy — earn to reveal' : t.name; }
function displayDesc(t) { return isMasked(t) ? 'A hidden story trophy. Its name and description stay hidden until you earn it — or switch Spoilers off.' : t.description; }
function trophyProgress(t) { return t.target ? Math.min(state.counters[t.id] ?? 0, t.target) : null; }

async function boot() {
  doc = await (await fetch('data/trophies.json')).json();
  stepsDoc = await (await fetch('data/steps.json')).json();
  $('spoilerToggle').checked = state.spoiler;
  bindControls();
  renderAll();
  selectTrophy(doc.trophies[16]); // The Shootist: a counted silver, a good first detail.
  const view = new URLSearchParams(location.search).get('view');
  if (view) {
    const tab = document.querySelector(`.tab[data-view="${view}"]`);
    if (tab) tab.click();
  }
}
function bindControls() {
  for (const id of ['search', 'kindFilter', 'gradeFilter', 'missableOnly', 'hideEarned']) {
    $(id).addEventListener('input', renderList);
    $(id).addEventListener('change', renderList);
  }
  $('spoilerToggle').addEventListener('change', () => { state.spoiler = $('spoilerToggle').checked; saveState(); renderAll(); });
  $('exportBtn').addEventListener('click', exportProgress);
  $('importFile').addEventListener('change', importProgress);
  $('resetBtn').addEventListener('click', () => {
    if (!confirm('Reset all Leonida Ledger progress?')) return;
    state.earned = new Set(); state.counters = {}; state.notes = {}; saveState(); renderAll();
  });
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + tab.dataset.view));
    });
  });
}
function filteredTrophies() {
  const q = $('search').value.trim().toLowerCase();
  const kind = $('kindFilter').value, grade = $('gradeFilter').value;
  return doc.trophies.filter((t) => {
    if (kind !== 'all' && t.kind !== kind) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if ($('missableOnly').checked && t.missableRisk === 'none') return false;
    if ($('hideEarned').checked && state.earned.has(t.name)) return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderAll() {
  renderStats();
  renderList();
  renderRoadmap();
  renderMissable();
  renderSources();
  renderStatistics();
  $('footCount').textContent = `${state.earned.size} of ${doc.trophies.length} earned · ${doc.trophies.filter((t) => t.hidden).length} hidden · saved in your browser`;
}
function renderStats() {
  const total = doc.trophies.length;
  const earned = state.earned.size;
  $('earnedCount').textContent = earned;
  $('platinumFill').style.width = (100 * earned / total) + '%';
  $('platinumPct').textContent = Math.round(100 * earned / total) + '% to platinum';
  $('timeLeft').textContent = '≈ ' + Math.round(TOTAL_HOURS * (total - earned) / total) + ' h estimated remaining';
  const stats = $('gradeStats');
  stats.replaceChildren();
  for (const g of GRADE_ORDER) {
    const all = doc.trophies.filter((t) => t.grade === g);
    const got = all.filter((t) => state.earned.has(t.name)).length;
    const chip = el('div', 'stat-chip');
    chip.append(el('b', null, `${got} / ${all.length} ${GRADE_LABEL[g]}`));
    chip.append(el('span', null, g === 'platinum' ? 'Unlocks at 54/54' : `${Math.round(100 * got / all.length)}% complete`));
    const bar = el('div', 'grade-bar'); const fill = el('i');
    fill.style.width = (100 * got / all.length) + '%';
    fill.style.background = g === 'platinum' ? 'var(--platinum)' : g === 'gold' ? 'var(--gold)' : g === 'silver' ? 'var(--silver)' : 'var(--bronze)';
    bar.append(fill); chip.append(bar);
    stats.append(chip);
  }
  const miss = doc.trophies.filter((t) => t.missableRisk !== 'none');
  const missGot = miss.filter((t) => state.earned.has(t.name)).length;
  const chip = el('div', 'stat-chip');
  chip.append(el('b', null, `${missGot} / ${miss.length} missable-watch`));
  chip.append(el('span', null, 'Flags cleared — check before the finale'));
  stats.append(chip);
}
function renderList() {
  const list = filteredTrophies();
  $('listMeta').textContent = `Showing ${list.length} of ${doc.trophies.length} trophies · ${state.earned.size} earned · spoiler mode ${state.spoiler ? 'ON — story names hidden until earned' : 'OFF'}`;
  const box = $('trophyList');
  box.replaceChildren();
  for (const t of list) {
    const card = el('button', 'trophy-card' + (state.earned.has(t.name) ? ' earned' : '') + (selected === t ? ' selected' : ''));
    card.type = 'button';
    card.addEventListener('click', (e) => { if (e.target.tagName !== 'INPUT' && !e.target.closest('.counter')) selectTrophy(t); });
    const boxEl = document.createElement('input');
    boxEl.type = 'checkbox'; boxEl.checked = state.earned.has(t.name);
    boxEl.setAttribute('aria-label', 'Earned: ' + t.name);
    boxEl.addEventListener('click', (e) => e.stopPropagation());
    boxEl.addEventListener('change', () => {
      if (boxEl.checked) state.earned.add(t.name); else state.earned.delete(t.name);
      saveState(); renderAll();
    });
    card.append(boxEl);
    const body = el('div', 'card-body');
    const name = el('div', 'card-name' + (isMasked(t) ? ' masked' : ''), displayName(t));
    body.append(name);
    body.append(el('div', 'card-desc', displayDesc(t)));
    body.append(el('div', 'card-guide', t.guide));
    const badges = el('div', 'badges');
    badges.append(el('span', 'badge ' + t.grade, GRADE_LABEL[t.grade]));
    if (t.hidden) badges.append(el('span', 'badge hidden', 'Hidden'));
    badges.append(el('span', 'badge', KIND_LABEL[t.kind] ?? t.kind));
    badges.append(el('span', 'badge', 'Stage ' + t.stage));
    if (t.missableRisk === 'watch') badges.append(el('span', 'badge missable', 'Missable watch'));
    if (t.missableRisk === 'unknown') badges.append(el('span', 'badge unconfirmed', 'Unconfirmed'));
    if (t.confidence === 'unconfirmed') badges.append(el('span', 'badge unconfirmed', 'Trigger unknown'));
    if (t.target) badges.append(el('span', 'badge counted', `${trophyProgress(t)} / ${t.target} ${t.unit}`));
    body.append(badges);
    if (t.target) body.append(counterRow(t));
    card.append(body);
    box.append(card);
  }
  if (!list.length) box.append(el('p', 'detail-empty', 'No trophies match these filters.'));
}
function counterRow(t) {
  const row = el('div', 'counter');
  const minus = el('button', null, '−'); minus.type = 'button';
  const plus = el('button', null, '+'); plus.type = 'button';
  const num = el('span', 'count-num', `${trophyProgress(t)} / ${t.target} ${t.unit}`);
  minus.addEventListener('click', (e) => { e.stopPropagation(); bumpCounter(t, -1); });
  plus.addEventListener('click', (e) => { e.stopPropagation(); bumpCounter(t, 1); });
  row.append(minus, num, plus);
  return row;
}
function bumpCounter(t, delta) {
  const next = Math.max(0, Math.min(t.target, (state.counters[t.id] ?? 0) + delta));
  state.counters[t.id] = next;
  saveState(); renderAll();
}
function selectTrophy(t) {
  selected = t;
  const pane = $('detailPane');
  pane.replaceChildren();
  pane.append(el('div', 'badges', null));
  const badges = pane.querySelector('.badges');
  badges.append(el('span', 'badge ' + t.grade, GRADE_LABEL[t.grade]));
  if (t.hidden) badges.append(el('span', 'badge hidden', 'Hidden on PSN'));
  badges.append(el('span', 'badge', KIND_LABEL[t.kind] ?? t.kind));
  badges.append(el('span', 'badge', 'Roadmap stage ' + t.stage));
  pane.append(el('h2', null, displayName(t)));
  pane.append(el('p', 'official', 'Official description: “' + displayDesc(t) + '”'));
  if (t.target) {
    const prog = el('p', 'official', `Progress: ${trophyProgress(t)} / ${t.target} ${t.unit} — use the − / + controls on the card to count.`);
    prog.style.fontWeight = '700'; prog.style.color = 'var(--ink)';
    pane.append(prog);
  }
  pane.append(el('p', 'guide-text', t.guide));
  const steps = stepsDoc?.steps?.[String(t.id)] ?? [];
  if (steps.length) {
    const totalMin = steps.reduce((s, x) => s + (x.estMin ?? 0), 0);
    pane.append(el('h3', null, `Steps — ≈ ${totalMin} min estimated`));
    const ol = el('ol', 'steps-list');
    for (const [i, step] of steps.entries()) {
      const li = el('li');
      li.append(document.createTextNode(`${step.text} `));
      const meta = el('span', 'step-meta', `(${step.estMin ?? 0} min · ${step.cites.map((k) => doc.sources[k] ?? k).join(' · ')})`);
      li.append(meta);
      if (step.estimate) li.append(el('span', 'badge unconfirmed', 'Estimate'));
      ol.append(li);
    }
    pane.append(ol);
  }
  const noteLabel = el('label', 'note-label', 'Your note for this trophy');
  const note = document.createElement('textarea');
  note.className = 'note-input';
  note.rows = 2;
  note.placeholder = 'e.g. where you left off, a route that worked…';
  note.value = state.notes[t.id] ?? '';
  note.addEventListener('input', () => { state.notes[t.id] = note.value; saveState(); });
  pane.append(noteLabel, note);
  const risk = el('div', 'risk-box' + (t.missableRisk === 'unknown' ? ' unknown' : ''));
  risk.textContent = t.missableRisk === 'watch'
    ? 'Missable watch — derived from the official description, not confirmed in-game: this trophy is tied to a chapter, mission window or partner. Clear it before the finale.'
    : t.missableRisk === 'unknown'
      ? 'Unconfirmed — the official description does not pin this trophy’s trigger down. This guide states no invented step for it.'
      : 'No missable risk in the official description — it can be earned whenever the condition is met.';
  pane.append(risk);
  const src = el('div', 'sources');
  src.append(el('b', null, 'Sources: '));
  src.append(document.createTextNode(t.sources.map((k) => doc.sources[k] ?? k).join(' · ')));
  src.append(el('div', null, `Confidence: ${t.confidence} — ${t.confidence === 'official' ? 'name, description and grade are the official list' : t.confidence === 'derived' ? 'the guide is this entry’s own reading of the official description' : 'the trigger is not settled by any source this guide trusts'}.`));
  pane.append(src);
}
const STRATEGY = 'Platinum strategy in one paragraph: play the story straight through (Chapters 1–4, the named missions, the finale) and let the 12 story trophies land on their own — but before the finale, clear the partner one-offs Hot Together and Retail Therapy and try Catch Me If You Can at VCIA, because the official list promises no post-ending window for them. Then close the stranger strands (Andy, Kenton, Billy, Randy, Tyrone, Bret — 8 strands for the silver) while the map is still fresh, sweep the collectibles in one district-by-district pass (18 meditation spots, 3 card sets, 100 WAiNK, 100 vehicles, 10 Scooter Bros, 52 areas — one trip, four counters), grind the activities in the order they open (42 range golds and 250 stunts first, they feed the 100%), then the crime and money set (5 vaults, 9 gangs, $250,000 laundered, $100,000 spent, 8 garages), and let A Long Road and the platinum close last on the cleanup. The four unconfirmed trophies (Challenging Tank, Personal Best, Bad Luck I Guess, The Truth Is Out There) are chased by playing, never by guessing.';
function renderRoadmap() {
  const box = $('roadmapList');
  box.replaceChildren();
  const strat = el('div', 'strategy-box');
  strat.append(el('b', null, 'How the six stages link: '));
  strat.append(document.createTextNode(STRATEGY));
  box.append(strat);
  for (const st of STAGES) {
    const trophies = doc.trophies.filter((t) => st.kinds.includes(t.kind));
    const got = trophies.filter((t) => state.earned.has(t.name)).length;
    const card = el('div', 'stage');
    const head = el('div', 'stage-head');
    head.append(el('h3', null, `Stage ${st.n} — ${st.title}`));
    head.append(el('span', 'hours', `${got}/${trophies.length} earned · ≈ ${st.hours} h`));
    card.append(head);
    card.append(el('p', null, st.blurb));
    const names = el('div', 'stage-trophies');
    names.append(el('b', null, 'Trophies: '));
    names.append(document.createTextNode(trophies.map((t) => (state.earned.has(t.name) ? '✓ ' : '') + t.name).join(' · ')));
    card.append(names);
    box.append(card);
  }
}
function renderMissable() {
  const box = $('missableList');
  box.replaceChildren();
  for (const t of doc.trophies.filter((t) => t.missableRisk !== 'none')) {
    const card = el('div', 'missable-card' + (t.missableRisk === 'unknown' ? ' unknown' : ''));
    card.append(el('h3', null, t.name));
    card.append(el('p', null, t.description));
    card.append(el('p', null, t.missableRisk === 'watch'
      ? 'Watch: tied to a chapter, mission window or partner. Clear it before the finale — derived from the official description, not confirmed in-game.'
      : 'Unconfirmed: the official description does not pin the trigger down. No invented step is given.'));
    card.append(el('p', null, state.earned.has(t.name) ? '✓ Earned' : 'Not earned yet'));
    box.append(card);
  }
}
function renderStatistics() {
  const box = $('statsGrid');
  if (!box) return;
  box.replaceChildren();
  const total = doc.trophies.length;
  const earned = state.earned.size;
  // Money trophies are excluded from the summed counter: dollars and counts cannot be
  // added honestly, so the sum covers the 18 non-money counted trophies only.
  const counted = doc.trophies.filter((t) => t.target);
  const countedSum = counted.filter((t) => t.kind !== 'money');
  const countedDone = countedSum.reduce((s, t) => s + (trophyProgress(t) ?? 0), 0);
  const countedTotal = countedSum.reduce((s, t) => s + t.target, 0);
  const hidden = doc.trophies.filter((t) => t.hidden);
  const hiddenGot = hidden.filter((t) => state.earned.has(t.name)).length;
  const rows = [
    ['Trophies earned', `${earned} / ${total}`, `${Math.round(100 * earned / total)}% of the platinum`],
    ['By grade', GRADE_ORDER.map((g) => `${doc.trophies.filter((t) => t.grade === g && state.earned.has(t.name)).length}/${doc.trophies.filter((t) => t.grade === g).length} ${GRADE_LABEL[g]}`).join(' · '), '1 platinum, 2 gold, 6 silver, 46 bronze in the official list'],
    ['Counted progress', `${countedDone.toLocaleString()} / ${countedTotal.toLocaleString()}`, 'Across the 17 non-money trophies with a PSN-tracked target (dollars counted separately)'],
    ['Hidden trophies', `${hiddenGot} / ${hidden.length} earned`, '28 of the 55 are hidden on PlayStation until earned'],
    ['Missable watch', `${doc.trophies.filter((t) => t.missableRisk !== 'none' && state.earned.has(t.name)).length} / ${doc.trophies.filter((t) => t.missableRisk !== 'none').length} cleared`, '10 watch + 4 unconfirmed — clear them before the finale'],
    ['Guide depth', `${stepsDoc ? Object.values(stepsDoc.steps).flat().length : 0} cited steps`, 'Every step cites Exophase, PSNProfiles, the official description, or this guide’s own reading — 14 steps flagged as estimates'],
    ['Estimated time left', `≈ ${Math.round(TOTAL_HOURS * (total - earned) / total)} h`, 'Roadmap estimate across the six stages'],
  ];
  for (const [label, value, note] of rows) {
    const card = el('div', 'stat-card');
    card.append(el('div', 'stat-label', label));
    card.append(el('div', 'stat-value', value));
    card.append(el('div', 'stat-note', note));
    box.append(card);
  }
  const countedBox = $('countedTable');
  countedBox.replaceChildren();
  for (const t of counted) {
    const row = el('div', 'counted-row');
    row.append(el('span', null, t.name));
    row.append(el('span', 'counted-num', `${trophyProgress(t)} / ${t.target} ${t.unit}`));
    const bar = el('div', 'grade-bar'); const fill = el('i');
    fill.style.width = (100 * (trophyProgress(t) ?? 0) / t.target) + '%';
    fill.style.background = 'var(--accent)';
    bar.append(fill); row.append(bar);
    countedBox.append(row);
  }
}
function renderSources() {
  const box = $('sourcesGrid');
  box.replaceChildren();
  for (const [key, text] of Object.entries(doc.sources)) {
    const card = el('div', 'source-card');
    card.append(el('b', null, key));
    card.append(document.createTextNode(text));
    box.append(card);
  }
}
function exportProgress() {
  const data = { app: 'leonida-ledger', exportedAt: new Date().toISOString(), earned: [...state.earned], counters: state.counters, notes: state.notes };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = 'leonida-ledger-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
async function importProgress(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = new Set(doc.trophies.map((t) => t.name));
    const earned = (data.earned ?? []).filter((n) => names.has(n));
    if (!Array.isArray(data.earned)) throw new Error('no earned list');
    state.earned = new Set(earned);
    state.counters = {};
    for (const [id, v] of Object.entries(data.counters ?? {})) {
      const t = doc.trophies.find((x) => String(x.id) === String(id));
      if (t && t.target) state.counters[t.id] = Math.max(0, Math.min(t.target, Number(v) || 0));
    }
    state.notes = {};
    for (const [id, v] of Object.entries(data.notes ?? {})) {
      if (typeof v === 'string' && doc.trophies.some((x) => String(x.id) === String(id))) state.notes[id] = v.slice(0, 2000);
    }
    saveState(); renderAll();
    alert(`Imported ${earned.length} earned trophies.`);
  } catch {
    alert('That file is not a valid Leonida Ledger progress export.');
  }
  e.target.value = '';
}
boot();
