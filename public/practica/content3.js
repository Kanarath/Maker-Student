// =====================================================================
// UNIDADES «CAD E IMPRESIÓN 3D» y «BRAZOS Y MANIPULADORES»
// Se carga después de content2.js (usa sus constructores, figuras y addUnits).
// =====================================================================

// Brazo plano de 2 eslabones (animada): el alcance máximo es L1 + L2 y el mínimo |L1 − L2|
ANIMS.arm2 = (s, t) => {
  const a = 0.7 + 0.5 * Math.sin(t * 0.8), b = -0.2 + 0.6 * Math.sin(t * 1.1 + 1), ex = 80 + 70 * Math.cos(a), ey = 130 - 70 * Math.sin(a), tx = ex + 50 * Math.cos(a + b), ty = ey - 50 * Math.sin(a + b);
  _a(_q(s, 'l1'), { x2: ex, y2: ey }); _a(_q(s, 'j1'), { cx: ex, cy: ey }); _a(_q(s, 'l2'), { x1: ex, y1: ey, x2: tx, y2: ty }); _a(_q(s, 'tip'), { cx: tx, cy: ty });
};
function arm2SVG() {  // viewBox más alto: los rótulos van debajo del suelo
  return SV.wrap('0 0 320 188',
    `<path d="M-40 130A120 120 0 0 1 200 130M60 130A20 20 0 0 1 100 130" fill="none" stroke="var(--muted)" stroke-width="1.2" stroke-dasharray="4 4"/>` +
    `<path d="M10 150H310" ${SV.ink} fill="none"/><rect x="60" y="130" width="40" height="20" rx="4" ${SV.fill} ${SV.ink}/>` +
    `<line data-r="l1" x1="80" y1="130" x2="150" y2="130" ${SV.ink} style="stroke-width:7"/><line data-r="l2" x1="150" y1="130" x2="200" y2="130" ${SV.ink} style="stroke-width:7"/>` +
    `<circle cx="80" cy="130" r="6" ${SV.fill} ${SV.key}/><circle data-r="j1" cx="150" cy="130" r="6" ${SV.fill} ${SV.key}/><circle data-r="tip" cx="200" cy="130" r="5" fill="var(--gold)"/>` +
    SV.txt(310, 168, 'línea de puntos: alcance', 11, 'end', 500) + SV.txt(310, 183, 'máx = L1 + L2 · mín = |L1 − L2|', 11, 'end', 500) + SV.txt(80, 168, 'base', 11),
    'Brazo plano de dos eslabones moviéndose; las líneas de puntos marcan los alcances máximo y mínimo', ' data-anim="arm2"');
}

// ---------------------------------------------------------------------
// UNIDAD · CAD E IMPRESIÓN 3D
// ---------------------------------------------------------------------
// ---- Lección 1 · Del boceto a la pieza ----
T('boceto', 'Boceto', 'Dibujo plano (2D) con medidas que sirve de punto de partida para crear una pieza en 3D.', 'c1', 'Primero dibujas la sombra; luego le das grosor.', 'Dibujo 2D inicial');
T('extrusion', 'Extrusión', 'Operación que da grosor a un dibujo plano para convertirlo en un sólido.', 'c1', 'Es «estirar» el dibujo hacia arriba, como un molde de galletas.', 'Dar grosor a un dibujo');
T('cota', 'Cota', 'Medida que fijas en un dibujo para que tenga un tamaño exacto.', 'c1', 'Si la cota cambia, el dibujo se adapta.', 'Medida fijada');
C('extr_vol', 'Extruyes un cuadrado de 20 mm de lado hasta darle 5 mm de grosor. ¿Qué volumen tiene el sólido?', '2000 mm³', ['100 mm³', '400 mm³', '8000 mm³'], 'Volumen = área de la base × grosor = (20 × 20) × 5 = 2000 mm³.', 'c1', () => {
  const l = pick([10, 20, 30, 40]), h = pick([2, 5, 10]), v = l * l * h, a = v + ' mm³';
  return { q: `Extruyes un cuadrado de ${l} mm de lado hasta darle ${h} mm de grosor. ¿Qué volumen tiene el sólido?`, a, wrong: uniq([l * h, l * l, 4 * l * h, (l + h) * l].map(x => x + ' mm³'), a).slice(0, 3), explain: `Volumen = área de la base × grosor = (${l} × ${l}) × ${h} = ${v} mm³.` };
});
F('cad_param', '¿Qué ventaja tiene un modelo paramétrico (con cotas) en un programa CAD?', 'Que al cambiar una cota, la pieza se actualiza sola', ['Que la pieza se imprime más rápido', 'Que no hace falta medir nada', 'Que la pieza pesa menos'], 'Si una medida es un parámetro, cambiarla redibuja la pieza entera. Así adaptas un diseño (por ejemplo, un agujero un poco mayor) sin empezar de cero.', 'c1');
O('cad_flujo', 'Ordena los pasos para modelar una pieza sencilla', ['Dibuja el boceto 2D de la forma', 'Fija las cotas (medidas) del boceto', 'Extruye el boceto para darle grosor', 'Añade agujeros y redondea los bordes', 'Exporta el archivo para imprimir'], 'Se dibuja la forma plana, se fijan las medidas, se le da grosor, se afinan los detalles y se exporta. Si te equivocas en una cota, la corriges y la pieza se actualiza.', 'c1');

