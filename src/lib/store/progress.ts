// Progreso en el navegador (localStorage). Si está bloqueado (modo privado), la web sigue funcionando sin guardar.
import { parseState, type Part, type ProgressState } from "../game/core";

const KEY = "maker-student:progress";
export const PROGRESS_EVENT = "maker:progress";

export function loadProgress(): ProgressState {
  try { return parseState(localStorage.getItem(KEY)); } catch { return parseState(null); }
}
function save(s: ProgressState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* sin almacenamiento */ }
  window.dispatchEvent(new CustomEvent(PROGRESS_EVENT, { detail: s }));
}
export function setPart(lessonId: string, part: Part, done: boolean) {
  const s = loadProgress();
  const l = (s.lessons[lessonId] ??= { parts: {} });
  if (done) l.parts[part] ??= new Date().toISOString();
  else delete l.parts[part];
  save(s);
}
export function setChecks(lessonId: string, checks: number[]) {
  const s = loadProgress();
  (s.lessons[lessonId] ??= { parts: {} }).checks = checks;
  save(s);
}
export function setQuiz(lessonId: string, q: string, answer: number) {
  const s = loadProgress();
  const l = (s.lessons[lessonId] ??= { parts: {} });
  (l.quiz ??= {})[q] = answer;
  save(s);
}
export function onProgress(fn: (s: ProgressState) => void) {
  fn(loadProgress());
  window.addEventListener(PROGRESS_EVENT, () => fn(loadProgress()));
  window.addEventListener("storage", (e) => e.key === KEY && fn(loadProgress()));
}
