// Unidades del temario. Cada lección .mdx declara su `unit`.
export interface Unit { id: string; title: string; sub: string; icon: string }

export const UNITS: Unit[] = [
  { id: "vm", title: "Ventaja mecánica", sub: "Palancas, poleas y engranajes: ganar fuerza a cambio de recorrido", icon: "⚙️" },
];

export const RANKS = [
  { name: "Curioso", min: 0 },
  { name: "Aprendiz de taller", min: 150 },
  { name: "Montador", min: 450 },
  { name: "Mecánico", min: 1200 },
  { name: "Ingeniero de taller", min: 3000 },
];
