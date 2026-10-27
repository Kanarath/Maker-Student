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
  ]}
];
const LESSON_BY_ID = {};
UNITS.forEach(u => u.lessons.forEach(l => { l.unit = u.id; LESSON_BY_ID[l.id] = l; }));
