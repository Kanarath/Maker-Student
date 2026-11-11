// Componentes disponibles dentro de cualquier lección .mdx SIN tener que importarlos.
// La página de lección los pasa a MDX con <Content components={lessonComponents} />.
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
import LeverLab from "../labs/LeverLab.astro";
import GearLab from "../labs/GearLab.astro";
import PulleyLab from "../labs/PulleyLab.astro";

export const lessonComponents = { Block, Step, Fig, Why, Tip, Warn, Mistake, Checklist, Quiz, RegisterPiece, LeverLab, GearLab, PulleyLab };
