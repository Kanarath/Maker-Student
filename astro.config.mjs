// Configuración de Astro.
// `site` + `base` hacen que las rutas funcionen en https://kanarath.github.io/Maker-Student/
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

export default defineConfig({
  site: "https://kanarath.github.io",
  base: "/Maker-Student",
  trailingSlash: "ignore",
  integrations: [mdx()],
  // el validador (tools/validate.mjs) construye en otra carpeta para no pisar dist/
  outDir: process.env.MAKER_OUT_DIR || "./dist",
});
