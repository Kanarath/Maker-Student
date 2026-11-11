// =====================================================================
// 🛒 COMPRAS · dónde comprar tu kit Technic (y compatibles) con envío a España
// Datos consultados el 28 de octubre de 2026. LOS PRECIOS CAMBIAN A DIARIO: compruébalos en el enlace antes de pagar.
// Para actualizar: edita las listas de abajo (fecha, precio, enlace). Nada de esto se calcula solo.
// =====================================================================
const COMPRAS = {
  fecha: '28 oct 2026',
  // Listados de AliExpress vistos en sus páginas de búsqueda (precio, nota y ventas tal como aparecían ese día)
  ali: [
    { id: 'a116', t: '116 piezas sueltas MOC: pines, liftarms, ejes, conectores y un engranaje de 40 dientes', eur: 6.85, pcs: 116, nota: '4,9 ★ · más de 2.000 vendidos. Envío gratis a partir de 10 € de pedido.', url: 'https://es.aliexpress.com/item/1005006010396684.html', para: 'Pines, ejes y engranajes para empezar muy barato.' },
    { id: 'a120', t: '120 liftarms (vigas) MOC de 12 tamaños distintos', eur: 22.99, pcs: 120, nota: '4,9 ★ · 468 vendidos. 20,76 € cada uno si compras 2. Envío gratis.', url: 'https://es.aliexpress.com/item/32890076346.html', para: 'Vigas de muchos largos: lo que más necesitas para palancas y brazos.' },
    { id: 'a123', t: '123 piezas MOC: viga, pin, eje, conector, panel, engranajes y piezas de suspensión', eur: 13.99, pcs: 123, nota: '5 ★ · 23 vendidos. Envío gratis.', url: 'https://es.aliexpress.com/item/1005010332870954.html', para: 'Mezcla de todo a buen precio.' },
    { id: 'a160', t: '160 liftarms de vigas, piezas técnicas a granel', eur: 20.79, pcs: 160, nota: '5 ★ · 68 vendidos. 18,88 € cada uno si compras 2. Envío gratis.', url: 'https://es.aliexpress.com/item/32848279491.html', para: 'Muchas vigas.' },
    { id: 'a540', t: '540 piezas técnicas MOC a granel: pines, liftarms, ejes y conectores', eur: 31.39, pcs: 540, nota: '4,9 ★ · 376 vendidos. 29,23 € cada uno si compras 2. Envío gratis.', url: 'https://es.aliexpress.com/item/32892146778.html', para: 'Lote grande de piezas útiles para mecanismos: más piezas por euro.' },
    { id: 'a650', t: '650 piezas: engranajes, ejes, neumáticos, ruedas y ladrillos de moto', eur: 35.19, pcs: 650, nota: '5 ★ · 127 vendidos. 32,83 € cada uno si compras 2. Envío gratis.', url: 'https://es.aliexpress.com/item/32890314720.html', para: 'El más barato por pieza, pero lleva ruedas y piezas de moto que quizá no uses.' },
    { id: 'a596', t: '596 piezas: liftarms, conectores de eje y ruedas', eur: 41.79, pcs: 596, nota: '5 ★ · 57 vendidos. Envío gratis.', url: 'https://es.aliexpress.com/item/32969985522.html', para: 'Alternativa al de 540 si buscas más variedad de vigas.' },
    { id: 'a40', t: '40 liftarms de agujeros gruesos, de 1×2 a 1×15', eur: 6.39, pcs: 40, nota: '4,5 ★ · solo 12 vendidos. Envío gratis a partir de 10 €.', url: 'https://es.aliexpress.com/item/1005005642116369.html', para: 'Vigas de todos los largos para completar un lote.' }
  ],
  // Motor y pilas (para más adelante)
  motor: [
    { t: 'Motor M + caja de pilas AA + interruptor + cables (compatible con Power Functions)', eur: 10.59, nota: '5 ★ · 23 vendidos. Envío gratis a partir de 10 €.', url: 'https://es.aliexpress.com/item/1005005753499026.html' },
    { t: 'Mismo tipo de pack, más barato (no queda claro qué incluye exactamente: léelo bien)', eur: 7.19, nota: '7 vendidos. Envío gratis.', url: 'https://es.aliexpress.com/item/1005005038285356.html' },
    { t: 'Kit de 11 piezas: 5 motores + caja de pilas AA + mando a distancia 2,4 G', eur: 38.59, nota: '4,9 ★ · más de 2.000 vendidos. Para cuando quieras controlar varios motores.', url: 'https://es.aliexpress.com/item/1005010089158436.html' }
  ],
  // Amazon.es: Amazon no me dejó abrir las fichas; solo vi título y, en algunos casos, un precio en los resultados de búsqueda
  amazon: [
    { t: 'XUHN · 116 piezas Technic (engranajes, ejes, conectores, poleas, cadenas…)', eur: 16.99, nota: 'Precio y 4,6 ★ (164 valoraciones) tal como salían en el buscador; no pude abrir la ficha.', url: 'https://www.amazon.es/-/en/Engineering-Set-Gears-Axle-Pin-Connector-Transmission-Compatible/dp/B0F18LQHH9' },
    { t: 'UpGLeuch · 638 piezas (engranajes, ejes, cremallera, ruedas y pines)', eur: null, nota: 'Sin precio visto. Es el lote más grande del buscador.', url: 'https://www.amazon.es/UpGLeuch-Technic-repuesto-compatibles-engranajes/dp/B0C23TC1CV' },
    { t: 'CXWK · 116 piezas de ingeniería', eur: null, nota: 'Sin precio visto. Una reseña dice que la mayoría encaja, pero que alguna pieza queda muy justa y cuesta separarla.', url: 'https://www.amazon.es/Bulokeliner-construcci%C3%B3n-engranajes-conectores-compatible/dp/B098JSK5K7' },
    { t: 'LEGO original · 100 piezas Technic al azar (conectores, varillas, pines, ejes, brazos)', eur: 14.9, nota: 'Precio visto en el buscador, sin abrir la ficha. Piezas originales, pero al azar.', url: 'https://www.amazon.es/LEGO-100-Piezas-TECHNIC-Conectores/dp/B06XGV5JP3' }
  ],
  // Temu: solo pude ver los títulos; ninguna página mostraba precio
  temu: [
    { t: '301 piezas con liftarms, pines, ejes y conectores', url: 'https://www.temu.com/301-piece--building-blocks-set-abs-construction-supplement-pack-with-liftarms-pins-axles-connectors-compatible-with--for-diy--projects-ages-6-8-g-601099560607693.html' },
    { t: '120 piezas: ejes, pines y conectores angulares', url: 'https://www.temu.com/120pcs--series-axles-pins-angle-connectors-parts-compatible--parts-pack-accessories-for--moc--building-blocks-g-601099538447075.html' },
    { t: '190 piezas de engranajes, ruedas y casquillos', url: 'https://www.temu.com/uk/190pcs-mechanical-gear-building-blocks-set-50-in-1-technical-parts-kit-for--educational-stem-toy-with-abs-material-compatible-with-major-diy-brands--gears-wheels-and-bushings-in-mixed-colors-g-601099536273624.html' }
  ],
  // Piezas LEGO originales sueltas (precios por pieza vistos en las tiendas)
  originales: [
    { t: 'ToyPro (en español, piezas nuevas sueltas)', url: 'https://www.toypro.com/es/list/piezas/technic', nota: 'Pines y ejes: de 0,05 a 0,30 € cada uno según el largo. Vigas (liftarms): de 0,13 € las cortas a 1,14 € la de 15 agujeros. Engranajes de 8 y 16 dientes: unos 0,38–0,46 €.' },
    { t: 'Brick Owl (mercado de vendedores, en español)', url: 'https://www.brickowl.com/es/catalog/lego-parts/technic', nota: 'Desde 0,01 € por pieza, pero el envío lo pone cada vendedor: junta todo en un solo vendedor.' },
    { t: 'Bouwsteenwinkel (Países Bajos, envía a España)', url: 'https://bouwsteenwinkel.shop/es/', nota: 'Pines y ejes a 0,01 € la pieza. Tarifa de envío a España propia, que no pude ver: simula el pedido.' },
    { t: 'Wallapop: lotes de segunda mano', url: 'https://es.wallapop.com/item/lego-piezas-sueltas-construccion-1272508090', nota: 'Ejemplo que vi: un lote de piezas Technic no originales por unos 15 € (puede que ya esté vendido). Busca «lego technic lote» y pide fotos antes de comprar.' }
  ],
  eurPza: it => it.pcs ? it.eur / it.pcs : null
};

