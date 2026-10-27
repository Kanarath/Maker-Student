/* Motor genérico de la app de aprendizaje gamificada (sin vidas, sin energía, sin rachas).
   Lee su configuración y contenido de content.js y la mascota de mascot.js. */
'use strict';

// ===================== utilidades =====================
const $ = (s, r = document) => r.querySelector(s);
function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v);
  }
  kids.flat(Infinity).forEach(c => { if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c)); });
  return e;
}
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const pick = a => a[Math.floor(Math.random() * a.length)];
const DAY = 86400000;
const dayStart = ts => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
const dayKey = ts => { const d = new Date(ts); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
const md = s => String(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

// ===================== estado guardado =====================
const KEY = APP.key + '-v1';
const defaults = () => ({ xp: 0, days: [], srs: {}, done: {}, collection: [], ui: { collapsed: {} }, exams: [], settings: { sound: true, vibrate: true, cameo: true } });
function loadState() {
  try { const j = JSON.parse(localStorage.getItem(KEY)); if (j) { const d = defaults(); return Object.assign(d, j, { settings: Object.assign(d.settings, j.settings || {}) }); } } catch (e) {}
  return defaults();
}
let S = loadState();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

// ===================== repetición espaciada (Leitner) =====================
const INTERVALS = [0, 1, 3, 7, 16, 35];
function applyResult(id, ok) {
  const r = S.srs[id] || { box: 0, seen: 0 }; r.seen++;
  if (ok) { r.box = Math.min(5, r.box + 1); r.due = dayStart(Date.now()) + INTERVALS[r.box] * DAY; }
  else { r.box = r.box <= 1 ? 0 : 1; r.due = Date.now(); }
  S.srs[id] = r;
}
const dueItems = () => Object.keys(S.srs).filter(id => ITEMS[id] && S.srs[id].due <= Date.now()).sort((a, b) => S.srs[a].box - S.srs[b].box || S.srs[a].due - S.srs[b].due);
const learnedIds = () => Object.keys(S.srs).filter(id => ITEMS[id]);
const rankIdx = xp => { let i = 0; APP.ranks.forEach((r, k) => { if (xp >= r.xp) i = k; }); return i; };

// ===================== sonido y vibración =====================
let AC = null;
function tone(freq, t0, dur, type = 'sine', vol = 0.12) {
  if (!S.settings.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = freq; o.connect(g); g.connect(AC.destination);
    const t = AC.currentTime + t0; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.start(t); o.stop(t + dur);
  } catch (e) {}
}
const buzz = p => { if (S.settings.vibrate && navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} };
const sfx = {
  ok() { tone(660, 0, .12); tone(990, .09, .18); buzz(12); }, bad() { tone(300, 0, .18, 'triangle', .1); tone(250, .12, .22, 'triangle', .08); buzz([20, 30, 20]); },
  tap() { tone(520, 0, .05, 'sine', .06); }, pair() { tone(700, 0, .08); tone(1000, .06, .12); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .11, .3, 'square', .07)); buzz([30, 40, 60]); },
  chest() { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * .08, .25, 'triangle', .1)); }
};

// ===================== mascota, cameo y confeti =====================
function mascot(px = 6, extra = '', pose = 'wave') { const d = h('div', { class: 'chop ' + extra, html: robotSVG(pose) }); d.style.width = (16 * px) + 'px'; return d; }
function cameo(pose, text) {
  if (S.settings.cameo === false) return;
  document.querySelectorAll('.cameo').forEach(e => e.remove());
  const el = h('div', { class: 'cameo', 'aria-hidden': 'true' }, h('div', { class: 'cbubble' }, text), h('div', { class: 'chop', html: robotSVG(pose) }));
  document.body.append(el); setTimeout(() => el.remove(), 2700);
}
function maybeCameo(ok) {
  if (!SS || SS.cfg.exam || S.settings.cameo === false) return;
  const gap = SS.done - (SS.lastCameo ?? -9), combo = ok ? SS.combo + 1 : 0; let pose = null, text = '';
  if (ok && combo >= 5 && combo % 5 === 0) { pose = 'cheer'; text = pick(['¡Racha de ' + combo + '!', '¡Imparable!']); }
  else if (ok && gap >= 6 && Math.random() < 0.12) { pose = pick(['wave', 'dance', 'cheer']); text = pick(['¡Muy bien!', '¡Sigue así!', '¡Genial!']); }
  else if (!ok && gap >= 5 && Math.random() < 0.15) { pose = 'think'; text = pick(['¡Casi!', 'Tranquilo, ya sale', 'Fallar también enseña']); }
  if (pose) { SS.lastCameo = SS.done; cameo(pose, text); }
}
function confetti(n = 36) {
  const box = h('div', { class: 'confetti' }), cols = ['#c4600f', '#e7b83c', '#2b64b8', '#f4efe6', '#3aa76d'];
  for (let i = 0; i < n; i++) box.append(h('i', { style: `--x:${Math.random() * 100}vw;--r:${Math.random() * 720 - 360}deg;--d:${1.4 + Math.random() * 1.2}s;--dl:${Math.random() * .3}s;background:${pick(cols)}` }));
  document.body.append(box); setTimeout(() => box.remove(), 3000);
}

