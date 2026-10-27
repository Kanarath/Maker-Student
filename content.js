// =====================================================================
// CONFIGURACIÓN Y CONTENIDO — Taller de Inventor (MVP: unidad «Ventaja mecánica»)
// Reglas: ids estables para siempre · ≤ 7 items por lección · explicación siempre · nada se usa antes de enseñarse.
// =====================================================================
const APP = {
  key: 'tallerinventor',                 // clave de localStorage (única por app)
  name: 'Maker Student',
  greetings: ['Sin presión: cualquier ejercicio suma.', 'Dos minutos bastan. Cada sesión cuenta.', 'Aquí no se pierde nada. Solo se avanza.', 'Todo invento empieza con: «¿cómo funciona esto?»'],
  good: ['¡Bien!', '¡Eso es!', '¡Excelente!', '¡Perfecto!', '¡Funciona!', '¡Bien montado!'],
  ranks: [
    { xp: 0, name: 'Aprendiz', icon: '🔧' }, { xp: 150, name: 'Montador', icon: '🔩' }, { xp: 400, name: 'Manitas', icon: '⚙️' },
    { xp: 800, name: 'Mecánico', icon: '🛠️' }, { xp: 1400, name: 'Diseñador', icon: '📐' }, { xp: 2400, name: 'Inventor', icon: '💡' }, { xp: 4000, name: 'Maestro inventor', icon: '🏆' }
  ],
  // Colección: piezas, herramientas e inventos (emojis del sistema; ver docs/06 sobre emojis como arte)
  treasures: [['🔧', 'Llave inglesa'], ['🔩', 'Tornillo y tuerca'], ['⚙️', 'Engranaje'], ['🧰', 'Caja de herramientas'], ['⛓️', 'Cadena'], ['🧲', 'Imán'], ['📐', 'Escuadra'], ['📏', 'Regla'],
    ['🔨', 'Martillo'], ['⚖️', 'Balanza'], ['🏗️', 'Grúa'], ['🚲', 'Bicicleta'], ['🦾', 'Brazo mecánico'], ['🕰️', 'Reloj mecánico'], ['🛠️', 'Herramientas cruzadas'], ['💡', 'Idea']],
  kinds: { term: 'Conceptos', fact: 'Teoría', calc: 'Cálculo', order: 'Procedimientos', case: 'Casos y diagnóstico' },
  kindIcon: { term: '🔤', fact: '❓', calc: '🧮', order: '🔢', case: '🔍' }
};

const ITEMS = {};
function addItem(it) { ITEMS[it.id] = it; return it.id; }

// ---- Constructores de contenido (un item = una idea) ----
// término ↔ definición   (hint: truco para recordar; short: versión corta para emparejar)
const T = (id, term, def, group, hint, short) => addItem({ id: 't_' + id, kind: 'term', term, def, group, hint, short });
// pregunta con distractores propios (explain: el POR QUÉ; fig: dibujo SVG opcional)
const F = (id, q, a, wrong, explain, group, fig) => addItem({ id: 'f_' + id, kind: 'fact', q, a, wrong, explain, group, fig });
// cálculo con generador opcional de números aleatorios: gen() → { q, a, wrong:[...], explain, fig? }
const C = (id, q, a, wrong, explain, group, gen, fig) => addItem({ id: 'c_' + id, kind: 'calc', q, a, wrong, explain, group, gen, fig });
// ordenar pasos
const O = (id, prompt, steps, explain, group) => addItem({ id: 'o_' + id, kind: 'order', prompt, steps, explain, group });
// caso/lectura con preguntas: qs = [[pregunta, [opciones], índiceCorrecto, explicación]]
const X = (id, title, lines, qs, group) => addItem({ id: 'x_' + id, kind: 'case', title, lines, qs, group });

// Utilidades para generadores (`pick` se define en app.js; estos generadores solo corren con la app cargada)
const fmt = (n, d = 1) => (Math.round(n * 10 ** d) / 10 ** d).toString().replace('.', ',');
const uniq = (arr, correct) => [...new Set(arr)].filter(x => x !== correct);

