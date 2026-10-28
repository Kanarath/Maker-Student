// =====================================================================
// UNIDADES «MÁQUINAS SIMPLES Y CORREAS», «VEHÍCULOS TECHNIC», «NEUMÁTICA E HIDRÁULICA» y «CINEMÁTICA DEL BRAZO»
// Se carga después de content4.js (usa sus constructores, figuras y addUnits).
// =====================================================================

// ---------------------------------------------------------------------
// FIGURAS ANIMADAS Y ESTÁTICAS
// ---------------------------------------------------------------------
// Rampa: la caja sube despacio por la pendiente, con menos fuerza que en vertical pero más recorrido
ANIMS.ramp = (s, t) => {
  const f = 0.12 + 0.7 * (0.5 + 0.5 * Math.sin(t * 0.9)), x = 30 + 250 * f, y = 140 - 80 * f;
  _q(s, 'blk').setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(-17.74)`);
};
function rampSVG() {
  return SV.wrap('0 0 320 170',
    `<path d="M30 140H280V60Z" ${SV.fill} ${SV.ink}/><path d="M290 60V140" fill="none" stroke="var(--muted)" stroke-width="1.3" stroke-dasharray="4 3"/>` + SV.txt(300, 104, 'h', 13, 'start') + SV.txt(155, 160, 'largo L', 12) +
    `<g data-r="blk" transform="translate(60 125) rotate(-17.74)"><rect x="-17" y="-22" width="34" height="22" rx="3" ${SV.fill} ${SV.key}/><path d="M26 -11H48M40 -17L48 -11L40 -5" fill="none" ${SV.key} style="stroke-width:3"/></g>` +
    SV.txt(160, 18, 'rampa larga: poca fuerza, mucho camino', 11, 'middle', 500),
    'Una caja subiendo por una rampa: se necesita menos fuerza que levantándola en vertical, pero hay que recorrer más camino', ' data-anim="ramp"');
}
// Coche tomando una curva: la rueda exterior recorre un círculo mayor que la interior
ANIMS.curva = (s, t) => {
  const a = t * 0.8, x = 160 + 56 * Math.cos(a), y = 95 + 56 * Math.sin(a);
  _q(s, 'car').setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(a * 180 / Math.PI + 90).toFixed(1)})`);
};
function curvaSVG() {
  return SV.wrap('0 0 320 190',
    `<circle cx="160" cy="95" r="48" fill="none" stroke="var(--teal)" stroke-width="1.6" stroke-dasharray="4 4"/><circle cx="160" cy="95" r="64" fill="none" stroke="var(--gold)" stroke-width="1.6" stroke-dasharray="4 4"/>` +
    `<g data-r="car" transform="translate(216 95) rotate(90)"><rect x="-14" y="-7" width="28" height="14" rx="3" ${SV.fill} ${SV.ink}/><rect x="-14" y="-10" width="9" height="3" fill="var(--gold)"/><rect x="5" y="-10" width="9" height="3" fill="var(--gold)"/><rect x="-14" y="7" width="9" height="3" fill="var(--teal)"/><rect x="5" y="7" width="9" height="3" fill="var(--teal)"/></g>` +
    SV.txt(160, 98, 'centro', 11) + SV.txt(160, 180, 'rueda exterior: círculo grande · interior: pequeño', 10.5, 'middle', 500),
    'Un coche tomando una curva visto desde arriba: la rueda de fuera recorre un círculo mayor que la de dentro', ' data-anim="curva"');
}
// Dos jeringuillas unidas por un tubo con líquido: el émbolo pequeño baja mucho y el grande sube poco (pero empuja con más fuerza)
ANIMS.hidr = (s, t) => {
  const g = 0.5 + 0.5 * Math.sin(t * 0.9), lp = 40 + 50 * g, rp = 70 - 16.67 * g;
  _a(_q(s, 'lp'), { y: lp - 8 }); _a(_q(s, 'lrod'), { y2: lp - 8 }); _a(_q(s, 'lf'), { y: lp, height: 130 - lp });
  _a(_q(s, 'rp'), { y: rp - 8 }); _a(_q(s, 'rrod'), { y2: rp - 8 }); _a(_q(s, 'rf'), { y: rp, height: 130 - rp });
};
function hidrSVG() {
  return SV.wrap('0 0 320 170',
    `<rect data-r="lf" x="40" y="40" width="30" height="90" fill="var(--teal)" fill-opacity=".28"/><rect data-r="rf" x="200" y="70" width="90" height="60" fill="var(--teal)" fill-opacity=".28"/><rect x="70" y="112" width="130" height="16" fill="var(--teal)" fill-opacity=".28"/>` +
    `<path d="M40 30V130H70V112H200V130H290V30" fill="none" ${SV.ink}/><path d="M40 130H70M200 130H290" fill="none" ${SV.ink}/>` +
    `<rect data-r="lp" x="42" y="32" width="26" height="8" rx="2" ${SV.fill} ${SV.key}/><line data-r="lrod" x1="55" y1="12" x2="55" y2="32" ${SV.key}/>` +
    `<rect data-r="rp" x="202" y="62" width="86" height="8" rx="2" ${SV.fill} ${SV.key}/><line data-r="rrod" x1="245" y1="12" x2="245" y2="62" ${SV.key}/>` +
    SV.txt(55, 150, 'pequeño', 11, 'middle', 600) + SV.txt(55, 164, 'baja mucho', 11, 'middle', 500) + SV.txt(245, 150, 'grande', 11, 'middle', 600) + SV.txt(245, 164, 'sube poco, empuja más', 11, 'middle', 500),
    'Dos jeringuillas unidas con líquido: el émbolo pequeño baja mucho y el grande sube poco, pero con más fuerza', ' data-anim="hidr"');
}
// Posición del extremo de un brazo con el codo en ángulo recto
function codoSVG(L1, L2) {
  const s = Math.min(8, 110 / Math.max(L1, L2)), x0 = 40, y0 = 150, ex = x0 + L1 * s, ty = y0 - L2 * s;
  return SV.wrap('0 0 320 170',
    `<path d="M20 150H300M40 160V20" fill="none" stroke="var(--muted)" stroke-width="1" stroke-dasharray="3 3"/>` +
    `<path d="M${x0} ${y0}H${ex}V${ty}" fill="none" ${SV.ink} style="stroke-width:7"/><path d="M${ex - 12} ${y0}V${y0 - 12}H${ex}" fill="none" stroke="var(--muted)" stroke-width="1.3"/>` +
    `<circle cx="${x0}" cy="${y0}" r="6" ${SV.fill} ${SV.key}/><circle cx="${ex}" cy="${y0}" r="6" ${SV.fill} ${SV.key}/><circle cx="${ex}" cy="${ty}" r="5" fill="var(--gold)"/>` +
    SV.txt((x0 + ex) / 2, y0 + 16, 'eslabón 1: ' + L1 + ' cm', 11) + SV.txt(ex + 10, (y0 + ty) / 2, 'eslabón 2: ' + L2 + ' cm', 11, 'start') + SV.txt(ex + 10, ty - 6, 'extremo (x, y)', 11, 'start', 500),
    `Brazo plano: un eslabón de ${L1} cm en horizontal y otro de ${L2} cm en vertical, unidos por un codo en ángulo recto`);
}

// ---------------------------------------------------------------------
// UNIDAD · MÁQUINAS SIMPLES Y CORREAS
// ---------------------------------------------------------------------
// ---- Lección 1 · Plano inclinado y cuña ----
T('inclinado', 'Plano inclinado', 'Superficie en pendiente que permite subir una carga con menos fuerza, a cambio de recorrer más camino.', 'sm1', 'Una rampa: subes más despacio, pero con menos esfuerzo.', 'Rampa');
T('cuna', 'Cuña', 'Pieza en forma de plano inclinado doble que, al empujarla, separa o corta lo que tiene delante.', 'sm1', 'Un hacha, un cuchillo, una cuña bajo una puerta.', 'Rampa que corta o separa');
C('rampa', 'Quieres subir una carga de 40 N hasta 1 m de altura con una rampa de 4 m de largo (sin rozamiento). ¿Qué fuerza mínima hace falta para subirla por la rampa?', '10 N', ['40 N', '160 N', '4 N'], 'Fuerza = peso × altura ÷ largo = 40 × 1 ÷ 4 = 10 N. Cuatro veces menos fuerza, pero cuatro veces más camino.', 'sm1', () => {
  const w = pick([20, 40, 60]), h = pick([1, 2]), l = pick([4, 5, 10]), f = w * h / l, a = fmt(f) + ' N';
  return { q: `Quieres subir una carga de ${w} N hasta ${h} m de altura con una rampa de ${l} m de largo (sin rozamiento). ¿Qué fuerza mínima hace falta para subirla por la rampa?`, a, wrong: uniq([fmt(w), fmt(w * h), fmt(f * 2), fmt(w * l / h), fmt(w / h), fmt(f / 2), fmt(w + l)].map(x => x + ' N'), a).slice(0, 3), explain: `Fuerza = peso × altura ÷ largo = ${w} × ${h} ÷ ${l} = ${fmt(f)} N. ${fmt(l / h)} veces menos fuerza, pero ${fmt(l / h)} veces más camino.`, fig: rampSVG() };
}, rampSVG());
F('rampa_nada_gratis', 'Con una rampa subes una caja con menos fuerza. ¿Qué pagas a cambio?', 'Recorrer más camino: la fuerza baja, el recorrido sube', ['Nada: la rampa regala fuerza', 'Más peso en la caja', 'Menos tiempo seguro'], 'Es la misma regla de siempre: el trabajo (fuerza × distancia) es el mismo. Si usas menos fuerza, tienes que recorrer más distancia.', 'sm1', rampSVG());
F('rampa_larga', 'Quieres subir una carga a la misma altura. ¿Qué rampa pide menos fuerza?', 'La más larga y suave', ['La más corta y empinada', 'Las dos igual', 'La que tiene más rozamiento'], 'Con la misma altura, un largo mayor reparte el trabajo en más camino y la fuerza baja. Por eso las carreteras de montaña van en zigzag.', 'sm1');
F('cuna_ejemplos', '¿Cuál de estos objetos es una cuña?', 'La hoja de un hacha', ['La rueda de una bicicleta', 'Una polea', 'Un resorte'], 'La hoja se estrecha como dos planos inclinados: al empujarla hacia abajo, convierte tu fuerza en una fuerza lateral que separa la madera.', 'sm1');
F('cuna_calzo', 'Un calzo bajo una puerta impide que se cierre. ¿Por qué aguanta?', 'Porque el rozamiento y la forma de cuña lo mantienen clavado entre la puerta y el suelo', ['Porque pesa mucho', 'Porque el suelo lo atrae', 'Porque la puerta se hace más pequeña'], 'Al empujar la puerta, la cuña se encaja y el rozamiento con el suelo y con la puerta la mantiene en su sitio.', 'sm1');

