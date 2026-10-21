import assert from 'node:assert/strict';
import { before, describe, test } from 'node:test';

import { initialiser } from '../../shared/service.ts';
import { creerApp } from '../src/app.ts';
import { creerDepotSqlite, ouvrirBase } from '../src/depot-sqlite.ts';
import { secretsServeur } from '../src/securite.ts';

const ctx = { depot: creerDepotSqlite(ouvrirBase(':memory:')), secrets: secretsServeur, maintenant: () => new Date() };
const app = creerApp(ctx, { cleSecrete: 'cle-de-test' });

async function appel(methode: string, chemin: string, corps?: unknown, jeton?: string) {
  const r = await app.request(chemin, {
    method: methode,
    headers: { 'Content-Type': 'application/json', ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}) },
    body: corps === undefined ? undefined : JSON.stringify(corps),
  });
  const texte = await r.text();
  let json: any = texte;
  try {
    json = JSON.parse(texte);
  } catch {}
  return { statut: r.status, json };
}

const adhesion = {
  nom: 'Njoya Aïcha',
  telephone: '677 12 34 56',
  localite: 'Foumban',
  typeAdhesion: 'Via une association',
  association: 'Association des femmes de Njimom',
  formuleId: 'famille',
  ayantsDroit: 4,
  pin: '2580',
};

let jetonMembre = '';
let jetonProprio = '';
let membreId = '';

before(async () => {
  await initialiser(ctx, { email: 'proprio@pamezi.cm', nom: 'Propriétaire', motDePasse: 'motdepasse-solide' });
});

describe('public', () => {
  test('santé, formules, centres', async () => {
    assert.equal((await appel('GET', '/api/sante')).statut, 200);
    const f = await appel('GET', '/api/formules');
    assert.deepEqual(f.json.map((x: any) => x.id), ['essentiel', 'famille', 'serenite']);
    const c = await appel('GET', '/api/centres');
    assert.equal(c.json[0].nom, 'Hôpital Nah Pôn');
  });
});

describe('espace membre', () => {
  test('adhésion refusée si le téléphone est invalide', async () => {
    const r = await appel('POST', '/api/membres', { ...adhesion, telephone: '12345' });
    assert.equal(r.statut, 400);
    assert.match(r.json.erreur, /9 chiffres/);
  });

  test('adhésion, puis doublon refusé', async () => {
    const r = await appel('POST', '/api/membres', adhesion);
    assert.equal(r.statut, 201);
    assert.match(r.json.profil.membre.numero, /^PMZ-\d{4}-00001$/);
    assert.equal(r.json.profil.membre.telephone, '677123456');
    assert.equal(r.json.profil.membre.pinHash, undefined, 'le code secret ne doit jamais sortir');
    jetonMembre = r.json.jeton;
    membreId = r.json.profil.membre.id;
    assert.equal((await appel('POST', '/api/membres', adhesion)).statut, 409);
  });

  test('connexion avec le code secret', async () => {
    assert.equal((await appel('POST', '/api/membres/connexion', { telephone: '677123456', pin: '0000' })).statut, 401);
    const r = await appel('POST', '/api/membres/connexion', { telephone: '+237 677 12 34 56', pin: '2580' });
    assert.equal(r.statut, 200);
    assert.ok(r.json.jeton);
  });

  test('profil protégé', async () => {
    assert.equal((await appel('GET', '/api/moi')).statut, 401);
    assert.equal((await appel('GET', '/api/moi', undefined, 'faux.jeton')).statut, 401);
    const r = await appel('GET', '/api/moi', undefined, jetonMembre);
    assert.equal(r.statut, 200);
    assert.equal(r.json.situation.aJour, false);
  });

  test('cotisation Mobile Money confirmée, demande de soins calculée', async () => {
    const c = await appel('POST', '/api/moi/cotisations', { mois: 3, mode: 'MTN Mobile Money' }, jetonMembre);
    assert.equal(c.statut, 201);
    assert.equal(c.json.cotisation.montant, 7500);
    assert.equal(c.json.cotisation.statut, 'confirmee');
    assert.equal(c.json.profil.situation.aJour, true);
    const d = await appel('POST', '/api/moi/demandes', { centre: 'Hôpital Nah Pôn', motif: 'Consultation', montant: 20000 }, jetonMembre);
    assert.equal(d.statut, 201);
    assert.equal(d.json.demande.priseEnCharge, 15000);
    assert.equal(d.json.profil.plafondRestant, 385000);
  });

  test('cotisation en espèces en attente de confirmation', async () => {
    const c = await appel('POST', '/api/moi/cotisations', { mois: 1, mode: 'Espèces (bureau Pamezi)' }, jetonMembre);
    assert.equal(c.json.cotisation.statut, 'en_attente');
    assert.equal(c.json.profil.situation.enAttente, 1);
  });
});