// =====================================================================
// FIGURAS SVG PROPIAS (sin derechos de autor): dibujos técnicos de línea. Usan variables CSS (teal, dorado, blancos).
// =====================================================================
const SV = {
  ink: 'stroke="var(--teal)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"',      // contorno de piezas
  key: 'stroke="var(--gold)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"',      // lo que importa (apoyo, carga, fuerza)
  wire: 'stroke="var(--ink)" stroke-width="1.8" stroke-linecap="round"',                              // cuerdas
  fill: 'fill="var(--fillt)"',
  wrap: (vb, inner, label, extra = '') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}" style="width:100%;height:auto;max-height:210px"${extra}>${inner}</svg>`,
  txt: (x, y, s, size = 12, anchor = 'middle', w = 600) => `<text x="${x}" y="${y}" font-size="${size}" font-weight="${w}" text-anchor="${anchor}" fill="var(--ink)" font-family="ui-monospace,Consolas,monospace">${s}</text>`,
  arrowDown: (x, y1, y2) => `<path d="M${x} ${y1}V${y2}M${x - 7} ${y2 - 10}L${x} ${y2}L${x + 7} ${y2 - 10}" fill="none" stroke="var(--gold)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  // cota de dibujo técnico: línea con topes y rótulo
  dim: (x1, x2, y, label) => `<path d="M${x1} ${y - 5}V${y + 5}M${x2} ${y - 5}V${y + 5}M${x1} ${y}H${x2}" stroke="var(--muted)" stroke-width="1.3" fill="none"/>` + SV.txt((x1 + x2) / 2, y + 17, label, 12)
};
// Palanca con la carga a la izquierda y tu mano a la derecha. dc / de = distancias al apoyo (cm).
function leverSVG(dc, de, loadLabel) {
  const x0 = 32, x1 = 296, fx = x0 + (x1 - x0) * dc / (dc + de), y = 84;
  return SV.wrap('0 0 320 166',
    `<rect x="${x0 - 8}" y="${y - 5}" width="${x1 - x0 + 16}" height="10" rx="4" ${SV.fill} ${SV.ink}/>` +
    `<path d="M${fx} ${y + 5}L${fx - 17} ${y + 38}H${fx + 17}Z" ${SV.fill} ${SV.key}/>` +
    `<rect x="${x0 - 22}" y="${y - 42}" width="48" height="36" rx="6" ${SV.fill} ${SV.ink}/>` + SV.txt(x0 + 2, y - 19, loadLabel, 12) +
    SV.arrowDown(x1 - 6, y - 54, y - 8) + SV.txt(x1 - 6, y - 60, 'tu mano', 12) +
    `<path d="M${x0 + 2} ${y + 8}V${y + 52}M${fx} ${y + 40}V${y + 52}M${x1 - 6} ${y + 8}V${y + 52}" stroke="var(--muted)" stroke-width="1" stroke-dasharray="3 3"/>` +
    SV.dim(x0 + 2, fx, y + 56, dc + ' cm') + SV.dim(fx, x1 - 6, y + 56, de + ' cm'), 'Palanca con la carga a la izquierda y tu mano a la derecha');
}
// Balancín: niño pesado cerca del centro, niño ligero lejos.
function seesawSVG() {
  return SV.wrap('0 0 320 150',
    `<rect x="24" y="86" width="272" height="10" rx="4" ${SV.fill} ${SV.ink}/>` +
    `<path d="M160 96L144 128H176Z" ${SV.fill} ${SV.key}/>` +
    `<circle cx="112" cy="62" r="20" ${SV.fill} ${SV.key}/>` + SV.txt(112, 34, 'pesado', 11) +
    `<circle cx="276" cy="70" r="11" ${SV.fill} ${SV.ink}/>` + SV.txt(276, 50, 'ligero', 11) +
    SV.dim(112, 160, 128, 'cerca') +SV.dim(160, 276, 128, 'lejos'), 'Balancín en equilibrio: uno pesado cerca del centro y uno ligero lejos');
}
// Polea fija: solo cambia la dirección.
function fixedPulleySVG() {
  return SV.wrap('0 0 320 190',
    `<rect x="100" y="10" width="120" height="10" rx="3" ${SV.fill} ${SV.ink}/>` +
    `<path d="M160 20V34" ${SV.ink} fill="none"/><circle cx="160" cy="56" r="22" ${SV.fill} ${SV.ink}/><circle cx="160" cy="56" r="3.5" fill="var(--ink)"/>` +
    `<path d="M138 56V150M182 56V120" fill="none" ${SV.wire}/>` +
    `<rect x="116" y="150" width="44" height="30" rx="6" ${SV.fill} ${SV.key}/>` + SV.txt(138, 170, 'carga', 12) +
    SV.arrowDown(182, 100, 150) + SV.txt(198, 140, 'tiras ↓', 13, 'start') + SV.txt(108, 168, 'sube ↑', 13, 'end'), 'Polea fija: tiras hacia abajo y la carga sube');
}
// n tramos de cuerda sujetan la carga (polea móvil / polipasto simplificado).
function ropesSVG(n) {
  const w = 150, x0 = 160 - w / 2, xs = Array.from({ length: n }, (_, i) => x0 + 10 + (w - 20) * (n === 1 ? .5 : i / (n - 1)));
  return SV.wrap('0 0 320 190',
    `<rect x="${x0 - 20}" y="10" width="${w + 40}" height="10" rx="3" ${SV.fill} ${SV.ink}/>` +
    xs.map(x => `<path d="M${x} 20V104" fill="none" ${SV.wire}/>`).join('') +
    `<rect x="${x0}" y="104" width="${w}" height="40" rx="8" ${SV.fill} ${SV.key}/>` + SV.txt(160, 129, 'carga', 14) +
    SV.txt(160, 168, n + (n === 1 ? ' tramo sujeta' : ' tramos sujetan') + ' la carga', 13), n + ' tramos de cuerda sujetan la carga');
}
// Dos engranajes engranados. z1 = piñón (motriz, a la izquierda), z2 = rueda conducida.
function gearsSVG(z1, z2) {
  const th = 2.4, ro1 = z1 + th / 2, ro2 = z2 + th / 2;           // radio de paso = nº de dientes (módulo 2)
  const m = 6, W0 = 2 * ro1 + 2 * ro2 - th + 2 * m, H0 = 2 * Math.max(ro1, ro2) + 2 * m, s = 300 / W0, sw = (2.4 / s).toFixed(2);   // escala a 300 px de ancho; trazo constante
  const c1 = m + ro1, c2 = c1 + z1 + z2, cy = m + Math.max(ro1, ro2);
  const gear = (cx, z, off, stroke, role) => {
    const a = 2 * Math.PI / z, p = [];
    for (let i = 0; i < z; i++) { const t = off + i * a; [[-.5, z - th / 2], [-.2, z + th / 2], [.2, z + th / 2], [.5, z - th / 2]].forEach(([d, r]) => p.push((cx + r * Math.cos(t + d * a)).toFixed(1) + ',' + (cy + r * Math.sin(t + d * a)).toFixed(1))); }
    return `<g data-r="${role}" data-cx="${cx}" data-cy="${cy}"><polygon points="${p.join(' ')}" fill="var(--fillt)" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/><circle cx="${cx}" cy="${cy}" r="${Math.max(2.5, z * .14)}" fill="var(--ink)"/><circle cx="${cx}" cy="${cy - z * .62}" r="${Math.max(2, z * .09)}" fill="var(--gold)"/></g>`;
  };
  const H = H0 * s + 30;
  return SV.wrap(`0 0 320 ${H.toFixed(0)}`,
    `<g transform="translate(10 0) scale(${s.toFixed(3)})">${gear(c1, z1, 0, 'var(--gold)', 'g1')}${gear(c2, z2, Math.PI + Math.PI / z2, 'var(--teal)', 'g2')}</g>` +
    SV.txt(10, H - 8, 'piñón: ' + z1 + ' dientes', 13, 'start') + SV.txt(310, H - 8, 'rueda: ' + z2 + ' dientes', 13, 'end'), `Dos engranajes: piñón de ${z1} dientes y rueda de ${z2} dientes`, ` data-anim="gears" data-z1="${z1}" data-z2="${z2}"`);
}

// =====================================================================
// UNIDAD «VENTAJA MECÁNICA»
// =====================================================================

// ---- Lección 1 · La palanca ----
T('palanca', 'Palanca', 'Barra rígida que gira alrededor de un punto fijo para multiplicar fuerza o recorrido.', 'p1', 'Un balancín de parque es una palanca.', 'Barra que gira sobre un apoyo');
T('apoyo', 'Punto de apoyo (fulcro)', 'Punto fijo sobre el que gira la palanca.', 'p1', 'El centro del balancín.', 'Punto sobre el que gira');
T('brazo', 'Brazo de palanca', 'Distancia entre el punto de apoyo y el lugar donde actúa una fuerza.', 'p1', 'Cuanto más largo, más efecto de giro hace la misma fuerza.', 'Distancia del apoyo a la fuerza');
T('ventaja', 'Ventaja mecánica', 'Cuántas veces una máquina multiplica la fuerza que aplicas (a cambio de mover más la mano).', 'p1', 'Ganas fuerza, pagas con recorrido.', 'Veces que multiplica tu fuerza');
F('balancin', 'En un balancín, un niño pesado se sienta cerca del centro y uno ligero lejos, y quedan equilibrados. ¿Por qué?', 'Lo que cuenta es el peso × la distancia al apoyo, y puede ser igual en los dos lados', ['El niño ligero pesa más por estar lejos', 'El apoyo absorbe parte del peso', 'La distancia al apoyo no influye'],
  'Cada lado hace un efecto de giro igual a su peso multiplicado por su distancia al apoyo. Poco peso con mucha distancia puede igualar a mucho peso con poca distancia.', 'p1', seesawSVG());
F('gratis', 'Con una palanca levantas algo muy pesado haciendo poca fuerza. ¿Qué pagas a cambio?', 'Recorrido: tu mano se mueve mucho más que la carga', ['Nada: la palanca crea fuerza extra', 'Que la carga pese más', 'Que la carga suba más deprisa que tu mano'],
  'La palanca no crea energía: cambia fuerza por recorrido. Si haces la mitad de fuerza, tu mano debe recorrer el doble de distancia.', 'p1');

// ---- Lección 2 · Calcular palancas ----
C('palanca_f', 'La carga está a 20 cm del apoyo y tu mano a 60 cm del apoyo. Para sostener una carga de 90 N (unos 9 kg), ¿qué fuerza haces con la mano?', '30 N', ['90 N', '270 N', '22,5 N'],
  'Tu brazo es 60 / 20 = 3 veces más largo, así que la fuerza se divide entre 3: 90 ÷ 3 = 30 N. Comprobación: 30 × 60 = 90 × 20.', 'p2', () => {
    const k = pick([2, 3, 4, 5]), dc = pick([10, 15, 20, 25]), de = dc * k, F = pick([10, 15, 20, 25]), W = F * k;
    return { q: `La carga está a ${dc} cm del apoyo y tu mano a ${de} cm del apoyo. Para sostener una carga de ${W} N, ¿qué fuerza haces con la mano?`, a: F + ' N', wrong: uniq([W + ' N', W * k + ' N', fmt(W / (k + 1)) + ' N'], F + ' N'),
      explain: `Tu brazo es ${de} / ${dc} = ${k} veces más largo, así que la fuerza se divide entre ${k}: ${W} ÷ ${k} = ${F} N. Comprobación: ${F} × ${de} = ${W} × ${dc}.`, fig: leverSVG(dc, de, W + ' N') };
  }, leverSVG(20, 60, '90 N'));
C('palanca_v', 'La carga está a 20 cm del apoyo y tu mano a 60 cm del apoyo. ¿Cuántas veces multiplica la fuerza esta palanca?', '3 veces', ['4 veces', '6 veces', 'La divide entre 3'],
  'Ventaja mecánica = brazo de tu mano ÷ brazo de la carga = 60 / 20 = 3.', 'p2', () => {
    const k = pick([2, 3, 4, 5]), dc = pick([10, 15, 20, 25]), de = dc * k;
    return { q: `La carga está a ${dc} cm del apoyo y tu mano a ${de} cm del apoyo. ¿Cuántas veces multiplica la fuerza esta palanca?`, a: k + ' veces', wrong: uniq([(k + 1) + ' veces', (k * 2) + ' veces', 'La divide entre ' + k], k + ' veces'),
      explain: `Ventaja mecánica = brazo de tu mano ÷ brazo de la carga = ${de} / ${dc} = ${k}.`, fig: leverSVG(dc, de, '?') };
  });
F('equilibrio', 'Una palanca está en equilibrio: a un lado hay 30 N a 2 m del apoyo. Del otro lado, a 1 m del apoyo, ¿qué fuerza la equilibra?', '60 N', ['15 N', '30 N', '90 N'],
  'Fuerza × distancia debe ser igual en los dos lados: 30 × 2 = 60, así que a 1 m hace falta 60 / 1 = 60 N. A mitad de distancia, doble de fuerza.', 'p2');
F('colocar', 'Quieres levantar una piedra pesada con una barra. ¿Dónde conviene poner el apoyo?', 'Lo más cerca posible de la piedra', ['Lo más lejos posible de la piedra', 'Justo en el centro de la barra, siempre', 'Da igual dónde se ponga'],
  'Cuanto más corto es el brazo de la piedra y más largo el tuyo, mayor es la ventaja mecánica. Con el apoyo pegado a la piedra, tu empuje se multiplica más.', 'p2', leverSVG(10, 70, 'piedra'));

// ---- Lección 3 · Poleas ----
T('polipasto', 'Polipasto', 'Conjunto de poleas fijas y móviles con una sola cuerda, para multiplicar mucho la fuerza.', 'p3', 'Los talleres lo usan para sacar motores.', 'Varias poleas con una cuerda');
T('polea_fija', 'Polea fija', 'Polea con el eje sujeto: solo cambia la dirección de la fuerza, no la multiplica.', 'p3', 'Tiras hacia abajo para que algo suba.', 'Solo cambia la dirección');
T('polea_movil', 'Polea móvil', 'Polea que se mueve junto con la carga: la cuerda la sujeta por dos tramos y se reparte el peso.', 'p3', 'Dos tramos de cuerda sujetan la carga: cada uno aguanta la mitad.', 'Se mueve con la carga');
F('polea_fija', '¿Para qué sirve una polea fija?', 'Para cambiar la dirección de la fuerza (tirar hacia abajo para subir)', ['Para multiplicar la fuerza por dos', 'Para que la carga pese menos', 'Para ahorrar cuerda'],
  'En una polea fija la cuerda tiene el mismo esfuerzo en los dos lados: tiras con la misma fuerza que pesa la carga. Lo útil es poder tirar hacia abajo, aprovechando tu peso.', 'p3', fixedPulleySVG());
F('polea_cuerda', 'Para subir una carga 1 m con una polea móvil de 2 tramos de cuerda, ¿cuánta cuerda tienes que recoger?', '2 m', ['1 m', '0,5 m', '4 m'],
  'Cada uno de los 2 tramos debe acortarse 1 m para que la carga suba 1 m: recoges 2 m. Es el precio de hacer la mitad de fuerza: nada es gratis.', 'p3', ropesSVG(2));
C('polea_f', 'Una carga de 80 N cuelga de 2 tramos de cuerda. Sin contar el rozamiento, ¿qué fuerza hay que hacer para sostenerla?', '40 N', ['80 N', '160 N', '26,7 N'],
  'La fuerza se reparte entre los tramos que sujetan la carga: 80 ÷ 2 = 40 N (en la práctica algo más por el rozamiento).', 'p3', () => {
    const n = pick([2, 3, 4]), F = pick([10, 15, 20, 25]), W = F * n;
    return { q: `Una carga de ${W} N cuelga de ${n} tramos de cuerda. Sin contar el rozamiento, ¿qué fuerza hay que hacer para sostenerla?`, a: F + ' N', wrong: uniq([W + ' N', W * n + ' N', fmt(W / (n + 1)) + ' N'], F + ' N'),
      explain: `La fuerza se reparte entre los tramos que sujetan la carga: ${W} ÷ ${n} = ${F} N (en la práctica algo más por el rozamiento).`, fig: ropesSVG(n) };
  }, ropesSVG(2));

// ---- Lección 4 · Engranajes ----
T('pinon', 'Piñón (engranaje motriz)', 'Engranaje que recibe el giro del motor o de tu mano y lo transmite a otro.', 'p4', 'Es el que empuja.', 'El que empuja');
T('conducida', 'Rueda conducida', 'Engranaje que recibe el giro del piñón con el que engrana.', 'p4', 'Es el que es empujado.', 'El que es movido');
T('relacion', 'Relación de transmisión', 'Dientes de la rueda conducida ÷ dientes del piñón. Si es mayor que 1, la salida gira más lenta y con más fuerza de giro.', 'p4', 'Más dientes en la rueda conducida = más lento y más fuerte.', 'Dientes conducida ÷ piñón');
F('sentido', 'Dos engranajes engranan directamente. Uno gira a la derecha (sentido horario). El otro gira…', 'a la izquierda (sentido contrario)', ['a la derecha (el mismo sentido)', 'a la derecha, pero más despacio', 'no gira'],
  'Los dientes del primero empujan a los del segundo en el punto de contacto, y el segundo gira en sentido contrario. Para conservar el sentido hace falta un tercer engranaje intermedio.', 'p4', gearsSVG(12, 20));
C('relacion', 'Un piñón de 20 dientes mueve una rueda de 60 dientes. ¿Cuál es la relación de transmisión?', '3 : 1', ['1 : 3', '2 : 1', '40 : 1'],
  '60 ÷ 20 = 3. La rueda gira 3 veces más lenta que el piñón y, en el caso ideal, con 3 veces más fuerza de giro.', 'p4', () => {
    const z1 = pick([8, 10, 12, 16, 20]), k = pick([2, 3, 4]), z2 = z1 * k;
    return { q: `Un piñón de ${z1} dientes mueve una rueda de ${z2} dientes. ¿Cuál es la relación de transmisión?`, a: k + ' : 1', wrong: uniq(['1 : ' + k, (k + 1) + ' : 1', (k * 2) + ' : 1'], k + ' : 1'),
      explain: `${z2} ÷ ${z1} = ${k}. La rueda gira ${k} veces más lenta que el piñón y, en el caso ideal, con ${k} veces más fuerza de giro.`, fig: gearsSVG(z1, z2) };
  }, gearsSVG(20, 60));
C('velocidad', 'Un piñón de 10 dientes gira a 120 vueltas por minuto (rpm) y mueve una rueda de 30 dientes. ¿A qué velocidad gira la rueda?', '40 rpm', ['360 rpm', '120 rpm', '30 rpm'],
  'La rueda tiene 3 veces más dientes, así que gira 3 veces más lenta: 120 ÷ 3 = 40 rpm.', 'p4', () => {
    const z1 = pick([10, 12, 15, 20]), k = pick([2, 3, 4]), m = pick([20, 30, 40, 50]), n1 = m * k, z2 = z1 * k;
    return { q: `Un piñón de ${z1} dientes gira a ${n1} vueltas por minuto (rpm) y mueve una rueda de ${z2} dientes. ¿A qué velocidad gira la rueda?`, a: m + ' rpm', wrong: uniq([n1 * k + ' rpm', n1 + ' rpm', fmt(n1 / (k + 1)) + ' rpm'], m + ' rpm'),
      explain: `La rueda tiene ${k} veces más dientes, así que gira ${k} veces más lenta: ${n1} ÷ ${k} = ${m} rpm.`, fig: gearsSVG(z1, z2) };
  }, gearsSVG(10, 30));

// ---- Lección 5 · Engranajes en acción ----
T('par', 'Par (fuerza de giro)', 'Cuánto «retuerce» una fuerza a un eje: fuerza × distancia al centro. Se mide en newton-metro (N·m).', 'p5', 'Abrir un bote difícil: con más brazo, más par.', 'Fuerza de giro (N·m)');
F('par_vel', 'Un reductor baja la velocidad a la mitad. Sin contar pérdidas, el par de salida…', 'se duplica', ['se reduce a la mitad', 'se queda igual', 'se cuadruplica'],
  'La potencia (par × velocidad) se conserva, aproximadamente. Si la velocidad baja a la mitad, el par sube al doble. En la práctica hay rozamiento y sale algo menos.', 'p5');
C('tren', 'Un tren de dos etapas: la primera tiene relación 2 : 1 y la segunda 3 : 1. ¿Qué relación total tiene?', '6 : 1', ['5 : 1', '12 : 1', '1 : 6'],
  'Las relaciones de etapas encadenadas se multiplican, no se suman: 2 × 3 = 6. El eje de salida gira 6 veces más lento.', 'p5', () => {
    const k1 = pick([2, 3]), k2 = pick([3, 4, 5]), p = k1 * k2, a = p + ' : 1';
    return { q: `Un tren de dos etapas: la primera tiene relación ${k1} : 1 y la segunda ${k2} : 1. ¿Qué relación total tiene?`, a, wrong: uniq([(k1 + k2) + ' : 1', (p * 2) + ' : 1', '1 : ' + p], a),
      explain: `Las relaciones de etapas encadenadas se multiplican, no se suman: ${k1} × ${k2} = ${p}. El eje de salida gira ${p} veces más lento.` };
  });
O('tren', 'Ordena los pasos para montar y probar un tren de engranajes', ['Elige piñón y rueda según la relación que buscas', 'Fija los dos ejes a la distancia justa para que los dientes engranen', 'Gira a mano, despacio, para ver que no roza ni salta', 'Conecta el motor o la manivela', 'Prueba con poca carga y súbela poco a poco'],
  'Primero se piensa la relación, luego se monta con la distancia correcta, se prueba a mano y solo entonces se mete motor. Con poca carga primero, para no forzar los dientes.', 'p5');
X('atasco', 'El tren que salta', [
  'Has montado un piñón de 8 dientes y una rueda de 24.',
  'Al girar la manivela la rueda gira, pero cuando le cuelgas peso se oye «clac, clac».',
  'Ves que entre los dientes queda un hueco visible y a veces se deslizan uno sobre otro.',
  'Los dientes y los ejes no están dañados.'
], [
  ['¿Qué relación de transmisión has montado?', ['3 : 1', '1 : 3', '8 : 1', '24 : 1'], 0, '24 ÷ 8 = 3. La rueda gira 3 veces más lenta.'],
  ['¿Cuál es la causa más probable del «clac, clac»?', ['Los ejes están demasiado separados y los dientes no engranan a fondo', 'La relación 3 : 1 es demasiado grande', 'La manivela es demasiado larga', 'Los dientes están al revés'], 0, 'Un hueco visible entre dientes indica poca profundidad de engrane: al meter carga, los dientes saltan. Se corrige acercando los ejes.'],
  ['¿Qué haces primero?', ['Acercar los ejes hasta que engranen bien y repetir la prueba con poca carga', 'Cambiar el piñón por uno más grande sin mirar nada más', 'Añadir más peso para ver si se arregla', 'Tirar el montaje'], 0, 'Diagnóstico: cambia una sola cosa a la vez, empezando por lo más simple y barato.']
], 'p5');

// =====================================================================
// UNIDAD «GUÍA DE COMPRAS TECHNIC»
// Fuentes consultadas en octubre de 2026 (foros de aficionados como Eurobricks, tiendas de piezas sueltas y reseñas de marcas compatibles).
// NO incluye precios: cambian y no se han podido verificar. Todo lo que dependa de un vendedor o modelo es orientativo.
// =====================================================================
// Catálogo de piezas básicas: A viga · B pin · C eje · D tope (buje) · E engranaje
function partsSVG() {
  const badge = (x, y, l) => `<circle cx="${x}" cy="${y}" r="10" fill="var(--gold)"/><text x="${x}" y="${y + 4.5}" font-size="13" font-weight="800" text-anchor="middle" fill="var(--on-gold)" font-family="ui-monospace,Consolas,monospace">${l}</text>`;
  const holes = [40, 67, 94, 121, 148].map(x => `<circle cx="${x}" cy="40" r="5.5" fill="var(--bg)" ${SV.ink}/>`).join('');
  const gearPts = Array.from({ length: 12 }, (_, i) => { const a = 2 * Math.PI / 12, t = i * a; return [[-.5, 16], [-.2, 22], [.2, 22], [.5, 16]].map(([d, r]) => (258 + r * Math.cos(t + d * a)).toFixed(1) + ',' + (136 + r * Math.sin(t + d * a)).toFixed(1)).join(' '); }).join(' ');
  return SV.wrap('0 0 320 190',
    `<rect x="20" y="28" width="150" height="24" rx="12" ${SV.fill} ${SV.ink}/>${holes}` + badge(14, 20, 'A') +
    `<rect x="214" y="36" width="64" height="10" rx="4" ${SV.fill} ${SV.ink}/><rect x="206" y="30" width="12" height="22" rx="3" ${SV.fill} ${SV.ink}/><path d="M238 36v10M246 36v10M254 36v10" ${SV.ink} fill="none"/>` + badge(196, 22, 'B') +
    `<rect x="20" y="124" width="100" height="8" rx="2" ${SV.fill} ${SV.ink}/>` + badge(14, 108, 'C') + `<g transform="translate(138 128)"><rect x="-8" y="-2.4" width="16" height="4.8" rx="1.5" ${SV.fill} ${SV.ink}/><rect x="-2.4" y="-8" width="4.8" height="16" rx="1.5" ${SV.fill} ${SV.ink}/></g>` +
    `<rect x="170" y="118" width="26" height="28" rx="5" ${SV.fill} ${SV.ink}/><path d="M176 132h14M183 125v14" ${SV.ink} fill="none"/>` + badge(168, 112, 'D') +
    `<polygon points="${gearPts}" ${SV.fill} ${SV.ink}/><circle cx="258" cy="136" r="5" fill="var(--ink)"/>` + badge(232, 112, 'E') +
    SV.txt(160, 182, 'catálogo de piezas básicas (no está a escala)', 11, 'middle', 500), 'Cinco piezas Technic marcadas con las letras A a E: viga, pin, eje, tope y engranaje');
}
// Viga con n agujeros numerados: apoyo en el agujero a, carga en el c y tu mano en el h.
function beamSVG(n, a, c, h) {
  const x0 = 24, st = (300 - 2 * x0) / (n - 1), X = i => x0 + (i - 1) * st, y = 70;
  const holes = Array.from({ length: n }, (_, i) => `<circle cx="${X(i + 1)}" cy="${y}" r="4.6" fill="var(--bg)" ${SV.ink}/>` + SV.txt(X(i + 1), y - 16, i + 1, 9, 'middle', 500)).join('');
  return SV.wrap('0 0 320 190',
    `<rect x="${x0 - 14}" y="${y - 12}" width="${300 - 2 * x0 + 28}" height="24" rx="12" ${SV.fill} ${SV.ink}/>${holes}` +
    SV.arrowDown(X(h), 14, y - 28) + SV.txt(X(h), 11, 'tu mano', 11, X(h) > 250 ? 'end' : 'middle') +
    `<path d="M${X(a)} ${y + 12}L${X(a) - 12} ${y + 36}H${X(a) + 12}Z" ${SV.fill} ${SV.key}/>` + SV.txt(X(a), y + 52, 'apoyo', 11) +
    `<path d="M${X(c)} ${y + 12}V148" fill="none" ${SV.wire}/><rect x="${X(c) - 24}" y="148" width="48" height="26" rx="6" ${SV.fill} ${SV.key}/>` + SV.txt(X(c), 166, 'carga', 11),
    `Viga de ${n} agujeros: apoyo en el ${a}, carga en el ${c} y la mano en el ${h}`);
}

// ---- Lección 1 · Las piezas ----
T('viga', 'Viga (beam)', 'Barra con agujeros en línea. Se nombra por su número de agujeros: una viga «5» tiene 5.', 'q1', 'Es el «hueso» de cualquier montaje.', 'Barra con agujeros');
T('pin', 'Pin (clavija)', 'Pieza que une dos vigas metiéndose por sus agujeros. Los hay que agarran fuerte y los hay que dejan girar.', 'q1', 'Sin pines, todo se cae a trozos.', 'Une vigas por sus agujeros');
T('eje', 'Eje (cruceta)', 'Varilla en forma de cruz que atraviesa agujeros en cruz y transmite el giro.', 'q1', 'Su sección es una «+».', 'Varilla en cruz que gira');
T('tope', 'Tope (buje)', 'Pieza pequeña que se coloca en un eje para que no se deslice ni se escape.', 'q1', 'Como el tope de una cortina.', 'Evita que el eje se escape');
F('ident_eje', 'En el dibujo, ¿qué letra es el eje (cruceta)?', 'C', ['A', 'B', 'D'], 'El eje es la varilla larga y fina, y su sección es una cruz «+» (se ve su extremo al lado). La A es una viga, la B un pin y la D un tope.', 'q1', partsSVG());
F('ident_pin', 'En el dibujo, ¿qué letra es el pin?', 'B', ['A', 'C', 'E'], 'El pin es la pieza con cabeza y estrías que se mete en los agujeros de las vigas para unirlas. La A es una viga, la C un eje y la E un engranaje.', 'q1', partsSVG());

// ---- Lección 2 · Medir en Technic ----
F('paso', '¿Qué distancia hay entre los centros de dos agujeros contiguos de una viga Technic?', '8 mm', ['5 mm', '10 mm', '16 mm'], 'Todo el sistema va de 8 en 8 mm. Una viga «5» mide unos 40 mm (5 × 8). Es tu regla para calcular brazos de palanca contando agujeros.', 'q2');
C('dist_huecos', 'En una viga, ¿qué distancia hay entre el centro del agujero 2 y el del agujero 9?', '56 mm', ['64 mm', '7 mm', '88 mm'], 'Entre el 2 y el 9 hay 7 saltos de 8 mm: 7 × 8 = 56 mm. Se cuentan los saltos, no los agujeros.', 'q2', () => {
  const i = pick([1, 2, 3, 4]), j = i + pick([3, 4, 5, 6, 7]), d = (j - i) * 8;
  return { q: `En una viga, ¿qué distancia hay entre el centro del agujero ${i} y el del agujero ${j}?`, a: d + ' mm', wrong: uniq([(d + 8) + ' mm', (j - i) + ' mm', (i + j) * 8 + ' mm'], d + ' mm'), explain: `Entre el ${i} y el ${j} hay ${j - i} saltos de 8 mm: ${j - i} × 8 = ${d} mm. Se cuentan los saltos, no los agujeros.` };
});
C('palanca_viga', 'Palanca con una viga de 15 agujeros: apoyo en el agujero 4, carga en el 2 y tu mano en el 14. ¿Cuántas veces multiplica tu fuerza?', '5 veces', ['6 veces', '7 veces', 'La divide entre 5'], 'Brazo de la carga: 4 − 2 = 2 saltos. Brazo de tu mano: 14 − 4 = 10 saltos. 10 ÷ 2 = 5. Se pueden contar saltos en vez de milímetros porque el factor 8 mm se cancela.', 'q2', () => {
  const dc = pick([1, 2]), k = pick([2, 3, 4, 5]), de = dc * k, ap = pick([3, 4]), ca = ap - dc, ma = ap + de;
  return { q: `Palanca con una viga de 15 agujeros: apoyo en el agujero ${ap}, carga en el ${ca} y tu mano en el ${ma}. ¿Cuántas veces multiplica tu fuerza?`, a: k + ' veces', wrong: uniq([(k + 1) + ' veces', (k + 2) + ' veces', 'La divide entre ' + k], k + ' veces'),
    explain: `Brazo de la carga: ${ap} − ${ca} = ${dc} ${dc === 1 ? 'salto' : 'saltos'}. Brazo de tu mano: ${ma} − ${ap} = ${de} saltos. ${de} ÷ ${dc} = ${k}. Se pueden contar saltos en vez de milímetros porque el factor 8 mm se cancela.`, fig: beamSVG(15, ap, ca, ma) };
}, beamSVG(15, 4, 2, 14));
C('engr_technic', 'Un piñón de 8 dientes mueve una rueda de 24 dientes. ¿Qué relación de transmisión tiene?', '3 : 1', ['1 : 3', '4 : 1', '6 : 1'], 'Dientes de la conducida ÷ dientes del piñón: 24 ÷ 8 = 3. Los engranajes rectos más habituales en Technic son de 8, 16, 24 y 40 dientes.', 'q2', () => {
  const [z1, z2] = pick([[8, 16], [8, 24], [8, 40], [16, 24], [16, 40]]), r = z2 / z1, a = fmt(r) + ' : 1';
  return { q: `Un piñón de ${z1} dientes mueve una rueda de ${z2} dientes. ¿Qué relación de transmisión tiene?`, a, wrong: uniq(['1 : ' + fmt(r), fmt(r + 1) + ' : 1', fmt(r * 2) + ' : 1'], a), explain: `Dientes de la conducida ÷ dientes del piñón: ${z2} ÷ ${z1} = ${fmt(r)}. Los engranajes rectos más habituales en Technic son de 8, 16, 24 y 40 dientes.`, fig: gearsSVG(z1, z2) };
});
F('pin_agarre', 'Quieres que dos vigas puedan girar una respecto a la otra, como una bisagra. ¿Qué pin conviene?', 'Uno con poco agarre (liso)', ['Uno con mucho agarre', 'Da igual cuál', 'Ninguno: las vigas se sujetan solas'], 'Los pines con estrías agarran fuerte y dejan la unión rígida; los lisos dejan girar. Por color, suele ser: negros y azules con agarre, grises o tostados lisos. Es una regla práctica, no oficial: comprueba la pieza real.', 'q2');

// ---- Lección 3 · Dónde comprar ----
F('comprar_sets', 'Quieres muchas piezas variadas gastando poco. ¿Qué suele recomendarse en los foros de aficionados?', 'Comprar sets usados completos, reutilizar sus piezas y completar lo que falte', ['Comprar solo piezas sueltas nuevas, una a una', 'Comprar el set más caro y nuevo', 'Esperar a que todo baje de precio'], 'En los foros se repite que, para sumar piezas, suele salir más barato comprar sets (sobre todo usados) y rellenar huecos con piezas sueltas. Es una opinión de aficionados, no una garantía de precio.', 'q3');
F('comprar_suelta', 'Te faltan varios engranajes concretos de 24 dientes. ¿Dónde es más fácil encontrarlos sueltos?', 'En mercados de piezas sueltas como BrickLink o Brick Owl', ['En cualquier juguetería, sueltos', 'Solo en una tienda física oficial', 'No se venden sueltos'], 'Esos mercados venden piezas sueltas por referencia, de muchos vendedores. Mira envío y mínimos de pedido de cada vendedor: a veces el envío cuesta más que las piezas.', 'q3');
F('comprar_lote', 'Vas a comprar un lote usado «por peso». ¿Qué conviene comprobar antes?', 'Que haya fotos o lista de lo que trae, y si son piezas originales o compatibles', ['Solo el precio', 'Que el color te guste', 'Nada: todos los lotes son parecidos'], 'Un lote «por peso» puede ser mayormente ladrillos normales. Sin fotos ni lista, no sabes si trae vigas, ejes y engranajes. En segunda mano a veces mezclan piezas originales y de otras marcas.', 'q3');
F('comprar_compat', 'Una marca dice «compatible con Technic». ¿Qué es lo más prudente?', 'Mirar reseñas de ese modelo: el encaje puede variar entre modelos', ['Asumir que todo encaja perfecto', 'Asumir que es peor y no usarla', 'Pensar que sus motores servirán con la electrónica de LEGO'], 'Las reseñas de CaDA o Mould King dicen que muchas piezas mecánicas son combinables, pero que el ajuste de los pines no es uniforme y que su electrónica es un sistema propio. fischertechnik, en cambio, no es compatible.', 'q3');
O('compra', 'Ordena los pasos de una compra segura', ['Haz la lista de piezas que necesita tu misión', 'Compara el precio por pieza en 2 o 3 sitios', 'Mira el envío y la opinión del vendedor', 'Compra poco al principio', 'Comprueba que encajan antes de pedir más'], 'Se empieza por la necesidad (la misión), se compara, y se compra poco para probar el encaje antes de gastar más. Así un fallo de compra cuesta poco.', 'q3');
X('primera_compra', 'Tu primera compra', [
  'Tienes unos 30 € y ningún Technic.',
  'Quieres montar una palanca con una viga larga y un tren de engranajes con manivela.',
  'En una web de segunda mano hay un lote «piezas Technic, 2 kg» con fotos y lista del contenido.',
  'Otro lote, «piezas compatibles, 1 kg», no tiene fotos ni lista.'
], [
  ['¿Cuál miras primero?', ['El lote con fotos y lista: puedes comprobar que trae vigas largas, pines, ejes y engranajes', 'El lote sin fotos: seguro que es mejor sorpresa', 'El más barato, sea cual sea', 'Ninguno: compras un set nuevo grande'], 0, 'Con fotos y lista puedes ver si trae lo que tu misión necesita. Sin ellas, es una lotería.'],
  ['¿Qué haces con el lote sin fotos?', ['Pides fotos o la lista antes de decidir', 'Lo compras sin más', 'Lo compras si es más barato por kilo', 'Lo compras dos veces para asegurar'], 0, 'Un buen vendedor enseña lo que vende. Si no te lo enseña, mejor no comprarlo.'],
  ['Cuando llegue el lote, ¿qué completas en una tienda de piezas sueltas?', ['Solo lo que falte tras mirar lo que trae (p. ej. engranajes de 8 y 24 dientes)', 'Todo lo de la lista, por si acaso', 'Nada: ya lo tienes todo seguro', 'Un motor y una batería'], 0, 'Primero se mira lo que ya tienes; luego se compra solo lo que falta. Menos gasto y menos piezas repetidas.']
], 'q3');

// ---- Lección 4 · Tu kit de 30 € ----
C('precio_kg', 'Lote A: 12 € por 2 kg. Lote B: 15 € por 2,5 kg. ¿Cuál sale más barato por kilo?', 'Salen igual (6 € por kilo)', ['El lote A (6,5 € por kilo)', 'El lote B (5 € por kilo)', 'No se puede saber'], 'Se divide el precio entre el peso: A = 12 ÷ 2 = 6 €/kg; B = 15 ÷ 2,5 = 6 €/kg. Ojo: el precio por kilo no dice cuántas piezas útiles trae.', 'q4', () => {
  const pa = pick([9, 12, 15, 18]), wa = pick([1, 1.5, 2, 2.5]), pb = pick([10, 14, 16, 20]), wb = pick([1, 1.5, 2, 3]), ka = pa / wa, kb = pb / wb;
  if (Math.abs(ka - kb) < 0.3) return ITEMS.c_precio_kg.gen();
  const win = ka < kb ? 'A' : 'B', kw = Math.min(ka, kb), kl = Math.max(ka, kb), other = win === 'A' ? 'B' : 'A';
  return { q: `Lote A: ${pa} € por ${fmt(wa)} kg. Lote B: ${pb} € por ${fmt(wb)} kg. ¿Cuál sale más barato por kilo?`, a: `El lote ${win} (${fmt(kw)} € por kilo)`, wrong: uniq([`El lote ${other} (${fmt(kl)} € por kilo)`, 'Salen igual', 'No se puede saber'], `El lote ${win} (${fmt(kw)} € por kilo)`),
    explain: `Se divide el precio entre el peso: A = ${pa} ÷ ${fmt(wa)} = ${fmt(ka)} €/kg; B = ${pb} ÷ ${fmt(wb)} = ${fmt(kb)} €/kg. Ojo: el precio por kilo no dice cuántas piezas útiles trae.` };
});
F('prioridad', 'Para empezar con palancas y engranajes, ¿qué conviene tener antes que un motor?', 'Vigas largas, pines, ejes, topes y engranajes', ['Un motor y una batería', 'Ruedas grandes', 'Piezas decorativas'], 'Con vigas, ejes y engranajes ya haces todas las lecciones de ventaja mecánica moviendo con la mano. El motor llega más tarde, con sus normas de seguridad.', 'q4');
F('manivela', '¿Para qué sirve una manivela en tus primeros montajes sin motor?', 'Para girar los ejes a mano y notar el esfuerzo de cada relación de transmisión', ['Para ahorrar piezas', 'Para que el montaje sea más rápido que con motor', 'No sirve para nada útil'], 'Girar a mano te deja sentir en los dedos lo que dicen los cálculos: con una reducción grande cuesta menos girar, pero das más vueltas.', 'q4');
F('bateria', 'Más adelante usarás motores con batería. ¿Qué regla de seguridad es correcta?', 'No usar ni cargar una batería hinchada, caliente o dañada, y usar solo el cargador indicado', ['Cualquier cargador vale si encaja el conector', 'Dejarla cargando tapada con una tela', 'Si está hinchada, basta con usarla poco'], 'Las baterías de litio dañadas o hinchadas pueden calentarse e incendiarse. Se retiran, no se usan ni se cargan, y se llevan a un punto de reciclaje.', 'q4');
X('kit30', 'Tu kit de unos 30 €', [
  'Tu objetivo: montar una palanca y un tren de engranajes con manivela, sin motor.',
  'Ya tienes algunas piezas de Lego normal y ruedas, pero ningún Technic.',
  'Has conseguido un lote usado con vigas largas, pines y ejes, pero casi sin engranajes ni topes.'
], [
  ['¿Qué te falta comprar primero?', ['Engranajes (8, 16, 24 y 40 dientes) y unos topes', 'Un motor y una batería', 'Más vigas largas, aunque ya tienes', 'Piezas de colores'], 0, 'Compra solo lo que falta para tu misión. Con engranajes y topes ya montas el tren con manivela.'],
  ['Compras engranajes de otra marca «compatible». ¿Qué haces al recibirlos?', ['Pruebas el encaje con tus ejes y pines antes de pedir más', 'Los montas todos a la vez y fuerzas el encaje', 'Los tiras si no encajan a la primera, sin mirar nada', 'Los usas también como piezas de motor'], 0, 'El encaje puede variar entre marcas y modelos. Probar una unidad antes de pedir más ahorra dinero.'],
  ['¿Cuándo pasas a pensar en motores y baterías?', ['Cuando ya domines las lecciones de mecánica con la manivela y sepas qué necesitas', 'Antes de montar nada', 'Nunca: no hacen falta', 'El primer día'], 0, 'El motor añade coste y seguridad. Primero se entiende el mecanismo a mano; después se automatiza.']
], 'q4');

// =====================================================================
// UNIDAD «MECANISMOS QUE MUEVEN»
// Anécdotas y datos reales comprobados en octubre de 2026 (Antikythera, Ginebra/Cruz de Malta, autobloqueo del tornillo sin fin, frase atribuida a Arquímedes).
// =====================================================================
let _cid = 0;   // ids únicos para los recortes (clipPath) de las figuras
// Rueda dentada «de dibujo»: z dientes, radio de paso rp, altura de diente th, fase off (rad). Devuelve los puntos de un polígono.
function toothPts(cx, cy, z, rp, th, off) {
  const a = 2 * Math.PI / z, p = [];
  for (let i = 0; i < z; i++) { const t = off + i * a; [[-.38, rp - th / 2], [-.16, rp + th / 2], [.16, rp + th / 2], [.38, rp - th / 2]].forEach(([d, r]) => p.push((cx + r * Math.cos(t + d * a)).toFixed(1) + ',' + (cy + r * Math.sin(t + d * a)).toFixed(1))); }
  return p.join(' ');
}

// ---- Animaciones: app.js las llama con (svg, t) y t en segundos ----
const ANIMS = {};
const _q = (s, r) => s.querySelector(`[data-r="${r}"]`);
const _a = (el, o) => { for (const k in o) el.setAttribute(k, (+o[k]).toFixed(2)); };
const _rot = (el, deg) => el.setAttribute('transform', `rotate(${deg.toFixed(2)} ${el.dataset.cx} ${el.dataset.cy})`);
ANIMS.gears = (s, t) => { const z1 = +s.dataset.z1, z2 = +s.dataset.z2, a = t * 45; _rot(_q(s, 'g1'), a); _rot(_q(s, 'g2'), -a * z1 / z2); };   // ω2 = −ω1 · z1/z2
ANIMS.crank = (s, t) => {
  const cx = +s.dataset.cx, cy = +s.dataset.cy, r = +s.dataset.r, L = +s.dataset.l, a = t * 1.7;
  const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a), sx = px + Math.sqrt(L * L - (py - cy) ** 2);
  _a(_q(s, 'arm'), { x2: px, y2: py }); _a(_q(s, 'pin'), { cx: px, cy: py }); _a(_q(s, 'rod'), { x1: px, y1: py, x2: sx, y2: cy }); _a(_q(s, 'wrist'), { cx: sx, cy }); _a(_q(s, 'piston'), { x: sx - 15 });
};
ANIMS.cam = (s, t) => {
  const cx = +s.dataset.cx, cy = +s.dataset.cy, R = +s.dataset.rr, e = +s.dataset.e, a = t * 1.6;
  const Cx = cx + e * Math.cos(a), Cy = cy + e * Math.sin(a), yc = Cy - Math.sqrt(R * R - (e * Math.cos(a)) ** 2);   // punto de contacto bajo el seguidor
  _a(_q(s, 'disc'), { cx: Cx, cy: Cy }); _a(_q(s, 'link'), { x2: Cx, y2: Cy }); _a(_q(s, 'rod'), { y: 22, height: yc - 22 }); _a(_q(s, 'tip'), { cy: yc });
};
ANIMS.rack = (s, t) => {
  const rp = +s.dataset.rp, p = +s.dataset.p, a = 1.5 * Math.sin(t * 0.9);   // el piñón oscila para que la cremallera no se salga
  _rot(_q(s, 'pin'), a * 180 / Math.PI);
  _q(s, 'rack').setAttribute('transform', `translate(${(((-rp * a) % p) + p) % p} 0)`);          // dientes: solo importa el desplazamiento módulo el paso
  _q(s, 'mark').setAttribute('transform', `translate(${(-rp * a).toFixed(2)} 0)`);               // marca dorada: desplazamiento real
};
ANIMS.worm = (s, t) => {
  const z = +s.dataset.z, pw = +s.dataset.pw, revs = t * 0.5;   // 0,5 vueltas del tornillo por segundo
  _rot(_q(s, 'wheel'), -revs * 360 / z);                         // un diente de la rueda por cada vuelta del tornillo
  _q(s, 'thread').setAttribute('transform', `translate(${((revs * pw) % pw).toFixed(2)} 0)`);
};

// ---- Figuras ----
// Los cuatro movimientos básicos
function movimientosSVG() {
  const P = (i, inner, label) => `<g transform="translate(${i * 80} 0)">${inner}${SV.txt(40, 104, label, 11)}</g>`;
  const head = (x, y, dx1, dy1, dx2, dy2) => `<path d="M${x + dx1} ${y + dy1}L${x} ${y}L${x + dx2} ${y + dy2}" fill="none" ${SV.key}/>`;
  return SV.wrap('0 0 320 112',
    P(0, `<circle cx="40" cy="56" r="20" ${SV.fill} ${SV.ink}/><circle cx="40" cy="56" r="3" fill="var(--ink)"/><path d="M57 25A34 34 0 1 1 8 44" fill="none" ${SV.key}/><path d="M3 38L8 44L15 41" fill="none" ${SV.key}/>`, 'rotativo') +
    P(1, `<rect x="6" y="44" width="26" height="24" rx="4" ${SV.fill} ${SV.ink}/><path d="M38 56H72" fill="none" ${SV.key}/>${head(72, 56, -7, -6, -7, 6)}`, 'lineal') +
    P(2, `<path d="M6 78H74" ${SV.wire} fill="none"/><rect x="27" y="52" width="26" height="24" rx="4" ${SV.fill} ${SV.ink}/><path d="M12 38H68" fill="none" ${SV.key}/>${head(68, 38, -7, -6, -7, 6)}${head(12, 38, 7, -6, 7, 6)}`, 'alternativo') +
    P(3, `<circle cx="40" cy="24" r="3.5" fill="var(--ink)"/><path d="M40 24V72" ${SV.wire} fill="none"/><circle cx="40" cy="78" r="8" ${SV.fill} ${SV.ink}/><path d="M20 76A52 52 0 0 0 60 76" fill="none" ${SV.key}/>${head(20, 76, -5, -9, 4, -9)}${head(60, 76, 5, -9, -4, -9)}`, 'oscilante'),
    'Cuatro movimientos: rotativo, lineal, alternativo y oscilante', ' data-fig="mov"');
}
// Biela-manivela (animada): la manivela gira y la biela mueve el pistón
function crankSVG() {
  const cx = 70, cy = 100, r = 34, L = 120;
  return SV.wrap('0 0 320 190',
    `<rect x="132" y="${cy - 25}" width="120" height="50" rx="4" fill="none" ${SV.ink}/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--muted)" stroke-width="1.2" stroke-dasharray="3 4"/>` +
    `<rect data-r="piston" x="${cx + r + L - 15}" y="${cy - 18}" width="30" height="36" rx="3" ${SV.fill} ${SV.key}/>` +
    `<line data-r="rod" x1="${cx + r}" y1="${cy}" x2="${cx + r + L}" y2="${cy}" ${SV.wire} style="stroke-width:3.2"/>` +
    `<line data-r="arm" x1="${cx}" y1="${cy}" x2="${cx + r}" y2="${cy}" ${SV.key} style="stroke-width:4"/>` +
    `<circle cx="${cx}" cy="${cy}" r="5" fill="var(--ink)"/><circle data-r="pin" cx="${cx + r}" cy="${cy}" r="4.5" fill="var(--gold)"/><circle data-r="wrist" cx="${cx + r + L}" cy="${cy}" r="3.5" fill="var(--ink)"/>` +
    SV.txt(cx, cy + r + 24, 'manivela', 12) + SV.txt(cx + 70, cy - 40, 'biela', 12) + SV.txt(192, cy + 44, 'pistón en su cilindro', 12) +
    SV.dim(cx - r + L + 0, cx + r + L, 170, 'carrera = 2 × radio'),
    'Biela-manivela animada: la manivela gira y el pistón va y viene', ` data-anim="crank" data-cx="${cx}" data-cy="${cy}" data-r="${r}" data-l="${L}"`);
}
// Leva excéntrica (animada): el seguidor sube y baja 2 × la excentricidad
function camSVG() {
  const cx = 90, cy = 128, R = 40, e = 14;
  return SV.wrap('0 0 320 190',
    `<rect x="${cx - 22}" y="40" width="8" height="30" ${SV.fill} ${SV.ink}/><rect x="${cx + 14}" y="40" width="8" height="30" ${SV.fill} ${SV.ink}/>` +
    `<circle data-r="disc" cx="${cx}" cy="${cy}" r="${R}" ${SV.fill} ${SV.ink}/>` +
    `<line data-r="link" x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy}" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="3 3"/><circle cx="${cx}" cy="${cy}" r="4.5" fill="var(--ink)"/>` +
    `<rect data-r="rod" x="${cx - 6}" y="22" width="12" height="${cy - R - e - 22}" rx="2" ${SV.fill} ${SV.key}/><circle data-r="tip" cx="${cx}" cy="${cy - R - e}" r="4" fill="var(--gold)"/>` +
    `<path d="M${cx + 52} ${cy - R - e}H${cx + 90}M${cx + 52} ${cy - R + e}H${cx + 90}M${cx + 84} ${cy - R - e}V${cy - R + e}" stroke="var(--muted)" stroke-width="1.3" fill="none"/>` +
    SV.txt(cx + 96, cy - R + 4, 'sube y baja', 11, 'start') + SV.txt(cx + 96, cy - R + 20, '2 × excentricidad', 11, 'start') +
    SV.txt(cx, 182, 'leva excéntrica y seguidor', 12),
    'Leva excéntrica animada: el seguidor sube y baja', ` data-anim="cam" data-cx="${cx}" data-cy="${cy}" data-rr="${R}" data-e="${e}"`);
}
// Piñón y cremallera (animados): el giro del piñón mueve la cremallera en línea recta
function rackSVG() {
  const cx = 160, cy = 70, z = 12, rp = 30, th = 5, p = 2 * Math.PI * rp / z, yr = cy + rp + th / 2, yt = cy + rp - th / 2;
  let d = `M-80 ${yr + 22}V${yr}`;
  for (let k = -17; k < 20; k++) { const c = cx + p / 2 + k * p; d += `L${(c - .38 * p).toFixed(1)} ${yr}L${(c - .16 * p).toFixed(1)} ${yt}L${(c + .16 * p).toFixed(1)} ${yt}L${(c + .38 * p).toFixed(1)} ${yr}`; }
  d += `L420 ${yr}V${yr + 22}Z`;
  return SV.wrap('0 0 320 170',
    `<g data-r="rack"><path d="${d}" ${SV.fill} ${SV.ink}/></g>` +
    `<g data-r="mark"><circle cx="${cx + 2.5 * p}" cy="${yr + 11}" r="4" fill="var(--gold)"/></g>` +
    `<g data-r="pin" data-cx="${cx}" data-cy="${cy}"><polygon points="${toothPts(cx, cy, z, rp, th, Math.PI / 2)}" ${SV.fill} ${SV.ink}/><circle cx="${cx}" cy="${cy}" r="4" fill="var(--ink)"/><circle cx="${cx}" cy="${cy - 20}" r="4" fill="var(--gold)"/></g>` +
    SV.txt(cx, 16, 'piñón (gira)', 12) + SV.txt(cx, 160, 'cremallera (avanza en línea recta)', 12),
    'Piñón y cremallera animados', ` data-anim="rack" data-cx="${cx}" data-cy="${cy}" data-rp="${rp}" data-p="${p.toFixed(3)}"`);
}
// Tornillo sin fin y rueda (animados): una vuelta del tornillo = un diente de la rueda
function wormSVG(z = 14) {
  const cx = 160, cy = 66, Rw = 44, th = 6, pw = 2 * Math.PI * Rw / z, ty = cy + Rw + 2, id = 'wc' + (++_cid);
  const threads = Array.from({ length: Math.ceil(260 / pw) + 4 }, (_, i) => { const x = 40 - 2 * pw + i * pw; return `<path d="M${x.toFixed(1)} ${ty + 30}L${(x + pw * .6).toFixed(1)} ${ty}" fill="none" ${SV.ink}/>`; }).join('');
  return SV.wrap('0 0 320 190',
    `<g data-r="wheel" data-cx="${cx}" data-cy="${cy}"><polygon points="${toothPts(cx, cy, z, Rw, th, Math.PI / 2)}" ${SV.fill} ${SV.key}/><circle cx="${cx}" cy="${cy}" r="4" fill="var(--ink)"/><circle cx="${cx}" cy="${cy - 24}" r="4" fill="var(--gold)"/></g>` +
    `<clipPath id="${id}"><rect x="40" y="${ty}" width="240" height="30" rx="8"/></clipPath><rect x="40" y="${ty}" width="240" height="30" rx="8" ${SV.fill} ${SV.ink}/>` +
    `<g clip-path="url(#${id})"><g data-r="thread">${threads}</g></g>` +
    SV.txt(310, 14, 'rueda de ' + z + ' dientes', 11, 'end') + SV.txt(160, 184, 'tornillo sin fin: 1 vuelta = 1 diente de la rueda', 11),
    'Tornillo sin fin animado engranando con una rueda dentada', ` data-anim="worm" data-z="${z}" data-pw="${pw.toFixed(3)}"`);
}
// Trinquete: gira libre en un sentido y se bloquea en el otro
function ratchetSVG() {
  const cx = 160, cy = 100, z = 12, ri = 40, ro = 54, a = 2 * Math.PI / z;
  const pts = Array.from({ length: z }, (_, i) => [[0, ri], [.8, ro], [.82, ri]].map(([d, r]) => (cx + r * Math.cos(i * a + d * a - Math.PI / 2 - .2)).toFixed(1) + ',' + (cy + r * Math.sin(i * a + d * a - Math.PI / 2 - .2)).toFixed(1)).join(' ')).join(' ');
  return SV.wrap('0 0 320 190',
    `<polygon points="${pts}" ${SV.fill} ${SV.ink}/><circle cx="${cx}" cy="${cy}" r="5" fill="var(--ink)"/>` +
    `<path d="M${cx + 46} ${cy - ro - 14}L${cx + 4} ${cy - ri - 2}" ${SV.key} style="stroke-width:4" fill="none"/><circle cx="${cx + 50}" cy="${cy - ro - 16}" r="5" fill="var(--bg)" ${SV.key}/>` +
    `<path d="M${cx - 66} ${cy - 18}A68 68 0 0 0 ${cx - 40} ${cy + 54}" fill="none" ${SV.ink}/><path d="M${cx - 46} ${cy + 58}L${cx - 40} ${cy + 54}L${cx - 40} ${cy + 46}" fill="none" ${SV.ink}/>` +
    SV.txt(cx - 78, cy + 32, '↺ gira libre', 11, 'end') + SV.txt(cx + 80, cy + 60, '↻ bloqueado', 11, 'start') + SV.txt(cx + 52, cy - ro - 28, 'uña', 12) + SV.txt(160, 184, 'rueda de trinquete', 12),
    'Rueda de trinquete con su uña: gira libre en un sentido y se bloquea en el otro');
}

