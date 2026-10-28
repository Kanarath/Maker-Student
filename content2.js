// =====================================================================
// UNIDADES «SEGURIDAD, HERRAMIENTAS Y MÉTODO» y «MOTORES Y ENERGÍA»
// Se carga después de content.js (usa sus constructores, figuras y addUnits).
// =====================================================================

// Circuito sencillo: pila + motor
function circuitoSVG() {
  return SV.wrap('0 0 320 150',
    `<path d="M50 40V58M50 72V110H250V97M250 53V40H50" fill="none" ${SV.ink}/>` +
    `<path d="M36 58H64" ${SV.key} fill="none"/><path d="M43 72H57" ${SV.key} fill="none" style="stroke-width:5"/>` +
    `<circle cx="250" cy="75" r="22" ${SV.fill} ${SV.ink}/>` + SV.txt(250, 81, 'M', 18, 'middle', 700) +
    `<path d="M126 40H172M164 34L172 40L164 46" fill="none" ${SV.key} style="stroke-width:3"/>` + SV.txt(150, 26, 'corriente (A)', 12) +
    SV.txt(70, 62, '+', 14, 'start', 700) + SV.txt(70, 80, '−', 14, 'start', 700) +
    SV.txt(50, 134, 'pila: tensión (V)', 12, 'middle') + SV.txt(250, 134, 'motor', 12, 'middle'), 'Circuito con una pila y un motor: la pila da la tensión y por los cables circula la corriente');
}

// ---------------------------------------------------------------------
// UNIDAD · SEGURIDAD, HERRAMIENTAS Y MÉTODO
// ---------------------------------------------------------------------
// ---- Lección 1 · Tu banco de trabajo ----
T('epi', 'EPI (equipo de protección)', 'Gafas, guantes u otras protecciones personales que reducen el riesgo al trabajar.', 's1', 'Se pone ANTES de empezar, no después del susto.', 'Protección personal');
F('seg_ojos', '¿Cuándo debes ponerte gafas de protección?', 'Siempre que cortes, lijes, taladres o pueda saltar algo (piezas, gomas, chispas)', ['Solo si trabajas con electricidad', 'Solo cuando el trabajo dura más de una hora', 'Nunca hacen falta con piezas pequeñas'], 'Una pieza que sale disparada o una goma que se suelta pueden dar en los ojos en un instante. Ponerse las gafas lleva dos segundos; un daño en un ojo puede ser para siempre.', 's1');
F('seg_pelo', 'Vas a probar un mecanismo con partes que giran. ¿Qué haces con el pelo largo, las mangas sueltas y las pulseras?', 'Los recoges o te los quitas antes de empezar', ['Los dejas, si vas con cuidado', 'Solo te quitas la pulsera', 'Da igual si el motor es pequeño'], 'Los engranajes y los ejes en giro pueden enganchar pelo, ropa y joyas aunque el motor sea pequeño. Recogerlos antes es mucho más fácil que soltarlos cuando ya han tirado de ti.', 's1');
F('seg_orden', '¿Por qué conviene trabajar con las piezas sobre una bandeja o un trapo?', 'Para que las piezas pequeñas no rueden ni se pierdan, y para proteger la mesa', ['Para que pesen menos', 'Para que los pines encajen solos', 'Solo es una cuestión de estética'], 'Una bandeja reúne las piezas, evita que caigan al suelo (donde alguien puede pisarlas) y protege la superficie. Menos tiempo buscando, más tiempo inventando.', 's1');
O('seg_corte', 'Ordena los pasos para cortar cartón con un cúter', ['Coloca una tabla de corte debajo y sujeta el cartón', 'Marca la línea con lápiz y apoya una regla firme', 'Corta con varias pasadas suaves, con la mano libre lejos de la línea', 'Retrae la cuchilla y guarda el cúter'], 'Primero la base y la sujeción, luego la guía, después el corte en varias pasadas (forzar de una sola es lo que lo hace resbalar) y, al terminar, cuchilla dentro.', 's1');
X('seg_banco', 'La mesa desordenada', [
  'Vas a probar un mecanismo con manivela. En la mesa hay herramientas, el móvil, un vaso y piezas sueltas por todas partes.',
  'Llevas el pelo suelto y una pulsera. La luz es floja.'], [
  ['¿Qué haces ANTES de empezar a girar la manivela?', ['Recoger el pelo, quitar la pulsera y despejar la mesa', 'Empezar y recoger si ocurre algo', 'Poner el vaso más cerca para beber sin moverte'], 0, 'Se prepara el puesto primero: pelo recogido, sin pulseras, mesa despejada y buena luz. Después se prueba.'],
  ['¿Por qué importa la luz?', ['Porque con poca luz se calculan mal los dientes y se cometen más errores de manos', 'Porque los pines brillan', 'No importa'], 0, 'Con luz suficiente ves bien los dientes, los pines y los bordes, y fallas menos. Es parte de la seguridad.']], 's1');