// ---- Lección 2 · Cómo imprime una impresora 3D ----
T('fdm', 'FDM (deposición fundida)', 'Tipo de impresión 3D que funde un hilo de plástico (filamento) y lo deposita capa a capa.', 'c2', 'Es una pistola de silicona muy precisa y automática.', 'Plástico fundido en capas');
T('capa', 'Altura de capa', 'Grosor de cada una de las capas que forman la pieza; capas más finas dan mejor acabado pero tardan más.', 'c2', 'Capas más finas = más detalle, más tiempo.', 'Grosor de cada capa');
T('relleno', 'Relleno (infill)', 'Estructura interior de una pieza impresa; se indica con un porcentaje (a más porcentaje, más material por dentro).', 'c2', 'No suele ser macizo: ahorra material.', 'Interior de la pieza');
C('capas', 'Una pieza mide 30 mm de alto y la imprimes con capas de 0,2 mm. ¿Cuántas capas tendrá?', '150', ['6', '15', '300'], 'Número de capas = altura ÷ altura de capa = 30 ÷ 0,2 = 150.', 'c2', () => {
  const h = pick([10, 20, 30, 40, 60]), c = pick([0.1, 0.2, 0.4]), n = h / c, a = String(Math.round(n));
  return { q: `Una pieza mide ${h} mm de alto y la imprimes con capas de ${fmt(c)} mm. ¿Cuántas capas tendrá?`, a, wrong: uniq([n / 10, n * 2, n / 2, h * c].map(x => String(Math.round(x * 10) / 10).replace('.', ',')), a).slice(0, 3), explain: `Número de capas = altura ÷ altura de capa = ${h} ÷ ${fmt(c)} = ${Math.round(n)}.` };
});
F('fdm_debil', 'En una pieza impresa en FDM, ¿por dónde suele romperse más fácilmente?', 'Entre capas: la unión entre una capa y otra es más débil que cada capa por sí sola', ['A lo largo de las capas, siempre', 'Por el relleno, nunca por las capas', 'Todas las direcciones aguantan igual'], 'Cada capa se funde con la anterior, pero esa unión resiste menos que el plástico continuo. Por eso la orientación con la que imprimes importa.', 'c2');
F('fdm_voladizo', 'Una parte de tu pieza sobresale casi en horizontal, sin nada debajo. ¿Qué suele hacer falta?', 'Soportes (una estructura temporal) o reorientar la pieza', ['Nada: el plástico se queda en el aire', 'Imprimir más rápido', 'Subir la temperatura'], 'Cada capa necesita apoyarse en la anterior. Como regla práctica, ángulos de más de unos 45° respecto a la vertical suelen requerir soportes o cambiar la orientación.', 'c2');
F('fdm_orient', 'Vas a imprimir una palanca que se doblará al usarla. ¿Cómo la orientas?', 'De modo que el esfuerzo no tienda a separar las capas (capas en la dirección del esfuerzo)', ['De pie, con las capas apiladas a lo largo de la palanca', 'Da igual cómo la imprimas', 'Siempre con el mayor relleno posible y sin pensar en las capas'], 'Si la flexión intenta abrir la unión entre capas, se partirá por ahí. Colocarla tumbada, con las capas a lo largo del esfuerzo, suele resistir más.', 'c2');

