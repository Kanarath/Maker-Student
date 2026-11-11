// Extrae el contenido del motor anterior (public/practica/content*.js) a docs/legacy-content.json
// para que las lecciones nuevas lo usen como fuente (ejercicios, notas, curiosidades y misiones).
import fs from "node:fs";
import vm from "node:vm";
const dir = "public/practica/";
const files = ["content.js", "content2.js", "content3.js", "content4.js", "content5.js"];
const src = files.map((f) => fs.readFileSync(dir + f, "utf8")).join("\n;\n");
const ctx = { console, Math, Date, JSON, window: {}, document: { createElementNS() { return {}; } }, localStorage: {} };
vm.createContext(ctx);
vm.runInContext(src + "\n;globalThis.__out = { UNITS, ITEMS, MISIONES, CURIOS };", ctx, { filename: "content" });
const { UNITS, ITEMS, MISIONES } = ctx.__out;
const unitOf = {};
const units = UNITS.map((u, ui) => ({
  id: u.id, title: u.title, sub: u.sub, order: ui + 1,
  mission: MISIONES[u.id] ?? null,
  lessons: u.lessons.map((l) => ({
    id: l.id, title: l.title, sub: l.sub, icon: l.icon, note: l.note ? { title: l.note.title, body: l.note.body, hasFig: !!l.note.fig } : null,
    curio: l.curio ?? null,
    items: l.items.map((id) => {
      const it = ITEMS[id];
      if (!it) throw new Error("falta item " + id);
      const { gen, fig, ...rest } = it;
      return { ...rest, hasGen: !!gen, hasFig: !!fig };
    }),
  })),
}));
fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync("docs/legacy-content.json", JSON.stringify({ units }, null, 1));
console.log(units.map((u) => `${u.order}. ${u.id} «${u.title}» ${u.lessons.length} lecciones, ${u.lessons.reduce((a, l) => a + l.items.length, 0)} items`).join("\n"));