describe('back office', () => {
  test('connexion du propriétaire', async () => {
    assert.equal((await appel('POST', '/api/admin/connexion', { email: 'proprio@pamezi.cm', motDePasse: 'non' })).statut, 401);
    const r = await appel('POST', '/api/admin/connexion', { email: 'PROPRIO@pamezi.cm', motDePasse: 'motdepasse-solide' });
    assert.equal(r.statut, 200);
    assert.equal(r.json.admin.role, 'proprietaire');
    assert.equal(r.json.admin.motDePasseHash, undefined);
    jetonProprio = r.json.jeton;
  });

  test('un jeton de membre n’ouvre pas le back office', async () => {
    assert.equal((await appel('GET', '/api/admin/tableau-de-bord', undefined, jetonMembre)).statut, 401);
  });

  test('tableau de bord', async () => {
    const r = await appel('GET', '/api/admin/tableau-de-bord', undefined, jetonProprio);
    assert.equal(r.json.membres, 1);
    assert.equal(r.json.encaisse, 7500);
    assert.equal(r.json.cotisationsEnAttente, 1);
    assert.equal(r.json.demandesEnCours, 1);
  });

  test('confirmer la cotisation en espèces, une seule fois', async () => {
    const liste = await appel('GET', '/api/admin/cotisations?statut=en_attente', undefined, jetonProprio);
    assert.equal(liste.json.length, 1);
    assert.equal(liste.json[0].membreNom, 'Njoya Aïcha');
    const id = liste.json[0].id;
    assert.equal((await appel('POST', `/api/admin/cotisations/${id}/decision`, { decision: 'confirmee' }, jetonProprio)).statut, 200);
    assert.equal((await appel('POST', `/api/admin/cotisations/${id}/decision`, { decision: 'rejetee' }, jetonProprio)).statut, 409);
    const t = await appel('GET', '/api/admin/tableau-de-bord', undefined, jetonProprio);
    assert.equal(t.json.encaisse, 10000);
  });

  test('demande : valider puis payer ; transitions interdites refusées', async () => {
    const [d] = (await appel('GET', '/api/admin/demandes?statut=en_cours', undefined, jetonProprio)).json;
    assert.equal((await appel('POST', `/api/admin/demandes/${d.id}/decision`, { decision: 'payee' }, jetonProprio)).statut, 409);
    assert.equal((await appel('POST', `/api/admin/demandes/${d.id}/decision`, { decision: 'validee' }, jetonProprio)).statut, 200);
    assert.equal((await appel('POST', `/api/admin/demandes/${d.id}/decision`, { decision: 'payee', commentaire: 'Virement à l’hôpital' }, jetonProprio)).statut, 200);
    const t = await appel('GET', '/api/admin/tableau-de-bord', undefined, jetonProprio);
    assert.equal(t.json.prisEnChargePaye, 15000);
    assert.equal(t.json.solde, 10000 - 15000);
  });

  test('encaisser des espèces au bureau', async () => {
    const r = await appel('POST', `/api/admin/membres/${membreId}/especes`, { mois: 2 }, jetonProprio);
    assert.equal(r.statut, 201);
    assert.equal(r.json.cotisations[0].statut, 'confirmee');
  });

  test('suspendre un membre bloque ses demandes', async () => {
    await appel('PATCH', `/api/admin/membres/${membreId}`, { statut: 'suspendu' }, jetonProprio);
    const d = await appel('POST', '/api/moi/demandes', { centre: 'Hôpital Nah Pôn', motif: 'Analyses', montant: 5000 }, jetonMembre);
    assert.equal(d.statut, 403);
    await appel('PATCH', `/api/admin/membres/${membreId}`, { statut: 'actif' }, jetonProprio);
  });

  test('réinitialiser le code secret', async () => {
    await appel('POST', `/api/admin/membres/${membreId}/pin`, { pin: '9999' }, jetonProprio);
    assert.equal((await appel('POST', '/api/membres/connexion', { telephone: '677123456', pin: '9999' })).statut, 200);
  });

  test('formules : le propriétaire modifie, un gestionnaire ne peut pas', async () => {
    const f = await appel('PUT', '/api/admin/formules', { id: 'essentiel', cotisation: 1200 }, jetonProprio);
    assert.equal(f.json.cotisation, 1200);
    const g = await appel('POST', '/api/admin/gestionnaires', { email: 'agent@pamezi.cm', nom: 'Agent Foumbot', motDePasse: 'agent-foumbot-1' }, jetonProprio);
    assert.equal(g.statut, 201);
    const jg = (await appel('POST', '/api/admin/connexion', { email: 'agent@pamezi.cm', motDePasse: 'agent-foumbot-1' })).json.jeton;
    assert.equal((await appel('PUT', '/api/admin/formules', { id: 'essentiel', cotisation: 1 }, jg)).statut, 403);
    assert.equal((await appel('GET', '/api/admin/membres', undefined, jg)).statut, 200, 'un gestionnaire voit les membres');
    await appel('PATCH', `/api/admin/gestionnaires/${g.json.id}`, { actif: false }, jetonProprio);
    assert.equal((await appel('GET', '/api/admin/membres', undefined, jg)).statut, 401, 'compte désactivé');
  });

  test('recherche, export CSV et journal', async () => {
    const r = await appel('GET', '/api/admin/membres?q=njimom', undefined, jetonProprio);
    assert.equal(r.json.length, 1);
    const csv = await appel('GET', '/api/admin/membres.csv', undefined, jetonProprio);
    assert.match(csv.json, /PMZ-\d{4}-00001/);
    const j = await appel('GET', '/api/admin/journal', undefined, jetonProprio);
    assert.ok(j.json.length >= 6);
    assert.ok(j.json.some((e: any) => e.action === 'Prise en charge payée'));
  });

  test('trop de tentatives de connexion : blocage', async () => {
    let dernier = 0;
    for (let i = 0; i < 11; i++) dernier = (await appel('POST', '/api/admin/connexion', { email: 'x@pamezi.cm', motDePasse: 'mauvais' })).statut;
    assert.equal(dernier, 429);
  });
});
