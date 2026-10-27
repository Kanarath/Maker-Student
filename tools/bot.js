// BOT JUGADOR EN SILENCIO — pégalo en la consola de la página de pruebas.
// Juega todas las lecciones al azar, resuelve el orden de pasos y los emparejamientos, y llega a resultados.
// NO suena nada (apaga sonido, vibración). Mira el resultado con: await botEstado()
window.__bot = { hecho: {}, fallos: {}, errs: [], fin: false };
window.addEventListener('error', e => __bot.errs.push(e.message));
S.settings.sound = false; S.settings.vibrate = false;           // ← SILENCIO
window.botEstado = async (ms = 0) => { await new Promise(r => setTimeout(r, ms)); return { jugadas: Object.keys(__bot.hecho).length, fin: __bot.fin, fallos: __bot.fallos, errs: __bot.errs }; };
(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function jugar(lessonId) {
    startLesson(LESSON_BY_ID[lessonId]); let g = 0, why = '';
    try {
      while (SS && g++ < 600) {
        await sleep(12);
        if (document.querySelector('.foot.fb')) { document.querySelector('.foot .btn').click(); continue; }
        if (document.querySelector('.steps')) {                       // ordenar pasos: buscar el item y pulsar en orden
          const it = LESSON_BY_ID[lessonId].items.map(i => ITEMS[i]).find(x => x.kind === 'order' && document.querySelector('.q')?.textContent === x.prompt);
          if (it) for (const s of it.steps) [...document.querySelectorAll('.steps .bank .tile')].find(b => b.textContent === s)?.click();
          else document.querySelectorAll('.steps .bank .tile').forEach(b => b.click());
          await sleep(20); document.querySelector('.foot .btn')?.click(); continue;
        }
        const o = document.querySelectorAll('.opt');
        if (o.length) {
          const labels = [...o].map(x => x.textContent.replace(/^\d/, ''));
          if (new Set(labels).size !== labels.length) why += 'opciones repetidas: ' + labels.join(' | ') + ' ';
          if (labels.length < 3) why += 'pocas opciones: ' + labels.join(' | ') + ' ';
          o[Math.floor(Math.random() * o.length)].click(); continue;
        }
        if (document.querySelector('.matchgrid')) {
          for (let k = 0; k < 14 && document.querySelector('.mt:not(.gone)'); k++) { const L = [...document.querySelectorAll('.col:first-child .mt:not(.gone)')], R = [...document.querySelectorAll('.col:last-child .mt:not(.gone)')]; L[0].click(); R[k % R.length].click(); await sleep(420); }
          await sleep(600); continue;
        }
        document.querySelector('.foot .btn')?.click();
      }
    } catch (e) { why += 'ERR ' + e.message; }
    const ok = !!document.querySelector('.results'); if (!ok || why) __bot.fallos[lessonId] = why || ('bucle g=' + g); go('home'); return ok;
  }
  for (const u of UNITS) for (const l of u.lessons) __bot.hecho[l.id] = await jugar(l.id);
  __bot.fin = true;
})();
'bot en marcha (silencio)';
