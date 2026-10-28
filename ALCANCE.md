# ALCANCE — Taller de Inventor (nombre provisional)

> Se rellena **tras la entrevista** (`01-entrevista-inicial.md`). Nada se construye hasta que Ruben lo apruebe.
> Estado: ☑ borrador ☐ aprobado por Ruben (fecha: ____)

## 1. Resumen en una frase
Una app gamificada y sin castigos para aprender **mecatrónica con peso en mecánica** (mecanismos, transmisiones, brazos, CAD/impresión 3D y automatización básica) hasta poder **diseñar y construir un brazo de 2-3 grados de libertad**, en sesiones de 2-3 minutos, en Android (y PC).

## 2. Motivación y meta final
- Motivo: entender cómo funcionan las cosas (puertas automáticas, ascensores, brazos mecánicos), montar Lego Technic y, a la larga, **inventar**. Algo táctil, orgánico, "de ingeniería", no de software.
- "Haberlo conseguido" = **diseñar y construir un brazo** (mecánica). Reformulado en la entrevista: no se pide programarlo.
- Proyecto estrella / capstone: brazo robótico de 2-3 GDL (en Lego Technic y/o con piezas impresas en 3D).
- Plazo: sin prisa.

## 3. Rama y enfoque
- Rama: **Mecatrónica con peso en mecánica**. Sin Arduino/ESP32 ni programación por ahora.
- Intereses principales: mecanismos y transmisiones · brazos y manipuladores · impresión 3D y CAD · electricidad/motores/automatización.
- Enfoque: **mixto** — el objetivo es montar con las manos, pero hoy no tiene piezas Technic; por eso cada misión tendrá **versión con piezas reales y versión simulada/CAD**.
- Extra pedido: **módulo de asesoría de compra de Lego Technic y compatibles** (por dónde empezar, qué comprar, cuándo, alternativas baratas).

## 4. Punto de partida (de la entrevista)
| Área | Nivel |
|---|---|
| Matemáticas | Básico (reglas de tres, porcentajes, ecuaciones sencillas) |
| Física/electricidad | Intuición, sin teoría formal |
| Programación | No desea (por ahora) |
| Experiencia práctica | Ha jugado con Lego (normal y algo de ruedas, nada de Technic); ha usado CAD; herramientas básicas de taller |
- Test de nivel inicial: ☐ sí ☑ no (empieza desde el principio)

## 5. Nivel de llegada de esta versión
- Nivel objetivo: **Nivel 3 · Técnico** como hoja de ruta, entregado **por unidades** empezando por un MVP.
- Profundidad: **muy visual, intuición primero, teoría solo si va respaldada de práctica o juego**; entender el porqué y saber desarrollar soluciones, sin enfoque matemático. Mentalidad de inventor.
- Matemáticas dentro de la app: **cálculos sencillos** (relación de transmisión, palancas con regla de tres, velocidad/par).

## 6. Recursos y práctica
- Hardware: Lego normal + ruedas; **sin Technic ni motores**; herramientas básicas. Impresora 3D: sin confirmar.
- Presupuesto: **bajo (≈ hasta 30 €)** → prioridad a compatibles baratos y segunda mano.
- Simuladores: Tinkercad / FreeCAD / Fusion y simuladores de mecanismos en navegador.
- Software en PC: Windows, puede instalar.
- Misiones prácticas: **solo cuando él quiera**; nunca calendario.

## 7. Tiempo y ritmo
- Minutos/día: 10-15 · Sesión típica: 2-3 min (3-4 al día)
- Recordatorios: **ninguno**

## 8. Estética y gamificación
- Mascota: **animal-robot original** (dibujo propio SVG, a diseñar y aprobar) · apariciones (cameo) como Chopper, apagable.
- Temática/colores: **taller / laboratorio de inventor** (cuaderno de inventor, planos, piezas). Paleta por decidir (sin cambios sin preguntarle).
- Rangos: Aprendiz → Montador → … → Inventor (nombres por cerrar).
- Colección (en vez de ramen/sushi): **piezas, mecanismos e inventos**.
- Sonido/vibración: activables en ajustes.
- Reglas anti-castigo confirmadas: ☑ (sin vidas, energía, rachas que se pierdan ni atrasos)