// ---- Lección 1 · Tipos de movimiento ----
T('rotativo', 'Movimiento rotativo', 'El de una pieza que da vueltas alrededor de un eje, como una rueda o una manivela.', 'm1', 'Gira sin cambiar de sitio.', 'Da vueltas alrededor de un eje');
T('lineal', 'Movimiento lineal', 'El de una pieza que avanza en línea recta y en un solo sentido, como un tren por una vía recta.', 'm1', 'Va de A a B sin volver.', 'Avanza recto, sin volver');
T('alternativo', 'Movimiento alternativo', 'El de una pieza que va y viene en línea recta, como la aguja de una máquina de coser.', 'm1', 'Ida y vuelta por el mismo camino recto.', 'Ida y vuelta en línea recta');
T('oscilante', 'Movimiento oscilante', 'El de una pieza que se balancea en arco de ida y vuelta sin dar la vuelta entera, como un columpio.', 'm1', 'Se balancea como un péndulo.', 'Balanceo en arco');
T('mecanismo', 'Mecanismo', 'Conjunto de piezas que transforma un movimiento o una fuerza en otro distinto.', 'm1', 'Es el «traductor» entre un movimiento y otro.', 'Transforma movimientos');
F('mov_limpia', 'El brazo de un limpiaparabrisas barre el cristal yendo y viniendo en arco, sin dar la vuelta entera. ¿Qué movimiento hace?', 'Oscilante', ['Rotativo (da vueltas completas)', 'Lineal (avanza recto en un solo sentido)', 'Alternativo (ida y vuelta en línea recta)'], 'Se balancea en arco: ese es el movimiento oscilante. Si diera vueltas completas sería rotativo, y si fuera y viniera en línea recta, alternativo.', 'm1');
F('mov_aguja', 'La aguja de una máquina de coser sube y baja en línea recta, una y otra vez. ¿Qué movimiento hace?', 'Alternativo', ['Rotativo (da vueltas completas)', 'Oscilante (se balancea en arco)', 'Lineal (avanza recto en un solo sentido)'], 'Va y viene por el mismo camino recto: movimiento alternativo. Lo mueve un motor que gira, así que hay un mecanismo en medio que traduce giro en vaivén.', 'm1');