// ---- Lección 2 · Tornillo, rueda y eje ----
T('tornillo', 'Tornillo', 'Plano inclinado enrollado en forma de espiral alrededor de un cilindro: al girarlo avanza un poco por vuelta.', 'sm2', 'Una rampa enrollada.', 'Rampa en espiral');
T('paso_tornillo', 'Paso (de un tornillo)', 'Distancia que avanza un tornillo en una vuelta completa.', 'sm2', 'Paso fino = avanza poco por vuelta.', 'Avance por vuelta');
T('rueda_eje', 'Rueda y eje', 'Máquina simple en la que una rueda grande y un eje pequeño giran juntos: ventaja = radio de la rueda ÷ radio del eje.', 'sm2', 'Un picaporte o el mango de un destornillador.', 'Rueda grande, eje pequeño');
C('paso_tornillo_calc', 'Un tornillo avanza 1,5 mm por cada vuelta. Si le das 10 vueltas, ¿cuánto avanza?', '15 mm', ['11,5 mm', '6,7 mm', '1,5 mm'], 'Avance = paso × vueltas = 1,5 × 10 = 15 mm.', 'sm2', () => {
  const p = pick([0.5, 0.8, 1, 1.5, 2]), v = pick([4, 5, 8, 10, 12]), r = p * v, a = fmt(r) + ' mm';
  return { q: `Un tornillo avanza ${fmt(p)} mm por cada vuelta. Si le das ${v} vueltas, ¿cuánto avanza?`, a, wrong: uniq([fmt(p + v), fmt(v / p), fmt(r * 2), fmt(p)].map(x => x + ' mm'), a).slice(0, 3), explain: `Avance = paso × vueltas = ${fmt(p)} × ${v} = ${fmt(r)} mm.` };
});
C('rueda_eje_calc', 'Una manivela tiene un radio de 20 cm y el eje al que gira, 4 cm. ¿Qué ventaja mecánica da?', '5 veces', ['16 veces', '24 veces', '0,2 veces'], 'Ventaja = radio de la rueda ÷ radio del eje = 20 ÷ 4 = 5. Con una fuerza cinco veces menor mueves lo mismo, a cambio de girar cinco veces más recorrido.', 'sm2', () => {
  const R = pick([10, 20, 30, 40]), r = pick([2, 4, 5]), v = R / r, a = fmt(v) + ' veces';
  return { q: `Una manivela tiene un radio de ${R} cm y el eje al que gira, ${r} cm. ¿Qué ventaja mecánica da?`, a, wrong: uniq([fmt(R * r), fmt(R + r), fmt(r / R, 2), fmt(v * 2)].map(x => x + ' veces'), a).slice(0, 3), explain: `Ventaja = radio de la rueda ÷ radio del eje = ${R} ÷ ${r} = ${fmt(v)}. Con una fuerza ${fmt(v)} veces menor mueves lo mismo, a cambio de más recorrido.` };
});
F('tornillo_fino', 'Un tornillo de paso muy fino avanza poco por vuelta. ¿Qué consecuencia tiene?', 'Hace falta girar mucho más, pero con menos fuerza se avanza con precisión', ['Avanza muy deprisa', 'No puede apretar nada', 'Solo sirve para madera'], 'Pasar de poco avance por vuelta significa que cada giro empuja con mucha más fuerza y precisión. Es otra vez fuerza ↔ recorrido.', 'sm2');
F('mango_destornillador', 'Un destornillador con el mango más grueso se gira con menos esfuerzo. ¿Por qué?', 'Porque aumenta el radio de la rueda frente al del eje: más ventaja mecánica', ['Porque pesa más', 'Porque el tornillo es más pequeño', 'Porque el mango imanta el tornillo'], 'El mango es la «rueda» y la punta es el «eje». Con un mango más ancho, la misma fuerza hace más giro: ventaja = radio del mango ÷ radio de la punta.', 'sm2');

// ---- Lección 3 · Correas y cadenas ----
T('correa', 'Correa', 'Cinta flexible que une dos poleas y transmite el giro por rozamiento.', 'sm3', 'Como la del ventilador de un coche antiguo.', 'Cinta que une poleas');
T('cadena', 'Cadena', 'Serie de eslabones que engranan con piñones dentados y transmiten el giro sin resbalar.', 'sm3', 'Como la de una bicicleta.', 'Eslabones sobre piñones');
C('correa_rel', 'Una polea motriz de 2 cm de diámetro mueve con una correa a otra de 6 cm. ¿Qué relación de transmisión tiene (diámetro de la conducida ÷ diámetro de la motriz)?', '3 : 1', ['0,3 : 1', '12 : 1', '4 : 1'], 'Relación = diámetro de la conducida ÷ diámetro de la motriz = 6 ÷ 2 = 3. La conducida gira 3 veces más despacio, pero con más fuerza.', 'sm3', () => {
  const d = pick([2, 4]), D = pick([6, 8, 12]), r = D / d, a = fmt(r) + ' : 1';
  return { q: `Una polea motriz de ${d} cm de diámetro mueve con una correa a otra de ${D} cm. ¿Qué relación de transmisión tiene (diámetro de la conducida ÷ diámetro de la motriz)?`, a, wrong: uniq([fmt(d / D, 2), fmt(D * d), fmt(D - d), fmt(r * 2)].map(x => x + ' : 1'), a).slice(0, 3), explain: `Relación = diámetro de la conducida ÷ diámetro de la motriz = ${D} ÷ ${d} = ${fmt(r)}. La conducida gira ${fmt(r)} veces más despacio, pero con más fuerza.` };
});
F('correa_sentido', 'Dos poleas unidas por una correa abierta (sin cruzar). ¿En qué sentido gira la conducida?', 'En el mismo sentido que la motriz', ['En el sentido contrario', 'No gira', 'Cada vez en un sentido'], 'Con la correa abierta, las dos poleas giran en el mismo sentido. Si cruzas la correa en forma de 8, la conducida gira al revés.', 'sm3');
F('correa_patina', '¿Qué desventaja tiene una correa lisa respecto a un engranaje?', 'Puede patinar si la carga es grande, y entonces la relación ya no es exacta', ['Que siempre hace más ruido', 'Que no se puede usar con motores', 'Que gira en sentido contrario siempre'], 'La correa transmite por rozamiento: si el esfuerzo supera el agarre, resbala. Las correas dentadas y las cadenas evitan ese problema.', 'sm3');
F('correa_tension', 'Tensas muchísimo una correa para que no patine. ¿Qué riesgo corres?', 'Cargar demasiado los ejes y los rodamientos, y que se desgasten antes', ['Que gire más rápido', 'Que cambie la relación de transmisión', 'Ninguno'], 'Una tensión excesiva empuja los ejes lateralmente y aumenta el rozamiento. Lo adecuado es la mínima tensión que no patine.', 'sm3');
F('cadena_ventaja', '¿Qué ventaja tiene una cadena frente a una correa lisa?', 'No patina y puede transmitir mucho más esfuerzo', ['Es más silenciosa siempre', 'No necesita mantenimiento', 'No pesa nada'], 'Los eslabones engranan con los dientes del piñón, como en un engranaje a distancia. A cambio, necesita engrasado y hace más ruido.', 'sm3');

