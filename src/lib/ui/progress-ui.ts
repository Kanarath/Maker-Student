// Interfaz de progreso compartida: la píldora de XP de la cabecera y las tarjetas de lección de la portada.
// Lee el catálogo incrustado en la página (#maker-catalog) y se actualiza solo cuando cambia el progreso.
import { onProgress } from "./../store/progress";
import { isComplete, isStarted, lessonXp, nextLesson, rankFor, totalXp, type Catalog } from "../game/core";
import { RANKS } from "../../data/units";

const el = document.getElementById("maker-catalog");
const catalog: Catalog = el ? JSON.parse(el.textContent ?? "{}") : { lessons: [] };

onProgress((s) => {
  const xp = totalXp(catalog.lessons, s);
  const rank = rankFor(xp, RANKS);

  const pill = document.querySelector<HTMLElement>("[data-xp-pill]");
  if (pill) {
    pill.hidden = false;
    pill.querySelector("[data-xp-total]")!.textContent = String(xp);
    pill.querySelector("[data-xp-rank]")!.textContent = rank.current.name;
  }

  document.querySelectorAll<HTMLElement>("[data-rank-name]").forEach((n) => (n.textContent = rank.current.name));
  document.querySelectorAll<HTMLElement>("[data-rank-next]").forEach((n) => {
    n.textContent = rank.next ? `${rank.next.min - xp} XP para «${rank.next.name}»` : "Rango máximo";
  });
  document.querySelectorAll<HTMLElement>("[data-xp-bar]").forEach((n) => {
    const from = rank.current.min, to = rank.next?.min ?? rank.current.min + 1;
    n.style.setProperty("--p", `${Math.round(((xp - from) / (to - from)) * 100)}%`);
  });
  document.querySelectorAll<HTMLElement>("[data-xp-total-big]").forEach((n) => (n.textContent = String(xp)));

  const next = nextLesson(catalog.lessons, s);
  document.querySelectorAll<HTMLAnchorElement>("[data-next-lesson]").forEach((a) => {
    if (!next) { a.hidden = true; return; }
    a.hidden = false;
    a.href = next.href;
    const started = isStarted(next, s);
    a.querySelector("[data-next-verb]")!.textContent = started ? "Sigue con" : "Empieza";
    a.querySelector("[data-next-title]")!.textContent = next.title;
  });

  for (const l of catalog.lessons) {
    const card = document.querySelector<HTMLElement>(`[data-lesson-card="${l.id}"]`);
    if (!card) continue;
    const done = isComplete(l, s);
    const got = lessonXp(l, s);
    const max = l.xp.concept + l.xp.build + l.xp.piece;
    card.classList.toggle("done", done);
    card.classList.toggle("started", !done && isStarted(l, s));
    const state = card.querySelector<HTMLElement>("[data-state]");
    if (state) state.textContent = done ? "✓ Hecha" : isStarted(l, s) ? `En marcha · ${got}/${max} XP` : `+${max} XP`;
  }
});