// ---- Lección 2 · Biela-manivela ----
T('manivela', 'Manivela', 'Brazo que gira alrededor de un eje y al que se une la biela; su longitud es el radio de giro.', 'm2', 'Como el pedal de una bicicleta.', 'Brazo que gira');
T('biela', 'Biela', 'Barra que une la manivela con la pieza que va y viene (el pistón).', 'm2', 'Es el puente entre el giro y el vaivén.', 'Une giro y vaivén');
T('carrera', 'Carrera', 'Distancia total que recorre la pieza que va y viene, de un extremo al otro.', 'm2', 'Se mide de punta a punta.', 'Recorrido de punta a punta');
C('carrera', 'Una manivela de 20 mm de radio mueve un pistón con una biela. ¿Qué carrera tiene el pistón?', '40 mm', ['20 mm', '80 mm', '10 mm'], 'El pistón recorre de un extremo al otro el diámetro del círculo de la manivela: carrera = 2 × radio = 2 × 20 = 40 mm.', 'm2', () => {
  const r = pick([10, 12, 15, 20, 25, 30, 40]);
  return { q: `Una manivela de ${r} mm de radio mueve un pistón con una biela. ¿Qué carrera tiene el pistón?`, a: 2 * r + ' mm', wrong: uniq([r + ' mm', 4 * r + ' mm', fmt(r / 2) + ' mm'], 2 * r + ' mm'),
    explain: `El pistón recorre de un extremo al otro el diámetro del círculo de la manivela: carrera = 2 × radio = 2 × ${r} = ${2 * r} mm.`, fig: crankSVG() };
}, crankSVG());
F('bm_conv', '¿Qué transforma un mecanismo de biela-manivela?', 'Giro en vaivén en línea recta (y al revés)', ['Vaivén en un giro más lento por reducción', 'Giro en otro giro más rápido', 'Fuerza en calor'], 'La manivela gira, la biela empuja y tira, y el pistón va y viene en línea recta. Funciona también al revés: el vaivén de un pistón de motor hace girar el cigüeñal.', 'm2', crankSVG());
F('bm_volante', 'En los dos extremos del recorrido (los puntos muertos) el pistón no puede hacer girar la manivela. ¿Qué ayuda a pasarlos?', 'Un volante de inercia: una rueda pesada que sigue girando por inercia', ['Que la biela sea más corta', 'Frenar un poco la manivela', 'Aumentar la carrera'], 'En un punto muerto la biela y la manivela están alineadas y el empuje no produce giro. El volante almacena movimiento y «tira» de la manivela para pasar ese punto.', 'm2');
F('bm_predice', 'Predice: si duplicas el radio de la manivela, ¿qué le pasa a la carrera?', 'Se duplica', ['Se reduce a la mitad', 'No cambia', 'Se multiplica por cuatro'], 'carrera = 2 × radio. Si el radio se duplica, la carrera también. Puedes comprobarlo en la animación: el círculo de la manivela crece y el pistón recorre más.', 'm2');

