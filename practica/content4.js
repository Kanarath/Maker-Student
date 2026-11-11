// =====================================================================
// UNIDADES «AUTOMATIZACIÓN DE LO COTIDIANO» y «PROYECTO: TU BRAZO DE 2-3 GDL»
// Se carga después de content3.js (usa sus constructores, figuras y addUnits).
// =====================================================================

// ---------------------------------------------------------------------
// UNIDAD · AUTOMATIZACIÓN DE LO COTIDIANO
// ---------------------------------------------------------------------
// ---- Lección 1 · Sensores y actuadores ----
T('sensor', 'Sensor', 'Dispositivo que detecta algo del entorno (presencia, posición, temperatura, luz) y lo convierte en una señal.', 'a1', 'Son los «sentidos» de una máquina.', 'Detecta algo del entorno');
T('actuador', 'Actuador', 'Elemento que produce el movimiento o la acción: un motor, un pistón, un electroimán.', 'a1', 'Son los «músculos» de una máquina.', 'Produce el movimiento');
T('final_carrera', 'Final de carrera', 'Interruptor que se pulsa cuando una pieza llega al extremo de su recorrido y avisa de que debe parar.', 'a1', 'Evita que algo siga empujando contra el tope.', 'Avisa del fin del recorrido');
T('realimentacion', 'Realimentación (lazo cerrado)', 'Sistema que mide el resultado con un sensor y lo usa para corregirse; si no mide, se dice lazo abierto.', 'a1', 'Mira, compara y corrige.', 'Mide y se corrige');
F('lazo', 'Una tostadora sencilla funciona un tiempo fijo sin comprobar si el pan está dorado. ¿Qué tipo de sistema es?', 'De lazo abierto: no mide el resultado', ['De lazo cerrado: mide el dorado', 'No es un sistema', 'Un sensor sin actuador'], 'Funciona por tiempo, sin mirar el resultado. Un sistema de lazo cerrado mediría (por ejemplo, el color o la temperatura) y se corregiría.', 'a1');
F('puerta_seguridad', '¿Por qué una puerta automática lleva un sensor de obstáculo además del que detecta a quien llega?', 'Para no cerrarse sobre una persona o un objeto que esté en el hueco', ['Para abrirse más deprisa', 'Para gastar menos energía', 'Es solo decoración'], 'Un sistema que mueve masas y puede atrapar a alguien necesita un modo seguro de parar o abrirse de nuevo. La seguridad forma parte del diseño, no es un añadido.', 'a1');
F('termostato', 'Un termostato apaga la calefacción cuando la habitación llega a la temperatura elegida. ¿Qué tiene?', 'Un sensor de temperatura y realimentación: es un sistema de lazo cerrado', ['Solo un actuador', 'Un sensor sin ningún actuador', 'Un sistema de lazo abierto'], 'Mide la temperatura y la compara con la deseada para encender o apagar. Esa medida que vuelve al sistema es la realimentación.', 'a1');

