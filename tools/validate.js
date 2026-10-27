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
    c_tren: (n, a) => near(a[0], n[0] * n[2]),
    c_dist_huecos: (n, a) => near(a[0], (n[1] - n[0]) * 8),                       // saltos × 8 mm
    c_palanca_viga: (n, a) => near(a[0], (n[3] - n[1]) / (n[1] - n[2])),          // [15, apoyo, carga, mano]
    c_engr_technic: (n, a) => near(a[0], n[1] / n[0]),
    c_precio_kg: (n, a, s) => { const ka = n[0] / n[1], kb = n[2] / n[3], m = /lote (A|B)/.exec(s.a); if (!m) return false; const w = m[1], kw = Math.min(ka, kb); return (w === 'A') === (ka < kb) && near(num(s.a)[0], Math.round(kw * 10) / 10); },
    c_carrera: (n, a) => near(a[0], 2 * n[0]),                      // carrera = 2 × radio
    c_leva_lev: (n, a) => near(a[0], 2 * n[0]),                     // elevación = 2 × excentricidad
    c_rack_avance: (n, a) => near(a[0], n[0] * n[1]),               // avance = dientes × paso
    c_sinfin_rel: (n, a) => near(a[0], n[0]),                       // vueltas del tornillo = dientes (1 entrada)
    c_peso_calc: (n, a) => near(a[0], n[0] * n[1]),                 // peso = masa × 9,8
    c_resultante_calc: (n, a, s) => near(a[0], Math.abs(n[0] - n[1])) && (n[0] > n[1]) === /izquierda/.test(s.a),   // se restan; gana la mayor
    c_roz_calc: (n, a) => near(a[0], n[0] * n[1]),                  // μ × normal
    c_trabajo_calc: (n, a) => near(a[0], n[0] * n[1]),              // fuerza × distancia
    c_potencia_calc: (n, a) => near(a[0], n[0] / n[1])              // trabajo ÷ tiempo
  };
  Object.entries(VER).forEach(([id, f]) => { const it = ITEMS[id]; if (!it) return add(`${id}: no existe`); for (let k = 0; k < 200; k++) { const s = it.gen(); const n = num(s.q), a = num(s.a); if (!f(n, a, s)) { add(`${id}: cálculo incorrecto → «${s.q}» = «${s.a}»`); break; } if (s.wrong.some(w => w === s.a)) { add(`${id}: distractor igual a la respuesta`); break; } } });
  // figuras animadas: cada una debe tener su animación y no producir NaN en ningún instante (se prueba fuera de pantalla)
  const figs = [];
  ids.forEach(id => { const it = ITEMS[id]; (it.gen ? Array.from({ length: 12 }, () => it.gen()) : [it]).forEach(s => s.fig && figs.push([id, s.fig])); });
  UNITS.forEach(u => u.lessons.forEach(l => { if (l.note && l.note.fig) figs.push([l.id + ' (nota)', l.note.fig]); if (l.curio && l.curio.fig) figs.push([l.id + ' (curiosidad)', l.curio.fig]); }));
  let animadas = 0;
  figs.forEach(([id, f]) => {
    const d = new DOMParser().parseFromString(f, 'image/svg+xml').documentElement;
    if (d.querySelector('parsererror') || /NaN|undefined/.test(f)) return add(`${id}: figura no válida (XML roto o NaN)`);
    if (!d.hasAttribute('data-anim')) return;
    animadas++; const nom = d.getAttribute('data-anim'), host = document.createElement('div'); host.innerHTML = f; const svg = host.querySelector('svg');
    if (typeof ANIMS === 'undefined' || !ANIMS[nom]) return add(`${id}: la animación «${nom}» no existe`);
    try { [0, 0.37, 0.9, 1.5, 2.7, 5.1, 9.9, 33].forEach(t => { ANIMS[nom](svg, t); if (/NaN|undefined|Infinity/.test(svg.outerHTML)) throw new Error('valor no válido en t=' + t); }); } catch (e) { add(`${id}: la animación «${nom}» falla (${e.message})`); }
  });
  // curiosidades y misiones
  UNITS.forEach(u => {
    u.lessons.forEach(l => { if (l.curio && (!l.curio.body || l.curio.body.length < 60 || !l.curio.title)) add(`${l.id}: curiosidad incompleta`); });
    if (u.mission) { const m = u.mission; if (!m.id || !m.title || !m.why || !m.versions || !Object.keys(m.versions).length) add(`${u.id}: misión incompleta`); Object.entries(m.versions || {}).forEach(([k, v]) => { if (!v.label || !v.steps || v.steps.length < 3) add(`${u.id}: la versión «${k}» de la misión tiene menos de 3 pasos`); }); if (!m.safety) add(`${u.id}: la misión no tiene aviso de seguridad`); }
  });
  const mids = UNITS.filter(u => u.mission).map(u => u.mission.id); if (new Set(mids).size !== mids.length) add('ids de misión repetidos');
  return { items: ids.length, lecciones: seenLesson.size, animadas, curiosidades: UNITS.flatMap(u => u.lessons).filter(l => l.curio).length, misiones: mids.length, n: P.length, problemas: P };
})();