// ---- Lección 2 · Herramientas básicas ----
T('calibre', 'Calibre (pie de rey)', 'Herramienta para medir longitudes, diámetros y profundidades con una precisión de décimas de milímetro.', 's2', 'Mide el grosor de un eje o de una pared de tu pieza.', 'Mide con precisión');
F('herr_medir', '¿Qué herramienta usas para saber si un eje mide 5,0 mm o 5,3 mm?', 'Un calibre (pie de rey)', ['Una regla escolar', 'Una cinta métrica de costura', 'Mirar el eje de cerca'], 'Una regla suele distinguir milímetros enteros; un calibre llega a décimas. Para que dos piezas encajen, esas décimas importan.', 's2');
F('herr_destor', 'Un tornillo se está «pelando» porque el destornillador no encaja bien. ¿Qué haces?', 'Paras y pruebas con la punta del tamaño y la forma correctos, empujando recto', ['Aprietas más fuerte', 'Lo golpeas con un martillo', 'Usas unos alicates a lo bruto'], 'Una punta que no encaja se resbala y destroza la cabeza. Con la punta correcta y empujando recto se necesita menos fuerza y se evitan resbalones que pueden clavarse en la mano.', 's2');
F('herr_cuter', '¿Qué es más seguro: un cúter con cuchilla nueva y afilada o uno con la cuchilla roma?', 'El afilado, si se usa bien: corta con menos fuerza y resbala menos', ['El romo, porque corta menos', 'Es igual', 'Ninguno es seguro nunca'], 'Con una cuchilla roma hay que apretar más y es más fácil que patine y se vaya a la mano. Una cuchilla afilada, bien guiada y con la mano libre lejos, controla mejor.', 's2');
F('herr_pegamento', '¿Qué precaución tomas con un pegamento instantáneo (cianoacrilato)?', 'Gafas, poco producto, buena ventilación y cuidado con los dedos y la piel', ['Ninguna: es un pegamento escolar', 'Usarlo en un sitio cerrado para que seque antes', 'Echar mucho para asegurar'], 'Pega la piel y los párpados en segundos, y los vapores irritan. Una gota es suficiente; ten a mano papel y no te toques la cara.', 's2');

// ---- Lección 3 · Método de inventor ----
T('prototipo', 'Prototipo', 'Primer modelo de algo, hecho rápido y barato, para probar una idea antes de construir la versión buena.', 's3', 'Si falla, se rompe un cartón, no un mes de trabajo.', 'Primer modelo de prueba');
T('iteracion', 'Iteración', 'Repetir el ciclo de probar, ver qué falla y mejorar, acercándote al resultado paso a paso.', 's3', 'Casi ningún invento sale bien a la primera.', 'Mejorar paso a paso');
O('seg_metodo', 'Ordena el ciclo del inventor', ['Identifica el problema que quieres resolver', 'Dibuja y piensa varias soluciones posibles', 'Construye un prototipo rápido y sencillo', 'Pruébalo y mide qué falla', 'Mejora una cosa y vuelve a probar'], 'Se parte de un problema claro, se imagina más de una solución, se construye barato, se mide, y se mejora de uno en uno. Luego vuelves a empezar el ciclo.', 's3');
F('prototipo_barato', '¿Por qué conviene hacer el primer prototipo en cartón o con piezas sobrantes?', 'Porque permite comprobar la idea rápido y sin miedo a estropear nada', ['Porque el cartón es más resistente', 'Porque así no hace falta probarlo', 'Porque los prototipos buenos siempre son de cartón'], 'Si falla, solo cuesta unos minutos y un poco de cartón. Y cada fallo te enseña algo que podrás corregir antes de gastar tiempo y dinero en la versión buena.', 's3');
F('un_cambio', 'Tu prototipo falla y tienes tres ideas para arreglarlo. ¿Cómo las pruebas?', 'De una en una, cambiando solo una cosa cada vez', ['Las tres a la vez, para ir más rápido', 'Ninguna: empiezas de cero', 'Cambias todo lo que se te ocurra'], 'Si cambias varias cosas a la vez y mejora, no sabes cuál ayudó (o si alguna empeoró). Cambiar una sola cosa te dice qué funciona de verdad.', 's3');
C('escala', 'Un dibujo está a escala 1:2 (el dibujo es más pequeño que la pieza real). Una pieza dibujada mide 30 mm. ¿Cuánto mide la pieza real?', '60 mm', ['15 mm', '32 mm', '90 mm'], 'Escala 1:2 significa que 1 en el dibujo son 2 en la realidad: 30 × 2 = 60 mm.', 's3', () => {
  const r = pick([2, 4, 5, 10]), d = pick([10, 15, 20, 30]), real = d * r, a = real + ' mm';
  return { q: `Un dibujo está a escala 1:${r} (el dibujo es más pequeño que la pieza real). Una pieza dibujada mide ${d} mm. ¿Cuánto mide la pieza real?`, a, wrong: uniq([fmt(d / r) + ' mm', (d + r) + ' mm', (real * 2) + ' mm', (d * (r + 1)) + ' mm'], a).slice(0, 3), explain: `Escala 1:${r} significa que 1 en el dibujo son ${r} en la realidad: ${d} × ${r} = ${real} mm.` };
});