// ---------------------------------------------------------------------
// UNIDAD · VEHÍCULOS TECHNIC
// ---------------------------------------------------------------------
// ---- Lección 1 · Dirección ----
T('ackermann', 'Geometría Ackermann', 'Disposición de la dirección en la que, en una curva, la rueda interior gira más ángulo que la exterior para que ninguna patine.', 've1', 'Los dos círculos de la curva no tienen el mismo radio.', 'Rueda interior gira más');
C('dir_vueltas', 'Un volante da 3 vueltas de tope a tope y las ruedas giran 60° de tope a tope. ¿Cuántos grados giran las ruedas por cada vuelta del volante?', '20°', ['180°', '57°', '63°'], 'Grados por vuelta = 60 ÷ 3 = 20°. Una dirección «lenta» necesita más vueltas pero es más suave y precisa.', 've1', () => {
  const [v, t] = pick([[2, 60], [3, 60], [4, 60], [2, 80], [4, 80], [2, 100], [4, 100], [3, 120], [4, 120], [2, 120]]), g = t / v, a = fmt(g) + '°';
  return { q: `Un volante da ${v} vueltas de tope a tope y las ruedas giran ${t}° de tope a tope. ¿Cuántos grados giran las ruedas por cada vuelta del volante?`, a, wrong: uniq([fmt(v * t), fmt(t - v), fmt(t + v), fmt(g * 2)].map(x => x + '°'), a).slice(0, 3), explain: `Grados por vuelta = ${t} ÷ ${v} = ${fmt(g)}°. Una dirección «lenta» necesita más vueltas, pero es más suave y precisa.` };
});
F('dir_interior', 'En una curva, ¿qué rueda delantera debe girar más ángulo?', 'La interior (la más cercana al centro de la curva)', ['La exterior', 'Las dos igual', 'Ninguna: giran las traseras'], 'La rueda interior sigue un círculo más pequeño, y para ello hace falta un giro mayor. Esa es la idea de la geometría Ackermann.', 've1', curvaSVG());
F('dir_radio', 'Con el mismo giro de las ruedas, ¿qué coche hace una curva más cerrada: uno corto o uno largo?', 'El corto: cuanto menos distancia entre ejes, menor radio de giro', ['El largo', 'Los dos igual', 'Depende solo del color'], 'La distancia entre los ejes del coche (batalla) manda: con las mismas ruedas giradas, un coche más corto traza un círculo más pequeño.', 've1');
F('dir_technic', 'En un coche Technic, ¿qué mecanismo suele convertir el giro del volante en el giro de las ruedas?', 'Un piñón con cremallera (o un sistema de varillas)', ['Un trinquete', 'Una polea fija', 'Un muelle'], 'El volante gira un piñón que mueve una cremallera hacia los lados; unas varillas llevan ese movimiento a las ruedas delanteras. Es el mismo mecanismo de la unidad de mecanismos.', 've1');
F('dir_juego', 'Notas que el volante de tu coche tiene «holgura» antes de que giren las ruedas. ¿Cuál es la causa más probable?', 'Juego en las uniones y en los dientes de la cremallera', ['Que las ruedas son demasiado grandes', 'Que falta gravedad', 'Que la carretera es de goma'], 'Cada unión con holgura añade un pequeño margen antes de que el movimiento llegue. Menos uniones, ajustadas, reducen el juego.', 've1');

// ---- Lección 2 · Diferencial ----
T('diferencial', 'Diferencial', 'Mecanismo que reparte el giro de un eje entre dos ruedas y permite que giren a velocidades distintas.', 've2', 'Hace falta en las curvas: las ruedas no recorren lo mismo.', 'Reparte giro entre dos ruedas');
F('dif_curva', '¿Por qué hace falta un diferencial en las ruedas motrices de un coche?', 'Porque en una curva la rueda exterior recorre más distancia y tiene que girar más rápido', ['Para que el coche pese más', 'Para que las dos ruedas giren siempre igual', 'Para frenar mejor'], 'Si las dos ruedas fueran rígidas a un mismo eje, una tendría que patinar en las curvas. El diferencial les permite girar a velocidades distintas.', 've2', curvaSVG());
C('dif_rpm', 'En una curva, el eje de entrada de un diferencial abierto gira a 100 rpm y la rueda izquierda, a 80 rpm. ¿A cuántas rpm gira la rueda derecha? (la velocidad del eje de entrada es la media de las dos ruedas)', '120 rpm', ['100 rpm', '180 rpm', '20 rpm'], 'Si el eje de entrada es la media: 100 = (80 + derecha) ÷ 2, así que derecha = 2 × 100 − 80 = 120 rpm.', 've2', () => {
  const c = pick([60, 80, 100, 120]), l = c - pick([10, 20, 30]), r = 2 * c - l, a = r + ' rpm';
  return { q: `En una curva, el eje de entrada de un diferencial abierto gira a ${c} rpm y la rueda izquierda, a ${l} rpm. ¿A cuántas rpm gira la rueda derecha? (la velocidad del eje de entrada es la media de las dos ruedas)`, a, wrong: uniq([c + ' rpm', (c + l) + ' rpm', (c - l) + ' rpm', (r + 20) + ' rpm'], a).slice(0, 3), explain: `Si el eje de entrada es la media: ${c} = (${l} + derecha) ÷ 2, así que derecha = 2 × ${c} − ${l} = ${r} rpm.` };
});
F('dif_hielo', 'Un coche con diferencial abierto tiene una rueda motriz sobre hielo y otra sobre asfalto. ¿Qué suele pasar?', 'La rueda del hielo patina y el coche apenas avanza', ['La del asfalto empuja con toda la fuerza', 'Las dos agarran igual', 'El coche acelera más'], 'Un diferencial abierto reparte el par por igual: solo puede entregar a la rueda de asfalto lo que aguante la del hielo. Por eso existen los diferenciales autoblocantes.', 've2');
F('dif_bloqueo', '¿Qué hace un diferencial autoblocante o con bloqueo?', 'Limita o impide que una rueda gire mucho más que la otra, para repartir el esfuerzo a la que agarra', ['Hace que las ruedas giren siempre al revés', 'Quita fuerza a las dos ruedas', 'Funciona como un freno'], 'Al limitar la diferencia de giro, la rueda con agarre sigue recibiendo par aunque la otra patine.', 've2');
F('dif_technic', '¿Qué tipo de engranajes suelen formar un diferencial en Technic?', 'Engranajes cónicos (de bisel) que engranan en ángulo', ['Solo engranajes rectos en línea', 'Cremalleras', 'Poleas'], 'Los engranajes cónicos permiten cambiar la dirección del giro en 90° y repartirlo entre dos salidas. Lo viste en los engranajes, ahora a escala de coche.', 've2');

// ---- Lección 3 · Suspensión, tracción y vuelco ----
T('suspension', 'Suspensión', 'Conjunto de muelles y amortiguadores que mantiene las ruedas pegadas al suelo y absorbe los baches.', 've3', 'Un muelle solo rebota; con amortiguador se calma.', 'Muelles y amortiguadores');
T('traccion', 'Tracción', 'Fuerza con que las ruedas empujan al coche gracias al agarre con el suelo; solo llega a las ruedas motrices.', 've3', 'Depende del rozamiento entre neumático y suelo.', 'Empuje de las ruedas motrices');
C('agarre', 'Un coche de juguete pesa 20 N y todo ese peso descansa sobre las ruedas motrices. El coeficiente de rozamiento entre neumático y suelo es 0,6. ¿Qué fuerza máxima de empuje puede dar el suelo antes de que las ruedas patinen?', '12 N', ['20 N', '33 N', '0,6 N'], 'Agarre máximo = μ × reacción normal. Como el peso descansa sobre las ruedas motrices, la normal es 20 N: 0,6 × 20 = 12 N. Si el motor empuja más, las ruedas patinan.', 've3', () => {
  const w = pick([10, 20, 30, 40]), mu = pick([0.3, 0.5, 0.6, 0.8]), f = w * mu, a = fmt(f) + ' N';
  return { q: `Un coche de juguete pesa ${w} N y todo ese peso descansa sobre las ruedas motrices. El coeficiente de rozamiento entre neumático y suelo es ${fmt(mu)}. ¿Qué fuerza máxima de empuje puede dar el suelo antes de que las ruedas patinen?`, a, wrong: uniq([fmt(w), fmt(w / mu), fmt(w + mu), fmt(f * 2)].map(x => x + ' N'), a).slice(0, 3), explain: `Agarre máximo = μ × reacción normal. Como el peso descansa sobre las ruedas motrices, la normal es ${w} N: ${fmt(mu)} × ${w} = ${fmt(f)} N. Si el motor empuja más, las ruedas patinan.` };
});
F('susp_amort', 'Un muelle sin amortiguador rebota una y otra vez tras un bache. ¿Para qué sirve el amortiguador?', 'Para disipar la energía del muelle y calmar el rebote', ['Para que el muelle sea más largo', 'Para que el coche pese menos', 'Para hacer más ruido'], 'El muelle guarda energía y la devuelve; el amortiguador la convierte en calor por rozamiento (de un fluido o aire) y frena las oscilaciones.', 've3');
F('traccion_peso', 'Un coche de juguete patina al arrancar. ¿Qué puede ayudar a que agarre más?', 'Poner más peso sobre las ruedas motrices o neumáticos de goma', ['Quitar peso de las ruedas motrices', 'Cambiar los neumáticos por plástico liso', 'Pintarlo'], 'Agarre máximo = μ × reacción normal. Más peso sobre las ruedas motrices (más normal) o un μ mayor (goma) dan más agarre.', 've3');
F('vuelco', 'Un coche alto y estrecho vuelca más fácilmente que uno bajo y ancho. ¿Por qué?', 'Porque su centro de gravedad está más alto y más cerca del borde de apoyo', ['Porque pesa menos', 'Porque tiene menos ruedas', 'Porque el viento lo empuja'], 'Si la vertical desde el centro de gravedad cae fuera de las ruedas, el coche vuelca. Cuanto más bajo y ancho, más margen hay antes de ese punto.', 've3');
F('susp_technic', 'En un modelo Technic, ¿para qué sirve montar amortiguadores en las ruedas?', 'Para que las ruedas sigan en contacto con el suelo en terreno irregular y se absorban los golpes', ['Para que el modelo pese más', 'Para que no se pueda mover', 'Solo para decorar'], 'Un amortiguador con muelle deja que cada rueda suba y baje por separado. Así el agarre se mantiene y la estructura sufre menos golpes.', 've3');

