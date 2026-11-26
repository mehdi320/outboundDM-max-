// Assemble la version claude.ai en un seul fichier HTML (JS + CSS intégrés) :
// une page hébergée ne charge pas de scripts locaux séparés depuis un autre hôte.
import fs from "node:fs";
import path from "node:path";

const dir = "dist-artifact";
const assets = fs.readdirSync(path.join(dir, "assets"));
const read = (ext) =>
  assets.filter((f) => f.endsWith(ext)).map((f) => fs.readFileSync(path.join(dir, "assets", f), "utf8")).join("\n");

const css = read(".css");
const js = read(".js").replace(/<\/script/gi, "<\\/script");

const html = `<title>OutboundDM Max</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
<style>
/* Interface sombre volontaire (outil de travail) : fond et couleurs fixés explicitement. */
:root { color-scheme: dark; --bg: #08090b; --fg: #e2e5ea; }
html, body { background: var(--bg); color: var(--fg); }
body { font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
${css}
</style>
<div id="root"></div>
<script type="module">
${js}
</script>
`;
fs.writeFileSync(path.join(dir, "outbounddm-max.html"), html);
console.log(`dist-artifact/outbounddm-max.html (${(html.length / 1024).toFixed(0)} Ko)`);
