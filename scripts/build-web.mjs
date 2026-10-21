// Construit l'application Web (dist/) branchée sur le serveur Pamezi qui l'héberge
// (les appels vont vers /api sur la même adresse). Utilisation : npm run build:web
// Pour une version de démonstration sans serveur : npm run build:web -- --demo
import { execSync } from 'node:child_process';

const demo = process.argv.includes('--demo');
const env = { ...process.env };
if (demo) delete env.EXPO_PUBLIC_API_URL;
else env.EXPO_PUBLIC_API_URL = env.EXPO_PUBLIC_API_URL || '/';

console.log(demo ? 'Mode démonstration (sans serveur)' : `Branchée sur l'API : ${env.EXPO_PUBLIC_API_URL}`);
execSync('npx expo export --platform web --clear', { stdio: 'inherit', env });