// ---- Lección 4 · Diagnostica un coche ----
O('coche_montaje', 'Ordena los pasos para montar un coche con dirección y probarlo', ['Monta el chasis rígido con diagonales', 'Monta los dos ejes con las ruedas y comprueba que giran libres', 'Añade la dirección delantera y revisa que no roza', 'Conecta el motor y pruébalo a poca velocidad', 'Corrige lo que falle cambiando una cosa cada vez'], 'Primero un chasis rígido, luego ejes que giran sin rozar, después la dirección, y solo con eso funcionando se mete el motor. Se cambia una cosa cada vez para saber qué mejora.', 've4');
X('coche_no_gira', 'El coche que no gira', [
  'Has montado un coche con dirección de piñón y cremallera. Al girar el volante, las ruedas delanteras casi no se mueven.',
  'Notas que el volante gira, pero la cremallera se atasca en un extremo.'], [
  ['¿Qué revisas primero?', ['Que la cremallera y las varillas no roce con el chasis y que no haya un tope mal puesto', 'Que el color de las piezas coincida', 'Que el motor sea más potente'], 0, 'Un roce o un tope puesto de más bloquea el recorrido. Antes de tocar nada más, mueve a mano y busca dónde se atasca.'],
  ['¿Qué mejora más la precisión de la dirección?', ['Reducir el juego en las uniones y ajustar la cremallera al piñón', 'Hacer las ruedas más grandes', 'Añadir más peso al volante'], 0, 'Menos holgura significa que el giro del volante llega entero a las ruedas.']], 've4');
X('coche_patina', 'El coche que patina', [
  'Tu coche con motor tiene ruedas de plástico liso y casi todo el peso detrás, sobre las ruedas que no mueve el motor.',
  'Al acelerar, las ruedas motrices giran en seco y el coche apenas avanza.'], [
  ['¿Qué ocurre?', ['Las ruedas motrices tienen poco agarre: poco peso encima y poco rozamiento', 'El motor es demasiado lento', 'El coche necesita más amortiguadores'], 0, 'El empuje máximo es μ × reacción normal. Con poco peso sobre las ruedas motrices y plástico liso, el suelo no puede darles más.'],
  ['¿Qué cambio es más eficaz?', ['Poner peso sobre las ruedas motrices y neumáticos de goma', 'Alargar el coche', 'Quitar la dirección'], 0, 'Más normal y más μ dan más agarre. Es la misma regla del rozamiento.']], 've4');
F('coche_reduccion', 'Tu coche con motor directo en las ruedas va rápido pero se para con cualquier pendiente. ¿Qué le falta?', 'Una reducción: menos velocidad, más par', ['Más velocidad', 'Menos peso de las ruedas', 'Menos reducción'], 'Un motor pequeño gira rápido y flojo. Una reducción de engranajes o correa cambia velocidad por fuerza, justo lo que necesitas para subir una pendiente.', 've4');

// ---------------------------------------------------------------------
// UNIDAD · NEUMÁTICA E HIDRÁULICA
// ---------------------------------------------------------------------
// ---- Lección 1 · Presión y fuerza ----
T('presion', 'Presión', 'Fuerza repartida sobre una superficie: presión = fuerza ÷ área. Se mide en pascales (Pa), es decir, newtons por metro cuadrado.', 'fl1', 'La misma fuerza sobre menos área, más presión.', 'Fuerza ÷ área (Pa)');
T('pascal', 'Principio de Pascal', 'La presión que aplicas a un fluido encerrado se transmite con la misma intensidad por todo el fluido.', 'fl1', 'Aprietas por un lado y la presión llega igual a todos los lados.', 'La presión se transmite igual');
C('presion_calc', 'Una fuerza de 100 N se reparte sobre una superficie de 0,05 m². ¿Qué presión hay?', '2000 Pa', ['5 Pa', '20000 Pa', '100,05 Pa'], 'Presión = fuerza ÷ área = 100 ÷ 0,05 = 2000 Pa.', 'fl1', () => {
  const f = pick([20, 50, 100, 200]), A = pick([0.01, 0.02, 0.05, 0.1]), p = Math.round(f / A), a = p + ' Pa';
  return { q: `Una fuerza de ${f} N se reparte sobre una superficie de ${fmt(A, 2)} m². ¿Qué presión hay?`, a, wrong: uniq([fmt(f * A, 2), fmt(f + A, 2), fmt(p / 10), fmt(p * 10)].map(x => x + ' Pa'), a).slice(0, 3), explain: `Presión = fuerza ÷ área = ${f} ÷ ${fmt(A, 2)} = ${p} Pa.` };
});
F('presion_clavo', '¿Por qué un clavo se hunde en la madera con un martillazo y tu dedo no, aunque pongas la misma fuerza?', 'Porque la punta tiene muy poca área y concentra la fuerza: más presión', ['Porque el clavo pesa más', 'Porque la madera es más blanda cerca del clavo', 'Porque el clavo se calienta'], 'La misma fuerza sobre menos área da más presión. Por eso los clavos y los cuchillos tienen punta o filo.', 'fl1');
F('jeringas', 'Dos jeringuillas unidas por un tubo lleno de agua. Empujas el émbolo de una. ¿Qué ocurre con el de la otra?', 'Se mueve: la presión se transmite por el líquido', ['No se mueve nada', 'Se mueve al revés siempre', 'Solo se mueve si hay aire'], 'El agua casi no se comprime y transmite la presión que haces. Es el principio de Pascal funcionando.', 'fl1', hidrSVG());
F('aire_agua', '¿Por qué un sistema hidráulico (con líquido) es más preciso que uno neumático (con aire)?', 'Porque el líquido casi no se comprime y el aire sí, y el aire hace de «muelle»', ['Porque el líquido pesa menos', 'Porque el aire es más denso', 'Porque el aire no se puede mover'], 'Con aire, parte de tu esfuerzo comprime el gas y el movimiento resulta esponjoso. El líquido transmite el movimiento casi directamente.', 'fl1');

// ---- Lección 2 · Pistones y ventaja hidráulica ----
T('embolo', 'Émbolo (pistón)', 'Pieza que se desliza dentro de un cilindro y empuja o recibe el empuje del fluido.', 'fl2', 'El de una jeringuilla.', 'Pieza que empuja el fluido');
C('hidr_fuerza', 'En un sistema hidráulico, empujas con 10 N un émbolo de 2 cm². El otro émbolo tiene 20 cm². ¿Qué fuerza (ideal) da el émbolo grande?', '100 N', ['10 N', '20 N', '1 N'], 'La presión es igual en todo el fluido: 10 N ÷ 2 cm² = 5 N/cm². En el grande: 5 × 20 = 100 N. Fuerza × 10, a cambio de recorrer 10 veces menos.', 'fl2', () => {
  const f = pick([5, 10, 20]), a1 = pick([1, 2, 4]), a2 = pick([10, 20, 40]), r = f * a2 / a1, a = fmt(r) + ' N';
  return { q: `En un sistema hidráulico, empujas con ${f} N un émbolo de ${a1} cm². El otro émbolo tiene ${a2} cm². ¿Qué fuerza (ideal) da el émbolo grande?`, a, wrong: uniq([fmt(f), fmt(f * a1), fmt(f * a1 / a2, 2), fmt(f + a2)].map(x => x + ' N'), a).slice(0, 3), explain: `La presión es igual en todo el fluido: ${f} N ÷ ${a1} cm² = ${fmt(f / a1)} N/cm². En el grande: ${fmt(f / a1)} × ${a2} = ${fmt(r)} N. Más fuerza, a cambio de recorrer menos.`, fig: hidrSVG() };
}, hidrSVG());
C('hidr_recorrido', 'El émbolo grande de un sistema hidráulico tiene 20 cm² y el pequeño, 2 cm². Para que el grande suba 1 cm, ¿cuánto debe bajar el pequeño?', '10 cm', ['0,1 cm', '1 cm', '40 cm'], 'El volumen que sale por un lado entra por el otro: pequeño × 2 = grande × 20 × 1 cm, así que baja 10 cm. Lo que ganas en fuerza lo pagas en recorrido.', 'fl2', () => {
  const a1 = pick([1, 2, 4]), a2 = pick([10, 20, 40]), d = pick([1, 2]), r = d * a2 / a1, a = fmt(r) + ' cm';
  return { q: `El émbolo grande de un sistema hidráulico tiene ${a2} cm² y el pequeño, ${a1} cm². Para que el grande suba ${d} cm, ¿cuánto debe bajar el pequeño?`, a, wrong: uniq([fmt(d * a1 / a2, 2), fmt(d), fmt(r * 2), fmt(d + a2)].map(x => x + ' cm'), a).slice(0, 3), explain: `El volumen que sale por un lado entra por el otro: ${a1} × (bajada) = ${a2} × ${d}, así que baja ${fmt(r)} cm. Lo que ganas en fuerza lo pagas en recorrido.` };
});
F('hidr_nada_gratis', '¿Qué regla de siempre cumple un sistema hidráulico?', 'Lo que ganas en fuerza lo pagas en recorrido: el trabajo (fuerza × distancia) es el mismo', ['Crea fuerza de la nada', 'Suma la fuerza de los dos émbolos', 'Convierte los newtons en julios'], 'Es la misma idea que las palancas y los engranajes: ninguna máquina sin pérdidas da más trabajo del que recibe.', 'fl2');
F('gato', 'Un gato hidráulico levanta un coche con poca fuerza de brazo. ¿Cómo lo consigue?', 'Con un émbolo pequeño que empuja un émbolo muy grande: bombeas muchas veces para subir un poco', ['Porque el aceite pesa mucho', 'Porque crea energía', 'Porque usa un motor escondido siempre'], 'Cada bombeo empuja un poco de aceite hacia el émbolo grande, que sube poco pero con mucha fuerza. Por eso hay que bombear muchas veces.', 'fl2');
F('burbuja', 'Un circuito hidráulico tiene una burbuja de aire dentro. ¿Qué notas?', 'El movimiento sale «blando» o esponjoso, porque el aire se comprime', ['Funciona mejor', 'Nada: el aire no importa', 'El líquido se vuelve sólido'], 'El aire se comprime y absorbe parte de tu empuje. Hay que purgar las burbujas llenando el circuito con cuidado.', 'fl2');

