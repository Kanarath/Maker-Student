# Maker Student

Web para aprender **mecánica y mecatrónica montando piezas reales** (Lego Technic y similares, impresión 3D, brazos de 2-3 grados de libertad). Sin vidas, sin rachas que se pierdan, sin prisa. Todo el progreso y las fotos de tus montajes viven **solo en tu navegador**.

Web: https://kanarath.github.io/Maker-Student/

## Cómo funciona

| Qué | Dónde |
|---|---|
| **Lecciones visuales** (6 bloques: el montaje, la idea, montaje guiado, tu versión, errores típicos, comprueba y registra) | `src/content/lessons/<unidad>/*.mdx` |
| **Laboratorios interactivos** (palanca, engranajes, poleas…) | `src/components/labs/*.astro` (se registran solos) |
| **Imágenes** generadas con Blender sin interfaz | `tools/blender/` → `public/assets/img/<unidad>/` |
| **Práctica** (repaso espaciado, examen, cofres, mascota, compras) | `public/practica/` (motor anterior, enlazado desde cada lección con `?leccion=…`) |
| **Mis montajes** (foto + nota, IndexedDB) | `src/pages/montajes.astro` |

Guía para escribir lecciones: [`docs/GUIA-DE-LECCIONES.md`](docs/GUIA-DE-LECCIONES.md). Contenido del motor anterior (fuente de datos): `docs/legacy-content.json` (se regenera con `node tools/extract-legacy.mjs`).

## Desarrollo local

Requiere Node 22.12 o superior.

```bash
npm install
npm run dev        # http://localhost:4321/Maker-Student/  (ves también los borradores)
npm test           # lógica de progreso
npm run validate   # compila con borradores y revisa enlaces, alt, bloques, preguntas, imágenes
npm run check      # test + validate
npm run deploy     # check + build y sube dist/ a la rama gh-pages
```

## Regenerar las imágenes

```bash
blender -b --factory-startup --python tools/blender/maker_u_vm.py -- all
```

Cada unidad tiene su `tools/blender/maker_u_<unidad>.py`; todas usan la biblioteca de piezas `maker_lib.py`.

## Despliegue

El repositorio **no usa GitHub Actions**. `npm run deploy` pasa tests y validación, construye con Astro y sube el resultado a la rama `gh-pages`; en GitHub, Pages está en «Deploy from a branch: `gh-pages` / (root)».

## Estado de las lecciones

Cada lección tiene `status: borrador | revisada | publicada`. Solo tú puedes marcar `review.testedByLearner` tras probarla; sin eso no puede estar «publicada». En la web se ven las «revisadas» con la etiqueta «En prueba».