// ---- Lección 2 · Ascensores y puertas ----
T('contrapeso', 'Contrapeso', 'Masa colocada al otro lado de un sistema para equilibrar parte del peso de la carga y reducir el esfuerzo del motor.', 'a2', 'Como el otro niño del balancín.', 'Masa que equilibra');
F('asc_contrapeso', '¿Para qué lleva contrapeso un ascensor?', 'Para equilibrar parte del peso de la cabina y que el motor haga menos fuerza', ['Para que la cabina pese más', 'Para evitar usar cables', 'Para que suba sin motor'], 'Cabina y contrapeso cuelgan de la misma cuerda, como en una polea. El motor solo tiene que compensar la diferencia, no todo el peso de la cabina.', 'a2');
C('asc_diff', 'Un ascensor tiene una cabina cargada de 900 kg y un contrapeso de 1100 kg. ¿Qué diferencia de masa debe compensar el motor?', '200 kg', ['2000 kg', '1000 kg', '100 kg'], 'El motor solo compensa la diferencia entre los dos lados: 1100 − 900 = 200 kg.', 'a2', () => {
  let c, p; do { c = pick([700, 800, 900, 1000, 1200]); p = pick([800, 1000, 1100, 1300]); } while (c === p);
  const d = Math.abs(c - p), a = d + ' kg';
  return { q: `Un ascensor tiene una cabina cargada de ${c} kg y un contrapeso de ${p} kg. ¿Qué diferencia de masa debe compensar el motor?`, a, wrong: uniq([(c + p) + ' kg', Math.min(c, p) + ' kg', Math.max(c, p) + ' kg', (d / 2) + ' kg'], a).slice(0, 3), explain: `El motor solo compensa la diferencia entre los dos lados: ${Math.max(c, p)} − ${Math.min(c, p)} = ${d} kg.` };
});
F('asc_freno', '¿Qué lleva un ascensor para el caso de que se rompa el cable?', 'Un freno de seguridad que actúa por sí mismo y lo sujeta a las guías', ['Nada: los cables nunca fallan', 'Un contrapeso más pesado', 'Un motor de repuesto'], 'El freno de seguridad se activa mecánicamente cuando la cabina empieza a caer demasiado deprisa o se pierde la tensión del cable. Fue una de las ideas clave para que la gente se fiara de los ascensores.', 'a2');
O('puerta_secuencia', 'Ordena el funcionamiento de una puerta automática', ['El sensor detecta a una persona que se acerca', 'El motor abre la puerta', 'La puerta espera mientras haya alguien en la zona', 'Si no hay nadie ni obstáculo, el motor la cierra'], 'Detectar, abrir, esperar y cerrar solo cuando es seguro. Los sensores deciden en cada momento qué debe hacer el actuador.', 'a2');
X('asc_atasco', 'La puerta que se abre y se cierra', [
  'La puerta de un ascensor se cierra, se vuelve a abrir, y repite esto sin parar.',
  'Parece que algo roza el borde de la puerta.'], [
  ['¿Qué comprobarías primero?', ['Si algo bloquea el borde o el sensor de obstáculo (suciedad, un objeto, un tope)', 'Si el ascensor pesa mucho', 'Si la pared es de color claro'], 0, 'El sensor de obstáculo detecta algo y manda abrir de nuevo. Lo primero es ver si hay algo físicamente en el camino o el sensor está sucio.'],
  ['¿Y si no encuentras la causa?', ['Avisas a quien se ocupa del mantenimiento y no fuerzas la puerta', 'Fuerzas la puerta con las manos', 'Tapas el sensor con cinta'], 0, 'Anular o forzar un sistema de seguridad puede atrapar a alguien. Avisar a la persona responsable es lo correcto.']], 'a2');

// ---- Lección 3 · Idea tu automatismo ----
F('mec_primero', '¿Por qué conviene probar primero una solución mecánica sencilla antes de añadir más piezas?', 'Porque es más simple, tiene menos cosas que fallar y te ayuda a entender el problema', ['Porque la mecánica nunca falla', 'Porque así no hace falta probar nada', 'Porque lo complicado es siempre peor'], 'Si una palanca, una polea o un engranaje resuelve el problema, no hace falta más. Cada pieza extra es otro sitio por donde puede fallar.', 'a3');
O('auto_idear', 'Ordena el camino de un problema cotidiano a un automatismo', ['Elige una tarea repetitiva que te moleste', 'Piensa qué debe detectar y qué debe mover', 'Dibuja un esquema con sensor, actuador y mecanismo', 'Construye una versión de cartón o piezas y pruébala', 'Mide qué falla y mejora una cosa cada vez'], 'Es el ciclo del inventor aplicado a una máquina: problema, esquema, prototipo, prueba y mejora.', 'a3');
F('auto_limite', 'Un automatismo con partes que pueden pellizcar o golpear (puerta, cortina, brazo). ¿Qué necesita sí o sí?', 'Una forma segura de pararlo: limitar su fuerza y poder desconectarlo rápido', ['Que sea lo más potente posible', 'Que no se pueda desconectar', 'Que funcione sin supervisión desde el primer día'], 'Cuanto más fuerza tiene una máquina, más daño puede hacer. Limitar la fuerza, poner finales de carrera y poder cortar la corriente rápido son parte del diseño.', 'a3');
X('cortina', 'La cortina que sube sola', [
  'Quieres que una cortina ligera suba y baje sola con un motor pequeño.',
  'Tienes un motor de pilas, una polea y un hilo resistente.'], [
  ['¿Qué mecanismo encaja mejor para mover la cortina?', ['Un motor con reducción que enrolle el hilo en una polea o eje', 'Un trinquete sin motor', 'Una leva que se mueva a mano'], 0, 'El motor da el giro, la reducción da fuerza y la polea convierte el giro en recorrido del hilo, lo que ya conoces.'],
  ['¿Qué evita que el motor siga tirando cuando la cortina llega arriba?', ['Un final de carrera que corte la corriente', 'Un tope más fuerte', 'Un hilo más largo'], 0, 'Un final de carrera avisa de que se ha llegado al extremo. Sin él, el motor se bloquea, consume mucho y se calienta.']], 'a3');