// ---- Lección 3 · Neumática ----
T('neumatica', 'Neumática', 'Técnica que usa aire comprimido para producir fuerza y movimiento.', 'fl3', 'Las puertas de muchos autobuses.', 'Fuerza con aire');
C('neum_fuerza', 'Un cilindro neumático recibe aire a 100 kPa de presión y su émbolo tiene 50 cm² de área. ¿Qué fuerza empuja (ideal)? (un kilopascal sobre un centímetro cuadrado son una décima de newton)', '500 N', ['5000 N', '50 N', '150 N'], 'Fuerza = presión × área, con las unidades de este problema: 100 × 50 × 0,1 = 500 N.', 'fl3', () => {
  const p = pick([20, 50, 100, 200]), A = pick([10, 20, 50]), f = p * A / 10, a = f + ' N';
  return { q: `Un cilindro neumático recibe aire a ${p} kPa de presión y su émbolo tiene ${A} cm² de área. ¿Qué fuerza empuja (ideal)? (un kilopascal sobre un centímetro cuadrado son una décima de newton)`, a, wrong: uniq([p * A, p + A, f / 10, f * 2].map(x => fmt(x) + ' N'), a).slice(0, 3), explain: `Fuerza = presión × área, con las unidades de este problema: ${p} × ${A} × 0,1 = ${f} N.` };
});
F('neum_compresible', '¿Qué diferencia notas entre empujar una jeringuilla llena de agua y otra llena de aire con el extremo tapado?', 'La de aire se comprime y rebota; la de agua casi no cede', ['La de agua rebota más', 'No hay ninguna diferencia', 'La de aire no se puede empujar'], 'El aire se comprime como un muelle; el agua casi no. Por eso la neumática da movimientos más rápidos pero menos precisos.', 'fl3');
F('neum_uso', '¿Dónde se usa la neumática?', 'En puertas de autobús, herramientas de aire y frenos de trenes', ['Solo en los coches de juguete', 'Solo en los barcos', 'En ningún sitio hoy'], 'El aire comprimido es limpio, rápido y barato de transportar por tubos. Se usa donde hace falta mucha fuerza con un mecanismo sencillo y seguro.', 'fl3');
F('neum_seguridad', '¿Qué precaución tomas al hacer experimentos con aire a presión y jeringuillas?', 'No apuntar a nadie, usar gafas y no forzar los émbolos más de lo que aguantan', ['Ninguna: el aire no hace daño', 'Apuntar a la cara para ver si sale', 'Sellar con pegamento fuerte para que no escape'], 'Un émbolo o un tapón puede salir disparado si fuerzas la presión. Con aire, no apuntes a nadie, usa gafas y trabaja con presiones bajas, las de tus propias manos.', 'fl3');
F('aire_rebote', 'Predice: un brazo accionado con una jeringuilla de aire se detiene bruscamente. ¿Qué verás?', 'Un rebote o un temblor, porque el aire actúa como un muelle', ['Se queda totalmente firme', 'Se rompe siempre', 'Sube más deprisa'], 'El aire comprimido guarda y devuelve energía: sin frenos ni amortiguación, el extremo oscila antes de pararse.', 'fl3');

// ---- Lección 4 · Un brazo hidráulico casero ----
O('hidr_montaje', 'Ordena los pasos para montar un circuito de jeringuillas con agua', ['Llena las dos jeringuillas y el tubo de agua con cuidado de no dejar burbujas', 'Conecta cada jeringuilla a un extremo del tubo', 'Empuja el émbolo de una y comprueba que mueve el otro', 'Fija las jeringuillas a la estructura de cartón', 'Anota cuánto se mueve cada émbolo'], 'Primero se llena sin burbujas, luego se conecta, se prueba a mano y solo después se fija a la estructura. Medir los dos recorridos te permite comparar con el cálculo.', 'fl4');
X('hidr_flojo', 'El brazo hidráulico «blando»', [
  'Tu brazo de cartón mueve un palo con dos jeringuillas de agua y un tubo.',
  'Al empujar la jeringuilla, el brazo se mueve con retraso y «esponjoso», y a veces gotea por una unión.'], [
  ['¿Qué causa es más probable?', ['Hay aire dentro y alguna fuga en una unión', 'El agua pesa demasiado', 'El cartón es del color equivocado'], 0, 'El aire se comprime y la fuga pierde líquido. Las dos cosas hacen que el movimiento del émbolo no llegue entero al otro lado.'],
  ['¿Qué haces primero?', ['Vaciar, volver a llenar sin burbujas y revisar las uniones', 'Cambiar todo el cartón', 'Ponerle más agua por fuera'], 0, 'Purgar el aire y sellar bien las uniones se hace antes de rediseñar. Y trabaja lejos de aparatos eléctricos.']], 'fl4');
F('hidr_sincro', 'Conectas dos jeringuillas del mismo tamaño con un tubo. Empujas una 2 cm. ¿Cuánto se mueve la otra (ideal)?', 'Unos 2 cm: mismo tamaño, mismo recorrido', ['4 cm', '1 cm', 'No se mueve'], 'Con la misma área, el volumen desplazado es el mismo y el recorrido también. Con tamaños distintos, cambia fuerza y recorrido.', 'fl4');
F('hidr_vs', '¿Qué ventaja tiene un brazo hidráulico frente a uno con engranajes?', 'Puedes llevar la fuerza por tubos flexibles a donde quieras, sin ejes ni engranajes en cada articulación', ['No tiene ninguna fuga', 'Siempre es más rápido', 'No necesita mantenimiento'], 'Un tubo puede curvarse y llegar a cualquier articulación. A cambio hay fugas, burbujas y movimientos algo más lentos.', 'fl4');

// ---------------------------------------------------------------------
// UNIDAD · CINEMÁTICA DEL BRAZO
// ---------------------------------------------------------------------
// ---- Lección 1 · Ángulos y posición ----
T('cin_directa', 'Cinemática directa', 'Calcular dónde queda el extremo del brazo a partir de los ángulos de sus articulaciones.', 'ci1', 'Conozco los ángulos, calculo dónde llego.', 'Ángulos → posición');
T('cin_inversa', 'Cinemática inversa', 'Calcular qué ángulos hacen falta en las articulaciones para que el extremo llegue a un punto.', 'ci1', 'Conozco el punto, calculo los ángulos.', 'Posición → ángulos');
C('codo_pos', 'Un brazo plano tiene el primer eslabón de 12 cm en horizontal hacia la derecha y el segundo, de 8 cm, en vertical hacia arriba (el codo está en ángulo recto). ¿Cuáles son las coordenadas (x, y) del extremo, desde la base?', '(12, 8) cm', ['(8, 12) cm', '(20, 0) cm', '(12, 0) cm'], 'El primer eslabón lleva el extremo 12 cm a la derecha y el segundo lo sube 8 cm: (12, 8).', 'ci1', () => {
  const [a1, b1] = pick([[6, 8], [9, 12], [12, 16], [5, 12], [8, 15], [15, 20]]), sw = Math.random() < 0.5, L1 = sw ? b1 : a1, L2 = sw ? a1 : b1, a = `(${L1}, ${L2}) cm`;
  return { q: `Un brazo plano tiene el primer eslabón de ${L1} cm en horizontal hacia la derecha y el segundo, de ${L2} cm, en vertical hacia arriba (el codo está en ángulo recto). ¿Cuáles son las coordenadas (x, y) del extremo, desde la base?`, a, wrong: uniq([`(${L2}, ${L1}) cm`, `(${L1 + L2}, 0) cm`, `(${L1}, 0) cm`], a), explain: `El primer eslabón lleva el extremo ${L1} cm a la derecha y el segundo lo sube ${L2} cm: (${L1}, ${L2}).`, fig: codoSVG(L1, L2) };
}, codoSVG(12, 8));
C('codo_dist', 'Un brazo plano tiene el primer eslabón de 6 cm en horizontal y el segundo, de 8 cm, en vertical, con el codo en ángulo recto. ¿A qué distancia en línea recta está el extremo de la base?', '10 cm', ['14 cm', '2 cm', '48 cm'], 'Teorema de Pitágoras: distancia = √(6² + 8²) = √(36 + 64) = √100 = 10 cm. (No es 6 + 8 = 14: va en diagonal.)', 'ci1', () => {
  const [a1, b1] = pick([[6, 8], [9, 12], [12, 16], [5, 12], [8, 15], [15, 20]]), sw = Math.random() < 0.5, L1 = sw ? b1 : a1, L2 = sw ? a1 : b1, d = Math.hypot(L1, L2), a = d + ' cm';
  return { q: `Un brazo plano tiene el primer eslabón de ${L1} cm en horizontal y el segundo, de ${L2} cm, en vertical, con el codo en ángulo recto. ¿A qué distancia en línea recta está el extremo de la base?`, a, wrong: uniq([(L1 + L2) + ' cm', Math.abs(L1 - L2) + ' cm', (L1 * L2) + ' cm', (d * 2) + ' cm'], a).slice(0, 3), explain: `Teorema de Pitágoras: distancia = √(${L1}² + ${L2}²) = √(${L1 * L1} + ${L2 * L2}) = √${L1 * L1 + L2 * L2} = ${d} cm. (No es ${L1} + ${L2} = ${L1 + L2}: va en diagonal.)`, fig: codoSVG(L1, L2) };
}, codoSVG(6, 8));
F('cin_dos_sol', 'Quieres que el extremo de un brazo de 2 eslabones llegue a un punto de su alcance. ¿Cuántas formas suele haber de doblar el codo?', 'Normalmente dos: con el codo hacia arriba o con el codo hacia abajo', ['Siempre una sola', 'Infinitas siempre', 'Ninguna'], 'Para un punto dentro del alcance, un brazo plano de dos eslabones suele poder llegar con el codo «arriba» o «abajo» (dos soluciones). Elegir una forma parte del diseño.', 'ci1', arm2SVG());
F('cin_inalcanzable', 'Pides al brazo llegar a un punto más lejos de su alcance máximo. ¿Qué pasa en la cinemática inversa?', 'No hay solución: ese punto está fuera de su espacio de trabajo', ['El brazo se alarga solo', 'Hay dos soluciones', 'El brazo siempre llega girando la base'], 'Si el punto está más lejos de L1 + L2 (o más cerca de |L1 − L2|), ninguna combinación de ángulos lo alcanza.', 'ci1', arm2SVG());
F('cin_estirado', 'Un brazo está totalmente estirado. ¿Qué limitación tiene en ese momento?', 'No puede avanzar más en esa dirección: está en el borde de su alcance', ['Puede alcanzar cualquier punto', 'Pesa menos', 'Se mueve más deprisa'], 'En el borde del espacio de trabajo, mover un poco el extremo hacia fuera exigiría estirarse más de lo posible. Los brazos evitan trabajar justo en ese borde.', 'ci1');

