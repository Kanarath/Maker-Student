# Taller de Inventor (MVP)

PWA sin build para aprender mecánica y mecatrónica sin castigos. Unidad incluida: **Ventaja mecánica** (palancas, poleas, engranajes), 5 lecciones.

## Probar en local (Windows, sin Node ni Python)
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/serve.ps1 -Root . -Port 8130
# abrir http://localhost:8130/
```
## Pruebas (siempre en silencio)
En la consola de la página: `S.settings.sound=false; S.settings.vibrate=false;` y luego pegar `tools/validate.js` y `tools/bot.js`.

## Reglas
- No cambiar nunca los `id` de contenido ya creado. Contenido nuevo = ids nuevos.
- Subir `CACHE` en `sw.js` en cada versión y listar los ficheros nuevos.
- No publicar nada sin autorización de Ruben.