// ---------------------------------------------------------------------
// UNIDAD · MOTORES Y ENERGÍA
// ---------------------------------------------------------------------
// ---- Lección 1 · Electricidad sin miedo ----
T('tension', 'Tensión (voltios, V)', 'El «empuje» que da una pila o fuente para que circule la corriente. Se mide en voltios (V).', 'mo1', 'Como la presión del agua en una tubería.', 'Empuje eléctrico (V)');
T('corriente', 'Corriente (amperios, A)', 'Cantidad de electricidad que circula por un cable cada segundo. Se mide en amperios (A).', 'mo1', 'Como el caudal del agua en la tubería.', 'Flujo de electricidad (A)');
T('cortocircuito', 'Cortocircuito', 'Unión directa entre los dos polos de una pila sin nada en medio que limite la corriente: circula muchísima y todo se calienta.', 'mo1', 'Un atajo peligroso para la corriente.', 'Atajo con mucha corriente');
C('pot_elec', 'Un motor funciona a 6 V y consume 0,5 A. ¿Qué potencia eléctrica usa? (potencia = tensión × corriente)', '3 W', ['6,5 W', '12 W', '30 W'], 'Potencia = tensión × corriente = 6 V × 0,5 A = 3 W.', 'mo1', () => {
  const v = pick([3, 6, 9, 12]), i = pick([0.2, 0.5, 1, 2]), p = v * i, a = fmt(p) + ' W';
  return { q: `Un motor funciona a ${v} V y consume ${fmt(i)} A. ¿Qué potencia eléctrica usa? (potencia = tensión × corriente)`, a, wrong: uniq([fmt(v + i), fmt(v / i), fmt(p * 10), fmt(p / 2), fmt(p * 2)].map(x => x + ' W'), a).slice(0, 3), explain: `Potencia = tensión × corriente = ${v} V × ${fmt(i)} A = ${fmt(p)} W.`, fig: circuitoSVG() };
}, circuitoSVG());
C('pilas', 'Conectas 4 pilas de 1,5 V en serie (una detrás de otra). ¿Qué tensión total dan?', '6 V', ['1,5 V', '5,5 V', '2,7 V'], 'En serie las tensiones se suman: 4 × 1,5 V = 6 V.', 'mo1', () => {
  const n = pick([2, 3, 4, 6]), t = n * 1.5, a = fmt(t) + ' V';
  return { q: `Conectas ${n} pilas de 1,5 V en serie (una detrás de otra). ¿Qué tensión total dan?`, a, wrong: uniq([fmt(1.5) + ' V', fmt(n + 1.5) + ' V', fmt(n / 1.5) + ' V', fmt(n * 3) + ' V'], a).slice(0, 3), explain: `En serie las tensiones se suman: ${n} × 1,5 V = ${fmt(t)} V.` };
});
F('analogia', 'Con la analogía del agua en una tubería, ¿a qué se parece la tensión y a qué la corriente?', 'La tensión es como la presión y la corriente como el caudal', ['La tensión es el caudal y la corriente la presión', 'Las dos son como el tamaño de la tubería', 'No se parecen a nada'], 'Más presión empuja más agua por la tubería; más tensión empuja más corriente por el cable. La analogía no es perfecta, pero ayuda a no confundirlas.', 'mo1', circuitoSVG());
F('corto', 'Un clip metálico toca a la vez los dos polos de una pila. ¿Qué puede pasar?', 'Se produce un cortocircuito: circula mucha corriente y el clip y la pila pueden calentarse', ['Nada, el clip no conduce', 'La pila se carga', 'El clip se vuelve imán'], 'Sin nada que limite la corriente, la pila entrega todo lo que puede y se calienta. Por eso las pilas no se llevan sueltas junto a llaves o monedas.', 'mo1');
F('tension_baja', '¿Por qué conviene empezar con pilas de poca tensión (por ejemplo, 3 a 9 V) en tus montajes?', 'Porque con poca tensión el riesgo de una descarga es mucho menor y los fallos son menos graves', ['Porque las pilas pequeñas duran para siempre', 'Porque los motores solo funcionan a esa tensión', 'No hay ninguna razón'], 'Aun así, una pila o batería puede calentarse si se cortocircuita: poca tensión no significa riesgo cero. Pero es mucho más seguro que la corriente de un enchufe, que nunca debes tocar para esto.', 'mo1');

