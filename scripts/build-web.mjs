// Construit l'application Web (dist/).
//   npm run build:web                    branchée sur l'API de .env.production (Supabase)
//   npm run build:web -- --meme-serveur  branchée sur /api du serveur Node qui héberge le site (server/)
//   npm run build:web -- --demo          démonstration sans serveur (données sur l'appareil)
import { execSync } from 'node:child_process';

const env = { ...process.env };
if (process.argv.includes('--demo')) env.EXPO_PUBLIC_API_URL = ''; // vide : l'emporte sur .env.production
else if (process.argv.includes('--meme-serveur')) env.EXPO_PUBLIC_API_URL = '/';

console.log(env.EXPO_PUBLIC_API_URL === '' ? 'Mode démonstration (sans serveur)' : `API : ${env.EXPO_PUBLIC_API_URL ?? 'celle de .env.production'}`);
execSync('npx expo export --platform web --clear', { stdio: 'inherit', env });
