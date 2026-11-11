# Maker Student v2 · piloto (rama `v2-astro`)

Qué es: la unidad **Ventaja mecánica** (palanca, poleas, engranajes) rehecha con el formato de Forja Art / Forja Mecha.

## Decisiones (tomadas con Ruben)
- Formato híbrido: lección visual de 6 bloques (montaje, idea, montaje guiado, tu versión, errores, comprueba y registra). Los ejercicios y el repaso espaciado del PWA anterior se traerán después.
- Base técnica: Astro + MDX (como Forja Art). La app anterior está en `legacy/` y sigue funcionando en `main`.
- Imágenes: piezas genéricas tipo Technic (sin marca) modeladas por script en Blender sin interfaz: `tools/blender/maker_lib.py` y `maker_u_vm.py`.

## Regenerar las imágenes
    blender -b --factory-startup --python tools/blender/maker_u_vm.py -- all
Una sola imagen: `-- all p_hero`. Salen en `public/assets/img/vm/`.

## Pendiente
- Validador de contenido (`tools/validate.mjs`), tests y despliegue.
- Modo sin conexión e instalación en el móvil (PWA) en Astro.
- Repaso espaciado, examen, cofres, mascota, Compras.
- Revisión imagen a imagen y prueba en el móvil (`review.*` sigue en false).
