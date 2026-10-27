// VALIDADOR DE CONTENIDO — pégalo en la consola de la página (o ejecútalo con javascript_tool).
// Devuelve { n, problemas:[...] }. Debe dar n = 0 antes de dar nada por terminado.
(() => {
  const P = [], add = m => P.push(m);
  const ids = Object.keys(ITEMS);
  const need = { term: ['term', 'def'], fact: ['q', 'a', 'wrong', 'explain'], calc: ['q', 'a', 'wrong', 'explain'], order: ['prompt', 'steps', 'explain'], gap: ['prompt', 'code', 'answer', 'wrong', 'explain'], case: ['title', 'lines', 'qs'] };
  const distinct = a => new Set(a).size === a.length;
  ids.forEach(id => {
    const it = ITEMS[id];
    if (it.id !== id) add(`${id}: la clave y el id no coinciden`);
    if (!need[it.kind]) return add(`${id}: tipo desconocido «${it.kind}»`);
    need[it.kind].forEach(f => { if (it[f] == null && !(it.gen && ['q', 'a', 'wrong', 'explain'].includes(f))) add(`${id}: falta el campo «${f}»`); });
    if (it.kind === 'fact' || it.kind === 'calc') {
      const samples = it.gen ? Array.from({ length: 40 }, () => it.gen()) : [it];
      samples.forEach((s, k) => {
        if (!s.wrong || s.wrong.length < 3) return add(`${id}: menos de 3 distractores (muestra ${k})`);
        if (s.wrong.includes(s.a)) add(`${id}: un distractor repite la respuesta (muestra ${k})`);
        if (!distinct(s.wrong)) add(`${id}: distractores repetidos (muestra ${k})`);
        if (!s.explain || s.explain.length < 12) add(`${id}: explicación demasiado corta (muestra ${k})`);
      });
    }
    if (it.kind === 'order') { if (it.steps.length < 3) add(`${id}: menos de 3 pasos`); if (!distinct(it.steps)) add(`${id}: pasos repetidos`); }
    if (it.kind === 'gap') { if ((it.code.match(/____/g) || []).length !== 1) add(`${id}: el código debe tener exactamente un «____»`); if (it.wrong.includes(it.answer)) add(`${id}: un distractor es la respuesta`); if (it.wrong.length < 3) add(`${id}: menos de 3 distractores`); }
    if (it.kind === 'case') it.qs.forEach((q, i) => { if (q[2] < 0 || q[2] >= q[1].length) add(`${id}: pregunta ${i} con índice correcto fuera de rango`); if (!distinct(q[1])) add(`${id}: pregunta ${i} con opciones repetidas`); });
  });
  // respuestas ambiguas: dos términos con la misma definición, o definiciones repetidas
  const defs = {}; ids.filter(i => ITEMS[i].kind === 'term').forEach(i => { (defs[ITEMS[i].def] = defs[ITEMS[i].def] || []).push(i); });
  Object.entries(defs).forEach(([d, l]) => { if (l.length > 1) add(`definición repetida en ${l.join(', ')}`); });
  // lecciones y unidades
  const seenLesson = new Set();
  UNITS.forEach(u => u.lessons.forEach(l => {
    if (seenLesson.has(l.id)) add(`lección repetida ${l.id}`); seenLesson.add(l.id);
    if (l.items.length > 7) add(`${l.id}: más de 7 items (${l.items.length})`);
    if (!l.items.length) add(`${l.id}: sin items`);
    l.items.forEach(i => { if (!ITEMS[i]) add(`${l.id}: el item ${i} no existe`); });
  }));
  // items que no están en ninguna lección
  const used = new Set(UNITS.flatMap(u => u.lessons.flatMap(l => l.items))); ids.forEach(i => { if (!used.has(i)) add(`${i}: no aparece en ninguna lección`); });
  // distractores disponibles para términos (mínimo 3 otros términos)
  if (ids.filter(i => ITEMS[i].kind === 'term').length < 4) add('hacen falta ≥ 4 términos para generar opciones');
  // figuras SVG bien formadas
  ids.forEach(id => { const it = ITEMS[id]; const ss = it.gen ? Array.from({ length: 20 }, () => it.gen()) : [it]; ss.forEach(s => { if (s.fig != null) { if (!/^<svg[\s\S]*<\/svg>$/.test(s.fig)) add(`${id}: figura mal formada`); if (/NaN|undefined/.test(s.fig)) add(`${id}: la figura contiene NaN/undefined`); const d = new DOMParser().parseFromString(s.fig, 'image/svg+xml'); if (d.querySelector('parsererror')) add(`${id}: la figura no es XML válido`); } }); });
  // verificación numérica de los generadores (se recalcula con código, no a mano)
  const num = s => (s.match(/\d+(?:,\d+)?/g) || []).map(x => parseFloat(x.replace(',', '.'))), near = (x, y) => Math.abs(x - y) < 1e-6 * Math.max(1, Math.abs(y));
  const VER = {
    c_palanca_f: (n, a) => near(a[0] * n[1], n[2] * n[0]),         // F·de = W·dc
    c_palanca_v: (n, a) => near(a[0], n[1] / n[0]),
    c_polea_f: (n, a) => near(a[0] * n[1], n[0]),            // F·tramos = W
    c_relacion: (n, a) => near(a[0], n[1] / n[0]),
    c_velocidad: (n, a) => near(a[0] * n[2], n[1] * n[0]),         // n2·z2 = n1·z1
    c_tren: (n, a) => near(a[0], n[0] * n[2])
  };
  Object.entries(VER).forEach(([id, f]) => { const it = ITEMS[id]; if (!it) return add(`${id}: no existe`); for (let k = 0; k < 200; k++) { const s = it.gen(); const n = num(s.q), a = num(s.a); if (!f(n, a)) { add(`${id}: cálculo incorrecto → «${s.q}» = «${s.a}»`); break; } if (s.wrong.some(w => w === s.a)) { add(`${id}: distractor igual a la respuesta`); break; } } });
  return { items: ids.length, lecciones: seenLesson.size, n: P.length, problemas: P };
})();
