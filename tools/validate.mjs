// Validador de contenido: construye el sitio con TODOS los borradores en .validate-dist y revisa
// lo que el build de Astro no ve. Termina con código 1 si hay errores (los avisos no bloquean).
//   node tools/validate.mjs
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parseHTML } from "linkedom";

const ROOT = process.cwd();
const OUT = ".validate-dist";
const BASE = "/Maker-Student/";
const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

fs.rmSync(OUT, { recursive: true, force: true });
try {
  execSync("npx astro build", { stdio: "pipe", env: { ...process.env, MAKER_INCLUDE_DRAFTS: "1", MAKER_OUT_DIR: `./${OUT}` } });
} catch (e) {
  console.error(String(e.stdout ?? "") + String(e.stderr ?? ""));
  console.error("✕ El build falla.");
  process.exit(1);
}

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(OUT);
const pages = files.filter((f) => f.endsWith(".html") && !f.includes(`${path.sep}practica${path.sep}`));
const exists = (urlPath) => {
  const p = path.join(OUT, decodeURIComponent(urlPath.replace(BASE, "")).split("#")[0].split("?")[0]);
  return fs.existsSync(p) && (fs.statSync(p).isFile() || fs.existsSync(path.join(p, "index.html")));
};

const legacy = JSON.parse(fs.readFileSync("docs/legacy-content.json", "utf8"));
const legacyLessons = new Set(legacy.units.flatMap((u) => u.lessons.map((l) => l.id)));
const covered = new Set();
const usedImages = new Set();
const lessonIds = new Set();

for (const f of pages) {
  const rel = path.relative(OUT, f).replaceAll("\\", "/");
  const html = fs.readFileSync(f, "utf8");
  const { document } = parseHTML(html);
  if (!document.title || document.title.length < 5) err(`${rel}: falta <title>`);
  if (!document.querySelector('meta[name="description"]')?.getAttribute("content")) err(`${rel}: falta meta description`);
  if (document.querySelectorAll("h1").length !== 1) err(`${rel}: debe haber exactamente un <h1> (hay ${document.querySelectorAll("h1").length})`);

  const ids = new Map();
  for (const el of document.querySelectorAll("[id]")) {
    const id = el.getAttribute("id");
    if (ids.has(id)) err(`${rel}: id duplicado «${id}»`);
    ids.set(id, el);
  }
  for (const img of document.querySelectorAll("img")) {
    if (!img.hasAttribute("alt")) err(`${rel}: <img> sin alt (${img.getAttribute("src")})`);
    const src = img.getAttribute("src") ?? "";
    if (src.startsWith(BASE)) {
      usedImages.add(src);
      if (!exists(src)) err(`${rel}: imagen que no existe ${src}`);
    }
  }
  for (const a of document.querySelectorAll("a[href]")) {
    const h = a.getAttribute("href");
    if (h.startsWith("#")) { if (h.length > 1 && !ids.has(h.slice(1))) err(`${rel}: ancla rota ${h}`); continue; }
    if (h.startsWith(BASE) && !exists(h)) err(`${rel}: enlace roto ${h}`);
    if (h.startsWith("/") && !h.startsWith(BASE)) err(`${rel}: enlace absoluto fuera de la base ${h}`);
    if (h.startsWith("http://")) warn(`${rel}: enlace http sin cifrar ${h}`);
  }

  // reglas de las lecciones
  const lesson = document.querySelector("[data-lesson-id]");
  if (lesson) {
    const id = lesson.getAttribute("data-lesson-id");
    lessonIds.add(id);
    const kinds = [...document.querySelectorAll("section.block")].map((s) => s.getAttribute("data-kind"));
    const want = ["pieza", "concepto", "montaje", "version", "errores", "calidad"];
    if (kinds.join() !== want.join()) err(`${rel}: los bloques deben ser ${want.join(", ")} (hay ${kinds.join(", ")})`);
    const quizzes = [...document.querySelectorAll("[data-quiz]")];
    if (quizzes.length < 2) err(`${rel}: debe tener al menos 2 preguntas (tiene ${quizzes.length})`);
    const qids = new Set();
    for (const q of quizzes) {
      const qid = q.getAttribute("data-quiz");
      if (qids.has(qid)) err(`${rel}: pregunta repetida «${qid}»`);
      qids.add(qid);
      const n = q.querySelectorAll('input[type="radio"]').length;
      const a = Number(q.getAttribute("data-answer"));
      if (n < 3) err(`${rel}: la pregunta «${qid}» tiene menos de 3 opciones`);
      if (!Number.isInteger(a) || a < 0 || a >= n) err(`${rel}: la respuesta de «${qid}» está fuera de rango`);
    }
    if (!document.querySelector("[data-checklist]")) err(`${rel}: falta <Checklist>`);
    if (!document.querySelector("[data-register]")) err(`${rel}: falta <RegisterPiece>`);
    if (document.querySelectorAll("[data-quiz]").length && !document.querySelector(".mistake")) err(`${rel}: falta al menos un <Mistake> (errores típicos)`);
    if (!document.querySelector(".step")) err(`${rel}: falta el montaje guiado (<Step>)`);
    for (const a of document.querySelectorAll('a[href*="practica/?leccion="]')) {
      const m = /leccion=([a-z_0-9]+)/.exec(a.getAttribute("href"));
      if (m) { covered.add(m[1]); if (!legacyLessons.has(m[1])) err(`${rel}: practica apunta a «${m[1]}», que no existe`); }
    }
    const words = (document.querySelector(".body")?.textContent ?? "").split(/\s+/).length;
    if (words < 350) warn(`${rel}: lección muy corta (${words} palabras)`);
  }
}

// cobertura: todas las lecciones del motor de práctica deben colgar de alguna lección nueva
for (const l of legacyLessons) if (!covered.has(l)) err(`la lección de práctica «${l}» no está cubierta por ninguna lección nueva (practice)`);

// imágenes: tamaño y huérfanas
const imgs = files.filter((f) => f.includes(`${path.sep}assets${path.sep}img${path.sep}`));
for (const f of imgs) {
  const kb = fs.statSync(f).size / 1024;
  if (kb > 300) err(`${path.relative(OUT, f)}: pesa ${Math.round(kb)} KB (máximo 300)`);
  const url = BASE + path.relative(OUT, f).replaceAll("\\", "/");
  if (!usedImages.has(url)) warn(`imagen sin usar: ${path.relative(OUT, f)}`);
}

fs.rmSync(OUT, { recursive: true, force: true });
console.log(`Lecciones revisadas: ${lessonIds.size} · páginas: ${pages.length} · imágenes: ${imgs.length}`);
for (const w of warns) console.log("  aviso:", w);
if (errors.length) {
  console.error(`\n✕ ${errors.length} error(es):`);
  for (const e of errors) console.error("  -", e);
  process.exit(1);
}
console.log("✓ Contenido válido");
