// Construit une version « fichier unique » de l'application Web (dist-artifact/pamezi-app.html),
// sans aucun fichier externe : scripts, police et images sont intégrés dans la page.
// Utilisation : npm run build:artifact            (application membre)
//               npm run build:artifact -- --back-office  (s'ouvre sur le back office)
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const OUT_DIR = 'dist-artifact';
const BACK_OFFICE = process.argv.includes('--back-office');
const ROUTE = BACK_OFFICE ? '/admin' : '/';
const TITRE = BACK_OFFICE ? 'Back office Pamezi' : 'Application Pamezi';
const FICHIER = BACK_OFFICE ? 'pamezi-back-office.html' : 'pamezi-app.html';
const MIME = { '.png': 'image/png', '.ttf': 'font/ttf', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

// L'artefact ne peut joindre aucun serveur : il est toujours construit en mode démonstration.
const env = { ...process.env, EXPO_PUBLIC_API_URL: '' }; // vide : l'emporte sur .env.production
execSync('npx expo export --platform web --clear', { stdio: 'inherit', env });

const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
if (scripts.some((s) => !s.startsWith('/_expo/'))) throw new Error('Script inattendu dans index.html');

let js = scripts.map((s) => fs.readFileSync(path.join(DIST, s), 'utf8')).join('\n;\n');
if (/"\/_expo\/static\/js\/web\/[^"]+\.js"/.test(js.replace(/paths":\{[^}]*\}/g, ''))) {
  console.warn('Attention : des morceaux de code sont encore chargés à la demande.');
}

// Remplace chaque chemin "/assets/…" par son contenu en data: URI.
js = js.replace(/"(\/assets\/[^"]+\.(png|ttf|jpg|svg))"/g, (_, p) => {
  const file = path.join(DIST, p);
  if (!fs.existsSync(file)) return `"${p}"`;
  const data = fs.readFileSync(file).toString('base64');
  return `"data:${MIME[path.extname(p)]};base64,${data}"`;
});
js = js.replace(/<\/script/gi, '<\\/script');

const page = `<title>${TITRE}</title>
<meta name="theme-color" content="#0070C6">
<style>
  :root { --fond: #F5FAFE; color-scheme: light dark; }
  @media (prefers-color-scheme: dark) { :root { --fond: #0A1520; } }
  html, body { height: 100%; }
  body { background: var(--fond); overflow: hidden; }
  #root { display: flex; height: 100%; flex: 1; }
</style>
<div id="root"></div>
<script>
  // L'application démarre toujours sur le même écran, quelle que soit l'adresse de la page.
  try { if (location.pathname !== '${ROUTE}') history.replaceState(null, '', '${ROUTE}'); } catch (e) {}
</script>
<script>
${js}
</script>
`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, FICHIER), page);
console.log(`${OUT_DIR}/${FICHIER} : ${(page.length / 1e6).toFixed(2)} Mo`);