## 9. Plataforma y publicación
- Dispositivo: Android (PWA instalada) y también PC · Sin conexión: ☑ · Sincronización: ☐ (copia de seguridad manual)
- Despliegue: GitHub Pages en `Kanarath`, **a decidir más adelante**; no se crea nada sin su autorización · Repo: por decidir · URL prevista: —
- Imágenes: solo propias/licencia ☑. "LEGO" y "Technic" aparecen solo como texto, sin logos ni fotos.

## 10. Mapa del temario (propuesta, ver opciones abajo)
| Unidad | Lecciones (nº) | Tipos de ejercicio | Misión práctica | Prerrequisitos |
|---|---|---|---|---|
| 1 Seguridad, herramientas y método de inventor | 3-4 | fact, order, debug | Banco de trabajo seguro | — |
| 2 Fuerza, peso y movimiento (intuición) | 4-5 | term, fact, identify | Medir y comparar pesos/fuerzas | 1 |
| 3 Palancas y poleas | 5 | calc, identify, debug | Palanca con piezas o en simulador | 2 |
| 4 Engranajes y transmisiones | 5-6 | calc, order, debug | Tren de engranajes y reducción | 3 |
| 5 Mecanismos que mueven | 5-6 | identify, fact, debug | Leva / biela-manivela / tornillo sin fin | 4 |
| 6 Estructuras y rigidez | 4 | identify, debug | Reforzar un montaje | 2 |
| 7 Guía de compras Lego Technic y compatibles | 4 | fact, case | Lista de compra ≤ 30 € | — (transversal) |
| 8 Motores y energía (seguro) | 4-5 | term, calc, debug | Motor + transmisión | 4 |
| 9 CAD e impresión 3D | 5 | order, identify, debug | Diseñar un soporte | 6 |
| 10 Brazos y manipuladores | 5-6 | identify, calc, debug | Brazo de 2 GDL | 3-6, 8 |
| 11 Automatización de lo cotidiano | 4-5 | case, debug, order | Cómo funciona una puerta automática | 8 |
| 12 Proyecto: brazo de 2-3 GDL | 3-4 | case, order | Construcción completa | 10 |

### Opciones de arquitectura del temario
- **Opción A (recomendada) · "Mecánica primero, con el brazo como hilo"**: el orden de arriba; cada unidad cierra con una "pieza del brazo" que se va acumulando. Ventaja: base sólida y motivación constante. Contra: el brazo completo llega tarde.
- **Opción B · "Por casos del mundo real"**: unidades en torno a máquinas (puerta automática, ascensor, grúa, brazo) y se aprende la mecánica necesaria en cada una. Ventaja: más "inventor" y muy visual. Contra: conceptos repartidos, más difícil de ordenar y validar los prerrequisitos.

## 11. MVP (primera entrega)
- Unidad(es): **Unidad 3 · Palancas y poleas + arranque de Unidad 4 · Engranajes** (ventaja mecánica), con lo mínimo de las unidades previas como notas.
- Contenido: 5 lecciones, repaso espaciado, examen corto; mascota, cofres de piezas y rangos ya funcionando; ejercicios visuales (SVG propios).
- Criterio de "hecho": se juega entera en el móvil, sin errores, en silencio probado, con copia de seguridad.

## 12. Hitos
1. MVP jugable → Ruben lo prueba y opina.
2. Unidades 2..12 (de una en una, validando).
3. Examen de nivel + pulido visual.
4. Despliegue y guía de instalación (solo con su autorización).

## 13. Riesgos / decisiones abiertas
- **Nivel 3 es muy grande** para una primera versión: se trata como hoja de ruta, no como entrega única.
- **Meta "programar" cambiada a "diseñar y construir"**: si más adelante quiere control/código, será una rama opcional.
- **Guía de compras**: precios, tiendas y marcas cambian; se marcará como orientativa y con fecha, y se verificará antes de afirmar nada concreto.
- **Impresora 3D**: sin confirmar que tenga acceso; las misiones de CAD tendrán alternativa.
- **Seguridad**: avisos reales en herramientas, baterías, motores e impresión 3D (calor, humos).
- **Cobertura de ejercicios visuales**: requiere muchos SVG propios (mecanismos, engranajes, palancas); es el mayor coste de contenido.
- Nombre de la app, mascota, paleta y nombres de rangos: por decidir.

