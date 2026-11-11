// Componentes disponibles dentro de cualquier lección .mdx SIN tener que importarlos.
// Los básicos están listados; todo lo que haya en src/components/labs/*.astro se registra solo,
// con el nombre del archivo (LeverLab.astro → <LeverLab />). Así se añade un laboratorio nuevo sin tocar este archivo.
import Block from "./Block.astro";
import Step from "./Step.astro";
import Fig from "./Fig.astro";
import Why from "./Why.astro";
import Tip from "./Tip.astro";
import Warn from "./Warn.astro";
import Mistake from "./Mistake.astro";
import Checklist from "./Checklist.astro";
import Quiz from "./Quiz.astro";
import RegisterPiece from "./RegisterPiece.astro";

const labs = import.meta.glob<{ default: unknown }>("../labs/*.astro", { eager: true });
const labComponents = Object.fromEntries(
  Object.entries(labs).map(([path, m]) => [path.split("/").pop()!.replace(".astro", ""), m.default]),
);

export const lessonComponents = { Block, Step, Fig, Why, Tip, Warn, Mistake, Checklist, Quiz, RegisterPiece, ...labComponents };