// ---- Lección 3 · Diseñar para imprimir ----
T('tolerancia', 'Tolerancia (holgura)', 'Pequeño margen que se deja en el diseño para que dos piezas encajen sin quedar demasiado apretadas ni demasiado sueltas.', 'c3', 'Las piezas impresas rara vez salen exactas: prevé unas décimas.', 'Margen para encajar');
F('holgura', 'Diseñas un agujero para un eje impreso de 5 mm. Si lo haces exactamente de 5 mm, ¿qué suele pasar?', 'Que queda demasiado justo o no entra: hay que dejar una pequeña holgura (unas décimas de mm)', ['Entra con total comodidad siempre', 'El eje se encoge solo', 'El agujero se agranda al imprimir siempre'], 'Las piezas impresas se desvían unas décimas del modelo y los agujeros suelen salir algo más pequeños. Cuánta holgura necesitas depende de tu impresora: haz una prueba pequeña primero.', 'c3');
F('filete', 'Una esquina interior en ángulo recto es el punto por donde se parte tu pieza. ¿Qué la mejora?', 'Redondearla con un acuerdo (radio)', ['Hacerla más afilada', 'Quitar material justo ahí', 'Pintarla'], 'En una esquina viva las tensiones se concentran. Un radio las reparte y la pieza aguanta más. Es el mismo principio que redondear las esquinas de una ventana.', 'c3');
F('pared', 'Quieres una pieza más resistente. ¿Qué suele ayudar más: más relleno o más paredes (perímetros)?', 'Más paredes suele ayudar bastante, porque soportan buena parte del esfuerzo', ['Más relleno siempre es mejor que cualquier otra cosa', 'Ninguna de las dos cambia nada', 'Menos paredes y más aire'], 'Las paredes exteriores trabajan lejos del centro, como las alas de una viga en I. Subir de dos a tres o cuatro paredes suele dar más que subir mucho el relleno.', 'c3');
O('imprimir', 'Ordena el camino de una pieza hasta tenerla en la mano', ['Modela la pieza en el programa CAD', 'Exporta el modelo (por ejemplo, en formato STL)', 'Prepáralo en el programa de impresión (orientación, capas, relleno)', 'Imprime la pieza', 'Retira soportes, lima rebabas y pruébala'], 'Primero el modelo, luego su exportación, la preparación (donde decides cómo se imprime), la impresión y el acabado. Si algo falla, vuelves al paso que corresponda.', 'c3');
F('imp_seguridad', '¿Qué precaución tomas con una impresora 3D FDM?', 'No tocar la boquilla ni la cama calientes, ventilar y no dejarla funcionando sin supervisión', ['Ninguna: está a temperatura ambiente', 'Tocar la boquilla para ver si funciona', 'Taparla con una manta para que mantenga el calor'], 'La boquilla suele estar a unos 200 °C y la cama también se calienta. Ventila el sitio (sobre todo con ciertos plásticos) y no la dejes sola mucho tiempo.', 'c3');
X('pieza_rota', 'La palanca que se parte', [
  'Imprimes una palanca de 12 cm de largo, de pie, con las capas apiladas a lo largo de la palanca.',
  'Al empujarla se parte limpiamente en una línea recta, entre dos capas.'], [
  ['¿Qué ha pasado?', ['La unión entre capas es más débil y ha cedido a flexión', 'El plástico estaba frío', 'La palanca era demasiado corta'], 0, 'El esfuerzo de flexión ha intentado abrir la unión entre capas, que es su punto débil.'],
  ['¿Qué cambio haces primero?', ['Imprimirla tumbada y con más paredes', 'Imprimirla igual pero más rápido', 'Quitarle relleno'], 0, 'Tumbada, el esfuerzo ya no separa capas; más paredes aportan resistencia. Cambia una cosa cada vez para saber qué funciona.']], 'c3');

// ---- Lección 4 · Qué programa usar ----
T('stl', 'STL', 'Formato de archivo que describe la superficie de un modelo 3D con triángulos; no guarda las cotas ni el historial de modelado.', 'c4', 'Es la «foto final» de la pieza, no sus planos.', 'Archivo de superficie 3D');
F('tool_tinkercad', '¿Cuál es el mejor primer programa para quien nunca ha hecho CAD?', 'Tinkercad: funciona en el navegador y se modela con formas básicas', ['Un programa profesional de ingeniería muy complejo', 'Un editor de texto', 'Una hoja de cálculo'], 'Tinkercad parte de formas sencillas que se combinan y se restan. Es muy visual y suficiente para soportes, adaptadores y piezas sencillas.', 'c4');
F('tool_freecad', '¿Qué rasgo tiene FreeCAD?', 'Es gratuito y de código abierto, y permite modelado paramétrico (con cotas)', ['Solo funciona en el navegador', 'Solo sirve para dibujar a mano', 'No se puede exportar a STL'], 'FreeCAD es gratuito y abierto, y trabaja con cotas, algo más complicado de aprender que Tinkercad pero más potente.', 'c4');
F('tool_cual', 'Tienes que diseñar un soporte sencillo para un servo. ¿Con qué empiezas?', 'Con Tinkercad: para algo sencillo no hace falta más', ['Con el programa más complicado que exista', 'Con papel milimetrado, y no lo modelas nunca', 'Con una pieza comprada ya hecha, sin diseñar'], 'Para piezas sencillas, el programa más fácil es el mejor. Cuando lo necesites (cotas, cambios frecuentes), pasas a uno paramétrico.', 'c4');
F('tool_stl', '¿Qué pasa si guardas solo el archivo STL de tu pieza y pierdes el proyecto original?', 'Podrás imprimirla, pero será difícil cambiar sus cotas', ['No podrás imprimirla', 'Podrás cambiar las cotas como siempre', 'El STL guarda todos los pasos del modelado'], 'El STL solo contiene la superficie. Guarda siempre también el archivo del proyecto original si quieres modificar la pieza más adelante.', 'c4');
F('tool_licencia', 'Un programa CAD de empresa ofrece una licencia gratuita para uso personal. ¿Qué haces?', 'Compruebas las condiciones actuales (uso personal, límites) antes de depender de él', ['Asumes que siempre será gratis', 'Lo usas sin leer nada', 'Lo descartas siempre'], 'Las condiciones de licencia cambian con el tiempo. Revisa lo que permite el día que lo vayas a usar y guarda siempre copia de tus archivos.', 'c4');

