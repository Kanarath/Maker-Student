# Guía para escribir lecciones de Maker Student v2

Proyecto: `C:\Users\Ruben\Desktop\KREATIONS\Aprendizaje\Web\Taller de Inventor` (rama `v2-astro`). Web en español para aprender mecánica y mecatrónica **montando piezas reales** (Lego Technic y similares, impresión 3D, brazos; sin Arduino). Alumno: Ruben, TDAH, muy visual, principiante. Sin castigos, sin prisas. Tono cercano, frases cortas, párrafos de 1-3 líneas, negritas en lo clave.

## Qué hay hecho (léelo antes de escribir nada)
- **Lecciones de referencia (el patrón a seguir):** `src/content/lessons/mecanica/m3-01-palanca.mdx`, `m3-02-poleas.mdx`, `m3-03-engranajes.mdx`.
- **Componentes de lección** (disponibles en MDX sin importar): `src/components/lesson/*.astro` y `src/components/labs/*.astro` (se registran solos por nombre de archivo). Mira `Block`, `Step`, `Fig`, `Why`, `Tip`, `Warn`, `Mistake`, `Checklist`, `Quiz`, `RegisterPiece`, `LeverLab`, `GearLab`, `PulleyLab`.
- **Esquema obligatorio del frontmatter:** `src/content.config.ts` (el build falla si algo está mal). Ids de lección: `m{n}-{NN}` con `n` el número de módulo de tu unidad (ver `src/data/units.ts`). `unit` = id de la unidad (p. ej. `estr`). `status: borrador` SIEMPRE; `review.*` SIEMPRE false (solo Ruben los pone a true). `practice` = ids de lecciones del motor de práctica que cubren la lección (están en `docs/legacy-content.json`, p. ej. `l_triangulo`).
- **Fuente de contenido:** `docs/legacy-content.json` → tu unidad (`units[].id` = `u_...`): lecciones, notas, «sabías que» (`curio`), misión práctica (`mission`) y todos los ejercicios (`items`: términos, hechos con la respuesta correcta, cálculos, ordenar pasos, casos). **Es la base de verdad de los datos**: conserva sus hechos, cifras y cautelas. No inventes datos técnicos, fechas ni precios. Si añades un dato que no está en el JSON y no estás seguro, escríbelo con cautela («suele», «aproximadamente») o no lo pongas. Recalcula siempre cada cifra que escribas.

## Cada lección (formato híbrido de 6 bloques)
Usa los `<Block kind="…">` en este orden: `pieza`, `concepto`, `montaje`, `version`, `errores`, `calidad`.
1. **pieza**: qué vas a montar/hacer y una imagen hero. Si no hay montaje físico posible (seguridad, compras, CAD…), el «montaje» es el producto concreto de la lección (tu zona de trabajo, tu lista de compra, tu primer modelo…); igualmente se registra con foto/nota.
2. **concepto**: la idea con imágenes + «predice antes de mirar» + `<details>` con la respuesta + un `<Why>`. Incluye un laboratorio interactivo si hay algo que calcular o mover (reutiliza `LeverLab/GearLab/PulleyLab` si aplica o crea uno nuevo). Al menos un `<Quiz>`.
3. **montaje**: 3-6 `<Step img=… alt=…>` con imagen por paso (lo nuevo en color, lo anterior en gris). Cada paso: acción concreta + `<Why>` cuando haya motivo. Avisos `<Warn>` de seguridad si el JSON los menciona o la tarea los exige.
4. **version**: 2-3 retos con «predice y comprueba»; usa la misión del JSON (`mission`) como base de la unidad.
5. **errores**: ≥1 `<Mistake>` con imagen mal/bien (`slot="wrong"` / `slot="right"`) basada en los fallos típicos de los ejercicios del JSON.
6. **calidad**: `<Checklist>`, ≥1 `<Quiz>` más, y `<RegisterPiece piece="…" />`.
Añade el «Sabías que» de cada lección del JSON como `<Tip title="Sabías que…">` (conserva sus cautelas).
Cada lección dura 20-40 min (`duration`), `xp: { concept: 10, build: 20, piece: 40 }` (piece ≥ 50 % del total). Reparte la unidad en **2-4 lecciones nuevas** que cubran TODAS las lecciones/ideas del JSON (no dejes conceptos fuera). `practice` lista las lecciones legacy que cubre cada lección nueva (todas las legacy de la unidad deben aparecer en alguna).
Quizzes: `id` único por lección (`q1`, `q2`…), 3 opciones, `answer` = índice 0-based **verificado**. Reparte las respuestas correctas entre las posiciones.