// ---- Lección 2 · Tipos de motor ----
T('motor_cc', 'Motor de corriente continua (CC)', 'Motor que gira cuando le das tensión; el sentido de giro depende de cómo conectes los dos cables.', 'mo2', 'Cambia los cables de sitio y gira al revés.', 'Gira al darle tensión');
T('servo', 'Servomotor', 'Motor con un control interno que lo coloca en un ángulo concreto y lo mantiene, normalmente en un recorrido limitado (por ejemplo, 180°).', 'mo2', 'Ideal para articulaciones: le pides un ángulo.', 'Motor que va a un ángulo');
T('paso', 'Motor paso a paso', 'Motor que gira en pasos fijos, cada uno de un ángulo concreto.', 'mo2', 'Cuentas pasos y sabes cuánto ha girado.', 'Gira en pasos fijos');
F('motor_invertir', '¿Cómo haces que un motor de corriente continua gire en sentido contrario?', 'Cambiando la polaridad: intercambias los dos cables', ['Dándole más tensión', 'Cambiando el color del cable', 'No se puede'], 'El sentido de giro depende del sentido de la corriente: al intercambiar los cables, la corriente va al revés y el motor gira al revés.', 'mo2');
F('motor_vel', 'Reduces la tensión que recibe un motor de corriente continua sin carga. ¿Qué suele pasar?', 'Gira más despacio', ['Gira más deprisa', 'Cambia de sentido', 'Se para siempre'], 'En un motor de corriente continua la velocidad sin carga aumenta con la tensión. Con menos tensión, gira más despacio y con menos fuerza.', 'mo2');
F('servo_uso', 'Quieres que la articulación de un brazo se coloque en un ángulo concreto y se quede ahí. ¿Qué motor encaja mejor?', 'Un servomotor', ['Un motor de corriente continua sin más', 'Una pila', 'Una polea'], 'Un servo lleva dentro su propio control de posición: le pides un ángulo y va hasta él. Un motor de CC solo gira y tendrías que añadir algo para saber dónde está.', 'mo2');
C('paso_grados', 'Un motor paso a paso da 200 pasos por vuelta completa. ¿Cuántos grados avanza en cada paso?', '1,8°', ['3,6°', '0,9°', '18°'], 'Una vuelta son 360°. Cada paso: 360 ÷ 200 = 1,8°.', 'mo2', () => {
  const p = pick([48, 100, 200, 400]), g = 360 / p, a = fmt(g) + '°';
  return { q: `Un motor paso a paso da ${p} pasos por vuelta completa. ¿Cuántos grados avanza en cada paso?`, a, wrong: uniq([fmt(g * 2), fmt(g / 2, 2), fmt(g * 10)].map(x => x + '°'), a), explain: `Una vuelta son 360°. Cada paso: 360 ÷ ${p} = ${fmt(g)}°.` };
});