// ---- Lección 3 · Levas ----
T('leva', 'Leva', 'Pieza giratoria cuya forma empuja a otra pieza (el seguidor) y la hace subir y bajar a su paso.', 'm3', 'Un huevo girando empujaría hacia arriba.', 'Pieza giratoria que empuja');
T('seguidor', 'Seguidor', 'Pieza que se apoya en la leva y sube y baja siguiendo su forma.', 'm3', 'Es el que «sigue» a la leva.', 'Pieza que sigue a la leva');
T('arbol_levas', 'Árbol de levas', 'Eje con varias levas que abren y cierran piezas, como las válvulas de un motor, en el momento justo.', 'm3', 'Varias levas en un mismo eje.', 'Eje con varias levas');
C('leva_lev', 'Una leva excéntrica tiene su eje desplazado 8 mm del centro del disco. ¿Cuánto sube y baja el seguidor en total?', '16 mm', ['8 mm', '32 mm', '4 mm'], 'El disco gira alrededor de un punto descentrado. El punto más alto del disco sube 8 mm sobre el eje y el más bajo baja 8 mm: en total 2 × 8 = 16 mm.', 'm3', () => {
  const e = pick([4, 5, 6, 8, 10, 12]);
  return { q: `Una leva excéntrica tiene su eje desplazado ${e} mm del centro del disco. ¿Cuánto sube y baja el seguidor en total?`, a: 2 * e + ' mm', wrong: uniq([e + ' mm', 4 * e + ' mm', fmt(e / 2) + ' mm'], 2 * e + ' mm'),
    explain: `El disco gira alrededor de un punto descentrado. Su punto más alto queda ${e} mm por encima del eje y el más bajo ${e} mm por debajo: en total 2 × ${e} = ${2 * e} mm.`, fig: camSVG() };
}, camSVG());
F('leva_predice', 'Predice: en una leva excéntrica, ¿cuándo está el seguidor en su punto más alto?', 'Cuando la parte más alejada del eje de giro pasa bajo el seguidor', ['Cuando el centro del disco está justo a la izquierda del eje', 'Siempre está a la misma altura', 'Cuando la leva se para'], 'El seguidor sube cuanto más lejos del eje esté el borde que lo empuja. Mira la animación: está arriba cuando la línea punteada (eje → centro del disco) apunta hacia él.', 'm3', camSVG());
F('leva_reposo', '¿Cómo se consigue que el seguidor se quede un rato quieto (en reposo) mientras la leva sigue girando?', 'Con un tramo de la leva a radio constante (un arco circular centrado en el eje)', ['Con una zona que sube más deprisa', 'Con una leva más grande', 'No se puede: siempre se mueve'], 'Si durante un tramo el borde está siempre a la misma distancia del eje, el seguidor no sube ni baja. Dando forma a la leva «programas» cuándo se mueve y cuándo descansa.', 'm3');
F('leva_uso', 'En muchos motores de coche, ¿qué abre las válvulas en el momento justo?', 'Un árbol de levas', ['Un volante de inercia', 'Un tornillo sin fin', 'Una polea fija'], 'Cada leva del árbol empuja a su válvula con la forma justa: la forma de la leva decide cuándo se abre, cuánto y durante cuánto tiempo.', 'm3');

