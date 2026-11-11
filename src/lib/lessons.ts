// Acceso a las lecciones + comprobaciones que necesitan ver TODAS a la vez.
import { getCollection, type CollectionEntry } from "astro:content";
import { UNITS } from "../data/units";
import legacy from "../../docs/legacy-content.json";

const LEGACY_LESSONS = new Set((legacy as { units: { lessons: { id: string }[] }[] }).units.flatMap((u) => u.lessons.map((l) => l.id)));

export type Lesson = CollectionEntry<"lessons">;

/** En local se ven todas; en producción, revisadas («en prueba») y publicadas. */
const VISIBLE_IN_PROD = new Set(["revisada", "publicada"]);
const INCLUDE_DRAFTS = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.MAKER_INCLUDE_DRAFTS === "1";

let cache: Promise<Lesson[]> | undefined;

export function allLessons(): Promise<Lesson[]> {
  cache ??= getCollection("lessons").then((list) => {
    validate(list);
    return list.sort((a, b) => a.data.id.localeCompare(b.data.id, "en", { numeric: true }));
  });
  return cache;
}

export async function visibleLessons(): Promise<Lesson[]> {
  const list = await allLessons();
  return import.meta.env.PROD && !INCLUDE_DRAFTS ? list.filter((l) => VISIBLE_IN_PROD.has(l.data.status)) : list;
}

export const lessonXp = (l: Lesson) => l.data.xp.concept + l.data.xp.build + l.data.xp.piece;

function validate(list: Lesson[]) {
  const errors: string[] = [];
  const ids = new Map<string, string>();
  for (const l of list) {
    const { id, unit } = l.data;
    const where = `src/content/lessons/${l.id}.mdx`;
    if (ids.has(id)) errors.push(`${where}: id «${id}» repetido (también en ${ids.get(id)})`);
    ids.set(id, where);
    const u = UNITS.find((x) => x.id === unit);
    if (!u) errors.push(`${where}: la unidad «${unit}» no existe en src/data/units.ts`);
    else if (!id.startsWith(`m${u.n}-`)) errors.push(`${where}: el id «${id}» no empieza por m${u.n}- (módulo de la unidad ${unit})`);
    for (const p of l.data.practice) if (!LEGACY_LESSONS.has(p)) errors.push(`${where}: practice «${p}» no existe en el motor de práctica`);
  }
  for (const l of list)
    for (const p of l.data.prerequisites) if (!ids.has(p)) errors.push(`src/content/lessons/${l.id}.mdx: prerrequisito «${p}» no existe`);
  if (errors.length) throw new Error(`\n\nContenido no válido:\n  - ${errors.join("\n  - ")}\n`);
}