// ---------------------------------------------------------------------
// UNIDAD · BRAZOS Y MANIPULADORES
// ---------------------------------------------------------------------
// ---- Lección 1 · Grados de libertad ----
T('gdl', 'Grado de libertad (GDL)', 'Cada movimiento independiente que puede hacer un mecanismo: una articulación que gira o un carro que se desliza cuenta como uno.', 'b1', 'Un brazo con 3 motores independientes suele tener 3 GDL.', 'Movimiento independiente');
T('efector', 'Efector final', 'La herramienta que lleva el brazo en el extremo para actuar: una pinza, una ventosa, un lápiz...', 'b1', 'Es la «mano» del brazo.', 'Herramienta del extremo');
T('espacio', 'Espacio de trabajo', 'Conjunto de puntos que el extremo del brazo puede alcanzar.', 'b1', 'Es lo que «barre» el brazo al moverse.', 'Puntos que alcanza');
C('alcance_max', 'Un brazo plano tiene dos eslabones, de 12 cm y de 8 cm, con el extremo libre. ¿Cuál es su alcance máximo desde la base?', '20 cm', ['4 cm', '96 cm', '10 cm'], 'El alcance máximo es con el brazo estirado: 12 + 8 = 20 cm.', 'b1', () => {
  let l1, l2; do { l1 = pick([8, 10, 12, 15, 20]); l2 = pick([5, 6, 8, 10]); } while (l1 === l2);
  const a = (l1 + l2) + ' cm';
  return { q: `Un brazo plano tiene dos eslabones, de ${l1} cm y de ${l2} cm, con el extremo libre. ¿Cuál es su alcance máximo desde la base?`, a, wrong: uniq([(l1 - l2) + ' cm', (l1 * l2) + ' cm', fmt((l1 + l2) / 2) + ' cm', (2 * (l1 + l2)) + ' cm'], a).slice(0, 3), explain: `El alcance máximo es con el brazo estirado: ${l1} + ${l2} = ${l1 + l2} cm.`, fig: arm2SVG() };
}, arm2SVG());
C('alcance_min', 'Un brazo plano tiene dos eslabones, de 12 cm y de 8 cm. Con el codo totalmente doblado, ¿a qué distancia mínima de la base queda el extremo?', '4 cm', ['20 cm', '10 cm', '0 cm'], 'Con el codo plegado, un eslabón queda sobre el otro: 12 − 8 = 4 cm. (Con eslabones iguales llegaría a 0.)', 'b1', () => {
  let l1, l2; do { l1 = pick([8, 10, 12, 15, 20]); l2 = pick([5, 6, 8, 10]); } while (l1 === l2);
  const d = Math.abs(l1 - l2), a = d + ' cm';
  return { q: `Un brazo plano tiene dos eslabones, de ${l1} cm y de ${l2} cm. Con el codo totalmente doblado, ¿a qué distancia mínima de la base queda el extremo?`, a, wrong: uniq([(l1 + l2) + ' cm', fmt((l1 + l2) / 2) + ' cm', '0 cm', fmt(d * 2) + ' cm', Math.max(l1, l2) + ' cm', Math.min(l1, l2) + ' cm'], a).slice(0, 3), explain: `Con el codo plegado, un eslabón queda sobre el otro: ${Math.max(l1, l2)} − ${Math.min(l1, l2)} = ${d} cm. (Con eslabones iguales llegaría a 0.)`, fig: arm2SVG() };
}, arm2SVG());
F('gdl_cuantos', 'Un brazo gira sobre su base y además dobla el codo. ¿Cuántos grados de libertad tiene?', '2', ['1', '3', '6'], 'Cada movimiento independiente cuenta: giro de la base (1) y codo (2). Si añades una muñeca que gira, serían 3.', 'b1', arm2SVG());
F('gdl_seis', 'Para colocar un objeto en cualquier posición y con cualquier orientación en el espacio, ¿cuántos grados de libertad hacen falta como mínimo?', '6 (tres para la posición y tres para la orientación)', ['2', '3', '12'], 'Tres movimientos para llegar a un punto del espacio y tres giros para orientar la mano. Un brazo de 2 o 3 GDL no puede orientar libremente: está limitado a ciertos movimientos.', 'b1');