// ---- Lección 3 · Motor y reducción ----
T('motorreductor', 'Motorreductor', 'Motor con una reducción de engranajes integrada: gira más despacio, pero con más fuerza de giro (par).', 'mo3', 'Es lo que llevan los coches de juguete y muchos robots.', 'Motor + reducción');
C('motor_red', 'Un motor gira a 3000 rpm y lo conectas a una reducción de 30:1. ¿A cuántas rpm gira la salida?', '100 rpm', ['90000 rpm', '6000 rpm', '1500 rpm'], 'Una reducción de 30:1 divide la velocidad entre 30: 3000 ÷ 30 = 100 rpm.', 'mo3', () => {
  const m = pick([1500, 3000, 6000]), r = pick([10, 20, 30, 50]), s = m / r, a = s + ' rpm';
  return { q: `Un motor gira a ${m} rpm y lo conectas a una reducción de ${r}:1. ¿A cuántas rpm gira la salida?`, a, wrong: uniq([fmt(m * r), fmt(s * 2), fmt(s / 2), fmt(m - r)].map(x => x + ' rpm'), a).slice(0, 3), explain: `Una reducción de ${r}:1 divide la velocidad entre ${r}: ${m} ÷ ${r} = ${s} rpm.`, fig: gearsSVG(8, 24) };
}, gearsSVG(8, 24));
C('par_red', 'Un motor entrega 0,04 N·m. Con una reducción ideal de 20:1 (sin pérdidas), ¿qué par hay en la salida?', '0,8 N·m', ['0,002 N·m', '20,04 N·m', '1,6 N·m'], 'En una reducción ideal el par se multiplica por la relación: 0,04 × 20 = 0,8 N·m (a cambio de girar 20 veces más despacio).', 'mo3', () => {
  const par = pick([0.02, 0.04, 0.1, 0.2]), r = pick([5, 10, 20, 30]), s = par * r, a = fmt(s) + ' N·m';
  return { q: `Un motor entrega ${fmt(par, 2)} N·m. Con una reducción ideal de ${r}:1 (sin pérdidas), ¿qué par hay en la salida?`, a, wrong: uniq([fmt(par / r, 3), fmt(par + r, 2), fmt(s * 2), fmt(s / 2, 2)].map(x => x + ' N·m'), a).slice(0, 3), explain: `En una reducción ideal el par se multiplica por la relación: ${fmt(par, 2)} × ${r} = ${fmt(s)} N·m (a cambio de girar ${r} veces más despacio).` };
});
F('red_perdida', 'En la realidad, el par que sale de una reducción es algo menor que el calculado. ¿Por qué?', 'Porque se pierde algo por rozamiento entre dientes y en los ejes', ['Porque la relación de engranajes cambia sola', 'Porque el motor se cansa', 'Porque el par no se puede calcular'], 'Los cálculos «ideales» no cuentan el rozamiento, que convierte parte de la energía en calor. Se llama rendimiento: cuanto más etapas de engranajes, más se pierde.', 'mo3');
F('stall', 'Un motor de corriente continua se queda bloqueado (no puede girar) mientras sigue conectado. ¿Qué ocurre?', 'Consume mucha corriente y se puede calentar y dañar', ['Se enfría porque no gira', 'No consume nada', 'Gira al revés'], 'Cuando no gira, el motor no «frena» la corriente por sí mismo y toma muchísima. Desconéctalo en cuanto se bloquee: es un fallo típico al forzar un mecanismo.', 'mo3');
O('motor_prueba', 'Ordena los pasos para probar un motor con su transmisión', ['Fija el motor firmemente para que no se mueva', 'Conéctalo primero sin carga y mira el sentido de giro', 'Acopla la transmisión (engranajes o correa)', 'Prueba con poca carga y súbela poco a poco'], 'Se asegura el motor, se comprueba solo, se añade la transmisión y la carga se aumenta gradualmente. Si algo se bloquea, desconecta antes de tocar.', 'mo3');