function viewCompras() {
  const euro = n => n.toFixed(2).replace('.', ',') + ' €', link = (u, txt) => h('a', { class: 'btn ghost', href: u, target: '_blank', rel: 'noopener noreferrer' }, txt || 'Ver en la tienda ↗');
  const item = it => h('div', { class: 'shop' },
    h('b', {}, it.t),
    h('div', { class: 'chips' }, it.eur != null ? h('span', { class: 'price' }, euro(it.eur)) : h('span', { class: 'chip' }, 'sin precio visto'),
      it.pcs ? h('span', { class: 'chip' }, it.pcs + ' piezas') : null, (it.pcs && it.eur) ? h('span', { class: 'chip gold' }, euro(it.eur / it.pcs) + ' / pieza') : null),
    it.para ? h('p', { class: 'muted' }, '🎯 ' + it.para) : null, it.nota ? h('p', { class: 'muted' }, it.nota) : null, link(it.url));
  const A = id => COMPRAS.ali.find(x => x.id === id), tot = A('a116').eur + A('a120').eur;
  const wrap = h('div', { class: 'view' }, topbar(), h('h2', { class: 'unit' }, '🛒 Compras', h('small', {}, 'Dónde comprar tu kit · consultado el ' + COMPRAS.fecha)));
  wrap.append(h('div', { class: 'card warn' }, h('b', {}, '⚠️ Los precios cambian cada día'), h('p', {}, 'Esto es lo que vi el ' + COMPRAS.fecha + '. Antes de pagar, abre el enlace y mira el total final con el envío y los aranceles. No he comprado nada de aquí, así que no sé cómo llegan ni qué tal encajan.')));
  wrap.append(h('h3', {}, '⭐ Mi propuesta para empezar (unos 30 €)'),
    h('div', { class: 'card' }, h('p', {}, h('b', {}, 'Plan A · '), euro(tot) + ' en total. El de 120 vigas lleva envío gratis; el de 116 piezas solo a partir de 10 € de pedido, así que si no los juntas puede cobrarte el envío (no pude ver cuánto):'),
      h('p', { class: 'muted' }, '① ' + euro(A('a116').eur) + ' · 116 piezas sueltas (pines, ejes, engranajes) y ② ' + euro(A('a120').eur) + ' · 120 vigas de 12 tamaños. Con eso montas palancas, trenes de engranajes y la manivela de las misiones.'),
      h('p', { class: 'muted' }, 'Ojo: solo vi los títulos y las cifras de la búsqueda, no el desglose exacto de piezas de cada lote.'),
      h('p', {}, h('b', {}, 'Plan B · '), 'más piezas por euro: el lote de 540 (' + euro(A('a540').eur) + ') o el de 650 (' + euro(A('a650').eur) + ').'),
      h('p', {}, h('b', {}, 'Plan C · '), 'piezas LEGO originales a medida (ver más abajo): unos 12–15 € de piezas más el envío, según mi cuenta con los precios que vi (no he simulado un pedido).')));
  wrap.append(h('h3', {}, 'AliExpress'), h('div', { class: 'card list' }, h('p', { class: 'muted' }, 'Todos con envío a España. Los precios y las ventas son los que salían en la lista de resultados.'), ...COMPRAS.ali.map(item)));
  wrap.append(h('h3', {}, 'Motor y pilas (para más adelante)'), h('div', { class: 'card list' }, h('p', { class: 'muted' }, 'Los motores compatibles suelen usar el conector «Power Functions», de LEGO: no se enchufan a cualquier cosa. Empieza con pilas AA normales, nunca con baterías de litio sueltas.'), ...COMPRAS.motor.map(item)));
  wrap.append(h('h3', {}, 'Amazon.es'), h('div', { class: 'card list' }, h('p', { class: 'muted' }, 'Amazon no me dejó abrir las fichas, así que solo tengo título y, a veces, el precio del buscador.'), ...COMPRAS.amazon.map(item)));
  wrap.append(h('h3', {}, 'Temu'), h('div', { class: 'card list' }, h('p', { class: 'muted' }, 'Temu no me mostró precios. Aquí tienes tres listados con lo que dicen que llevan; abre el enlace para ver el precio y las opiniones.'), ...COMPRAS.temu.map(item)));
  wrap.append(h('h3', {}, 'Piezas LEGO originales sueltas'), h('div', { class: 'card list' },
    h('p', { class: 'muted' }, 'Más caras que las compatibles, pero sin dudas de encaje. Se compran pieza a pieza: tú eliges cuántas.'),
    ...COMPRAS.originales.map(it => h('div', { class: 'shop' }, h('b', {}, it.t), h('p', { class: 'muted' }, it.nota), link(it.url))),
    h('p', { class: 'muted' }, 'ToyPro: pedidos de menos de 15 € llevan 1,95 € de tramitación; el envío en sobre (hasta 400 g) sale desde 5,99 € y tarda unos 4-5 días; envío gratis a partir de 150 €. Se puede cancelar gratis hasta 30 días después de recibirlo.')));
  wrap.append(h('h3', {}, 'Lo que tienes que saber antes de pagar'), h('div', { class: 'card list' },
    ...[
      ['💶', 'Desde el 1 de julio de 2026 la UE cobra 3 € de arancel por artículo en los paquetes pequeños de fuera de la UE. Los medios no cuentan igual cómo se aplica (por artículo o por categoría), y podría añadirse una tasa de gestión de 2 € más adelante. Fíjate en el total que sale al pagar.'],
      ['🚚', 'Varios listados dicen «envío gratis a partir de 10 €»: si pides una sola cosa barata, puede que pagues envío. Junta lotes en un mismo pedido.'],
      ['🎨', 'Muchos lotes vienen en colores aleatorios y sin instrucciones. Para aprender mecánica da igual.'],
      ['🔍', '«Compatible con LEGO» es lo que dice el vendedor. No encontré ninguna prueba independiente de encaje. Compra primero el lote más barato y comprueba: los pines entran con un poco de fricción, los ejes giran sueltos y los engranajes engranan sin forzar.'],
      ['⭐', 'Mira las opiniones con foto y el número de ventas, no solo la nota. Un 5 ★ con 20 ventas dice poco; un 4,9 con miles, bastante más.'],
      ['📦', 'Los tiempos de entrega varían: vi 5 días en algunos listados «premium», pero no en la mayoría. Suma semanas si el pedido sale de China.']
    ].map(([i, t]) => h('div', { class: 'row' }, h('span', {}, i + '  ' + t)))));
  wrap.append(h('div', { class: 'card warn' }, h('b', {}, 'Lo que NO pude comprobar'),
    h('p', {}, 'No abrí fichas individuales de AliExpress, Amazon ni Temu (me las bloqueaban o llegaban vacías), así que no sé cuántas vigas, pines o engranajes lleva exactamente cada lote ni desde qué almacén salen. Tampoco he verificado ningún vendedor ni el envío concreto a Catalunya (supongo que igual que al resto de España).')));
  wrap.append(h('button', { class: 'btn ghost', onclick: () => go('home') }, 'Volver al camino'));
  show(wrap);
}
