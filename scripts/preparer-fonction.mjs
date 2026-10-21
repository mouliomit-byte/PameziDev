// Copie le code partagé (shared/) et l'API (server/src/) dans la fonction Supabase,
// qui ne peut pas importer de fichiers hors de son dossier. À lancer avant chaque déploiement :
//   npm run fonction:preparer && npx supabase functions deploy api --no-verify-jwt
import fs from 'node:fs';
import path from 'node:path';

const cible = 'supabase/functions/api/_lib';
fs.rmSync(cible, { recursive: true, force: true });
for (const [src, dest] of [
  ['shared/regles.ts', 'shared/regles.ts'],
  ['shared/service.ts', 'shared/service.ts'],
  ['server/src/app.ts', 'server/src/app.ts'],
  ['server/src/securite.ts', 'server/src/securite.ts'],
]) {
  fs.mkdirSync(path.dirname(path.join(cible, dest)), { recursive: true });
  fs.copyFileSync(src, path.join(cible, dest));
}
console.log(`Code copié dans ${cible}/`);