addUnits([
  { id: 'u_auto', title: 'Automatización de lo cotidiano', sub: 'Sensores, actuadores, ascensores y puertas', lessons: [
    { id: 'l_sens', title: 'Sensores y actuadores', sub: 'Los sentidos y los músculos', icon: '👁️', items: ['t_sensor', 't_actuador', 't_final_carrera', 't_realimentacion', 'f_lazo', 'f_puerta_seguridad', 'f_termostato'],
      note: { title: 'Detectar, decidir y mover', body: 'Casi toda máquina automática combina tres cosas:\n\n• un **sensor** que detecta\n• un **actuador** que mueve\n• un mecanismo en medio\n\nSi el sistema **mide el resultado** y se corrige, es de **lazo cerrado** (realimentación). Si no, es de **lazo abierto**.' } },
    { id: 'l_ascensor', title: 'Ascensores y puertas', sub: 'Contrapeso, freno y secuencia', icon: '🛗', items: ['t_contrapeso', 'f_asc_contrapeso', 'c_asc_diff', 'f_asc_freno', 'o_puerta_secuencia', 'x_asc_atasco'],
      note: { title: 'Una polea gigante', body: 'Un ascensor es una **polea**: la cabina cuelga de un lado y un **contrapeso** del otro. El motor solo compensa la **diferencia**.\n\nLa puerta automática sigue una **secuencia** (detectar, abrir, esperar, cerrar) con **sensores de seguridad** que impiden que atrape a nadie.' } },
    { id: 'l_idear', title: 'Idea tu automatismo', sub: 'De un problema a una máquina', icon: '💡', items: ['f_mec_primero', 'o_auto_idear', 'f_auto_limite', 'x_cortina'],
      note: { title: 'Lo más simple que funcione', body: 'Empieza por una **tarea repetitiva** que te moleste. Busca primero la solución **mecánica más simple**, añade un **sensor** y un **actuador** solo si hace falta y piensa siempre en **cómo parar** la máquina de forma segura.' } }
  ]},
  { id: 'u_proy', title: 'Proyecto: tu brazo de 2-3 GDL', sub: 'Requisitos, cálculos y montaje paso a paso', lessons: [
    { id: 'l_proy_req', title: 'Qué debe hacer tu brazo', sub: 'Requisitos con números', icon: '🎯', items: ['t_requisito', 'f_proy_empezar', 'c_proy_l2', 'f_proy_gdl', 'f_proy_carga', 'x_proy_req'],
      note: { title: 'Antes de montar: pregúntate qué quieres', body: 'Un buen proyecto empieza con **requisitos concretos**: ¿qué alcance (en cm)? ¿qué carga (en gramos)? ¿cuántos **GDL**?\n\nPara un primer brazo, **2 GDL** y una carga **ligera** son un reto realista. Más adelante, añades un tercero.' } },
    { id: 'l_proy_calc', title: 'Calcula tu brazo', sub: 'Par, margen y motores', icon: '🧮', items: ['c_proy_par', 'c_proy_margen', 'f_proy_hombro', 'f_proy_motor_base', 'f_proy_no_llega'],
      note: { title: 'Los números del hombro', body: 'El par en el **hombro** es **fuerza × distancia** de la carga **más** el peso propio del brazo (en su punto medio). Elige un motor con **margen** (por ejemplo, el doble del par que necesitas).\n\nSi no llega: **acorta**, **aligera**, pon un **contrapeso** o añade **reducción**.' } },
    { id: 'l_proy_build', title: 'Construye y prueba', sub: 'Paso a paso, con seguridad', icon: '🛠️', items: ['o_proy_pruebas', 'x_proy_fallo', 'f_proy_documenta', 'f_proy_seguridad'],
      note: { title: 'Poco a poco', body: 'Monta **por partes** y prueba cada una antes de añadir la siguiente. Primero **a mano**, luego con motor **sin carga**, y la **carga** sube poco a poco.\n\nAnota **qué cambias y qué pasa**: así aprendes de cada fallo.' } }
  ]}
], {
  l_sens: { title: 'Sabías que… las puertas automáticas de la Antigüedad', body: 'A **Herón de Alejandría**, ingeniero del siglo I, se le atribuye el diseño de **puertas de templo que se abrían solas** al encender el fuego del altar: el calor expandía el aire y desplazaba agua, que tiraba de unos contrapesos.\n\nSin electricidad, solo con **mecánica y física**.' },
  l_ascensor: { title: 'Sabías que… el freno de Otis', body: 'En 1854, Elisha Otis demostró en Nueva York un **ascensor con freno de seguridad**: se subió a una plataforma y ordenó cortar el cable delante del público. El freno la sujetó.\n\nEse tipo de frenos fue clave para que la gente se fiara de los ascensores.' },
  l_idear: { title: 'Sabías que… las máquinas de Rube Goldberg', body: 'El dibujante **Rube Goldberg** se hizo famoso por sus dibujos de máquinas absurdamente complicadas que hacían tareas muy simples.\n\nEs lo contrario de un buen diseño: tú busca **la solución más sencilla que funcione**.' },
  l_proy_build: { title: 'Sabías que… el túnel de viento casero', body: 'Los **hermanos Wright** construyeron en 1901 un pequeño túnel de viento para probar formas de alas antes de construir el avión.\n\nProbar **a pequeña escala y barato** antes de lo grande es una idea que sigue funcionando.' }
}, {
  u_auto: { id: 'm_auto', icon: '🚪', title: 'Descubre cómo funciona una puerta automática',
    why: 'Una puerta automática reúne **sensor, actuador y mecanismo** en algo que usas cada día. Observarla con ojos de inventor te enseña cómo se resuelven en la vida real los problemas que ya conoces.',
    think: '¿Qué detecta que te acercas? ¿Qué mueve la puerta? ¿Qué pasa si te quedas parado en medio? ¿Cómo evita que te pille?',
    safety: 'Observa desde un lado, sin bloquear la puerta ni ponerte donde pueda atraparte, y sin tocar nada. No fuerces nunca una puerta automática.',
    versions: {
      observar: { label: 'Observando una', intro: 'Una puerta automática real (supermercado, centro comercial, estación) y un cuaderno.', steps: [
        'Colócate a un lado, sin molestar, y mira cómo se abre al acercarse alguien.',
        'Localiza dónde está el sensor (suele estar encima) y apunta qué crees que detecta.',
        'Observa cuánto tarda en abrirse y en cerrarse y si lo hace a velocidad constante.',
        'Fíjate en qué pasa si alguien se queda parado en el hueco: ¿se cierra?',
        'Busca el carril o el mecanismo en lo alto: ¿ves una correa, una cadena, un motor?',
        'Dibuja un esquema con sensor, actuador y mecanismo y anota las preguntas que te surjan.'] },
      papel: { label: 'En papel', intro: 'Sin salir de casa: lápiz y papel.', steps: [
        'Dibuja una puerta corredera con un motor y una correa que la mueve.',
        'Añade un sensor que detecte a quien llega y otro que detecte obstáculos.',
        'Dibuja los finales de carrera de apertura y cierre.',
        'Escribe la secuencia de funcionamiento paso a paso.',
        'Marca dos situaciones peligrosas y cómo las evitaría tu diseño.'] } } },
  u_proy: { id: 'm_proy', icon: '🏁', title: 'Tu brazo de 2 GDL, de la idea a la prueba',
    why: 'Es la misión final: reúne **mecanismos, estructuras, motores y cálculos** en un solo proyecto. No hace falta que quede perfecto: lo importante es **diseñar, calcular, probar y mejorar**.',
    think: 'Cuando algo falle, no lo escondas: apúntalo. Cada fallo (par, rigidez, juego, peso) te dice qué parte de la teoría te falta aplicar.',
    safety: 'Corta y taladra con protecciones y sobre una base protegida. Usa solo pilas AA o AAA, desconecta en cuanto algo se bloquee o se caliente, no pongas los dedos en las articulaciones al probar y deja holgura a los cables.',
    versions: {
      diseno: { label: 'Diseño en papel', intro: 'Papel, lápiz, regla y calculadora (o el móvil).', steps: [
        'Escribe los requisitos: alcance en cm, carga máxima en gramos y número de GDL.',
        'Dibuja un esquema con los eslabones, las articulaciones y la pinza.',
        'Calcula el alcance máximo y mínimo con tus longitudes.',
        'Calcula el par necesario en el hombro, contando la carga y el peso del brazo.',
        'Elige un motor o servo con margen y anota qué reducción necesitarías.',
        'Marca los puntos que reforzarías con diagonales o dos pines.'] },
      montaje: { label: 'Montaje', intro: 'Con piezas Technic o cartón, y un motor o servo si ya lo tienes.', steps: [
        'Monta la base y comprueba que no se mueve al empujarla.',
        'Añade el primer eslabón y gíralo a mano; comprueba que no tiene juego excesivo.',
        'Añade el segundo eslabón y refuerza lo que se tumbe con diagonales.',
        'Si tienes motor, pruébalo primero sin carga y solo después con una pieza muy ligera.',
        'Mide el alcance real y compara con tu cálculo.',
        'Anota qué ha fallado, qué has cambiado y qué has aprendido.'] } } }
});