// ---- Lección 2 · Cargas en el brazo ----
C('par_brazo', 'Un brazo horizontal de 0,3 m sostiene en su punta una pieza de 2 N. ¿Qué par debe dar el motor del hombro (sin contar el peso del propio brazo)?', '0,6 N·m', ['2,3 N·m', '6 N·m', '0,15 N·m'], 'Par = fuerza × distancia = 2 N × 0,3 m = 0,6 N·m.', 'b2', () => {
  const l = pick([0.1, 0.2, 0.3, 0.4, 0.5]), f = pick([1, 2, 3, 4, 5]), p = l * f, a = fmt(p) + ' N·m';
  return { q: `Un brazo horizontal de ${fmt(l)} m sostiene en su punta una pieza de ${f} N. ¿Qué par debe dar el motor del hombro (sin contar el peso del propio brazo)?`, a, wrong: uniq([fmt(l + f), fmt(f / l), fmt(p * 10), fmt(p / 2, 2)].map(x => x + ' N·m'), a).slice(0, 3), explain: `Par = fuerza × distancia = ${f} N × ${fmt(l)} m = ${fmt(p)} N·m.` };
});
C('servo_carga', 'Un servo da un par de 12 kg·cm. ¿Qué carga máxima puede sostener a 4 cm de su eje?', '3 kg', ['48 kg', '16 kg', '8 kg'], 'Los kg·cm son carga × distancia: carga = 12 ÷ 4 = 3 kg. A más distancia, menos carga.', 'b2', () => {
  const par = pick([6, 10, 12, 20]), d = pick([2, 4, 5, 10]), c = par / d, a = fmt(c) + ' kg';
  return { q: `Un servo da un par de ${par} kg·cm. ¿Qué carga máxima puede sostener a ${d} cm de su eje?`, a, wrong: uniq([fmt(par * d), fmt(par + d), fmt(par - d), fmt(c * 2)].map(x => x + ' kg'), a).slice(0, 3), explain: `Los kg·cm son carga × distancia: carga = ${par} ÷ ${d} = ${fmt(c)} kg. A más distancia, menos carga.` };
});
F('par_peso_brazo', 'Además de la pieza que sostiene, ¿qué más carga el motor del hombro?', 'El propio peso del brazo, que actúa aproximadamente en su punto medio', ['Nada: el brazo no pesa', 'Solo el peso del motor de la muñeca', 'El peso del suelo'], 'Un eslabón uniforme pesa como si todo su peso estuviera en el centro. Ese peso, por la distancia, suma par en el hombro. Por eso los brazos se hacen ligeros.', 'b2');
F('par_doble', 'Con la misma pieza en la punta, duplicas el largo de un brazo horizontal. ¿Qué pasa con el par que necesita el hombro?', 'Se duplica (par = fuerza × distancia)', ['Se queda igual', 'Se reduce a la mitad', 'Se multiplica por 8'], 'El par es proporcional a la distancia: el doble de largo, el doble de par. (Lo que se multiplica por 8 es la flecha, no el par.)', 'b2');
F('brazo_ligero', 'Para que un servo pequeño mueva un brazo con más soltura, ¿qué ayuda más?', 'Hacer el brazo más corto y ligero, y colocar los motores pesados cerca de la base', ['Hacerlo más largo', 'Poner más peso en la punta', 'Usar solo vigas muy gruesas y macizas'], 'Menos longitud y menos masa lejos de la base significan menos par. Es la combinación de lo que viste en palancas y en voladizos.', 'b2');

// ---- Lección 3 · Pinzas y transmisión ----
T('paralelogramo', 'Mecanismo de paralelogramo', 'Cuatro barras articuladas que forman un paralelogramo y mantienen paralelas las barras opuestas; sirve para que una pieza conserve su orientación al moverse.', 'b3', 'La mano del brazo no se inclina aunque suba y baje.', 'Mantiene la orientación');
F('pinza_roz', 'Una pinza de dos dedos suelta una pieza lisa y pesada al moverla. ¿Qué puede ayudar?', 'Aumentar el rozamiento (goma en los dedos) o la fuerza de agarre', ['Hacer los dedos más pulidos', 'Mover la pinza más deprisa', 'Quitar fuerza de agarre'], 'La pinza sujeta por rozamiento: rozamiento = μ × fuerza con la que aprietas. Con goma sube μ; con más fuerza sube la normal.', 'b3');
F('pinza_cremallera', 'Quieres que una pinza abra y cierre dos dedos a la vez con un solo motor que gira. ¿Qué mecanismo sirve?', 'Una cremallera con piñón, o un tornillo con dos tuercas', ['Una polea fija sola', 'Un trinquete', 'Una leva sin seguidor'], 'El giro del motor se convierte en desplazamiento lineal de los dos dedos: lo que viste en la unidad de mecanismos.', 'b3');
F('transmision_brazo', '¿Cómo mueves una articulación del brazo sin poner el motor justo en ella?', 'Con una correa, una cadena o varillas desde un motor colocado en la base', ['No es posible', 'Con un imán', 'Con una cuerda sin tensar'], 'Llevar el motor a la base reduce el peso que carga el brazo y el par que debe aguantar. Se paga con algo más de complejidad y de juego.', 'b3');
F('paralelogramo_uso', '¿Para qué sirve un paralelogramo articulado en un brazo?', 'Para que la herramienta o la pinza mantenga su orientación al subir y bajar el brazo', ['Para que el brazo sea más pesado', 'Para convertir giro en línea recta', 'Para que no se pueda mover'], 'Las barras opuestas siguen paralelas, así que la pieza del extremo no se inclina aunque cambie su altura. Lo usan muchas lámparas de escritorio.', 'b3');
F('ventosa', '¿Cuándo funciona bien una ventosa como efector?', 'Con superficies lisas y limpias, donde puede sellar', ['Con superficies rugosas y sucias', 'Con tela suelta', 'Con cualquier superficie, siempre'], 'Una ventosa agarra con la presión del aire al crear vacío: necesita sellar. Con superficies rugosas o sucias entra aire y suelta.', 'b3');

