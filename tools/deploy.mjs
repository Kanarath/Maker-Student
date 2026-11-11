// Publica el sitio en GitHub Pages sin GitHub Actions: pasa tests y validación, construye con Astro y
// sube el contenido de dist/ a la rama gh-pages. Si algo falla, no se sube nada.
//   npm run deploy
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const run = (cmd, opts = {}) => execSync(cmd, { stdio: "inherit", ...opts });
const out = (cmd, opts = {}) => execSync(cmd, { encoding: "utf8", ...opts }).trim();

const status = out("git status --porcelain");
if (status) {
  console.error("✕ Hay cambios sin guardar en git. Haz commit antes de publicar:\n" + status);
  process.exit(1);
}
const remote = out("git remote get-url origin");
const sha = out("git rev-parse --short HEAD");

run("npm run check");
fs.rmSync("dist", { recursive: true, force: true });
run("npx astro build");
if (!fs.existsSync("dist/index.html")) throw new Error("El build no generó dist/index.html");
fs.writeFileSync("dist/.nojekyll", "");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "maker-deploy-"));
fs.cpSync("dist", tmp, { recursive: true });
run("git init -q -b gh-pages", { cwd: tmp });
run("git add -A", { cwd: tmp });
run(`git -c user.name="Maker deploy" -c user.email="deploy@maker.local" commit -q -m "Despliegue desde ${sha}"`, { cwd: tmp });
run(`git push -f -q "${remote}" gh-pages`, { cwd: tmp });
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`✓ Publicado ${sha} en la rama gh-pages. Pages tarda ~1 minuto en reflejarlo.`);