// ---- Lección 4 · Cremallera y tornillo sin fin ----
T('cremallera', 'Cremallera', 'Barra con dientes en línea recta que engrana con un piñón.', 'm4', 'Es un engranaje «estirado» en línea.', 'Barra dentada recta');
T('sinfin', 'Tornillo sin fin', 'Tornillo que engrana con una rueda dentada y la hace avanzar un diente por cada vuelta.', 'm4', 'Reduce muchísimo la velocidad.', 'Tornillo que mueve una rueda');
C('rack_avance', 'Un piñón de 12 dientes, con 5 mm entre dientes, mueve una cremallera. ¿Cuánto avanza la cremallera en una vuelta del piñón?', '60 mm', ['17 mm', '120 mm', '30 mm'], 'En una vuelta pasan 12 dientes por el contacto, y cada uno ocupa 5 mm: 12 × 5 = 60 mm.', 'm4', () => {
  const z = pick([8, 10, 12, 16, 20]), p = pick([4, 5, 6, 8]);
  return { q: `Un piñón de ${z} dientes, con ${p} mm entre dientes, mueve una cremallera. ¿Cuánto avanza la cremallera en una vuelta del piñón?`, a: z * p + ' mm', wrong: uniq([(z + p) + ' mm', 2 * z * p + ' mm', (z * p / 2) + ' mm'], z * p + ' mm'),
    explain: `En una vuelta pasan ${z} dientes por el contacto, y cada uno ocupa ${p} mm: ${z} × ${p} = ${z * p} mm.`, fig: rackSVG() };
}, rackSVG());
C('sinfin_rel', 'Un tornillo sin fin con una sola entrada mueve una rueda de 24 dientes. ¿Cuántas vueltas da el tornillo por cada vuelta completa de la rueda?', '24 vueltas', ['12 vueltas', '48 vueltas', '1 vuelta'], 'Cada vuelta del tornillo hace avanzar la rueda un diente. Para que la rueda dé una vuelta completa hacen falta tantas vueltas del tornillo como dientes tiene: 24.', 'm4', () => {
  const z = pick([10, 12, 16, 20, 24, 30, 40]);
  return { q: `Un tornillo sin fin con una sola entrada mueve una rueda de ${z} dientes. ¿Cuántas vueltas da el tornillo por cada vuelta completa de la rueda?`, a: z + ' vueltas', wrong: uniq([(z / 2) + ' vueltas', 2 * z + ' vueltas', '1 vuelta'], z + ' vueltas'),
    explain: `Cada vuelta del tornillo hace avanzar la rueda un diente. Para que la rueda dé una vuelta completa hacen falta tantas vueltas del tornillo como dientes tiene: ${z}.`, fig: wormSVG(z) };
}, wormSVG(14));
F('rack_uso', '¿Qué transforma una cremallera con su piñón?', 'Giro en movimiento en línea recta (y al revés)', ['Línea recta en otra línea recta', 'Giro en otro giro más rápido', 'Fuerza en velocidad sin mover nada'], 'Cuando el piñón gira, sus dientes empujan los de la cremallera, que avanza en línea recta. Si empujas la cremallera, también hace girar el piñón.', 'm4', rackSVG());
F('sinfin_predice', 'Predice: ¿qué consigue un tornillo sin fin con una rueda de muchos dientes?', 'Una reducción enorme de velocidad (y mucha fuerza de giro) en poco espacio', ['Aumentar mucho la velocidad', 'Convertir el giro en vaivén', 'Nada: solo cambia el sentido de giro'], 'Con una entrada, la relación es igual al número de dientes de la rueda: con 40 dientes, 40 : 1 en un solo paso. Con engranajes rectos necesitarías varias etapas.', 'm4', wormSVG(14));
F('sinfin_bloqueo', 'Con un tornillo sin fin de rosca poco inclinada, ¿qué suele pasar si empujas la rueda para hacer girar el tornillo?', 'Puede quedarse bloqueado (autobloqueo), pero no está garantizado', ['Gira más fácil que al revés, siempre', 'Gira libremente, siempre', 'Se rompe siempre'], 'El autobloqueo depende del rozamiento y del ángulo de la rosca: con poca inclinación y buen rozamiento la rueda no puede mover el tornillo. Pero el desgaste o las vibraciones pueden hacer que se pierda, así que no te fíes solo de él para sostener cargas peligrosas.', 'm4');

