// Catálogo ligero de lecciones que el navegador necesita para calcular tu progreso (JSON incrustado en cada página).
import { visibleLessons } from "./lessons";
import { url } from "./url";
import type { Catalog } from "./game/core";

let cache: Promise<Catalog> | undefined;

export function buildCatalog(): Promise<Catalog> {
  cache ??= (async () => ({
    lessons: (await visibleLessons()).map((l) => ({
      id: l.data.id,
      unit: l.data.unit,
      title: l.data.title,
      href: url(`${l.data.unit}/${l.data.id}/`),
      duration: l.data.duration,
      piece: l.data.piece.name,
      prerequisites: l.data.prerequisites,
      xp: l.data.xp,
    })),
  }))();
  return cache;
}
