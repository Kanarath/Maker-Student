// =====================================================================
// CONFIGURACIÓN Y CONTENIDO — Taller de Inventor (MVP: unidad «Ventaja mecánica»)
// Reglas: ids estables para siempre · ≤ 7 items por lección · explicación siempre · nada se usa antes de enseñarse.
// =====================================================================
const APP = {
  key: 'tallerinventor',                 // clave de localStorage (única por app)
  name: 'Taller de Inventor',
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
  wrap: (vb, inner, label) => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}" style="width:100%;height:auto;max-height:210px">${inner}</svg>`,
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
  const gear = (cx, z, off, stroke) => {
    const a = 2 * Math.PI / z, p = [];
    for (let i = 0; i < z; i++) { const t = off + i * a; [[-.5, z - th / 2], [-.2, z + th / 2], [.2, z + th / 2], [.5, z - th / 2]].forEach(([d, r]) => p.push((cx + r * Math.cos(t + d * a)).toFixed(1) + ',' + (cy + r * Math.sin(t + d * a)).toFixed(1))); }
    return `<polygon points="${p.join(' ')}" fill="var(--fillt)" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/><circle cx="${cx}" cy="${cy}" r="${Math.max(2.5, z * .14)}" fill="var(--ink)"/>`;
  };
  const H = H0 * s + 30;
  return SV.wrap(`0 0 320 ${H.toFixed(0)}`,
    `<g transform="translate(10 0) scale(${s.toFixed(3)})">${gear(c1, z1, 0, 'var(--gold)')}${gear(c2, z2, Math.PI + Math.PI / z2, 'var(--teal)')}</g>` +
    SV.txt(10, H - 8, 'piñón: ' + z1 + ' dientes', 13, 'start') + SV.txt(310, H - 8, 'rueda: ' + z2 + ' dientes', 13, 'end'), `Dos engranajes: piñón de ${z1} dientes y rueda de ${z2} dientes`);
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
  ]}
];
const LESSON_BY_ID = {};
UNITS.forEach(u => u.lessons.forEach(l => { l.unit = u.id; LESSON_BY_ID[l.id] = l; }));
