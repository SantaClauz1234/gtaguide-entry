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
let selected = null;

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null');
    if (raw && Array.isArray(raw.earned)) {
      return { earned: new Set(raw.earned), counters: raw.counters ?? {}, spoiler: raw.spoiler !== false };
    }
  } catch { /* corrupted save: start fresh */ }
  return { earned: new Set(), counters: {}, spoiler: true };
}
function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify({
    earned: [...state.earned], counters: state.counters, spoiler: state.spoiler,
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
    state.earned = new Set(); state.counters = {}; saveState(); renderAll();
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
function renderRoadmap() {
  const box = $('roadmapList');
  box.replaceChildren();
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
  const data = { app: 'leonida-ledger', exportedAt: new Date().toISOString(), earned: [...state.earned], counters: state.counters };
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
    saveState(); renderAll();
    alert(`Imported ${earned.length} earned trophies.`);
  } catch {
    alert('That file is not a valid Leonida Ledger progress export.');
  }
  e.target.value = '';
}
boot();
