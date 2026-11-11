// ESQUEMA DE CONTENIDO
// Forma obligatoria del frontmatter de cada lección. Si un archivo no la cumple, el build falla
// diciendo qué campo está mal: una lección rota nunca llega a la web.
// Las comprobaciones que necesitan ver VARIAS lecciones (prerrequisitos, ids repetidos…) están en src/lib/lessons.ts.
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const lessons = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/lessons" }),
  schema: z
    .object({
      id: z.string().regex(/^m\d{1,2}-\d{2}$/, "El id debe tener la forma m3-02 (módulo-lección)"),
      unit: z.string().regex(/^[a-z]+$/, "unit: id de la unidad (p. ej. vm)"),
      order: z.number().int().min(1),
      title: z.string().min(4),
      summary: z.string().min(10).max(220),
      practice: z.array(z.string()).default([]), // ids de lecciones del motor de práctica (public/practica) que cubren esta lección
      cover: z.string().regex(/^[a-z0-9_]+\/[a-z0-9_]+$/, "cover: ruta de la imagen sin extensión, p. ej. vm/p_hero"),
      duration: z.number().int().min(5).max(60),
      status: z.enum(["borrador", "revisada", "publicada"]),
      prerequisites: z.array(z.string()).default([]),
      objectives: z.array(z.string()).min(1).max(5),
      materials: z.array(z.string()).default([]), // lo que necesitas para montarlo (opcional: se puede hacer en pantalla)
      piece: z.object({ name: z.string(), hint: z.string().optional() }),
      xp: z.object({ concept: z.number().int().min(0), build: z.number().int().min(0), piece: z.number().int().min(1) }),
      review: z
        .object({
          examplesChecked: z.boolean().default(false), // cifras y cálculos revisados
          imagesChecked: z.boolean().default(false), // imágenes revisadas una a una
          testedByLearner: z.boolean().default(false), // solo tú puedes poner esto a true
        })
        .default({}),
    })
    .refine((l) => l.xp.piece >= 0.5 * (l.xp.concept + l.xp.build + l.xp.piece), {
      message: "Al menos el 50 % de la XP debe venir de registrar el montaje",
      path: ["xp", "piece"],
    })
    .refine((l) => l.status !== "publicada" || (l.review.examplesChecked && l.review.imagesChecked && l.review.testedByLearner), {
      message: "Una lección solo puede estar «publicada» si cifras, imágenes y prueba están revisadas",
      path: ["status"],
    }),
});

export const collections = { lessons };