// ---- Lección 4 · Baterías con cabeza ----
F('bat_hinchada', 'Una batería de litio se ha hinchado. ¿Qué haces?', 'No la usas ni la cargas; la sacas con cuidado a un sitio seguro y la llevas a un punto de reciclaje', ['La sigues usando si funciona', 'La cargas más despacio', 'La pinchas para que se deshinche'], 'Una batería hinchada puede estar dañada por dentro y calentarse o incendiarse. Pincharla es muy peligroso. Aléjala de materiales inflamables y entrégala en un punto de recogida.', 'mo4');
F('bat_carga', '¿Cómo cargas con seguridad una batería recargable?', 'Con el cargador adecuado para ese tipo de batería, sobre una superficie no inflamable y sin dejarla sin vigilar', ['Con cualquier cargador que encaje', 'Debajo de la almohada para que no se enfríe', 'Dejándola toda la noche en la cama'], 'Cada tipo de batería necesita su cargador. Cargar sobre una superficie que no arda y estando atento reduce mucho el riesgo si algo falla.', 'mo4');
F('bat_corto', '¿Por qué no es buena idea llevar baterías o pilas sueltas en el bolsillo con llaves o monedas?', 'Porque los metales pueden unir los dos polos y provocar un cortocircuito', ['Porque se descargan por el calor del cuerpo', 'Porque las monedas pesan', 'No pasa nada'], 'Unos contactos metálicos pueden cerrar el circuito entre los polos y calentar la pila. Guárdalas en su caja o con los polos tapados.', 'mo4');
F('bat_mezclar', 'En un portapilas, ¿puedes mezclar pilas nuevas con pilas viejas o de distinto tipo?', 'No: se recomienda usar siempre pilas iguales y del mismo estado', ['Sí, así se aprovechan todas', 'Sí, si son de colores distintos', 'Solo si el motor es pequeño'], 'Las pilas distintas o de carga distinta se descargan de forma desigual y alguna puede acabar sobrecargada o con fugas. Cambia todas a la vez.', 'mo4');
F('bat_reciclar', '¿Dónde tiras las pilas y baterías gastadas?', 'En un contenedor o punto de recogida de pilas (por ejemplo, en una tienda o punto limpio)', ['En el cubo de basura normal', 'En el váter', 'En cualquier jardín'], 'Contienen materiales contaminantes y las de litio pueden provocar incendios en un camión de basura. Los puntos de recogida las reciclan de forma segura.', 'mo4');
X('bat_caso', 'El coche de juguete que se calienta', [
  'Un coche de juguete con una batería recargable se calienta bastante mientras lo cargas, y la batería está algo hinchada.',
  'Lo has dejado cargando toda la noche encima de la cama.'], [
  ['¿Qué haces?', ['Lo desconectas, no lo vuelves a usar y llevas la batería a reciclar', 'Lo cargas otra vez para ver si se arregla', 'Lo dejas toda la noche como siempre'], 0, 'Una batería hinchada y caliente es una señal de peligro. Se retira, se deja en una superficie que no arda y se recicla.'],
  ['La próxima vez, ¿dónde cargas?', ['Sobre una superficie no inflamable y a la vista', 'Debajo de la almohada', 'Dentro de un cajón cerrado con ropa'], 0, 'Cargar a la vista y sobre algo que no arda permite reaccionar rápido si algo va mal.']], 'mo4');

