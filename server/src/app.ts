// Routes HTTP de l'API Pamezi. Toute la logique est dans shared/service.ts ;
// ce fichier ne fait que l'authentification et la traduction HTTP <-> service.

import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

import { ErreurMetier } from '../../shared/regles.ts';
import * as S from '../../shared/service.ts';
import { creerJetons, creerLimiteur } from './securite.ts';

type Options = { cleSecrete: string; originesAutorisees?: string[] };

const DUREE_MEMBRE = 90 * 24 * 3600; // 90 jours
const DUREE_ADMIN = 12 * 3600; // 12 heures

export function creerApp(ctx: S.Contexte, options: Options) {
  const jetons = creerJetons(options.cleSecrete);
  const limiteur = creerLimiteur();
  const app = new Hono();

  app.use('*', secureHeaders());
  app.use(
    '/api/*',
    cors({
      origin: options.originesAutorisees?.length ? options.originesAutorisees : '*',
      allowHeaders: ['Authorization', 'Content-Type'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      maxAge: 86400,
    }),
  );
  // 100 Ko par requête, sauf l'adhésion qui transporte la photo de la CNI.
  const petit = bodyLimit({ maxSize: 100 * 1024, onError: (c) => c.json({ erreur: 'Requête trop volumineuse.' }, 413) });
  const grand = bodyLimit({ maxSize: 2500 * 1024, onError: (c) => c.json({ erreur: 'La photo de la CNI est trop lourde.' }, 413) });
  app.use('/api/*', (c, next) => (c.req.method === 'POST' && c.req.path === '/api/membres' ? grand(c, next) : petit(c, next)));

  app.onError((e, c) => {
    if (e instanceof ErreurMetier) return c.json({ erreur: e.message }, e.code as 400);
    console.error(e);
    return c.json({ erreur: 'Erreur interne du serveur. Réessayez plus tard.' }, 500);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const corps = async (c: Context): Promise<any> => {
    try {
      return await c.req.json(); // validé ensuite par le service
    } catch {
      throw new ErreurMetier(400, 'Données invalides.');
    }
  };
  const ip = (c: Context) => c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const limiter = (c: Context, id: string) => {
    if (!limiteur.autorise(`${ip(c)}|${id}`)) throw new ErreurMetier(429, 'Trop de tentatives. Réessayez dans 15 minutes.');
  };
  const jetonDe = (c: Context) => jetons.lire(c.req.header('authorization')?.replace(/^Bearer\s+/i, ''));
  const membreId = (c: Context) => {
    const j = jetonDe(c);
    if (!j || j.role !== 'membre') throw new ErreurMetier(401, 'Session expirée. Reconnectez-vous.');
    return j.sub;
  };
  const admin = async (c: Context) => {
    const j = jetonDe(c);
    if (!j || j.role !== 'admin') throw new ErreurMetier(401, 'Session expirée. Reconnectez-vous.');
    return S.adminActif(ctx, j.sub);
  };

  // --- Public
  app.get('/api/sante', (c) => c.json({ ok: true, service: 'Mutuelle de Santé Pamezi' }));
  app.get('/api/formules', async (c) => c.json(await S.formulesActives(ctx)));
  app.get('/api/centres', async (c) => c.json(await S.listerCentres(ctx)));
  app.get('/api/stats', async (c) => c.json(await S.statistiquesPubliques(ctx)));
  app.get('/api/reglages', async (c) => c.json(await S.lireReglages(ctx)));

  // --- Espace membre
  app.post('/api/membres', async (c) => {
    limiter(c, 'adhesion');
    const profil = await S.adherer(ctx, await corps(c));
    return c.json({ jeton: jetons.emettre(profil.membre.id, 'membre', DUREE_MEMBRE), profil }, 201);
  });
  app.post('/api/membres/connexion', async (c) => {
    const { telephone, pin } = await corps(c);
    limiter(c, `m:${telephone}`);
    const profil = await S.connecterMembre(ctx, telephone, pin);
    limiteur.reinitialiser(`${ip(c)}|m:${telephone}`);
    return c.json({ jeton: jetons.emettre(profil.membre.id, 'membre', DUREE_MEMBRE), profil });
  });
  app.get('/api/moi', async (c) => c.json(await S.profil(ctx, membreId(c))));
  app.post('/api/moi/cotisations', async (c) => {
    const { mois, mode } = await corps(c);
    return c.json(await S.cotiser(ctx, membreId(c), mois, mode), 201);
  });
  app.post('/api/moi/demandes', async (c) => c.json(await S.demander(ctx, membreId(c), await corps(c)), 201));

  // --- Back office
  app.post('/api/admin/connexion', async (c) => {
    const { email, motDePasse } = await corps(c);
    limiter(c, `a:${email}`);
    const a = await S.connecterAdmin(ctx, email, motDePasse);
    limiteur.reinitialiser(`${ip(c)}|a:${email}`);
    return c.json({ jeton: jetons.emettre(a.id, 'admin', DUREE_ADMIN), admin: a });
  });
  app.get('/api/admin/moi', async (c) => c.json(await admin(c)));
  app.get('/api/admin/tableau-de-bord', async (c) => {
    await admin(c);
    return c.json(await S.tableauDeBord(ctx));
  });
  app.get('/api/admin/membres', async (c) => {
    await admin(c);
    return c.json(await S.listerMembres(ctx, { q: c.req.query('q'), statut: c.req.query('statut') as never }));
  });
  app.get('/api/admin/membres.csv', async (c) => {
    await admin(c);
    const csv = '﻿' + S.membresEnCsv(await S.listerMembres(ctx, {}));
    return c.body(csv, 200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="membres-pamezi.csv"' });
  });
  app.get('/api/admin/membres/:id', async (c) => {
    await admin(c);
    return c.json(await S.profil(ctx, c.req.param('id')));
  });
  app.get('/api/admin/membres/:id/piece', async (c) => {
    await admin(c);
    return c.json(await S.pieceIdentite(ctx, c.req.param('id')));
  });
  app.patch('/api/admin/membres/:id', async (c) => c.json(await S.modifierMembre(ctx, await admin(c), c.req.param('id'), await corps(c))));
  app.post('/api/admin/membres/:id/pin', async (c) => {
    await S.reinitialiserPin(ctx, await admin(c), c.req.param('id'), (await corps(c)).pin);
    return c.json({ ok: true });
  });
  app.post('/api/admin/membres/:id/especes', async (c) =>
    c.json(await S.encaisserEspeces(ctx, await admin(c), c.req.param('id'), (await corps(c)).mois), 201),
  );
  app.get('/api/admin/cotisations', async (c) => {
    await admin(c);
    return c.json(await S.listerCotisations(ctx, c.req.query('statut') as never));
  });
  app.post('/api/admin/cotisations/:id/decision', async (c) => {
    await S.traiterCotisation(ctx, await admin(c), c.req.param('id'), (await corps(c)).decision);
    return c.json({ ok: true });
  });
  app.get('/api/admin/demandes', async (c) => {
    await admin(c);
    return c.json(await S.listerDemandes(ctx, c.req.query('statut') as never));
  });
  app.post('/api/admin/demandes/:id/decision', async (c) => {
    const { decision, commentaire } = await corps(c);
    await S.traiterDemande(ctx, await admin(c), c.req.param('id'), decision, commentaire);
    return c.json({ ok: true });
  });
  app.get('/api/admin/formules', async (c) => {
    await admin(c);
    return c.json(await S.toutesFormules(ctx));
  });
  app.put('/api/admin/formules', async (c) => c.json(await S.enregistrerFormule(ctx, await admin(c), await corps(c))));
  app.get('/api/admin/centres', async (c) => {
    await admin(c);
    return c.json(await S.listerCentres(ctx));
  });
  app.put('/api/admin/centres', async (c) => c.json(await S.enregistrerCentre(ctx, await admin(c), await corps(c))));
  app.delete('/api/admin/centres/:id', async (c) => {
    await S.supprimerCentre(ctx, await admin(c), c.req.param('id'));
    return c.json({ ok: true });
  });
  app.get('/api/admin/gestionnaires', async (c) => {
    await admin(c);
    return c.json(await S.listerAdmins(ctx));
  });
  app.post('/api/admin/gestionnaires', async (c) => c.json(await S.creerAdmin(ctx, await admin(c), await corps(c)), 201));
  app.patch('/api/admin/gestionnaires/:id', async (c) => {
    await S.activerAdmin(ctx, await admin(c), c.req.param('id'), (await corps(c)).actif);
    return c.json({ ok: true });
  });
  app.get('/api/admin/journal', async (c) => {
    await admin(c);
    return c.json(await S.listerJournal(ctx));
  });

  app.put('/api/admin/reglages', async (c) => c.json(await S.enregistrerReglages(ctx, await admin(c), await corps(c))));
  app.get('/api/admin/notifications', async (c) => {
    await admin(c);
    return c.json(await S.notificationsDuBackOffice(ctx));
  });

  app.all('/api/*', (c) => c.json({ erreur: 'Adresse inconnue.' }, 404));
  return app;
}