// ---- Lección 5 · A saltos y en un solo sentido ----
T('trinquete', 'Trinquete', 'Rueda con dientes inclinados y una uña que solo la deja girar en un sentido.', 'm5', 'Es lo que hace «clic-clic» en una llave de carraca.', 'Gira solo en un sentido');
T('lengueta', 'Uña (lengüeta)', 'Pieza que se apoya en los dientes del trinquete y bloquea el giro hacia atrás.', 'm5', 'Se levanta al subir y cae al pasar el diente.', 'Bloquea el giro hacia atrás');
T('ginebra', 'Cruz de Malta (mecanismo de Ginebra)', 'Rueda con ranuras que un pasador hace avanzar un paso cada vez, convirtiendo un giro continuo en giro a saltos.', 'm5', 'Gira, para, avanza un paso, para...', 'Giro continuo → giro a saltos');
F('trinq_uso', '¿Para qué sirve la uña de un trinquete?', 'Para impedir que la rueda gire hacia atrás', ['Para que la rueda gire más deprisa', 'Para convertir el giro en vaivén', 'Para frenar la rueda en los dos sentidos'], 'En el sentido libre la uña sube por la rampa del diente y cae detrás; al intentar volver, choca con la cara vertical del diente y bloquea.', 'm5', ratchetSVG());
F('trinq_predice', 'Predice: giras la rueda de un trinquete en su sentido libre y sueltas. ¿Qué ocurre?', 'La uña cae tras un diente y evita que la rueda vuelva atrás', ['La rueda vuelve sola a su sitio', 'La rueda sigue girando sin parar', 'La uña se rompe'], 'Al girar en el sentido libre, cada diente levanta la uña y esta cae detrás (el «clic»). Al soltar, la cara vertical del diente se apoya en la uña y la rueda no retrocede.', 'm5');
F('ginebra_cine', 'En un proyector de cine antiguo, ¿para qué se usa una cruz de Malta?', 'Para que la película avance un fotograma y se pare un instante delante de la lente', ['Para girar el carrete más deprisa', 'Para enfocar la imagen', 'Para rebobinar la película'], 'La imagen solo se ve bien si el fotograma está quieto mientras se proyecta. El mecanismo repite «avanzar y parar» unas 24 veces por segundo, y el ojo ve movimiento continuo.', 'm5');
F('ginebra_reloj', '¿De dónde viene el nombre «Ginebra» de este mecanismo?', 'De la relojería suiza, donde se usó como tope para que el muelle no se tensara ni se destensara del todo', ['De un inventor llamado Ginebra', 'De los primeros cines de esa ciudad', 'De la forma de una cruz suiza'], 'Su primera aplicación fue en relojes mecánicos suizos, como tope del muelle. Después se usó en proyectores de cine, y por eso se conoce también como cruz de Malta.', 'm5');

// Unidades y lecciones (≤ 7 items por lección, ≈ 2-4 min)
const UNITS = [
  { id: 'u_vm', title: 'Ventaja mecánica', sub: 'Palancas, poleas y engranajes: ganar fuerza', lessons: [
    { id: 'l_palanca', title: 'La palanca', sub: 'Apoyo, brazo y ventaja', icon: '⚖️', items: ['t_palanca', 't_apoyo', 't_brazo', 't_ventaja', 'f_balancin', 'f_gratis'],
      note: { title: 'Nada es gratis', body: 'Una palanca **no crea fuerza**: la cambia por recorrido.\n\nSi empujas con la mitad de fuerza, tu mano tiene que moverse el doble.\n\nMira el balancín: el que está lejos del centro sube y baja mucho; el que está cerca, poco.' } },
    { id: 'l_palanca_calc', title: 'Calcular palancas', sub: 'Fuerza × distancia', icon: '🧮', items: ['c_palanca_f', 'c_palanca_v', 'f_equilibrio', 'f_colocar'],
      note: { title: 'La regla de la palanca', body: 'En equilibrio: **fuerza × distancia al apoyo** es igual en los dos lados.\n\nEjemplo: 30 N a 2 m → 30 × 2 = 60. Al otro lado, a 1 m, hace falta 60 N.\n\n**Ventaja mecánica** = brazo de tu mano ÷ brazo de la carga. Es una simple regla de tres. Usa la misma unidad (cm o m) en todo.' } },
    { id: 'l_poleas', title: 'Poleas', sub: 'Cuerda, rueda y reparto', icon: '⛓️', items: ['t_polipasto', 't_polea_fija', 't_polea_movil', 'f_polea_fija', 'f_polea_cuerda', 'c_polea_f'],
      note: { title: 'Repartir el peso', body: 'Una **polea fija** solo cambia hacia dónde tiras.\n\nUna **polea móvil** reparte el peso entre los tramos de cuerda que sujetan la carga:\n\n• fuerza = peso ÷ nº de tramos (sin rozamiento)\n• recoges tantos metros de cuerda como tramos, por cada metro que sube la carga\n\nOtra vez: ganas fuerza, pagas con cuerda.' } },
    { id: 'l_engranajes', title: 'Engranajes', sub: 'Dientes y relación', icon: '⚙️', items: ['t_pinon', 't_conducida', 't_relacion', 'f_sentido', 'c_relacion', 'c_velocidad'],
      note: { title: 'Contar dientes', body: 'Dos engranajes engranan sus dientes. Para saber qué hacen basta **contar dientes**:\n\n• relación = dientes de la conducida ÷ dientes del piñón\n• pequeño mueve a grande → **lento y fuerte**\n• grande mueve a pequeño → **rápido y flojo**' } },
    { id: 'l_tren', title: 'Engranajes en acción', sub: 'Par, trenes y diagnóstico', icon: '🔧', items: ['t_par', 'f_par_vel', 'c_tren', 'o_tren', 'x_atasco'],
      note: { title: '⚠️ Seguridad primero', body: 'Los engranajes en marcha **pellizcan** dedos, pelo y ropa.\n\n• Para el motor o suelta la manivela antes de tocar nada.\n• Empieza siempre con poca carga.\n• Con piezas pequeñas, trabaja en una bandeja para que no se pierdan.' } }
  ]},
  { id: 'u_compras', shortcut: true, icon: '🛒', title: 'Guía de compras Technic', sub: 'Qué piezas necesitas y cómo comprar poco y bien', lessons: [
    { id: 'l_piezas', title: 'Las piezas Technic', sub: 'Viga, pin, eje y tope', icon: '🧩', items: ['t_viga', 't_pin', 't_eje', 't_tope', 'f_ident_eje', 'f_ident_pin'],
      note: { title: 'El alfabeto del Technic', body: 'Casi todo lo que montarás con Technic sale de pocas piezas:\n\n• **vigas**: el esqueleto\n• **pines**: unen las vigas\n• **ejes**: transmiten el giro\n• **topes**: sujetan los ejes\n• **engranajes**: ya los conoces\n\nCon eso ya puedes hacer palancas y trenes de engranajes.' } },
    { id: 'l_medir', title: 'Medir en Technic', sub: 'Todo va de 8 en 8 mm', icon: '📏', items: ['f_paso', 'c_dist_huecos', 'c_palanca_viga', 'c_engr_technic', 'f_pin_agarre'],
      note: { title: 'Contar agujeros es medir', body: 'La distancia entre agujeros contiguos es de **8 mm**.\n\nAsí puedes calcular una palanca **contando agujeros** (saltos) en vez de medir con regla. Es la misma regla de tres de antes.\n\nLos engranajes rectos más habituales tienen **8, 16, 24 y 40 dientes**.' } },
    { id: 'l_donde', title: 'Dónde comprar', sub: 'Sets, lotes y piezas sueltas', icon: '🛒', items: ['f_comprar_sets', 'f_comprar_suelta', 'f_comprar_lote', 'f_comprar_compat', 'o_compra', 'x_primera_compra'],
      note: { title: 'Orientativo, no oficial', body: 'Esto resume foros de aficionados, tiendas de piezas sueltas y reseñas de marcas compatibles (consultado en octubre de 2026).\n\n**No hay precios** porque cambian: compruébalos tú el día de comprar.\n\nCompra poco al principio y prueba el encaje antes de pedir más.' } },
    { id: 'l_kit30', title: 'Tu kit de unos 30 €', sub: 'Qué comprar primero', icon: '🧰', items: ['c_precio_kg', 'f_prioridad', 'f_manivela', 'f_bateria', 'x_kit30'],
      note: { title: 'Primero la mano, luego el motor', body: 'Para las lecciones de ventaja mecánica no necesitas motor: te basta una **manivela** para girar los ejes con la mano.\n\nLista mínima útil: vigas largas, pines, ejes, topes y engranajes de 8, 16, 24 y 40 dientes.\n\n⚠️ Más adelante, con baterías: nada de cargar baterías hinchadas, calientes o dañadas.' } }
  ]},
  { id: 'u_mec', title: 'Mecanismos que mueven', sub: 'Biela-manivela, levas, cremallera, tornillo sin fin y trinquete', lessons: [
    { id: 'l_mov', title: 'Tipos de movimiento', sub: 'Giro, recta, vaivén y balanceo', icon: '🔄', items: ['t_rotativo', 't_lineal', 't_alternativo', 't_oscilante', 't_mecanismo', 'f_mov_limpia', 'f_mov_aguja'],
      note: { title: 'Traductores de movimiento', fig: movimientosSVG(), body: 'Hay **cuatro** movimientos básicos: **rotativo** (da vueltas), **lineal** (avanza recto), **alternativo** (va y viene en recta) y **oscilante** (se balancea en arco).\n\nUn **mecanismo** convierte uno en otro. Casi todo en una máquina es eso: traducir movimientos.' } },
    { id: 'l_biela', title: 'Biela-manivela', sub: 'De girar a ir y venir', icon: '🚂', items: ['t_manivela', 't_biela', 't_carrera', 'c_carrera', 'f_bm_conv', 'f_bm_volante', 'f_bm_predice'],
      note: { title: 'Mira cómo se mueve', fig: crankSVG(), body: 'La **manivela** gira, la **biela** empuja y tira, y el **pistón** va y viene.\n\n• **carrera = 2 × radio** de la manivela\n• en los extremos (puntos muertos) el pistón no puede mover la manivela: ahí ayuda un **volante de inercia**\n\n👆 Toca el dibujo para pausarlo y mirarlo con calma.' } },
    { id: 'l_leva', title: 'Levas', sub: 'La forma decide el movimiento', icon: '🥚', items: ['t_leva', 't_seguidor', 't_arbol_levas', 'c_leva_lev', 'f_leva_predice', 'f_leva_reposo', 'f_leva_uso'],
      note: { title: 'La forma lo programa todo', fig: camSVG(), body: 'Una **leva** empuja a su **seguidor** según su forma.\n\nEn una **leva excéntrica** (disco con el eje descentrado) el seguidor sube y baja **2 × la excentricidad**.\n\nCambiando la forma de la leva cambias cuándo sube, cuánto y cuándo descansa.\n\n👆 Toca el dibujo para pausarlo.' } },
    { id: 'l_sinfin', title: 'Cremallera y tornillo sin fin', sub: 'Giro en recta y reducción enorme', icon: '🔩', items: ['t_cremallera', 't_sinfin', 'c_rack_avance', 'c_sinfin_rel', 'f_rack_uso', 'f_sinfin_predice', 'f_sinfin_bloqueo'],
      note: { title: 'Dos formas de engranar', fig: rackSVG(), body: 'Un **piñón** con una **cremallera** convierte giro en línea recta: avance por vuelta = nº de dientes × paso.\n\nUn **tornillo sin fin** mueve una rueda **un diente por vuelta**: una reducción enorme en poco espacio.\n\n👆 Toca el dibujo para pausarlo.' } },
    { id: 'l_trinquete', title: 'Un sentido y a saltos', sub: 'Trinquete y cruz de Malta', icon: '🎞️', items: ['t_trinquete', 't_lengueta', 't_ginebra', 'f_trinq_uso', 'f_trinq_predice', 'f_ginebra_cine', 'f_ginebra_reloj'],
      note: { title: 'Control del movimiento', fig: ratchetSVG(), body: 'Un **trinquete** deja girar en un sentido y bloquea el otro, gracias a su **uña**.\n\nUna **cruz de Malta** (mecanismo de Ginebra) convierte un giro continuo en giro **a saltos**: avanza un paso, para, avanza otro...' } }
  ]}
];
const LESSON_BY_ID = {};
UNITS.forEach(u => u.lessons.forEach(l => { l.unit = u.id; LESSON_BY_ID[l.id] = l; }));

