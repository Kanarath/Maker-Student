// Rutas internas. En GitHub Pages la web vive en una subcarpeta (/Maker-Student/); Astro la expone
// en import.meta.env.BASE_URL, a veces SIN barra final. Normalizamos aquí una sola vez.
export const BASE = import.meta.env.BASE_URL.replace(/\/?$/, "/");

/** Une la base con una ruta interna: url("palanca/") → "/Maker-Student/palanca/" */
export const url = (path = "") => BASE + path.replace(/^\//, "");