// ---- Lección 2 · Resolución y precisión ----
T('resolucion', 'Resolución', 'El cambio más pequeño de posición que el sistema puede hacer, por ejemplo un grado de giro de un servo.', 'ci2', 'Cuanto más pequeño el paso, más fino el control.', 'Paso más pequeño');
T('repetibilidad', 'Repetibilidad', 'Capacidad de volver una y otra vez al mismo punto con casi el mismo resultado.', 'ci2', 'No es lo mismo que acertar al primer intento: es acertar siempre igual.', 'Volver siempre al mismo sitio');
C('res_punta', 'Un brazo mide 40 cm de largo. Su articulación se mueve en pasos de un grado. Aproximadamente, ¿cuánto se mueve la punta con cada paso? (regla: un grado desplaza la punta unos 0,0175 de la longitud)', '7 mm', ['0,7 mm', '70 mm', '40 mm'], 'Desplazamiento ≈ 0,0175 × 40 cm = 0,7 cm = 7 mm. Cuanto más largo el brazo, más salta la punta con cada grado.', 'ci2', () => {
  const L = pick([20, 40, 60, 80]), m = L * 0.175, a = fmt(m) + ' mm';
  return { q: `Un brazo mide ${L} cm de largo. Su articulación se mueve en pasos de un grado. Aproximadamente, ¿cuánto se mueve la punta con cada paso? (regla: un grado desplaza la punta unos 0,0175 de la longitud)`, a, wrong: uniq([fmt(m / 10, 2), fmt(m * 10), fmt(L), fmt(m * 2)].map(x => x + ' mm'), a).slice(0, 3), explain: `Desplazamiento ≈ 0,0175 × ${L} cm = ${fmt(L * 0.0175, 2)} cm = ${fmt(m)} mm. Cuanto más largo el brazo, más salta la punta con cada grado.` };
});
F('res_largo', 'Quieres colocar la punta con la máxima precisión. ¿Cómo influye la longitud del brazo?', 'Cuanto más largo, menos precisa es la punta para el mismo paso del motor', ['Cuanto más largo, más precisa', 'No influye', 'Solo influye el color'], 'El mismo ángulo mueve más la punta cuanto más lejos está del eje. Por eso los brazos precisos son cortos o llevan reducciones finas.', 'ci2');
F('calibrar', 'Al encender tu brazo, no sabe en qué ángulo está cada articulación. ¿Cómo lo soluciona?', 'Moviéndolas hasta un final de carrera que marca una posición de referencia (el «cero»)', ['Adivinando', 'Esperando a que se enfríe', 'Girando siempre 360°'], 'Sin sensores de posición absolutos, el brazo necesita una referencia conocida: al llegar al final de carrera sabe dónde está y a partir de ahí cuenta pasos.', 'ci2');
F('juego_prec', 'Tu brazo llega siempre unos milímetros por debajo del punto esperado. ¿Qué podría explicarlo?', 'La flexión de los eslabones y el juego de las uniones, que se suman a lo largo del brazo', ['Que la gravedad sube', 'Que las pilas no brillan', 'Que la regla ha cambiado'], 'Un eslabón largo se dobla bajo carga y las uniones tienen holgura: la punta cae un poco. Es la misma flecha y el mismo juego que viste en las estructuras.', 'ci2');

// ---- Lección 3 · Trayectorias ----
T('trayectoria', 'Trayectoria', 'Camino que sigue el extremo del brazo al ir de un punto a otro.', 'ci3', 'Puede ser recta, curva o a saltos.', 'Camino del extremo');
F('rect_curva', 'Quieres que la punta de un brazo de articulaciones se mueva en línea recta. ¿Qué debe ocurrir en las articulaciones?', 'Deben moverse a la vez, a velocidades que van cambiando', ['Basta mover una sola articulación', 'Todas a la misma velocidad constante', 'Ninguna: lo hace sola'], 'Cada articulación gira trazando un arco, así que una recta exige combinar varios giros coordinados. Mover una sola articulación hace que la punta dibuje un arco.', 'ci3');
F('suave', '¿Por qué conviene arrancar y frenar el brazo de forma gradual?', 'Para reducir tirones y vibraciones: la inercia y la flexión hacen que los cambios bruscos lo hagan temblar', ['Para que gaste más energía', 'Para que sea más ruidoso', 'No conviene: siempre a tope'], 'Un arranque brusco pide mucha aceleración (fuerza, par) y excita las vibraciones del brazo. Una rampa suave lo evita.', 'ci3');
O('planificar', 'Ordena los pasos para mover el brazo a un punto', ['Decide el punto de salida y el punto de llegada', 'Comprueba que los dos puntos están dentro del alcance', 'Calcula los ángulos de cada articulación', 'Mueve con arranque y frenada suaves', 'Mide el resultado y corrige'], 'Se define el objetivo, se comprueba que es posible, se calculan los ángulos, se mueve con suavidad y se mide para ajustar.', 'ci3');
X('cin_error', 'El brazo que llega corto', [
  'Tu brazo de dos eslabones debería llegar a 20 cm de la base, pero se queda a 18 cm.',
  'Los ángulos que le pides son los correctos, y los eslabones miden lo que dices.'], [
  ['¿Qué causas son más probables?', ['Juego en las uniones, flexión de los eslabones y una calibración del cero mal hecha', 'Que el brazo se ha encogido', 'Que el aire pesa'], 0, 'Todas esas cosas hacen que el brazo no siga exactamente el ángulo pedido. Lo primero es comprobar la calibración y el juego.'],
  ['¿Qué mides primero?', ['Los ángulos reales con un transportador y la posición del cero', 'El color de las piezas', 'La temperatura'], 0, 'Comparar el ángulo pedido con el ángulo real te dice si el error viene del cero, de la holgura o de la flexión.']], 'ci3');