// ---- Lección 1 del proyecto: requisitos ----
// (se definen después de addUnits para mantener el orden de lectura; los constructores solo registran los items)
T('requisito', 'Requisito', 'Cosa concreta que debe cumplir un diseño, expresada con números cuando se puede (por ejemplo, alcanzar 20 cm y levantar 100 g).', 'p1', 'Sin requisitos, no sabes cuándo has terminado.', 'Lo que debe cumplir');
F('proy_empezar', '¿Por dónde empiezas el proyecto de tu brazo?', 'Escribiendo qué debe hacer: alcance, carga y número de grados de libertad', ['Comprando los motores más potentes', 'Montando sin plan y mirando qué sale', 'Imprimiendo piezas al azar'], 'Los requisitos guían todas las decisiones: el tamaño, los motores y la estructura. Sin ellos, es fácil comprar o construir lo que no hace falta.', 'p1');
C('proy_l2', 'Quieres que tu brazo tenga un alcance máximo de 24 cm y el primer eslabón mide 14 cm. ¿Cuánto debe medir el segundo?', '10 cm', ['38 cm', '7 cm', '34 cm'], 'Alcance máximo = L1 + L2, así que L2 = 24 − 14 = 10 cm.', 'p1', () => {
  const t = pick([20, 24, 25, 30]), l1 = pick([10, 12, 14, 15]), l2 = t - l1, a = l2 + ' cm';
  return { q: `Quieres que tu brazo tenga un alcance máximo de ${t} cm y el primer eslabón mide ${l1} cm. ¿Cuánto debe medir el segundo?`, a, wrong: uniq([(t + l1) + ' cm', fmt(l2 / 2) + ' cm', (t + l2) + ' cm', (l1 - l2) + ' cm'], a).slice(0, 3), explain: `Alcance máximo = L1 + L2, así que L2 = ${t} − ${l1} = ${l2} cm.`, fig: arm2SVG() };
}, arm2SVG());
F('proy_gdl', 'Para tu primer brazo, ¿cuántos grados de libertad es razonable pedir?', 'Dos, y añadir un tercero cuando el primero funcione bien', ['Seis a la vez, para hacerlo todo', 'Ninguno', 'Todos los que se te ocurran'], 'Cada grado de libertad añade un motor, más par, más peso, más juego y más cableado. Es más fácil acertar con pocos y ampliar después.', 'p1');
F('proy_carga', '¿Qué carga es razonable pedir a un primer brazo de piezas y motores pequeños?', 'Una pieza ligera (decenas de gramos) y, si va bien, subir poco a poco', ['Un objeto de varios kilos', 'La mayor carga posible desde el principio', 'Ninguna, porque nunca funciona'], 'Cuanto más pesa la carga, más par necesitan los motores y más se dobla la estructura. Con carga ligera, aprendes sin quemar motores.', 'p1');
X('proy_req', 'La lista de requisitos', [
  'Quieres un brazo que levante un tapón de botella de un lado de la mesa y lo deje en otro.',
  'Tu mesa es pequeña y solo tienes servos de poco par.'], [
  ['¿Qué requisitos son más útiles?', ['Alcance en cm, carga máxima en gramos y número de GDL', 'Que sea muy bonito', 'Que sea lo más grande posible'], 0, 'Son medibles y orientan los cálculos de par y de longitud. «Bonito» y «grande» no ayudan a decidir nada.'],
  ['Con servos de poco par, ¿qué te conviene?', ['Brazo corto y ligero, y carga pequeña', 'Brazo muy largo y pesado', 'Añadir un motor más grande en la punta'], 0, 'Menos longitud y menos masa lejos de la base significan menos par necesario. Es lo que has visto en voladizos y en cargas del brazo.']], 'p1');

