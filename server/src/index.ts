// Démarrage du serveur Pamezi : API (/api/...) + application Web (membres et back office).
//
// Variables d'environnement :
//   PORT                 port d'écoute (8787 par défaut)
//   PAMEZI_DONNEES       dossier de la base SQLite et de la clé secrète (./donnees par défaut)
//   PAMEZI_SECRET        clé de signature des sessions (générée et conservée si absente)
//   ADMIN_EMAIL          e-mail du compte propriétaire créé au premier démarrage
//   ADMIN_MOT_DE_PASSE   son mot de passe (généré et affiché une seule fois si absent)
//   ADMIN_NOM            son nom affiché
//   CORS_ORIGINES        origines autorisées, séparées par des virgules (toutes par défaut)
//   PAMEZI_WEB           dossier de l'application Web exportée (../dist par défaut)

import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';

import { initialiser } from '../../shared/service.ts';
import { creerApp } from './app.ts';
import { creerDepotSqlite, ouvrirBase } from './depot-sqlite.ts';
import { secretsServeur } from './securite.ts';

const ici = path.dirname(new URL(import.meta.url).pathname);
const dossierDonnees = path.resolve(process.env.PAMEZI_DONNEES ?? path.join(ici, '..', 'donnees'));
fs.mkdirSync(dossierDonnees, { recursive: true });

function cleSecrete(): string {
  if (process.env.PAMEZI_SECRET) return process.env.PAMEZI_SECRET;
  const fichier = path.join(dossierDonnees, 'cle-secrete.txt');
  if (!fs.existsSync(fichier)) fs.writeFileSync(fichier, randomBytes(32).toString('base64url'), { mode: 0o600 });
  return fs.readFileSync(fichier, 'utf8').trim();
}

const db = ouvrirBase(path.join(dossierDonnees, 'pamezi.sqlite'));
const ctx = { depot: creerDepotSqlite(db), secrets: secretsServeur, maintenant: () => new Date() };

const motDePasse = process.env.ADMIN_MOT_DE_PASSE ?? randomBytes(9).toString('base64url');
const email = process.env.ADMIN_EMAIL ?? 'proprietaire@pamezi.cm';
const { proprietaireCree } = await initialiser(ctx, { email, nom: process.env.ADMIN_NOM ?? 'Propriétaire Pamezi', motDePasse });
if (proprietaireCree) {
  console.log('\n=== Compte propriétaire créé ===');
  console.log(`E-mail       : ${email}`);
  console.log(`Mot de passe : ${process.env.ADMIN_MOT_DE_PASSE ? '(celui de ADMIN_MOT_DE_PASSE)' : motDePasse}`);
  console.log('Notez-le maintenant : il ne sera plus affiché.\n');
}

const app = creerApp(ctx, {
  cleSecrete: cleSecrete(),
  originesAutorisees: process.env.CORS_ORIGINES?.split(',').map((o) => o.trim()).filter(Boolean),
});

// Application Web (si elle a été exportée avec `npm run build:web` à la racine du projet).
const dossierWeb = path.resolve(process.env.PAMEZI_WEB ?? path.join(ici, '..', '..', 'dist'));
if (fs.existsSync(path.join(dossierWeb, 'index.html'))) {
  const racine = path.relative(process.cwd(), dossierWeb) || '.';
  app.use('/*', serveStatic({ root: racine }));
  const index = fs.readFileSync(path.join(dossierWeb, 'index.html'), 'utf8');
  app.get('*', (c) => c.html(index)); // les routes de l'app (/tontine, /admin…) renvoient la page
  console.log(`Application Web servie depuis ${dossierWeb}`);
} else {
  console.log('Application Web non trouvée : lancez `npm run build:web` à la racine pour la servir ici.');
}

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, () => console.log(`Serveur Pamezi prêt sur http://localhost:${port}`));

const arreter = () => {
  db.close();
  process.exit(0);
};
process.on('SIGINT', arreter);
process.on('SIGTERM', arreter);