// ---- Lección 4 · Diagnostica un brazo ----
O('arm_montaje', 'Ordena los pasos para diseñar y montar un brazo', ['Define qué debe hacer el brazo y a qué distancia', 'Dibuja el esquema con las articulaciones y los eslabones', 'Calcula el par que necesita cada articulación', 'Elige motores y reducción con margen', 'Monta y prueba sin carga', 'Añade carga poco a poco y corrige lo que falle'], 'Primero se piensa para qué sirve y se dibuja, después se calcula y se eligen los motores con margen. Solo entonces se monta, se prueba sin carga y se sube la carga gradualmente.', 'b4');
X('brazo_cae', 'El brazo que se cae', [
  'Tu brazo tiene un motor con reducción en el hombro, y levanta bien la pieza.',
  'Cuando paras el motor, el brazo cae lentamente por su propio peso.'], [
  ['¿Qué ocurre?', ['El mecanismo no se autobloquea: el peso mueve el motor hacia atrás', 'El motor está roto', 'El brazo no pesa bastante'], 0, 'Con engranajes rectos y poco rozamiento el peso puede mover el motor hacia atrás. Un tornillo sin fin con poca inclinación puede bloquear, aunque no es seguro garantizarlo.'],
  ['¿Qué mejoraría la situación?', ['Un freno, un tornillo sin fin o un contrapeso que equilibre el brazo', 'Un brazo más largo', 'Quitar la reducción'], 0, 'Equilibrar el brazo con un contrapeso reduce el par que debe aguantar el motor; un freno o un sin fin evitan que retroceda.']], 'b4');
X('brazo_vibra', 'El brazo que vibra', [
  'Al parar bruscamente, la punta del brazo oscila arriba y abajo durante un momento antes de quedarse quieta.',
  'Los eslabones son largos y finos y las uniones llevan un pin cada una.'], [
  ['¿Qué dos causas son las más probables?', ['Poca rigidez de los eslabones y juego en las uniones', 'Que el brazo tiene demasiada luz', 'Que el suelo está inclinado'], 0, 'Un brazo largo y flexible rebota como una regla; los pines con holgura añaden juego. Se arregla con rigidez, diagonales y menos masa lejos de la base.'],
  ['¿Qué cambio es más eficaz?', ['Acortar los eslabones y añadir diagonales', 'Pintar los eslabones', 'Usar un motor más rápido'], 0, 'Menos longitud y triángulos rigidizan la estructura (flecha y juego). Un motor más rápido solo hará más brusco el arranque.']], 'b4');
F('arm_holgura', 'Tu brazo termina siempre un poco más a la izquierda de donde esperabas. ¿Qué puede causarlo?', 'Juego en las uniones y falta de rigidez, que se suman a lo largo del brazo', ['Que la gravedad cambia durante el día', 'Que los motores se cansan', 'Que el suelo se mueve'], 'Los pequeños márgenes de cada unión se acumulan, y más cuanto más largo es el brazo. Menos uniones y más rígidas dan más precisión.', 'b4');
F('arm_cables', 'Los cables de tu brazo se enredan y se pellizcan al girar las articulaciones. ¿Qué haces?', 'Dejas holgura, los recoges con bridas o guías y compruebas el recorrido completo antes de conectar', ['Los tensas para que no cuelguen', 'Los atas fuerte a los ejes', 'Pruebas con el motor a plena potencia'], 'Con las articulaciones en sus extremos el cable no debe tensarse ni quedar pillado. Revisa el recorrido completo a mano y con el motor desconectado.', 'b4');