// ---- Lección 2 del proyecto: cálculos ----
C('proy_par', 'Un brazo horizontal de 0,2 m lleva una pieza de 3 N en la punta y su peso propio es de 2 N (actúa en su punto medio). ¿Qué par debe dar el motor del hombro?', '0,8 N·m', ['0,6 N·m', '1 N·m', '0,4 N·m'], 'Par = 3 N × 0,2 m (la pieza) + 2 N × 0,1 m (el brazo, en su punto medio) = 0,6 + 0,2 = 0,8 N·m.', 'p2', () => {
  const l = pick([0.1, 0.2, 0.3, 0.4]), f = pick([1, 2, 3, 4]), w = pick([1, 2, 3, 4]), p = f * l + w * l / 2, a = fmt(p, 2) + ' N·m';
  return { q: `Un brazo horizontal de ${fmt(l)} m lleva una pieza de ${f} N en la punta y su peso propio es de ${w} N (actúa en su punto medio). ¿Qué par debe dar el motor del hombro?`, a, wrong: uniq([f * l, (f + w) * l, (f + w) * l / 2, w * l / 2].map(x => fmt(x, 2) + ' N·m'), a).slice(0, 3), explain: `Par = ${f} N × ${fmt(l)} m (la pieza) + ${w} N × ${fmt(l / 2, 2)} m (el brazo, en su punto medio) = ${fmt(f * l, 2)} + ${fmt(w * l / 2, 2)} = ${fmt(p, 2)} N·m.` };
});
C('proy_margen', 'El par necesario en el hombro es de 0,8 N·m y quieres un motor con un margen de 2 veces. ¿Qué par mínimo debe dar el motor?', '1,6 N·m', ['0,4 N·m', '0,8 N·m', '2,8 N·m'], 'Par con margen = par necesario × margen = 0,8 × 2 = 1,6 N·m.', 'p2', () => {
  const p = pick([0.2, 0.4, 0.8, 1.2]), m = pick([1.5, 2, 3]), r = p * m, a = fmt(r, 2) + ' N·m';
  return { q: `El par necesario en el hombro es de ${fmt(p)} N·m y quieres un motor con un margen de ${fmt(m)} veces. ¿Qué par mínimo debe dar el motor?`, a, wrong: uniq([fmt(p / m, 2), fmt(p, 2), fmt(p + m, 2), fmt(r * 2, 2)].map(x => x + ' N·m'), a).slice(0, 3), explain: `Par con margen = par necesario × margen = ${fmt(p)} × ${fmt(m)} = ${fmt(r, 2)} N·m.` };
});
F('proy_hombro', '¿Qué articulación de un brazo suele necesitar el motor más fuerte?', 'La del hombro (la más cercana a la base), porque soporta todo lo que hay después', ['La de la muñeca', 'La de la pinza', 'Todas necesitan lo mismo'], 'El hombro carga con los eslabones, motores y carga que cuelgan más allá, a mucha distancia. La muñeca solo carga con la pinza y la pieza.', 'p2');
F('proy_motor_base', 'Un motor colocado justo sobre el eje del hombro, ¿cuánto par añade a ese mismo hombro por su peso?', 'Casi nada: está casi a cero de distancia del eje (par = peso × distancia)', ['Mucho: pesa lo mismo y eso es lo único que importa', 'Todo su peso multiplicado por la longitud del brazo', 'Nada, nunca'], 'El par depende de la distancia al eje, y sobre el eje es casi cero. Por eso se colocan los motores pesados cerca de la base.', 'p2');
F('proy_no_llega', 'Tu servo no llega a levantar el brazo con la carga. ¿Cuál de estas es la mejor primera medida?', 'Acortar o aligerar el brazo, o añadir un contrapeso o reducción', ['Añadir más peso en la punta', 'Alargar el brazo', 'Quitar la reducción'], 'Todas las opciones razonables bajan el par necesario o suben el par disponible: menos longitud, menos masa, equilibrio o más reducción.', 'p2');