## 14. Registro de decisiones
| Fecha | Decisión | Motivo |
|---|---|---|
| 2026-10-27 | Mecatrónica con peso en mecánica; sin Arduino/ESP32 ni programación | Preferencia por lo táctil e ingeniería |
| 2026-10-27 | Meta: diseñar y construir un brazo, no programarlo | Aclarado en la entrevista |
| 2026-10-27 | Sin test de nivel inicial | Prefiere empezar desde el principio |
| 2026-10-27 | Mascota animal-robot original, taller de inventor | Sin derechos de autor; encaja con inventar |
| 2026-10-27 | Sin recordatorios; misiones solo cuando quiera | TDAH, cero presión |
| 2026-10-27 | Despliegue a decidir; imágenes solo propias | Control de Ruben |
| 2026-10-27 | Alcance aprobado, Opción A. MVP = unidad `u_vm` «Ventaja mecánica» con 5 lecciones (palanca, calcular palancas, poleas, engranajes, engranajes en acción) | Aprobación explícita de Ruben |
| 2026-10-27 | Nombre provisional «Taller de Inventor»; mascota zorro-robot «Tuerca» (provisional) | Pendiente de que Ruben los apruebe |
| 2026-10-27 | Rediseño blueprint futurista (teal + dorado + blancos/negros, sin cuadrícula) y mascota robot-dron | Feedback de Ruben: el aspecto anterior no le gustaba |
| 2026-10-27 | Unidad u_compras «Guía de compras Technic» (4 lecciones) sin precios; orientativa, basada en foros y reseñas consultados en oct 2026 | Pedido de Ruben; los precios no se pudieron verificar |
| 2026-10-27 | Unidad `u_mec` «Mecanismos que mueven» (5 lecciones) con figuras animadas; tarjeta «Sabías que…» en 10 lecciones y misiones prácticas en 3 unidades | Ruben pidió más material coherente, con anécdotas y ayudas de comprensión; datos comprobados en fuentes (oct 2026) |
| 2026-10-27 | Unidad `u_fuerza` «Fuerza, peso y movimiento» (4 lecciones: fuerza y peso, fuerzas que se suman, rozamiento, trabajo y energía), colocada la primera del camino; con rozamiento animado, 4 curiosidades y misión con goma elástica | Ruben eligió continuar con la base física; Estructuras queda para después |
| 2026-10-28 | Unidad `u_estr` «Estructuras y rigidez» (4 lecciones: triángulos, estirar/apretar/doblar, voladizos, reforzar un montaje), al final del camino; con 2 animaciones (marco cuadrado frente a triangulado, dos voladizos), 4 curiosidades y misión con cartón o papel; arreglo del enlace de animaciones dentro de las lecciones | Ruben pidió empezar por Estructuras; conecta con el brazo (voladizo, momento en la base) |
| 2026-10-28 | Seis unidades nuevas en ficheros aparte (content2-4.js, registradas con addUnits): `u_seg` Seguridad, herramientas y método (primera del camino), `u_motor` Motores y energía (con baterías seguras), `u_cad` CAD e impresión 3D, `u_brazo` Brazos y manipuladores (animación de brazo de 2 eslabones), `u_auto` Automatización de lo cotidiano y `u_proy` Proyecto: tu brazo de 2-3 GDL. Total: 43 lecciones, 264 ejercicios, 11 misiones, 34 curiosidades | Ruben pidió implementar de golpe todas las unidades restantes del mapa; quedan examen final y guía de instalación |
| 2026-10-28 | Examen final del curso (3 veces más largo, 63 preguntas) con resultado por tema/unidad además de por tipo; guía de instalación dentro de la app (Android, PC, iPhone y qué hacer si dice «ya instalada»), en la pestaña Taller | Ruben pidió seguir con lo pendiente (examen final y guía de instalación); queda el pulido visual según lo que vaya viendo en el móvil |
