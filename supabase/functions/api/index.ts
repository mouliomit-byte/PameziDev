// API Pamezi sur Supabase Edge Functions (Deno) : le même code que server/ (Node),
// branché sur la base Postgres du projet. Adresse : https://<projet>.supabase.co/functions/v1/api/...
//
// Secrets du projet (tableau de bord Supabase › Edge Functions › Secrets) :
//   ADMIN_EMAIL, ADMIN_MOT_DE_PASSE, ADMIN_NOM   compte propriétaire créé au premier appel
//   PAMEZI_SECRET                                clé des sessions (sinon dérivée de la clé de service)
//   CORS_ORIGINES                                origines autorisées, séparées par des virgules
// SUPABASE_DB_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement par Supabase.
//
// Le dossier _lib/ est une copie de shared/ et server/src/ : `npm run fonction:preparer`.

import { createHmac } from 'node:crypto';

import postgres from 'postgres';

import { creerApp } from './_lib/server/src/app.ts';
import { secretsServeur } from './_lib/server/src/securite.ts';
import { initialiser } from './_lib/shared/service.ts';
import { creerDepotPostgres } from './depot-postgres.ts';

const env = (n: string) => Deno.env.get(n)?.trim() || undefined;

const sql = postgres(env('SUPABASE_DB_URL')!, { max: 3, prepare: false, idle_timeout: 20 });
const ctx = { depot: creerDepotPostgres(sql), secrets: secretsServeur, maintenant: () => new Date() };

const cleSecrete =
  env('PAMEZI_SECRET') ?? createHmac('sha256', env('SUPABASE_SERVICE_ROLE_KEY') ?? '').update('pamezi-sessions').digest('base64url');

const app = creerApp(ctx, {
  cleSecrete,
  originesAutorisees: env('CORS_ORIGINES')?.split(',').map((o) => o.trim()).filter(Boolean),
});

// Formules, centres et compte propriétaire créés au premier appel s'ils n'existent pas.
let pret: Promise<void> | null = null;
function initialisation() {
  pret ??= (async () => {
    const email = env('ADMIN_EMAIL');
    const motDePasse = env('ADMIN_MOT_DE_PASSE');
    await initialiser(ctx, email && motDePasse ? { email, motDePasse, nom: env('ADMIN_NOM') ?? 'Propriétaire Pamezi' } : undefined);
  })().catch((e) => {
    pret = null; // réessayer au prochain appel (ex. deux démarrages simultanés)
    console.error('Initialisation', e);
  });
  return pret;
}

Deno.serve(async (req) => {
  await initialisation();
  return app.fetch(req);
});