addUnits([
  { id: 'u_seg', title: 'Seguridad, herramientas y método', sub: 'Un banco de trabajo seguro y el ciclo del inventor', lessons: [
    { id: 'l_seg_banco', title: 'Tu banco de trabajo', sub: 'Gafas, pelo y orden', icon: '🥽', items: ['t_epi', 'f_seg_ojos', 'f_seg_pelo', 'f_seg_orden', 'o_seg_corte', 'x_seg_banco'],
      note: { title: 'Antes de tocar nada', body: 'Un inventor prepara el puesto **antes** de empezar:\n\n• **gafas** si cortas, lijas o puede saltar algo\n• **pelo recogido** y sin mangas sueltas ni pulseras\n• mesa **despejada**, buena luz y una **bandeja** para las piezas\n• herramientas afiladas **bien usadas**, con la mano libre lejos\n\nCuesta un minuto y evita casi todos los sustos.' } },
    { id: 'l_seg_herr', title: 'Herramientas básicas', sub: 'Medir, atornillar y cortar', icon: '🔧', items: ['t_calibre', 'f_herr_medir', 'f_herr_destor', 'f_herr_cuter', 'f_herr_pegamento'],
      note: { title: 'La herramienta adecuada', body: 'Con pocas herramientas haces mucho: **calibre** para medir, **destornilladores** del tamaño justo, **tijeras** y **cúter**, y alguna **lima** fina.\n\nLa regla de oro: usa la herramienta **para lo que sirve**, sin forzarla. Si tienes que apretar mucho, algo falla.' } },
    { id: 'l_seg_metodo', title: 'Método de inventor', sub: 'Probar, medir, mejorar', icon: '🔁', items: ['t_prototipo', 't_iteracion', 'o_seg_metodo', 'f_prototipo_barato', 'f_un_cambio', 'c_escala'],
      note: { title: 'Equivocarse es parte del método', body: 'Los inventores **no aciertan a la primera**: construyen un **prototipo** barato, lo prueban, miden qué falla y mejoran **una cosa** cada vez.\n\nAsí el error deja de dar miedo: es información. Y esa es la idea de toda esta app.' } }
  ]},
  { id: 'u_motor', title: 'Motores y energía', sub: 'Pilas, motores, reducciones y baterías seguras', lessons: [
    { id: 'l_elec', title: 'Electricidad sin miedo', sub: 'Tensión, corriente y potencia', icon: '🔌', items: ['t_tension', 't_corriente', 't_cortocircuito', 'c_pot_elec', 'c_pilas', 'f_analogia', 'f_corto'],
      note: { title: 'El circuito más sencillo', fig: circuitoSVG(), body: 'Una **pila** empuja (**tensión**, en voltios) y por los cables circula la **corriente** (en amperios) hasta el **motor** y de vuelta.\n\n**Potencia = tensión × corriente** (en vatios). Y **nunca** unas los dos polos con un metal: eso es un **cortocircuito**.\n\n⚠️ Trabaja siempre con pilas o baterías pequeñas. **Nunca** con la corriente del enchufe.' } },
    { id: 'l_motor', title: 'Tipos de motor', sub: 'Continua, servo y paso a paso', icon: '🔋', items: ['t_motor_cc', 't_servo', 't_paso', 'f_motor_invertir', 'f_motor_vel', 'f_servo_uso', 'c_paso_grados'],
      note: { title: 'Tres motores, tres usos', body: '• **Motor de CC**: gira al darle tensión; cambia los cables y gira al revés.\n• **Servo**: le pides un **ángulo** y lo mantiene. Muy útil en articulaciones.\n• **Paso a paso**: gira en **pasos fijos**; contando pasos sabes cuánto ha girado.' } },
    { id: 'l_reduccion', title: 'Motor y reducción', sub: 'Menos velocidad, más fuerza', icon: '⚙️', items: ['t_motorreductor', 'c_motor_red', 'c_par_red', 'f_red_perdida', 'f_stall', 'o_motor_prueba'],
      note: { title: 'Lo que ya sabes, con motor', fig: gearsSVG(8, 24), body: 'Un motor pequeño gira **rápido y flojo**. Una **reducción** de engranajes lo hace girar más despacio y con **más fuerza** de giro (par): la misma regla que viste con los engranajes.\n\nIdeal: velocidad ÷ relación y par × relación. Real: algo menos, por el **rozamiento**.\n\n👆 Toca el dibujo para pausarlo.' } },
    { id: 'l_bateria', title: 'Baterías con cabeza', sub: 'Cómo no tener sustos', icon: '🛡️', items: ['f_tension_baja', 'f_bat_hinchada', 'f_bat_carga', 'f_bat_corto', 'f_bat_mezclar', 'f_bat_reciclar', 'x_bat_caso'],
      note: { title: '⚠️ Las baterías tienen reglas', body: '• **Nunca** uses ni cargues una batería **hinchada, caliente o dañada**.\n• Carga con el **cargador adecuado**, sobre algo que no arda y **a la vista**.\n• **No mezcles** pilas nuevas con viejas ni de distinto tipo.\n• Evita **cortocircuitos**: nada de metal suelto cerca de los polos.\n• Recicla las gastadas en un **punto de recogida**.' } }
  ]}
], {
  l_seg_herr: { title: 'Sabías que… el nonio de tu calibre', body: 'La escala deslizante que permite leer **décimas de milímetro** en un calibre se llama **nonio** (o escala de Vernier). Se atribuye a Pierre Vernier, que la describió en 1631.\n\nEs un truco ingenioso: dos escalas con divisiones ligeramente distintas permiten ver cuándo se alinean y leer más fino que una regla.' },
  l_seg_metodo: { title: 'Sabías que… cientos de prototipos', body: 'El inventor James Dyson cuenta que construyó **5.127 prototipos** de su aspiradora sin bolsa antes de llegar a la versión final.\n\nSea o no exacta la cifra, la idea es real: **iterar** (probar, fallar, mejorar) es la forma normal de inventar, no una señal de fracaso.' },
  l_elec: { title: 'Sabías que… la primera pila', body: 'En 1800, Alessandro Volta apiló discos de cobre y de zinc separados por paños empapados en salmuera y consiguió una corriente continua: la **pila voltaica**.\n\nDe su apellido viene el **voltio**, la unidad de tensión.' },
  l_motor: { title: 'Sabías que… cómo entiende un servo el ángulo', body: 'Un **servo** de modelismo recibe un pulso eléctrico cada unos 20 milisegundos. La **duración del pulso** (aproximadamente de 1 a 2 ms) le dice qué ángulo debe ocupar.\n\nTú no tienes que programar nada: basta saber que un servo «entiende» posiciones, no solo giros.' },
  l_reduccion: { title: 'Sabías que… un motor de juguete es rapidísimo y flojo', body: 'Un motor de juguete pequeño puede girar a **miles de vueltas por minuto**, pero casi no tiene fuerza. Por eso casi siempre lleva una **reducción**: cambia velocidad por fuerza, como en las palancas.' },
  l_bateria: { title: 'Sabías que… las baterías de litio y los aviones', body: 'Las baterías de litio de repuesto no se pueden facturar en la bodega de los aviones: deben ir **en el equipaje de mano**, protegidas de cortocircuitos, para poder actuar rápido si una se calienta.\n\nEs una norma pensada precisamente para esos sustos.' }
}, {
  u_seg: { id: 'm_seg', icon: '🧰', title: 'Prepara tu banco de trabajo',
    why: 'Un puesto de trabajo **ordenado y seguro** te ahorra sustos y piezas perdidas. Esta misión es sobre todo **organizar**: no hace falta comprar nada.',
    think: '¿Qué te ha costado más encontrar o más te ha estorbado? Esa es la parte que más compensa mejorar.',
    safety: 'Si te falta alguna protección (gafas, por ejemplo), no cortes ni lijes nada hasta que la tengas. Ten un botiquín básico a mano.',
    versions: { banco: { label: 'Mi banco', intro: 'Una mesa, una bandeja o caja, y lo que ya tengas.', steps: [
      'Despeja una mesa y deja solo lo necesario para el montaje.',
      'Pon una bandeja o caja para las piezas pequeñas.',
      'Comprueba que tienes buena luz sobre la zona de trabajo.',
      'Prepara tus gafas de protección y localiza tus tijeras y cúter.',
      'Haz una lista de 3 cosas que te faltan (por ejemplo, gafas, un calibre, una tabla de corte).',
      'Hazte una foto del puesto y anota qué cambiarías.'] } } },
  u_motor: { id: 'm_motor', icon: '🔋', title: 'Motor, polaridad y reducción',
    why: 'Vas a **ver** que un motor de corriente continua cambia de sentido al invertir los cables, y a sentir qué ocurre con la fuerza cuando metes una reducción.',
    think: 'Antes de conectar, predice: ¿en qué sentido girará? ¿Más rápido o más despacio con la reducción? ¿Y con más o menos fuerza?',
    safety: 'Usa solo un portapilas con pilas AA o AAA, nunca baterías de litio sueltas. Desconecta en cuanto algo se bloquee o se caliente. No toques el motor si está caliente.',
    versions: {
      motor: { label: 'Con motor y pilas', intro: 'Un motor pequeño de corriente continua (de juguete), un portapilas con 2 pilas AA, y dos engranajes de distinto tamaño (opcional).', steps: [
        'Conecta el motor al portapilas y mira hacia dónde gira.',
        'Desconecta, intercambia los dos cables y vuelve a conectar: ¿gira al revés?',
        'Pon una cinta en el eje para ver mejor el giro y estima cuántas vueltas da en 5 segundos.',
        'Si tienes dos engranajes (por ejemplo, 8 y 24 dientes), acóplalos al eje del motor y a otro eje.',
        'Predice y compara: ¿cuántas vueltas da ahora la salida en 5 segundos? Debería ser unas 3 veces menos.',
        'Prueba a frenar la salida con los dedos con cuidado: ¿notas más fuerza que en el eje del motor?'] },
      papel: { label: 'En papel', intro: 'Sin material: solo lápiz y papel.', steps: [
        'Dibuja un circuito con pila, cables y motor, y marca con una flecha el sentido de la corriente.',
        'Dibuja el mismo circuito con los cables invertidos y marca el sentido de giro del motor.',
        'Calcula la potencia de un motor de 6 V que consume 0,5 A.',
        'Dibuja una reducción de 8 a 24 dientes y calcula cuántas rpm tendría a la salida con un motor de 3000 rpm.'] } } }
}, ['u_seg']);