addUnits([
  { id: 'u_simples', title: 'Máquinas simples y correas', sub: 'Rampa, cuña, tornillo, rueda y eje, correas y cadenas', lessons: [
    { id: 'l_inclinado', title: 'Plano inclinado y cuña', sub: 'Menos fuerza, más camino', icon: '📐', items: ['t_inclinado', 't_cuna', 'c_rampa', 'f_rampa_nada_gratis', 'f_rampa_larga', 'f_cuna_ejemplos', 'f_cuna_calzo'],
      note: { title: 'Una rampa es una máquina', fig: rampSVG(), body: 'Un **plano inclinado** deja subir una carga con **menos fuerza**, pero con **más camino**:\n\n**fuerza = peso × altura ÷ largo** (sin rozamiento)\n\nUna **cuña** es una rampa que se mueve y **separa** lo que tiene delante.\n\n👆 Toca el dibujo para pausarlo.' } },
    { id: 'l_tornillo', title: 'Tornillo, rueda y eje', sub: 'Rampas enrolladas y mangos', icon: '🔩', items: ['t_tornillo', 't_paso_tornillo', 't_rueda_eje', 'c_paso_tornillo_calc', 'c_rueda_eje_calc', 'f_tornillo_fino', 'f_mango_destornillador'],
      note: { title: 'Lo mismo, de otra forma', body: 'Un **tornillo** es una rampa **enrollada**: cada vuelta lo hace avanzar su **paso**.\n\nUna **rueda y eje** gana fuerza con la relación de radios: **ventaja = radio de la rueda ÷ radio del eje**.\n\nSiempre pagas con recorrido lo que ganas en fuerza.' } },
    { id: 'l_correas', title: 'Correas y cadenas', sub: 'Unir ejes lejanos', icon: '⛓️', items: ['t_correa', 't_cadena', 'c_correa_rel', 'f_correa_sentido', 'f_correa_patina', 'f_correa_tension', 'f_cadena_ventaja'],
      note: { title: 'Engranajes a distancia', body: 'Una **correa** une dos poleas por rozamiento; una **cadena** engrana con dientes y no resbala.\n\n**Relación = diámetro de la conducida ÷ diámetro de la motriz**, como con los engranajes.\n\nNo tenses de más: cargas los ejes y los rodamientos.' } }
  ]},
  { id: 'u_vehiculo', title: 'Vehículos Technic', sub: 'Dirección, diferencial, suspensión y tracción', lessons: [
    { id: 'l_direccion', title: 'Dirección', sub: 'Cómo gira un coche', icon: '🚗', items: ['t_ackermann', 'c_dir_vueltas', 'f_dir_interior', 'f_dir_radio', 'f_dir_technic', 'f_dir_juego'],
      note: { title: 'Los dos círculos de la curva', fig: curvaSVG(), body: 'En una curva, cada rueda traza un **círculo distinto**: la de dentro, uno **más pequeño**. Por eso gira **más ángulo** (geometría **Ackermann**).\n\nEn Technic, un **piñón y una cremallera** suelen mover las ruedas.\n\n👆 Toca el dibujo para pausarlo.' } },
    { id: 'l_diferencial', title: 'Diferencial', sub: 'Dos ruedas, dos velocidades', icon: '⚙️', items: ['t_diferencial', 'f_dif_curva', 'c_dif_rpm', 'f_dif_hielo', 'f_dif_bloqueo', 'f_dif_technic'],
      note: { title: 'Repartir el giro', body: 'El **diferencial** permite que las dos ruedas giren a velocidades **distintas** en una curva, y reparte el par por igual.\n\nEn un diferencial abierto: **entrada = media de las dos ruedas**.\n\nSi una rueda patina, **la otra casi no empuja**: por eso existen los autoblocantes.' } },
    { id: 'l_susp', title: 'Suspensión y tracción', sub: 'Agarre, rebote y vuelco', icon: '🛞', items: ['t_suspension', 't_traccion', 'c_agarre', 'f_susp_amort', 'f_traccion_peso', 'f_vuelco', 'f_susp_technic'],
      note: { title: 'Agarrar y no volcar', body: 'El empuje máximo es **μ × reacción normal**: más **peso** sobre las ruedas motrices y más **goma** dan más agarre.\n\nUn **muelle** rebota; el **amortiguador** lo calma.\n\nUn **centro de gravedad bajo** y una base ancha evitan el vuelco.' } },
    { id: 'l_coche_diag', title: 'Diagnostica un coche', sub: 'Gira mal, patina, va flojo', icon: '🔍', items: ['o_coche_montaje', 'x_coche_no_gira', 'x_coche_patina', 'f_coche_reduccion'],
      note: { title: 'Mira, mide, cambia una cosa', body: 'Casi siempre el fallo es de lo que ya sabes: **juego** en la dirección, **poco agarre**, **poca reducción**, **poco peso** donde debe estar.\n\nCambia **una cosa cada vez** y prueba.' } }
  ]},
  { id: 'u_fluidos', title: 'Neumática e hidráulica', sub: 'Fuerza con agua y con aire', lessons: [
    { id: 'l_presion', title: 'Presión y fuerza', sub: 'Pascales y jeringuillas', icon: '💧', items: ['t_presion', 't_pascal', 'c_presion_calc', 'f_presion_clavo', 'f_jeringas', 'f_aire_agua'],
      note: { title: 'Presión = fuerza ÷ área', body: 'La **presión** es la fuerza **repartida** en una superficie: **presión = fuerza ÷ área**.\n\nEn un fluido encerrado, la presión que haces se **transmite por igual** a todos lados (principio de **Pascal**).' } },
    { id: 'l_hidr', title: 'Pistones y ventaja hidráulica', sub: 'Poca fuerza, mucha fuerza', icon: '💉', items: ['t_embolo', 'c_hidr_fuerza', 'c_hidr_recorrido', 'f_hidr_nada_gratis', 'f_gato', 'f_burbuja'],
      note: { title: 'La palanca de los líquidos', fig: hidrSVG(), body: 'Si un émbolo es **10 veces** más grande que otro, la **fuerza** del grande es **10 veces** mayor... pero se mueve **10 veces menos**.\n\nOtra vez: lo que ganas en fuerza lo pagas en **recorrido**.\n\n👆 Toca el dibujo para pausarlo.' } },
    { id: 'l_neum', title: 'Neumática', sub: 'Aire comprimido', icon: '🌬️', items: ['t_neumatica', 'c_neum_fuerza', 'f_neum_compresible', 'f_neum_uso', 'f_neum_seguridad', 'f_aire_rebote'],
      note: { title: 'El aire se comprime', body: 'La **neumática** usa aire comprimido: es **rápida y limpia**, pero **menos precisa**, porque el aire actúa como un **muelle**.\n\n⚠️ Con aire a presión: **gafas**, no apuntes a nadie y no fuerces los émbolos.' } },
    { id: 'l_hidr_arm', title: 'Un brazo hidráulico casero', sub: 'Montar sin burbujas', icon: '🦾', items: ['o_hidr_montaje', 'x_hidr_flojo', 'f_hidr_sincro', 'f_hidr_vs'],
      note: { title: 'Fuerza por tubos', body: 'Un brazo hidráulico mueve la fuerza por **tubos flexibles**, sin ejes ni engranajes en cada articulación.\n\nLos enemigos son las **burbujas** y las **fugas**. Llena **sin aire** y revisa las uniones.' } }
  ]},
  { id: 'u_cinem', title: 'Cinemática del brazo', sub: 'Ángulos, posición y precisión', lessons: [
    { id: 'l_cin_pos', title: 'Ángulos y posición', sub: 'Dónde llega el extremo', icon: '📍', items: ['t_cin_directa', 't_cin_inversa', 'c_codo_pos', 'c_codo_dist', 'f_cin_dos_sol', 'f_cin_inalcanzable', 'f_cin_estirado'],
      note: { title: 'Ángulos ↔ posición', fig: codoSVG(12, 8), body: '• **Directa**: conozco los **ángulos**, calculo dónde llega el extremo.\n• **Inversa**: conozco el **punto**, calculo los **ángulos**.\n\nCon el codo en ángulo recto, la posición son los dos eslabones; y la distancia en diagonal se calcula con **Pitágoras**: √(a² + b²).' } },
    { id: 'l_cin_prec', title: 'Resolución y precisión', sub: 'Cuánto salta la punta', icon: '🎯', items: ['t_resolucion', 't_repetibilidad', 'c_res_punta', 'f_res_largo', 'f_calibrar', 'f_juego_prec'],
      note: { title: 'Más largo, menos fino', body: 'Un mismo grado de giro mueve **más** la punta cuanto **más largo** es el brazo. Por eso la **resolución** de las articulaciones importa.\n\nY con un **final de carrera** el brazo encuentra su **cero** al arrancar.' } },
    { id: 'l_cin_tray', title: 'Trayectorias', sub: 'Rectas, curvas y suavidad', icon: '〰️', items: ['t_trayectoria', 'f_rect_curva', 'f_suave', 'o_planificar', 'x_cin_error'],
      note: { title: 'Mover bien es mover suave', body: 'Para que la punta vaya en **recta**, las articulaciones se mueven **a la vez** con velocidades que cambian.\n\nY conviene **arrancar y frenar poco a poco**: así no se excitan las vibraciones.' } }
  ]}
], {
  l_inclinado: { title: 'Sabías que… las carreteras en zigzag', body: 'Las carreteras de montaña van en **zigzag** porque son una **rampa larga y suave** enrollada en la ladera: con la misma altura, cuanto más largo el camino, menos pendiente y **menos fuerza** hace falta.\n\nEs el plano inclinado en versión gigante.' },
  l_tornillo: { title: 'Sabías que… el tornillo de Arquímedes', body: 'Se atribuye a **Arquímedes** el **tornillo** que sube agua girando una espiral dentro de un tubo inclinado. Los historiadores discuten si lo inventó él o si ya se usaba antes.\n\nSigue usándose hoy para mover agua, grano y otros materiales.' },
  l_correas: { title: 'Sabías que… la correa de distribución', body: 'En muchos motores de coche, una **correa dentada** une el cigüeñal con el árbol de levas para que giren **sincronizados**. Si se rompe, el motor puede estropearse.\n\nPor eso esa correa lleva dientes: **no puede patinar**.' },
  l_direccion: { title: 'Sabías que… la patente de la dirección', body: 'La geometría de dirección de los coches se asocia a **Rudolph Ackermann**, que la patentó en Inglaterra en **1818**, aunque la idea la había ideado el alemán Georg Lankensperger.\n\nSirve para que las dos ruedas delanteras no patinen en una curva.' },
  l_diferencial: { title: 'Sabías que… el diferencial de 1827', body: 'El francés **Onésiphore Pecqueur** patentó en **1827** un mecanismo diferencial para un carro de vapor, y se le considera un pionero del diferencial del automóvil.\n\nLo que hace es permitir que las ruedas giren a velocidades distintas en una curva.' },
  l_presion: { title: 'Sabías que… Pascal y los fluidos', body: '**Blaise Pascal**, en el siglo XVII, estudió cómo se transmite la presión en un fluido encerrado. Su resultado, el **principio de Pascal**, es la base de los frenos hidráulicos y de los gatos.\n\nDe él viene también el **pascal**, la unidad de presión.' },
  l_hidr: { title: 'Sabías que… la prensa de Bramah', body: 'El inglés **Joseph Bramah** patentó en **1795** una **prensa hidráulica** que aplicaba el principio de Pascal para conseguir fuerzas enormes con un émbolo pequeño.\n\nHoy sus descendientes están en talleres, grúas y frenos.' },
  l_neum: { title: 'Sabías que… la neumática antigua', body: 'Se cuenta que **Ctesibio de Alejandría**, en el siglo III a. C., ya construyó **bombas y mecanismos de aire**. Es una de las ramas más antiguas de la ingeniería.\n\nLos frenos de aire de los trenes y las puertas de autobús usan hoy la misma idea.' },
  l_cin_pos: { title: 'Sabías que… la cinemática inversa en los videojuegos', body: 'La **cinemática inversa** no solo se usa en robots: en animación y **videojuegos** sirve para que un personaje estire la mano hacia un objeto y el brazo se coloque solo.\n\nEs el mismo problema: dado el punto, ¿qué ángulos necesita cada articulación?' },
  l_cin_prec: { title: 'Sabías que… las especificaciones de un brazo industrial', body: 'Los brazos industriales indican su **repetibilidad**, normalmente de **décimas o centésimas de milímetro**: no que acierten un punto cualquiera, sino que **vuelvan una y otra vez al mismo**.\n\nPara eso necesitan estructuras muy rígidas y poco juego.' }
}, {
  u_simples: { id: 'm_simples', icon: '📐', title: 'Rampa y poleas de cartón',
    why: 'Con una **goma elástica** como medidor de fuerza vas a **ver** que una rampa pide menos fuerza que subir en vertical, y a medir cuánto más camino pagas.',
    think: 'Antes de medir, predice: ¿se estirará menos la goma en la rampa larga? ¿Cuántas veces menos? Compara con la regla de fuerza = peso × altura ÷ largo.',
    safety: 'Usa gomas en buen estado y no las estires cerca de la cara. Sujeta bien los libros para que no caigan sobre los dedos o los pies.',
    versions: {
      goma: { label: 'Con goma y cartón', intro: 'Una goma elástica, una tabla o cartón rígido, libros, una regla y un objeto pequeño y pesado (un estuche, un bote).', steps: [
        'Apoya la tabla sobre uno o dos libros para hacer una rampa y mide su altura y su largo.',
        'Ata la goma al objeto y tira hacia arriba en vertical, midiendo cuánto se estira la goma.',
        'Tira del objeto por la rampa con velocidad constante y mide cuánto se estira ahora.',
        'Predice cómo cambia al hacer la rampa más larga con la misma altura y vuélvelo a medir.',
        'Compara con la regla de fuerza = peso × altura ÷ largo. ¿Por qué no coincide del todo? (rozamiento)'] },
      papel: { label: 'En papel', intro: 'Sin material.', steps: [
        'Dibuja una rampa de 3 m de largo y 1 m de altura con una caja de 30 N.',
        'Calcula la fuerza mínima para subirla y el camino que recorres.',
        'Repite para una rampa de 6 m con la misma altura y compara.',
        'Escribe con tus palabras qué ganas y qué pagas.'] } } },
  u_vehiculo: { id: 'm_veh', icon: '🚗', title: 'Un coche de cartón con dirección',
    why: 'Vas a construir un coche sencillo y **ver** cómo una dirección con pivote cambia el radio de la curva. Es la forma más rápida de entender por qué importa la distancia entre ejes.',
    think: 'Antes de probar, predice: ¿qué coche hará la curva más cerrada, el corto o el largo? Mide el radio de giro con un cordel o con tiza y compara.',
    safety: 'Corta el cartón con tijeras sobre una superficie protegida. Si añades un motor, usa solo pilas AA y desconecta si se bloquea. Prueba lejos de escaleras.',
    versions: {
      carton: { label: 'Con cartón', intro: 'Cartón rígido, 4 tapones de botella, dos palillos o pajitas rígidas, un encuadernador y cinta.', steps: [
        'Recorta un chasis rectangular de cartón y monta dos ejes con palillos y las ruedas (tapones).',
        'Comprueba que las ruedas giran libres y que el coche rueda en línea recta.',
        'Haz que el eje delantero pueda pivotar con un encuadernador en el centro del chasis.',
        'Gira el eje delantero un ángulo fijo con cinta y empuja el coche: marca el círculo que traza.',
        'Mide el radio de la curva con una cuerda desde el centro de giro.',
        'Repite con un chasis más largo: ¿cambia el radio como habías predicho?'] },
      papel: { label: 'En papel', intro: 'Papel, lápiz y regla.', steps: [
        'Dibuja un coche visto desde arriba con sus cuatro ruedas.',
        'Dibuja los círculos que recorren la rueda interior y la exterior en una curva.',
        'Calcula cuántos grados giran las ruedas por vuelta de volante si da 3 vueltas para 60° de tope.',
        'Escribe por qué un diferencial es necesario en las ruedas motrices.'] } } },
  u_fluidos: { id: 'm_hidr', icon: '💉', title: 'Brazo hidráulico de jeringuillas',
    why: 'Con dos jeringuillas y un tubo vas a **sentir** el principio de Pascal: empujas un émbolo y se mueve el otro, y con tamaños distintos notas el cambio entre fuerza y recorrido.',
    think: 'Antes de empujar, predice: con la jeringuilla pequeña y la grande, ¿cuál se mueve más? ¿Cuál empuja con más fuerza? Mide el recorrido de cada una y compara con la regla de las áreas.',
    safety: 'Usa jeringuillas SIN aguja. Trabaja con agua, lejos de enchufes y aparatos eléctricos, y sobre una bandeja. No apuntes a la cara y no fuerces los émbolos.',
    versions: {
      jeringas: { label: 'Con jeringuillas', intro: 'Dos jeringuillas de distinto tamaño sin aguja, unos 30 cm de tubo flexible, agua con colorante, una bandeja y cartón para un soporte.', steps: [
        'Llena una jeringuilla con agua y conéctale el tubo, dejando salir el aire.',
        'Llena el tubo y conecta la segunda jeringuilla con el émbolo recogido, sin dejar burbujas.',
        'Empuja el émbolo de una jeringuilla y comprueba que el otro se mueve.',
        'Mide cuánto baja el pequeño y cuánto sube el grande. ¿Cuántas veces más recorre el pequeño?',
        'Intenta frenar con el dedo el émbolo grande mientras empujas el pequeño: ¿en cuál notas más fuerza?',
        'Monta un brazo de cartón con una articulación movida por el émbolo grande.'] },
      papel: { label: 'En papel', intro: 'Sin material.', steps: [
        'Dibuja dos émbolos unidos por un tubo, uno de 2 cm² y otro de 20 cm².',
        'Calcula la fuerza en el grande si empujas el pequeño con 10 N.',
        'Calcula cuánto baja el pequeño para que el grande suba 1 cm.',
        'Explica con tus palabras por qué una burbuja de aire estropea el sistema.'] } } },
  u_cinem: { id: 'm_cinem', icon: '📍', title: 'Dibuja el mapa de alcance de tu brazo',
    why: 'Vas a **medir** el alcance real de un brazo de dos eslabones y comprobarlo con la regla: máximo = L1 + L2 y mínimo = |L1 − L2|. Además verás cuánto se aleja la realidad del cálculo.',
    think: 'Antes de medir, predice las distancias máxima y mínima. Luego mide. ¿Cuánto se aleja? Esa diferencia es el juego y la flexión de tu montaje.',
    safety: 'Corta el cartón con tijeras sobre una superficie protegida. Haz los agujeros con un lápiz sobre material blando.',
    versions: {
      carton: { label: 'Con un brazo de cartón', intro: 'Dos tiras de cartón de largos distintos, dos encuadernadores, un lápiz y un folio grande.', steps: [
        'Monta un brazo de dos eslabones con un encuadernador en el codo y otro en la base.',
        'Mide la longitud de cada eslabón y calcula el alcance máximo y mínimo.',
        'Sujeta un lápiz en el extremo y marca sobre el folio los puntos que alcanzas con el brazo estirado.',
        'Marca también los puntos con el codo lo más doblado posible.',
        'Mide las dos distancias y compáralas con tu cálculo.',
        'Coloca el brazo con el codo en ángulo recto y comprueba la distancia en diagonal con Pitágoras.'] },
      papel: { label: 'En papel', intro: 'Papel, regla y compás.', steps: [
        'Dibuja un brazo de dos eslabones de 10 cm y 6 cm desde una base.',
        'Con el compás, dibuja los círculos del alcance máximo y mínimo.',
        'Marca tres puntos dentro del espacio de trabajo y tres fuera.',
        'Para cada punto de dentro, dibuja las dos formas de doblar el codo.'] } } }
});
