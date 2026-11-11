// Unidades del temario, en el orden del curso. `n` es el número de módulo (m{n}-NN en los ids de lección)
// y `legacy` el id de la unidad equivalente en el motor de práctica (public/practica).
export interface Unit { id: string; n: number; title: string; sub: string; icon: string; legacy: string }

export const UNITS: Unit[] = [
  { id: "seg", n: 1, title: "Seguridad, herramientas y método", sub: "Trabajar sin hacerte daño y sin perder piezas", icon: "🦺", legacy: "u_seg" },
  { id: "fuerza", n: 2, title: "Fuerza, peso y movimiento", sub: "Lo que empuja, lo que frena y cuánto cuesta moverlo", icon: "🧲", legacy: "u_fuerza" },
  { id: "vm", n: 3, title: "Ventaja mecánica", sub: "Palancas, poleas y engranajes: ganar fuerza a cambio de recorrido", icon: "⚙️", legacy: "u_vm" },
  { id: "simples", n: 4, title: "Máquinas simples y correas", sub: "Plano inclinado, tornillo, rueda y eje, correas y cadenas", icon: "🔩", legacy: "u_simples" },
  { id: "mec", n: 5, title: "Mecanismos que mueven", sub: "Biela-manivela, levas, cremallera, tornillo sin fin y trinquete", icon: "🚂", legacy: "u_mec" },
  { id: "estr", n: 6, title: "Estructuras y rigidez", sub: "Triángulos, esfuerzos y brazos que no se doblan", icon: "🏗️", legacy: "u_estr" },
  { id: "compras", n: 7, title: "Guía de compras Technic", sub: "Qué piezas necesitas y cómo comprar poco y bien", icon: "🛒", legacy: "u_compras" },
  { id: "motor", n: 8, title: "Motores y energía", sub: "Corriente, pilas, motores y reductores", icon: "🔋", legacy: "u_motor" },
  { id: "vehiculo", n: 9, title: "Vehículos Technic", sub: "Dirección, diferencial, suspensión y diagnóstico", icon: "🚗", legacy: "u_vehiculo" },
  { id: "fluidos", n: 10, title: "Neumática e hidráulica", sub: "Presión, pistones y un brazo hidráulico casero", icon: "💧", legacy: "u_fluidos" },
  { id: "cad", n: 11, title: "CAD e impresión 3D", sub: "De la idea a la pieza impresa", icon: "🖨️", legacy: "u_cad" },
  { id: "brazo", n: 12, title: "Brazos y manipuladores", sub: "Grados de libertad, pares y pinzas", icon: "🦾", legacy: "u_brazo" },
  { id: "cinem", n: 13, title: "Cinemática del brazo", sub: "Dónde llega la punta y con qué precisión", icon: "📐", legacy: "u_cinem" },
  { id: "auto", n: 14, title: "Automatización de lo cotidiano", sub: "Sensores, ascensores y cómo idear una máquina", icon: "🛗", legacy: "u_auto" },
  { id: "proy", n: 15, title: "Proyecto: tu brazo de 2-3 GDL", sub: "Requisitos, cálculos y montaje de tu brazo", icon: "🎯", legacy: "u_proy" },
];

export const RANKS = [
  { name: "Curioso", min: 0 },
  { name: "Aprendiz de taller", min: 300 },
  { name: "Montador", min: 900 },
  { name: "Mecánico", min: 2200 },
  { name: "Ingeniero de taller", min: 4500 },
];
