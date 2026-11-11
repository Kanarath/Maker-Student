// LÓGICA PURA DE PROGRESO: recibe datos y devuelve resultados. No toca el navegador (se prueba con tests).
// Principio: solo se GUARDA lo que hiciste (qué partes completaste). XP, rango y «siguiente lección» se CALCULAN.
// Sin castigos: nada baja, nada caduca.

export type Part = "concept" | "build" | "piece";
export const PARTS: Part[] = ["concept", "build", "piece"];

export interface CatalogLesson {
  id: string;
  unit: string;
  title: string;
  href: string;
  duration: number;
  piece: string;
  prerequisites: string[];
  xp: Record<Part, number>;
}
export interface Catalog { lessons: CatalogLesson[] }

export interface ProgressState {
  version: 1;
  lessons: Record<string, { parts: Partial<Record<Part, string>>; checks?: number[]; quiz?: Record<string, number> }>;
}
export const emptyState = (): ProgressState => ({ version: 1, lessons: {} });

export interface Rank { name: string; min: number }

export function lessonXp(l: CatalogLesson, s: ProgressState): number {
  const done = s.lessons[l.id]?.parts ?? {};
  return PARTS.reduce((sum, p) => sum + (done[p] ? l.xp[p] : 0), 0);
}
export const isComplete = (l: CatalogLesson, s: ProgressState) => PARTS.every((p) => !!s.lessons[l.id]?.parts[p]);
export const isStarted = (l: CatalogLesson, s: ProgressState) => PARTS.some((p) => !!s.lessons[l.id]?.parts[p]);

export const totalXp = (cat: CatalogLesson[], s: ProgressState) => cat.reduce((a, l) => a + lessonXp(l, s), 0);

export function rankFor(xp: number, ranks: Rank[]) {
  let i = 0;
  while (i + 1 < ranks.length && xp >= ranks[i + 1].min) i++;
  return { current: ranks[i], next: ranks[i + 1] as Rank | undefined };
}

const prereqsMet = (l: CatalogLesson, cat: CatalogLesson[], s: ProgressState) =>
  l.prerequisites.every((id) => {
    const p = cat.find((x) => x.id === id);
    return !p || isComplete(p, s);
  });

/** Siguiente lección recomendada: primero la que dejaste a medias, luego la primera sin hacer con requisitos cumplidos. */
export function nextLesson(cat: CatalogLesson[], s: ProgressState) {
  const pending = cat.filter((l) => !isComplete(l, s));
  return pending.find((l) => isStarted(l, s)) ?? pending.find((l) => prereqsMet(l, cat, s)) ?? pending[0];
}

/** Valida lo guardado: si está corrupto, empieza de cero. */
export function parseState(raw: string | null): ProgressState {
  if (!raw) return emptyState();
  try {
    const s = JSON.parse(raw);
    if (s?.version !== 1 || typeof s.lessons !== "object" || s.lessons === null) return emptyState();
    return s as ProgressState;
  } catch {
    return emptyState();
  }
}