// =====================================================================
// CURIOSIDADES («Sabías que…») Y MISIONES PRÁCTICAS
// Todo lo que afirman se ha comprobado en fuentes (oct. 2026); lo dudoso se dice como dudoso.
// =====================================================================
const CURIOS = {
  l_palanca: { title: 'Sabías que… la frase de Arquímedes', body: 'Se atribuye a Arquímedes la frase «dadme un punto de apoyo y moveré el mundo».\n\nLa recogen autores posteriores (como Pappus, en el siglo IV), así que **no se sabe si la dijo con esas palabras**. Lo real es la idea: con un brazo larguísimo, una fuerza pequeña puede equilibrar una carga enorme... a cambio de recorrer una distancia enorme.' },
  l_palanca_calc: { title: 'Sabías que… la romana', body: 'La **romana** es una balanza antigua que pesa con una palanca: cuelgas lo que quieres pesar en un lado y deslizas un contrapeso por el brazo graduado hasta equilibrar.\n\nCuanto más lejos del apoyo está el contrapeso, más peso equilibra: es **fuerza × distancia**, justo lo que acabas de calcular.' },
  l_poleas: { title: 'Sabías que… no hay ventaja gratis', body: 'Un **polipasto** combina poleas fijas y móviles con una sola cuerda. Cuantos más tramos sujetan la carga, menos fuerza haces... pero más cuerda tienes que recoger.\n\nEs la misma regla de la palanca: la ventaja no se crea, **se cambia por recorrido**.' },
  l_engranajes: { title: 'Sabías que… el mecanismo de Anticitera', body: 'En un naufragio cerca de la isla griega de Anticitera se recuperó un mecanismo de bronce con engranajes de hace unos 2.000 años (se data entre el 150 y el 100 a. C.; algunos investigadores proponen una fecha más antigua).\n\nSe calcula que tenía **más de 30 engranajes** y servía para calcular posiciones del Sol, la Luna y otros astros. Es un tren de engranajes como los que estás aprendiendo.' },
  l_tren: { title: 'Sabías que… el tren de un reloj', body: 'En un reloj de agujas, el segundero da **60 vueltas por cada vuelta del minutero**, y el minutero **12 por cada vuelta de la horaria**.\n\nSon dos reducciones, 60 : 1 y 12 : 1. Encadenadas se multiplican: **720 : 1**. Por eso el tren de engranajes de un reloj mecánico es largo.' },
  l_mov: { title: 'Sabías que… casi todo es traducir giros', body: 'Un motor eléctrico corriente solo sabe **girar**. Para que algo suba y baje, avance o se balancee, hace falta un mecanismo en medio.\n\nPor eso gran parte de la mecánica es el arte de traducir un movimiento en otro. ¡Y tú vas a aprender los traductores clásicos!' },
  l_biela: { title: 'Sabías que… el mecanismo de los motores', body: 'Los motores de pistón de los coches y las máquinas de vapor usan una **biela-manivela**: el pistón empuja y tira, y la manivela (el cigüeñal) convierte ese vaivén en el giro que mueve las ruedas.\n\nEs el mismo dibujo que acabas de ver, pero en grande y con fuego dentro.' },
  l_leva: { title: 'Sabías que… la forma de la leva es un «programa»', body: 'En muchos motores de coche, un **árbol de levas** abre cada válvula con la forma justa: la forma de cada leva decide **cuándo** se abre, **cuánto** y **durante cuánto tiempo**.\n\nNo hay electrónica: la «instrucción» está tallada en el metal.' },
  l_sinfin: { title: 'Sabías que… una etapa vale por varias', body: 'Con un tornillo sin fin de una entrada, una rueda de 40 dientes da una reducción de **40 : 1 en un solo paso**. Con engranajes rectos necesitarías varias etapas.\n\nEso sí: que el tornillo se **autobloquee** (que la rueda no pueda moverlo) depende del rozamiento y del ángulo de la rosca; no lo des por seguro.' },
  l_trinquete: { title: 'Sabías que… el «clic-clic» de la carraca', body: 'El «clic-clic» de una llave de carraca es la **uña** de un trinquete saltando de diente en diente.\n\nGracias a él puedes apretar un tornillo moviendo la llave de ida y vuelta, sin sacarla cada vez.' }
};
Object.entries(CURIOS).forEach(([id, c]) => { LESSON_BY_ID[id].curio = c; });

const MISIONES = {
  u_vm: { id: 'm_vm', icon: '🛠️', title: 'Tren de engranajes con manivela',
    why: 'Hasta ahora lo has **calculado**. Ahora lo vas a **sentir**: montar un tren de engranajes y girar la manivela te enseña, con los dedos, lo que significa una relación 3 : 1.',
    think: 'Antes de girar, **predice**. Después compara con lo que ves. Si no coincide: ¿hay un eje flojo y el engrane salta, o has contado mal las vueltas? Ese es el mejor momento para aprender.',
    safety: 'Mantén los dedos lejos de los dientes mientras giran. Si cortas cartón, usa tijeras sobre una superficie protegida.',
    versions: {
      piezas: { label: 'Con piezas', intro: 'Si ya tienes un piñón y una rueda de Technic (o compatibles).', steps: [
        'Elige un piñón de 8 dientes y una rueda de 24 dientes.',
        'Móntalos en dos ejes paralelos, a la distancia justa para que los dientes engranen sin forzar.',
        'Pon una manivela (una viga corta) en el eje del piñón y un tope en cada eje.',
        'Marca la rueda con un trozo de cinta y cuenta cuántas vueltas das al piñón por cada vuelta de la rueda: debería salir 3.',
        'Cambia a la rueda de 40 dientes y, ANTES de girar, predice cuántas vueltas saldrán. Luego compruébalo.',
        'Anota qué has notado: ¿qué pasa con la velocidad y con el esfuerzo al girar?'] },
      papel: { label: 'En papel y cartón', intro: 'Sin piezas: dos discos con marcas, mismo tamaño de diente.', steps: [
        'Dibuja en cartón dos círculos con marcas (dientes) alrededor: uno con 8 marcas y otro con 24. Con el mismo tamaño de diente, el de 24 debe tener un radio 3 veces mayor.',
        'Recórtalos y pon un punto de color en un diente de cada uno.',
        'Colócalos tocándose por el borde y «gíralos» con la mano, contando los dientes que pasan por el punto de contacto.',
        'Cuenta cuántas vueltas del pequeño por cada vuelta del grande: debería salir 3.',
        'Haz otro par con 8 y 16 dientes y predice el resultado antes de girarlo.'] } } },
  u_compras: { id: 'm_compras', icon: '📝', title: 'Tu lista de compra (sin comprar)',
    why: 'Planificar una compra pequeña es una habilidad de inventor: sabes qué necesitas, comparas y compras poco. Esta misión es **solo mirar y anotar**: no hace falta gastar nada.',
    think: '¿Qué piezas se repiten en todos tus montajes (pines, ejes, topes)? Esas son las que más compensa comprar en cantidad.',
    safety: 'No compres con prisa. Usa webs que conozcas, mira la opinión del vendedor y las condiciones de devolución.',
    versions: { lista: { label: 'Lista y comparación', intro: 'Sin gastar nada.', steps: [
      'Escribe qué quieres montar primero (por ejemplo: una palanca con viga y un tren de engranajes con manivela).',
      'Haz la lista de piezas que necesita (vigas, pines, ejes, topes, engranajes) con cantidades.',
      'Busca esas piezas en dos webs distintas y anota el precio de cada una HOY.',
      'Calcula el coste total de la lista en cada web (precio × cantidad, más el envío).',
      'Mira si un lote usado con fotos y lista te sale mejor: compara por kilo y por piezas útiles.',
      'Decide una compra pequeña (o ninguna) y anota por qué.'] } } },
  u_mec: { id: 'm_mec', icon: '🔁', title: 'Convierte un giro en un vaivén',
    why: 'Vas a construir tu primer **traductor de movimiento**: una manivela que hace ir y venir una pieza. Medir la carrera y compararla con tu predicción es la mejor forma de entender de verdad la biela-manivela.',
    think: 'Antes de girar, predice: ¿qué carrera tendrá? Luego mídela. ¿Coincide con 2 × el radio? Si no, ¿qué la cambia: el juego en las uniones, una guía floja, medir mal?',
    safety: 'Cuidado con los dedos en las uniones que se mueven. Si usas cartón, corta con tijeras sobre una superficie protegida y lejos de ti.',
    versions: {
      piezas: { label: 'Con piezas', intro: 'Con vigas, pines, ejes y topes (te vale la lista de unos 30 €).', steps: [
        'Monta una manivela: una viga corta unida a un eje con un tope.',
        'Une una viga larga (la biela) con un pin a la punta de la manivela.',
        'Haz que el otro extremo de la biela se mueva entre dos vigas paralelas (la guía).',
        'Gira la manivela con la mano y mide cuánto recorre el extremo de la biela: esa es la carrera.',
        'Compárala con 2 × el radio de la manivela (cuenta saltos de agujero × 8 mm).',
        'Cambia el radio de la manivela y repite: ¿se cumple la predicción?'] },
      papel: { label: 'En papel y cartón', intro: 'Sin piezas: cartón, un encuadernador (o un clip) y un lápiz.', steps: [
        'Recorta un disco de cartón (la manivela) y marca un punto cerca del borde: ese es el pin.',
        'Une al punto una tira de cartón (la biela) con un encuadernador o un clip.',
        'Haz que el otro extremo de la tira se mueva entre dos reglas o lápices paralelos (la guía).',
        'Gira el disco con el dedo y marca los dos extremos del recorrido de la tira.',
        'Mide la distancia entre las marcas (la carrera) y compárala con 2 × la distancia del punto al centro.',
        'Muévelo más cerca del centro y repite: ¿cambia la carrera como predijiste?'] } } }
};
UNITS.forEach(u => { if (MISIONES[u.id]) u.mission = MISIONES[u.id]; });