// ===================== navegación =====================
const app = $('#app'), nav = $('#nav'); let tab = 'home';
function show(node, withNav = true) { app.replaceChildren(node); nav.classList.toggle('hidden', !withNav); window.scrollTo(0, 0); }
function go(t) { tab = t; nav.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === t)); ({ home: viewHome, review: viewReview, coll: viewColl, dojo: viewTaller })[t](); }
nav.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { sfx.tap(); go(b.dataset.t); }));

// ===================== vistas =====================
function topbar() {
  const i = rankIdx(S.xp), r = APP.ranks[i], nx = APP.ranks[i + 1], pct = nx ? Math.round((S.xp - r.xp) / (nx.xp - r.xp) * 100) : 100;
  return h('header', { class: 'top' },
    h('div', { class: 'rank' }, h('span', { class: 'rk-jp' }, r.icon), h('div', {}, h('b', {}, r.name), h('small', {}, APP.name))),
    h('div', { class: 'xpwrap' }, h('div', { class: 'xpbar' }, h('i', { style: `width:${pct}%` })), h('small', {}, nx ? `${S.xp} / ${nx.xp} XP` : `${S.xp} XP`)),
    h('div', { class: 'days', title: 'Días que has entrenado en total' }, '🔥 ', h('b', {}, S.days.length), h('small', {}, ' días')));
}
function viewHome() {
  const wrap = h('div', { class: 'view' }, topbar()), due = dueItems().length;
  wrap.append(h('div', { class: 'hero' }, mascot(8, 'bob', 'wave'), h('div', { class: 'bubble' }, pick(APP.greetings))));
  wrap.append(h('button', { class: 'card review-card', onclick: () => { sfx.tap(); go('review'); } }, h('span', { class: 'big-emoji' }, due ? '🔁' : '✅'),
    h('div', {}, h('b', {}, due ? `${due} cosas listas para repasar` : 'Todo al día'), h('small', {}, due ? 'Repaso rápido de ~2 min' : 'Puedes hacer práctica libre cuando quieras')), h('span', { class: 'chev' }, '›')));
  const nextL = UNITS.flatMap(u => u.lessons).find(l => !S.done[l.id]);
  if (nextL) wrap.append(h('button', { class: 'card next-card', onclick: () => { sfx.tap(); startLesson(nextL); } },
    h('span', { class: 'circle sm' }, nextL.icon), h('div', {}, h('small', {}, 'Siguiente lección'), h('b', {}, nextL.title)), h('span', { class: 'go' }, 'Ir ›')));
  UNITS.forEach(u => {
    const doneN = u.lessons.filter(l => S.done[l.id]).length, shut = S.ui.collapsed[u.id] ?? !u.lessons.includes(nextL);
    wrap.append(h('button', { class: 'unit', 'aria-expanded': !shut, onclick: () => { S.ui.collapsed[u.id] = !shut; save(); viewHome(); } },
      h('span', { class: 'uhead' }, h('span', {}, u.title), h('span', { class: 'ucount' }, `${doneN}/${u.lessons.length} ${shut ? '▸' : '▾'}`)), h('small', {}, u.sub)));
    if (shut) return;
    const path = h('div', { class: 'path' });
    u.lessons.forEach((l, i) => {
      const n = S.done[l.id] || 0;
      path.append(h('button', { class: 'node ' + (i % 2 ? 'r' : 'l') + (n ? ' done' : '') + (l === nextL ? ' next' : ''), onclick: () => { sfx.tap(); startLesson(l); } },
        h('span', { class: 'circle' }, l.icon), h('span', { class: 'ntxt' }, h('b', {}, l.title), h('small', {}, l.sub), h('span', { class: 'stars' }, n ? '★'.repeat(Math.min(n, 3)) + '☆'.repeat(3 - Math.min(n, 3)) : h('em', {}, 'nueva')))));
    });
    wrap.append(path);
  });
  wrap.append(h('p', { class: 'foot-note' }, 'Todas las lecciones están abiertas: entra por donde quieras.'));
  show(wrap);
}
function viewReview() {
  const due = dueItems(), learned = learnedIds();
  const wrap = h('div', { class: 'view' }, topbar(), h('h2', { class: 'unit' }, 'Repaso', h('small', {}, 'Recordar es lo que fija lo aprendido')));
  const card = h('div', { class: 'card center' }, mascot(5, '', 'think'));
  if (!learned.length) card.append(h('p', {}, 'Aún no has aprendido nada que repasar. ¡Haz tu primera lección!'));
  else if (due.length) card.append(h('p', {}, h('b', {}, due.length), ' listas para repasar'), h('button', { class: 'btn', onclick: () => startReview(false) }, 'Empezar repaso'));
  else card.append(h('p', {}, 'Todo al día. ¡Buen trabajo!'), h('button', { class: 'btn', onclick: () => startReview(true) }, 'Práctica libre (sin límite)'));
  if (due.length && learned.length) card.append(h('button', { class: 'btn ghost', onclick: () => startReview(true) }, 'O practicar lo que quiera'));
  wrap.append(card);
  if (learned.length) {
    wrap.append(h('h3', {}, 'Mapa de dominio'), h('p', { class: 'muted' }, 'Cuanto más intenso el color, mejor lo recuerdas.'));
    const grid = h('div', { class: 'mastery' });
    learned.forEach(id => { const it = ITEMS[id]; grid.append(h('span', { class: 'chip b' + S.srs[id].box, title: label(it) }, APP.kindIcon[it.kind] || '•')); });
    wrap.append(grid);
  }
  show(wrap);
}
function viewColl() {
  const wrap = h('div', { class: 'view' }, topbar(), h('h2', { class: 'unit' }, 'Colección', h('small', {}, `${S.collection.length} / ${APP.treasures.length} tesoros`)));
  const grid = h('div', { class: 'treasures' });
  APP.treasures.forEach((t, i) => { const own = S.collection.includes(i); grid.append(h('div', { class: 'tr' + (own ? ' own' : '') }, h('span', {}, own ? t[0] : '❔'), h('small', {}, own ? t[1] : '???'))); });
  wrap.append(grid, h('p', { class: 'muted center' }, 'Cada lección y cada repaso terminado te da un cofre.'), h('div', { class: 'center' }, mascot(6, 'bob', 'cheer')));
  show(wrap);
}
function viewTaller() {
  const wrap = h('div', { class: 'view' }, topbar(), h('h2', { class: 'unit' }, 'Taller', h('small', {}, 'Progreso, examen y ajustes')));
  wrap.append(h('div', { class: 'stats' }, stat('🔥', S.days.length, 'días entrenados'), stat('⭐', S.xp, 'XP total'), stat('📚', learnedIds().length, 'cosas aprendidas')));
  const last = (S.exams || []).slice(-1)[0];
  wrap.append(h('h3', {}, 'Examen de nivel'), h('div', { class: 'card list' },
    h('p', { class: 'muted' }, 'Preguntas de todas las categorías, sin pistas y sin prisa. No pasa nada si fallas: te dice qué repasar.'),
    last ? h('p', {}, '🎓 Último resultado: ', h('b', {}, last.pct + ' %'), ' (' + new Date(last.d).toLocaleDateString('es-ES') + ')') : null,
    (last && last.missed && last.missed.length) ? h('button', { class: 'btn ghost', onclick: () => startFixes(last.missed) }, '🔁 Repasar los errores del último examen (' + last.missed.length + ')') : null,
    h('button', { class: 'btn', onclick: () => startExam('learned') }, '🎓 Sobre lo que he estudiado'), h('button', { class: 'btn ghost', onclick: () => startExam('all') }, 'Todo el curso')));
  const set = S.settings, toggle = (t, k) => h('label', { class: 'row' }, h('span', {}, t), h('input', { type: 'checkbox', ...(set[k] ? { checked: '' } : {}), onchange: e => { set[k] = e.target.checked; save(); } }));
  wrap.append(h('h3', {}, 'Ajustes'), h('div', { class: 'card list' }, toggle('Sonidos', 'sound'), toggle('Vibración', 'vibrate'), toggle('La mascota se asoma en las lecciones', 'cameo')));
  wrap.append(h('h3', {}, 'Copia de seguridad'), h('div', { class: 'card list' },
    h('p', { class: 'muted' }, 'Tu progreso vive en este dispositivo. Descárgalo de vez en cuando.'),
    h('button', { class: 'btn ghost', onclick: exportSave }, '⬇ Descargar copia'),
    h('label', { class: 'btn ghost filebtn' }, '⬆ Restaurar copia', h('input', { type: 'file', accept: 'application/json', onchange: importSave })),
    h('button', { class: 'btn danger', onclick: () => { if (confirm('¿Borrar TODO el progreso? No se puede deshacer.')) { S = defaults(); save(); go('home'); } } }, 'Borrar progreso')));
  show(wrap);
}
const stat = (i, v, l) => h('div', { class: 'stat' }, h('span', {}, i), h('b', {}, v), h('small', {}, l));
function exportSave() { const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' })), download: APP.key + '-progreso.json' }); document.body.append(a); a.click(); a.remove(); }
function importSave(e) {
  const f = e.target.files[0]; if (!f) return; const r = new FileReader();
  r.onload = () => { try { const j = JSON.parse(r.result); if (typeof j.xp !== 'number') throw 0; S = Object.assign(defaults(), j); save(); alert('Progreso restaurado ✔'); go('dojo'); } catch (x) { alert('Ese archivo no es una copia válida.'); } };
  r.readAsText(f);
}
function label(it) { return it.term || it.q || it.prompt || it.title || it.id; }

// ===================== ejercicios =====================
// distractores: mismo tipo, preferir mismo grupo o ya aprendidos, sin repetir la respuesta
function distract(it, prop, n = 3) {
  const pool = Object.values(ITEMS).filter(x => x.kind === it.kind && x.id !== it.id && x[prop] != null && x[prop] !== it[prop]);
  const pref = shuffle(pool.filter(x => x.group === it.group || S.srs[x.id])), rest = shuffle(pool.filter(x => !pref.includes(x))), out = [], seen = new Set([it[prop]]);
  for (const x of [...pref, ...rest]) { if (!seen.has(x[prop])) { seen.add(x[prop]); out.push(x); } if (out.length >= n) break; }
  return out;
}
const mcqOptions = (it, prop) => shuffle([it, ...distract(it, prop)]).map(x => ({ key: x.id, label: x[prop], correct: x.id === it.id }));
const choiceOpts = (a, wrong) => shuffle([a, ...shuffle(wrong.filter(w => w !== a)).slice(0, 3)]).map((l, i) => ({ key: 'o' + i, label: l, correct: l === a }));
const E = {
  t2d: it => ({ itemId: it.id, make: () => ({ type: 'mcq', question: '¿Qué significa?', big: it.term, options: mcqOptions(it, 'def'), answerText: it.def, explain: it.hint || '' }) }),
  d2t: it => ({ itemId: it.id, make: () => ({ type: 'mcq', question: '¿A qué concepto corresponde?', big: it.def, bigSmall: true, options: mcqOptions(it, 'term'), answerText: it.term, explain: it.hint || '' }) }),
  fact: it => ({ itemId: it.id, make: () => { const s = it.gen ? it.gen() : it; return { type: 'mcq', question: s.q, fig: s.fig, options: choiceOpts(s.a, s.wrong), answerText: s.a, explain: s.explain }; } }),
  order: it => ({ itemId: it.id, make: () => ({ type: 'order', question: it.prompt, steps: shuffle(it.steps), answer: it.steps, answerText: it.steps.map((s, i) => (i + 1) + '. ' + s).join('  '), explain: it.explain }) }),
  gap: it => ({ itemId: it.id, make: () => ({ type: 'mcq', question: it.prompt, code: it.code, options: choiceOpts(it.answer, it.wrong), answerText: it.answer, explain: it.explain }) }),
  q: (it, qi) => ({ itemId: it.id, make: () => { const q = it.qs[qi]; return { type: 'mcq', question: q[0], passage: it, options: shuffle(q[1].map((l, i) => ({ key: 'q' + i, label: l, correct: i === q[2] }))), answerText: q[1][q[2]], explain: q[3] || '' }; } })
};
function exercisesFor(it, mode) {
  const one = fs => mode === 'lesson' ? fs.map(f => f(it)) : [pick(fs)(it)];
  if (it.kind === 'term') return one([E.t2d, E.d2t]);
  if (it.kind === 'fact' || it.kind === 'calc') return [E.fact(it)];
  if (it.kind === 'order') return [E.order(it)];
  if (it.kind === 'gap') return [E.gap(it)];
  if (it.kind === 'case') return mode === 'lesson' ? it.qs.map((_, i) => E.q(it, i)) : [E.q(it, Math.floor(Math.random() * it.qs.length))];
  return [];
}
function matchStep(items) {
  items = items.filter((it, i) => items.findIndex(o => (o.short || o.def) === (it.short || it.def)) === i);
  return { type: 'match', items: items.map(i => i.id), pairs: items.map(i => ({ id: i.id, l: i.term, r: i.short || (i.def.length > 44 ? i.def.slice(0, 42) + '…' : i.def) })) };
}

// ===================== sesiones =====================
let SS = null, curKeys = null;
function startLesson(lesson) {
  const items = lesson.items.map(id => ITEMS[id]), steps = [];
  if (lesson.note) steps.push({ type: 'note', note: lesson.note });
  items.forEach(it => steps.push({ type: 'intro', item: it }));
  steps.push(...shuffle(items.flatMap(it => exercisesFor(it, 'lesson'))));
  const terms = items.filter(i => i.kind === 'term');
  if (terms.length >= 3) steps.push(matchStep(terms.slice(0, 5)));
  runSession({ title: lesson.title, steps, itemIds: lesson.items, lessonId: lesson.id, mode: 'lesson' });
}
function startReview(free) {
  const ids = free ? shuffle(learnedIds()).slice(0, 10) : dueItems().slice(0, 10); if (!ids.length) return;
  const items = ids.map(id => ITEMS[id]);
  runSession({ title: free ? 'Práctica libre' : 'Repaso', steps: shuffle(items.flatMap(it => exercisesFor(it, 'review'))), itemIds: ids, mode: free ? 'free' : 'review' });
}
function startFixes(ids) {
  const items = ids.filter(i => ITEMS[i]).slice(0, 12).map(i => ITEMS[i]); if (!items.length) return;
  runSession({ title: 'Repaso de tus errores', steps: shuffle(items.flatMap(it => exercisesFor(it, 'review'))), itemIds: items.map(i => i.id), mode: 'review' });
}
function runSession(cfg) { SS = { cfg, queue: cfg.steps.slice(), total: cfg.steps.length, done: 0, combo: 0, maxCombo: 0, right: 0, tries: 0, wrong: new Set(), xp: 0, cat: {}, missed: [] }; nextStep(); }
function quitSession() { SS = null; go(tab); }
function nextStep() {
  if (!SS.queue.length) return finishSession();
  const step = SS.queue.shift(), body = h('div', { class: 'body' }), foot = h('div', { class: 'foot' });
  const pct = Math.round(SS.done / (SS.done + SS.queue.length + 1) * 100);
  show(h('div', { class: 'session' }, h('div', { class: 'shead' },
    h('button', { class: 'x', 'aria-label': 'Salir', onclick: () => { if (SS.done < 3 || confirm('¿Salir ahora? No pasa nada, puedes volver cuando quieras.')) quitSession(); } }, '✕'),
    h('div', { class: 'pbar' }, h('i', { style: `width:${pct}%` })), h('div', { class: 'combo' + (SS.combo >= 3 ? ' hot' : '') }, SS.combo >= 2 ? `🔥 ×${SS.combo}` : '')), body, foot), false);
  curKeys = null;
  if (step.type === 'intro') rIntro(step, body, foot); else if (step.type === 'note') rNote(step, body, foot); else if (step.type === 'match') rMatch(step, body, foot);
  else { const spec = step.make(); spec.itemId = step.itemId; spec.retry = !!step.retry; spec.src = step; spec.cat = step.cat; (spec.type === 'order' ? rOrder : rMcq)(spec, body, foot);
    if (SS.cfg.exam && spec.cat) body.prepend(h('div', { class: 'examcat' }, spec.cat + ' · ' + (SS.done + 1) + ' / ' + SS.total)); }
}
const advance = (lbl = 'Continuar', fn) => h('button', { class: 'btn primary', onclick: () => { sfx.tap(); (fn || (() => { SS.done++; nextStep(); }))(); } }, lbl);

function rNote(step, body, foot) { body.append(h('div', { class: 'card note' }, h('h2', {}, '💡 ' + step.note.title), step.note.fig ? h('div', { class: 'fig', html: step.note.fig }) : null, h('p', { html: md(step.note.body) }))); foot.append(advance('Entendido', () => nextStep())); }
function rIntro(step, body, foot) {
  const it = step.item, tag = { term: 'Concepto nuevo', fact: 'Idea clave', calc: 'Cálculo', order: 'Procedimiento', case: 'Caso' }[it.kind];
  const card = h('div', { class: 'card intro' }, h('div', { class: 'tag' }, tag));
  if (it.kind === 'term') card.append(...[h('div', { class: 'big-jp sm' }, it.term), h('div', { class: 'es', style: 'font-size:1.05rem;font-weight:600' }, it.def), it.hint ? h('p', { class: 'mnemo' }, '💭 ' + it.hint) : null].filter(Boolean));
  else if (it.kind === 'fact' || it.kind === 'calc') { const s = it.gen ? it.gen() : it; card.append(...[h('p', { style: 'font-weight:700;text-align:center' }, s.q), s.fig ? h('div', { class: 'fig', html: s.fig }) : null, h('div', { class: 'es' }, s.a), h('p', { class: 'mnemo' }, '💭 ' + s.explain)].filter(Boolean)); }
  else if (it.kind === 'order') card.append(h('p', { style: 'font-weight:700;text-align:center' }, it.prompt), h('ol', { style: 'text-align:left;line-height:1.5' }, it.steps.map(s => h('li', {}, s))), h('p', { class: 'mnemo' }, '💭 ' + it.explain));
  else if (it.kind === 'gap') card.append(h('p', { style: 'font-weight:700;text-align:center' }, it.prompt), h('pre', { class: 'code' }, it.code.replace('____', it.answer)), h('p', { class: 'mnemo' }, '💭 ' + it.explain));
  else if (it.kind === 'case') card.append(h('h2', { style: 'margin:0;text-align:center' }, it.title), caseEl(it), h('p', { class: 'muted' }, 'Léelo con calma y luego contesta.'));
  body.append(card); foot.append(advance('¡Entendido!', () => nextStep()));
}
function caseEl(it) { return h('div', { class: 'casecard' }, it.lines.map(l => h('div', { class: 'ln' }, l))); }

// --- opción múltiple ---
function rMcq(spec, body, foot) {
  const opts = h('div', { class: 'opts' }); let locked = false;
  spec.options.forEach((o, i) => { const b = h('button', { class: 'opt', onclick: () => choose(o, b) }, h('span', { class: 'num' }, i + 1), o.label); opts.append(b); });
  function choose(o, btn) {
    if (locked) return; locked = true;
    if (SS.cfg.exam) { opts.querySelectorAll('.opt').forEach(b => { b.disabled = true; }); btn.classList.add('picked'); grade(spec, o.correct); setTimeout(() => { SS.done++; nextStep(); }, 380); return; }
    opts.querySelectorAll('.opt').forEach((b, i) => { b.disabled = true; if (spec.options[i].correct) b.classList.add('right'); });
    if (!o.correct) btn.classList.add('wrong');
    grade(spec, o.correct); feedback(foot, o.correct, spec.answerText, spec.explain);
  }
  body.append(...[h('div', { class: 'q' }, spec.question),
    spec.fig ? h('div', { class: 'fig', html: spec.fig }) : null,
    spec.passage ? h('div', { class: 'card passage-card' }, h('b', {}, spec.passage.title), caseEl(spec.passage)) : null,
    spec.code ? h('pre', { class: 'code' }, spec.code) : null,
    spec.big ? h('div', { class: 'big-jp sm' }, spec.big) : null, opts].filter(Boolean));   // append nativo escribiría "null"
  curKeys = e => { const n = +e.key; if (n >= 1 && n <= spec.options.length && !locked) opts.children[n - 1].click(); };
}
// --- ordenar pasos ---
function rOrder(spec, body, foot) {
  const ans = h('div', { class: 'answer' }), bank = h('div', { class: 'bank' }), chosen = [];
  spec.steps.forEach(t => { const b = h('button', { class: 'tile', onclick: () => { if (b.parentNode === bank) { ans.append(b); chosen.push(t); } else { bank.append(b); chosen.splice(chosen.indexOf(t), 1); } sfx.tap(); check.disabled = chosen.length < spec.steps.length; } }, t); bank.append(b); });
  const check = h('button', { class: 'btn primary', disabled: '', onclick: () => {
    if (check.disabled) return; check.disabled = true;     // evita el doble toque (en el examen saltaría una pregunta)
    const ok = chosen.join('|') === spec.answer.join('|');
    ans.querySelectorAll('.tile').forEach(b => b.disabled = true); bank.querySelectorAll('.tile').forEach(b => b.disabled = true);
    if (SS.cfg.exam) { grade(spec, ok); ans.classList.add('picked'); setTimeout(() => { SS.done++; nextStep(); }, 380); return; }
    ans.classList.add(ok ? 'right' : 'wrong'); grade(spec, ok); feedback(foot, ok, spec.answerText, spec.explain);
  } }, 'Comprobar');
  body.append(h('div', { class: 'q' }, spec.question), h('div', { class: 'steps' }, ans, bank)); foot.append(check);
}
// --- emparejar ---
function rMatch(step, body, foot) {
  const L = shuffle(step.pairs), R = shuffle(step.pairs); let sel = null, left = step.pairs.length; const colL = h('div', { class: 'col' }), colR = h('div', { class: 'col' });
  const mk = (p, side, col) => { const b = h('button', { class: 'mt', style: side === 'l' ? 'font-weight:700' : 'font-size:.88rem', onclick: () => {
    if (b.classList.contains('gone')) return;
    if (!sel) { sel = { p, side, b }; b.classList.add('sel'); sfx.tap(); return; }
    if (sel.side === side) { sel.b.classList.remove('sel'); sel = { p, side, b }; b.classList.add('sel'); sfx.tap(); return; }
    if (sel.p.id === p.id) { [sel.b, b].forEach(x => { x.classList.remove('sel'); x.classList.add('gone'); }); sfx.pair(); sel = null; left--; if (!left) { SS.xp += 10; setTimeout(() => { SS.done++; nextStep(); }, 450); } }
    else { SS.wrong.add(sel.p.id); SS.wrong.add(p.id); sfx.bad(); const a = sel.b; a.classList.remove('sel'); a.classList.add('shake'); b.classList.add('shake'); setTimeout(() => { a.classList.remove('shake'); b.classList.remove('shake'); }, 400); sel = null; }
  } }, side === 'l' ? p.l : p.r); col.append(b); };
  L.forEach(p => mk(p, 'l', colL)); R.forEach(p => mk(p, 'r', colR));
  body.append(h('div', { class: 'q' }, 'Une las parejas'), h('div', { class: 'matchgrid' }, colL, colR));
}
// --- calificación y feedback ---
const GOOD_MSG = () => pick(APP.good);
function grade(spec, ok) {
  if (SS.cfg.exam) { const c = (SS.cat[spec.cat] = SS.cat[spec.cat] || { r: 0, t: 0 }); c.t++; SS.tries++; if (ok) { c.r++; SS.right++; } else { if (spec.itemId) SS.wrong.add(spec.itemId); SS.missed.push({ cat: spec.cat, id: spec.itemId, q: spec.big || spec.question, a: spec.answerText }); } return; }
  maybeCameo(ok); SS.tries++;
  if (ok) { SS.right++; SS.combo++; SS.maxCombo = Math.max(SS.maxCombo, SS.combo); SS.xp += spec.retry ? 4 : 10; sfx.ok(); }
  else { SS.combo = 0; sfx.bad(); if (!spec.retry) { SS.wrong.add(spec.itemId); SS.queue.splice(Math.min(3, SS.queue.length), 0, { itemId: spec.itemId, make: spec.src.make, retry: true }); } }
  const c = $('.combo'); if (c) { c.textContent = SS.combo >= 2 ? `🔥 ×${SS.combo}` : ''; c.classList.toggle('hot', SS.combo >= 3); }
}
function feedback(foot, ok, answerText, explain) {
  foot.replaceChildren(); foot.className = 'foot fb ' + (ok ? 'ok' : 'bad');
  foot.append(h('div', { class: 'msg' }, ok ? h('b', {}, GOOD_MSG()) : [h('b', {}, 'Casi. La respuesta es:'), h('div', { class: 'ans' }, answerText)],
    explain ? h('div', { class: 'explain' }, '💭 ' + explain) : null, ok ? null : h('small', {}, 'Volverá a salir enseguida.')), advance('Continuar'));
  curKeys = e => { if (e.key === 'Enter') foot.querySelector('.btn').click(); };
}
document.addEventListener('keydown', e => { if (SS && curKeys) curKeys(e); });

// ===================== fin de sesión =====================
function finishSession() {
  if (SS.cfg.exam) return finishExam();
  const cfg = SS.cfg, before = rankIdx(S.xp), perfect = SS.wrong.size === 0, gain = SS.xp + 20 + (perfect ? 10 : 0);
  if (cfg.mode !== 'free') cfg.itemIds.forEach(id => applyResult(id, !SS.wrong.has(id)));
  S.xp += gain; const today = dayKey(Date.now()); if (!S.days.includes(today)) S.days.push(today);
  if (cfg.lessonId) S.done[cfg.lessonId] = (S.done[cfg.lessonId] || 0) + 1; save();
  const after = rankIdx(S.xp), res = { gain, acc: SS.tries ? Math.round(SS.right / SS.tries * 100) : 100, maxCombo: SS.maxCombo, perfect, up: after > before, rank: APP.ranks[after], cfg, chest: cfg.mode !== 'free' };
  SS = null; sfx.win(); confetti(); renderResults(res);
}
function renderResults(r) {
  show(h('div', { class: 'session results' }, h('div', { class: 'body center' }, mascot(8, 'bob', r.up ? 'dance' : 'cheer'),
    h('h1', {}, r.perfect ? '¡Perfecto!' : '¡Lección completada!'), h('p', { class: 'muted' }, r.cfg.title),
    h('div', { class: 'stats' }, stat('⭐', '+' + r.gain, 'XP'), stat('🎯', r.acc + '%', 'precisión'), stat('🔥', '×' + r.maxCombo, 'mejor combo')),
    r.up ? h('div', { class: 'rankup' }, '🎖️ ¡Nuevo rango! ', h('b', {}, r.rank.icon + ' ' + r.rank.name)) : null, r.chest ? chestEl() : null),
    h('div', { class: 'foot' }, h('button', { class: 'btn primary', onclick: () => go('home') }, 'Volver al camino'))), false);
  if (r.up) setTimeout(() => confetti(60), 600);
}
function chestEl() {
  const box = h('div', { class: 'chestbox' }), btn = h('button', { class: 'chest', onclick: open }, '🎁', h('small', {}, 'Toca para abrir tu cofre'));
  function open() {
    btn.onclick = null; sfx.chest(); btn.classList.add('opening');
    const free = APP.treasures.map((t, i) => i).filter(i => !S.collection.includes(i));
    setTimeout(() => {
      if (free.length) { const i = pick(free); S.collection.push(i); save(); box.replaceChildren(h('div', { class: 'reward' }, h('span', { class: 'big-emoji pop' }, APP.treasures[i][0]), h('b', {}, '¡Nuevo tesoro!'), h('small', {}, APP.treasures[i][1]))); }
      else { S.xp += 15; save(); box.replaceChildren(h('div', { class: 'reward' }, h('span', { class: 'big-emoji pop' }, '💰'), h('b', {}, '+15 XP extra'), h('small', {}, '¡Colección completa!'))); }
      confetti(24);
    }, 700);
  }
  box.append(btn); return box;
}

// ===================== examen de nivel =====================
const EXAM_TIPS = { term: 'Repasa los conceptos fallados y relee sus definiciones; tus fallos ya están en el Repaso.', fact: 'Revisa las explicaciones: lo importante es el "por qué".', calc: 'Repite los cálculos con números distintos. Truco: casi todo son reglas de tres (distancias, tramos de cuerda o dientes).', order: 'Repite los procedimientos pensando en el motivo de cada paso (y la seguridad primero).', case: 'Lee los casos con calma y razona de lo simple a lo complejo (revisa lo barato y fácil antes que cambiar piezas).' };
function startExam(scope) {
  const pool = scope === 'learned' ? learnedIds().map(id => ITEMS[id]) : Object.values(ITEMS), steps = [];
  const N = { term: 6, fact: 5, calc: 5, order: 3, case: 2 };
  Object.keys(APP.kinds).forEach(kind => {
    shuffle(pool.filter(i => i.kind === kind)).slice(0, N[kind] || 3).forEach(it => {
      const exs = kind === 'term' ? [pick([E.t2d, E.d2t])(it)] : kind === 'case' ? [E.q(it, Math.floor(Math.random() * it.qs.length))] : exercisesFor(it, 'review');
      exs.forEach(ex => steps.push(Object.assign({}, ex, { cat: APP.kinds[kind] })));
    });
  });
  if (steps.length < 6) { alert('Aún no has estudiado lo suficiente para un examen con tu avance. Prueba «Todo el curso».'); return; }
  runSession({ title: scope === 'learned' ? 'Examen: lo que has estudiado' : 'Examen: todo el curso', steps, itemIds: [], mode: 'exam', exam: true, scope });
}
function finishExam() {
  const cfg = SS.cfg; let r = 0, t = 0; Object.values(SS.cat).forEach(c => { r += c.r; t += c.t; });
  const pct = t ? Math.round(r / t * 100) : 0, cats = Object.entries(SS.cat).map(([k, c]) => [k, Math.round(c.r / c.t * 100)]), missed = SS.missed.slice();
  SS.wrong.forEach(id => { if (S.srs[id]) applyResult(id, false); });
  const prev = (S.exams || []).filter(e => e.scope === cfg.scope).slice(-1)[0];
  S.exams = (S.exams || []).concat({ d: Date.now(), scope: cfg.scope, pct, cats: Object.fromEntries(cats), missed: [...new Set(missed.map(m => m.id).filter(Boolean))].slice(0, 30) }).slice(-10);
  const gain = r * 2; S.xp += gain; const today = dayKey(Date.now()); if (!S.days.includes(today)) S.days.push(today); save(); SS = null; sfx.win(); confetti(40);
  renderExamResults({ pct, cats, r, t, gain, scope: cfg.scope, missed, prev: prev ? prev.pct : null });
}
function renderExamResults(x) {
  const verdict = x.pct >= 85 ? '¡Nivel casi dominado! Listo para el siguiente.' : x.pct >= 65 ? 'Nivel sólido: estás cerca de dominarlo.' : x.pct >= 40 ? 'Vas bien. Refuerza tus puntos débiles.' : 'Estás construyendo la base: sigue con las lecciones y el repaso.';
  const kindOf = Object.fromEntries(Object.entries(APP.kinds).map(([k, v]) => [v, k])), weak = [...x.cats].sort((a, b) => a[1] - b[1]).filter(c => c[1] < 75).slice(0, 3);
  const ids = [...new Set(x.missed.map(m => m.id).filter(Boolean))], cnt = {};
  ids.forEach(id => { const l = Object.values(LESSON_BY_ID).find(l => l.items.includes(id)); if (l) cnt[l.id] = (cnt[l.id] || 0) + 1; });
  const lessons = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id, n]) => [LESSON_BY_ID[id], n]), byCat = {}; x.missed.forEach(m => { (byCat[m.cat] = byCat[m.cat] || []).push(m); });
  const delta = x.prev == null ? null : x.pct - x.prev;
  show(h('div', { class: 'session results' }, h('div', { class: 'body' },
    h('div', { class: 'center' }, mascot(6, 'bob', x.pct >= 65 ? 'dance' : 'cheer'), h('h1', {}, x.pct + ' %'), h('p', { class: 'muted' }, x.r + ' de ' + x.t + ' correctas'),
      delta == null ? null : h('p', { class: delta >= 0 ? 'delta up' : 'delta' }, (delta >= 0 ? '▲ +' : '▼ ') + delta + ' puntos respecto a tu último examen')),
    h('div', { class: 'card' }, h('b', {}, verdict), h('p', { class: 'muted' }, 'Es una orientación, no una evaluación oficial.')),
    h('div', { class: 'card examrows' }, x.cats.map(c => h('div', { class: 'examrow' + (c[1] < 60 ? ' low' : '') }, h('span', {}, c[0]), h('div', { class: 'xpbar' }, h('i', { style: 'width:' + c[1] + '%' })), h('b', {}, c[1] + ' %')))),
    weak.length ? h('div', { class: 'card' }, h('b', {}, '🎯 Qué repasar'), weak.map(c => h('p', {}, h('b', {}, c[0] + ' (' + c[1] + ' %). '), EXAM_TIPS[kindOf[c[0]]] || ''))) : null,
    lessons.length ? h('div', { class: 'card' }, h('b', {}, '📖 Lecciones para repasar'), lessons.map(([l, n]) => h('button', { class: 'btn ghost', onclick: () => startLesson(l) }, l.icon + '  ' + l.title + '  ·  ' + n + (n === 1 ? ' error' : ' errores')))) : null,
    Object.keys(byCat).length ? h('div', { class: 'card' }, h('b', {}, '❌ Lo que has fallado'), Object.entries(byCat).map(([cat, list]) => h('details', {}, h('summary', {}, cat + ' (' + list.length + ')'), list.map(m => h('div', { class: 'missrow' }, h('span', { class: 'mq' }, m.q), h('span', { class: 'ma' }, '→ ' + m.a)))))) : null,
    h('p', { class: 'muted center' }, '+' + x.gain + ' XP')),
    h('div', { class: 'foot' }, ids.length ? h('button', { class: 'btn primary', onclick: () => startFixes(ids) }, 'Repasar mis errores ahora') : null, h('button', { class: 'btn ghost', onclick: () => go('dojo') }, 'Volver al Taller'))), false);
}

// ===================== arranque =====================
document.title = APP.name;
go('home');
({ '#repaso': () => go('review'), '#taller': () => go('dojo') })[location.hash]?.();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