## Imágenes con Blender (sin interfaz)
- Blender 4.2: `"C:\Program Files\Blender Foundation\Blender 4.2\blender.exe" -b --factory-startup --python tools/blender/maker_u_<unidad>.py -- all [nombre ...]`
- **Biblioteca compartida:** `tools/blender/maker_lib.py` (NO la edites): `reset, studio, eevee, camera, render, beam, pin, axle, gear, pulley, weight, arrow, arc_arrow, rope, plane, place, set_mat, group_rotate, M (materiales), hexc, Parts`… Unidad de medida: 1 = un paso entre agujeros (8 mm). Lee `tools/blender/maker_u_vm.py` entero: es el modelo a imitar (decorador `@image`, `begin()/purge()`, `Parts.show(k)` para pasos con lo nuevo en color y lo anterior en gris).
- **Tu archivo:** `tools/blender/maker_u_<unidad>.py` (uno por unidad; copia la estructura de `maker_u_vm.py`). Si necesitas piezas nuevas (leva, cremallera, tornillo sin fin, resorte, muelle, pistón, jeringuilla, motor, rueda, batería, pinza…), defínelas **en tu archivo** con bmesh/primitivas, mismo estilo visual (colores de `COLORS`, bisel, suelo oscuro). No toques `maker_lib.py` ni archivos de otras unidades.
- **Salida:** `public/assets/img/<unidad>/<nombre>.webp`, 1280×720, `SAMPLES` ~40. Un `.webp` ≤ 300 KB.
- **Revisa CADA imagen** con la herramienta Read (la ves). Busca: piezas atravesadas, flechas en mal sentido, encuadre cortado, objetos tapados, etiquetas que se pisan, física incorrecta (los engranajes deben engranar a la distancia correcta, la cuerda debe seguir un recorrido posible…). Corrige y vuelve a renderizar hasta que la imagen sea correcta y clara. Una imagen que no explica nada es peor que ninguna: si no puedes representar bien algo, usa un esquema SVG/HTML dentro de la lección o un laboratorio en vez de un render malo.
- Orientación: una cámara 3/4 ligeramente elevada, fondo oscuro, flechas emisivas (`acento` naranja, `cian`, `bien` verde, `mal` rojo) para fuerzas y movimientos. Sin texto dentro del render (el texto va en el pie de figura o en HTML).
- `<Fig src="<unidad>/<nombre>" alt="…" caption="…" />` y `<Step img="<unidad>/<nombre>" alt="…">`. **`alt` descriptivo siempre** (qué se ve, con colores y posiciones).

## Laboratorios nuevos (cuando aporten)
`src/components/labs/<Nombre>.astro` con SVG + script, como `LeverLab.astro` (lee uno entero). Nombre único (sin chocar con otras unidades: añade un prefijo claro, p. ej. `RampLab`, `CamLab`). Accesible: botones/deslizadores con etiquetas, respeta `prefers-reduced-motion`, funciona en móvil (viewBox, sin ancho fijo). Los cálculos deben ser correctos: compruébalos con números de ejemplo en la propia salida.

## Reglas de calidad y honestidad
- Hechos técnicos exactos; la física con ecuaciones correctas y unidades. Distingue lo que el alumno verá con lo que es teoría ideal (rozamiento, etc.).
- Seguridad real donde toque (corte, pilas/baterías LiPo, calor de la impresora, presión, jeringuillas sin aguja, etc.).
- Español de España, sin anglicismos innecesarios; el término técnico en inglés solo si es el estándar, con su traducción.
- Accesible: contraste, `alt`, listas reales, sin información solo por color (la flecha verde/roja siempre va con texto «Así sí/Así no»).
- No uses marcas registradas en imágenes. Habla de «piezas tipo Technic».

## Cómo comprobar tu trabajo
- Build: `MAKER_INCLUDE_DRAFTS=1 MAKER_OUT_DIR=./.build-<unidad> npx astro build` (cada agente su carpeta de salida para no pisarse). Debe terminar sin errores y generar tus páginas. Borra `./.build-<unidad>` al acabar.
- No arranques servidores de desarrollo, **no hagas commit ni push**, no edites `units.ts`, `content.config.ts`, `BaseLayout`, `package.json`, `public/practica/`, ni archivos de otras unidades.

## Qué entregas al terminar
Un informe corto: lecciones creadas (ids y títulos), nº de imágenes, laboratorios nuevos, qué legacy cubre cada lección, datos que has dudado y cómo los has tratado, y cualquier cosa que no hayas podido hacer bien (sé honesto).