// ---- Lección 3 del proyecto: construir y probar ----
O('proy_pruebas', 'Ordena el proceso de prueba de tu brazo', ['Monta la base y comprueba que no se mueve al empujarla', 'Monta el primer eslabón y gíralo a mano', 'Añade el segundo eslabón y comprueba el recorrido', 'Conecta el motor y pruébalo sin carga', 'Añade la pinza y la carga poco a poco', 'Anota resultados y mejora una cosa cada vez'], 'Se prueba cada parte antes de sumar la siguiente: así, cuando algo falla, sabes dónde está el problema. La carga se aumenta gradualmente y se aprende de cada resultado.', 'p3');
X('proy_fallo', 'El brazo que llega pero no coge', [
  'Tu brazo llega perfectamente al tapón, pero la pinza lo suelta al levantarlo.',
  'La pinza tiene dedos de plástico liso y un servo pequeño.'], [
  ['¿Qué ayudaría más?', ['Goma en los dedos para aumentar el rozamiento', 'Alargar el brazo', 'Pintar los dedos'], 0, 'La pinza sujeta por rozamiento: más μ (goma) y más fuerza de agarre ayudan.'],
  ['¿Qué haces antes de cambiar nada más?', ['Anotar qué has cambiado y qué ha ocurrido', 'Cambiar todo a la vez', 'Quitar la pinza'], 0, 'Cambiar una cosa cada vez y anotarla te dice qué funcionó. Si cambias todo, no sabrás qué ha resuelto el problema.']], 'p3');
F('proy_documenta', '¿Qué conviene anotar durante las pruebas de tu brazo?', 'Qué has cambiado, qué has medido y qué ha pasado', ['Solo lo que sale bien', 'Nada: te acordarás de todo', 'Solo la hora a la que empezaste'], 'Anotar cambios, medidas y resultados te permite aprender de lo que falla y repetir lo que funciona, y es la base del método de inventor.', 'p3');
F('proy_seguridad', 'Antes de la primera prueba con motor, ¿qué compruebas?', 'Que los cables no se pillan, que nada se engancha, que tienes tus manos lejos y cómo desconectar rápido', ['Que el motor sea lo más potente posible', 'Nada: se prueba y ya', 'Que haya mucha gente alrededor'], 'Un brazo puede pellizcar al arrancar o bloquearse y calentar el motor. Comprobarlo antes lleva un minuto y evita sustos.', 'p3');