addUnits([
  { id: 'u_cad', title: 'CAD e impresión 3D', sub: 'Del boceto a la pieza que puedes sostener', lessons: [
    { id: 'l_cad_idea', title: 'Del boceto a la pieza', sub: 'Boceto, cotas y extrusión', icon: '📐', items: ['t_boceto', 't_extrusion', 't_cota', 'c_extr_vol', 'f_cad_param', 'o_cad_flujo'],
      note: { title: 'De 2D a 3D', body: 'Casi todo modelo CAD sencillo sigue el mismo camino: **boceto** plano con **cotas** (medidas), **extrusión** para darle grosor, y detalles como **agujeros** y **redondeos**.\n\nSi usas cotas, cambiar una medida actualiza la pieza entera: es el modelado **paramétrico**.' } },
    { id: 'l_fdm', title: 'Cómo imprime una impresora 3D', sub: 'Capas, relleno y soportes', icon: '🖨️', items: ['t_fdm', 't_capa', 't_relleno', 'c_capas', 'f_fdm_debil', 'f_fdm_voladizo', 'f_fdm_orient'],
      note: { title: 'Una pieza es una pila de capas', body: 'Una impresora **FDM** funde plástico y lo deposita **capa a capa**. Eso explica casi todo:\n\n• la unión **entre capas** es el punto débil\n• lo que sobresale en el aire necesita **soportes**\n• capas más **finas** = más detalle y más tiempo\n\nPor eso importa **cómo orientas** la pieza.' } },
    { id: 'l_diseno_imp', title: 'Diseñar para imprimir', sub: 'Holgura, radios y paredes', icon: '🧩', items: ['t_tolerancia', 'f_holgura', 'f_filete', 'f_pared', 'o_imprimir', 'f_imp_seguridad', 'x_pieza_rota'],
      note: { title: 'Piensa en cómo se va a imprimir', body: '• Deja **holgura** (unas décimas de mm) donde dos piezas encajan; haz una **prueba pequeña** primero.\n• **Redondea** las esquinas interiores.\n• Más **paredes** suele reforzar más que mucho relleno.\n• Orienta la pieza para que el esfuerzo **no separe capas**.\n\n⚠️ La boquilla y la cama están **calientes**: no las toques.' } },
    { id: 'l_cad_tools', title: 'Qué programa usar', sub: 'Tinkercad, FreeCAD y el archivo STL', icon: '💻', items: ['t_stl', 'f_tool_tinkercad', 'f_tool_freecad', 'f_tool_cual', 'f_tool_stl', 'f_tool_licencia'],
      note: { title: 'Empieza por lo sencillo', body: '• **Tinkercad**: en el navegador, con formas básicas. Perfecto para empezar.\n• **FreeCAD**: gratuito y paramétrico, más potente y más largo de aprender.\n• Otros programas de empresa pueden ofrecer licencias de uso personal: **comprueba las condiciones** el día que los uses.\n\nGuarda siempre el **proyecto original**, no solo el STL.' } }
  ]},
  { id: 'u_brazo', title: 'Brazos y manipuladores', sub: 'Grados de libertad, par, pinzas y diagnóstico', lessons: [
    { id: 'l_gdl', title: 'Grados de libertad', sub: 'Cuántos movimientos tiene un brazo', icon: '🦾', items: ['t_gdl', 't_efector', 't_espacio', 'c_alcance_max', 'c_alcance_min', 'f_gdl_cuantos', 'f_gdl_seis'],
      note: { title: 'Un brazo es una cadena de articulaciones', fig: arm2SVG(), body: 'Cada articulación independiente es un **grado de libertad**. Con **2 eslabones** de longitudes **L1** y **L2**:\n\n• alcance **máximo** = L1 + L2 (estirado)\n• alcance **mínimo** = |L1 − L2| (codo doblado)\n\nEl extremo solo puede estar dentro de esa corona: su **espacio de trabajo**.\n\n👆 Toca el dibujo para pausarlo.' } },
    { id: 'l_pares', title: 'Cargas en el brazo', sub: 'Par, kg·cm y peso propio', icon: '🏋️', items: ['c_par_brazo', 'c_servo_carga', 'f_par_peso_brazo', 'f_par_doble', 'f_brazo_ligero'],
      note: { title: 'El hombro es el que más sufre', body: 'El motor del hombro debe dar un **par** = fuerza × distancia, contando la **pieza** y también el **peso propio** del brazo (en su punto medio).\n\nLos **servos** indican su par en **kg·cm**: carga × distancia. A más distancia, menos carga.\n\nBrazo **corto y ligero**, motores **cerca de la base**.' } },
    { id: 'l_pinza', title: 'Pinzas y transmisión', sub: 'Agarrar y mover sin pesar', icon: '🤏', items: ['t_paralelogramo', 'f_pinza_roz', 'f_pinza_cremallera', 'f_transmision_brazo', 'f_paralelogramo_uso', 'f_ventosa'],
      note: { title: 'La mano del brazo', body: 'Una **pinza** agarra por **rozamiento**: goma en los dedos y fuerza suficiente. Una **cremallera** o un **tornillo** abren los dedos con un solo motor.\n\nUn **paralelogramo** mantiene la orientación de la mano. Y con correas o varillas puedes llevar los **motores a la base**.' } },
    { id: 'l_arm_diag', title: 'Diagnostica un brazo', sub: 'Cae, vibra o no llega', icon: '🔍', items: ['o_arm_montaje', 'x_brazo_cae', 'x_brazo_vibra', 'f_arm_holgura', 'f_arm_cables'],
      note: { title: 'Cuando algo falla, mide', body: 'Un brazo que **cae**, **vibra** o **no llega** casi siempre tiene la causa en lo que ya sabes: **par** insuficiente, **rigidez** escasa, **juego** en las uniones o **peso** lejos de la base.\n\nCambia **una cosa** cada vez y mide qué mejora.' } }
  ]}
], {
  l_cad_idea: { title: 'Sabías que… el abuelo del CAD se llamó Sketchpad', body: 'En 1963, Ivan Sutherland creó **Sketchpad**, un programa que permitía dibujar en una pantalla con un lápiz óptico y que se considera un antecesor del diseño asistido por ordenador.\n\nHoy dibujas en tu navegador lo que entonces ocupaba un ordenador de laboratorio.' },
  l_fdm: { title: 'Sabías que… la patente de la impresión FDM', body: 'El método FDM (deposición fundida) lo patentó **Scott Crump** a finales de los años 80, y de ahí nació la empresa Stratasys.\n\nLas impresoras caseras de hoy se basan en el mismo principio: plástico fundido, capa a capa.' },
  l_cad_tools: { title: 'Sabías que… STL viene de «estereolitografía»', body: 'El formato **STL** nació en los años 80 para la **estereolitografía**, una de las primeras técnicas de impresión 3D. Describe la superficie con triángulos.\n\nPor eso, hoy, casi cualquier impresora lo entiende.' },
  l_gdl: { title: 'Sabías que… el primer robot industrial', body: 'Unimate, considerado el primer **robot industrial**, empezó a trabajar en una fábrica de General Motors en 1961, moviendo piezas calientes de metal.\n\nEra un brazo de varias articulaciones: ya entonces, el secreto eran los **grados de libertad**.' },
  l_pares: { title: 'Sabías que… el brazo del transbordador', body: 'El **Canadarm**, el brazo del transbordador espacial, se diseñó para moverse en ingravidez. En la Tierra, por su propio peso, no podía sostenerse ni levantar casi nada sin ayuda.\n\nEs un buen ejemplo de que el **par** depende del peso: en el espacio no pesa.' },
  l_pinza: { title: 'Sabías que… robots de almacén con ventosas', body: 'Muchos robots de almacén cogen cajas con **ventosas**: no necesitan apretar, solo crear vacío para que la presión del aire las sujete.\n\nPero solo funcionan con superficies lo bastante lisas y limpias para sellar.' }
}, {
  u_cad: { id: 'm_cad', icon: '📐', title: 'Diseña un soporte',
    why: 'Vas a recorrer el camino de un inventor: **boceto, cotas, extrusión** y la pregunta clave: «¿esto se puede imprimir?». Puedes hacerlo en Tinkercad o solo en papel.',
    think: 'Antes de imprimir (o de darlo por bueno), revisa: ¿las medidas están acotadas? ¿hay holgura donde encajan piezas? ¿se puede imprimir sin soportes? ¿cómo orientarías la pieza?',
    safety: 'Si llegas a imprimir, no toques la boquilla ni la cama calientes y ventila la habitación. En papel, usa tijeras y cúter con cuidado sobre una base protegida.',
    versions: {
      tinkercad: { label: 'En el ordenador', intro: 'Un navegador y una cuenta gratuita en Tinkercad (o el programa que prefieras).', steps: [
        'Elige una pieza sencilla: un soporte para tu servo o un adaptador de eje.',
        'Mide con regla o calibre lo que tiene que sujetar y anota las cotas.',
        'Crea un bloque base con las medidas y resta un hueco para el servo con holgura.',
        'Añade dos agujeros para tornillos y redondea una esquina interior.',
        'Comprueba la orientación: ¿qué cara apoya en la cama y dónde irían las capas?',
        'Guarda el proyecto y exporta el STL (solo si vas a imprimirlo).'] },
      papel: { label: 'En papel', intro: 'Papel, lápiz, regla y, si quieres, cartón.', steps: [
        'Dibuja a mano la vista de arriba de tu soporte.',
        'Acota todas las medidas, incluidos los agujeros.',
        'Recórtalo en cartón y comprueba que encaja con lo que debe sujetar.',
        'Marca dónde pondrías la holgura (décimas de mm) y por qué.',
        'Dibuja cómo lo orientarías al imprimir y dónde irían las capas.'] } } },
  u_brazo: { id: 'm_brazo', icon: '🦾', title: 'Un brazo de 2 GDL de cartón',
    why: 'Vas a construir un brazo sencillo y a **ver** su espacio de trabajo: lo que predijiste (alcance máximo y mínimo) lo vas a medir con la regla.',
    think: 'Antes de moverlo, predice el alcance máximo y el mínimo con las longitudes de tus eslabones. Luego mídelos y compara. ¿Por qué no coincide exactamente?',
    safety: 'Corta con tijeras o cúter sobre una base protegida y lejos de ti. Haz los agujeros con un lápiz sobre un material blando. Si añades un motor, usa solo pilas AA y desconecta si se bloquea.',
    versions: {
      carton: { label: 'Con cartón', intro: 'Tiras de cartón, dos encuadernadores (o clips), un lápiz y una regla.', steps: [
        'Recorta dos tiras de cartón de longitudes distintas (por ejemplo, 14 cm y 10 cm) y haz un agujero en cada extremo.',
        'Une las dos tiras con un encuadernador (el codo) y fija el extremo de la primera a un cartón-base con otro (el hombro).',
        'Predice con la regla cuál será el alcance máximo (L1 + L2) y el mínimo (|L1 − L2|).',
        'Pon un lápiz en el extremo libre y dibuja sobre un folio el área que alcanzas al mover el brazo.',
        'Mide con la regla hasta dónde llega el extremo con el brazo estirado y con el codo doblado.',
        'Compara con tu predicción y anota las diferencias.'] },
      piezas: { label: 'Con piezas', intro: 'Con vigas, pines y ejes de tu kit.', steps: [
        'Monta un hombro con una viga corta fija a la base y gira sobre un eje con tope.',
        'Une una segunda viga como segundo eslabón con otro eje (el codo).',
        'Cuenta los saltos de agujero para calcular L1 y L2 en milímetros (cada salto son 8 mm).',
        'Predice el alcance máximo y mínimo y mídelos con una regla.',
        'Añade una diagonal donde veas que el brazo se tumba y prueba otra vez.'] } } }
});
