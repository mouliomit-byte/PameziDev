// Génère 30 membres FICTIFS (avec cotisations et demandes) en appliquant les règles de l'application,
// et écrit le SQL d'insertion pour la base Supabase. Lancer : node scripts/fictifs/generer.ts
// Tout est marqué : numéros PMZ-DEMO-xxxx, champ « fictif: true », téléphones 6900001xx, CNI FICTIFxxxxx.
// Suppression : scripts/fictifs/supprimer.sql

import fs from 'node:fs';

import { creerDepotMemoire, etatVide } from '../../shared/depot-memoire.ts';
import type { ModePaiement } from '../../shared/regles.ts';
import * as S from '../../shared/service.ts';
import { secretsServeur } from '../../server/src/securite.ts';

// Générateur pseudo-aléatoire reproductible.
let graine = 20261021;
const hasard = () => ((graine = (graine * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const choisir = <T>(xs: T[]) => xs[Math.floor(hasard() * xs.length)];
const entre = (a: number, b: number) => a + Math.floor(hasard() * (b - a + 1));

const NOMS = ['Njoya', 'Mfondi', 'Pefoura', 'Mbouombouo', 'Nchare', 'Mounpain', 'Njikam', 'Ngouhouo', 'Mama', 'Nsangou', 'Ndam', 'Mfopit', 'Pemboura', 'Kouotou', 'Monjimbo', 'Nchouwet', 'Njimoluh', 'Fonkou', 'Mbiapo', 'Nji', 'Pagnigni', 'Mouchingam', 'Ngapna', 'Nkoupa', 'Mounjouenpou', 'Nsangou', 'Mefire', 'Paho', 'Ngoumbe', 'Mounde'];
const PRENOMS = ['Ibrahim', 'Mariama', 'Abdou', 'Fadimatou', 'Salifou', 'Awa', 'Aminatou', 'Moussa', 'Hadidja', 'Oumarou', 'Zénabou', 'Issa', 'Ramatou', 'Adamou', 'Mounira', 'Yaya', 'Safiatou', 'Amadou', 'Rabiatou', 'Seidou', 'Djamila', 'Ousmane', 'Haoua', 'Ali', 'Kadidja', 'Bouba', 'Asmaou', 'Souleymane', 'Nafissatou', 'Hamidou'];
const LOCALITES = ['Foumban', 'Foumban', 'Foumban', 'Foumbot', 'Foumbot', 'Koutaba', 'Kouoptamo', 'Magba', 'Malantouen', 'Massangam', 'Njimom', 'Bangourain'];
const ASSOCIATIONS = ['Association des femmes de Njimom', 'GIC des planteurs de Foumbot', 'Tontine des commerçants du marché de Foumban'];
const FORMULES = ['essentiel', 'famille', 'famille', 'famille', 'serenite'];
const MOMO: ModePaiement[] = ['MTN Mobile Money', 'Orange Money'];
const PHOTO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const maintenant = new Date();
const etat = etatVide();
const ctx: S.Contexte = { depot: creerDepotMemoire(etat), secrets: secretsServeur, maintenant: () => maintenant };
const a = (d: Date): S.Contexte => ({ ...ctx, maintenant: () => d });
await S.initialiser(ctx, { email: 'generateur@fictif.local', nom: 'Bureau (données fictives)', motDePasse: 'non-exporte-123' });
const bureau = (await ctx.depot.admins.tous())[0];

const membres: { id: string; aJour: boolean }[] = [];
for (let i = 0; i < 30; i++) {
  const ilYa = entre(0, 6); // mois depuis l'adhésion
  const adhesion = new Date(maintenant.getFullYear(), maintenant.getMonth() - ilYa, entre(1, ilYa === 0 ? Math.max(1, maintenant.getDate() - 1) : 27), entre(8, 17), entre(0, 59));
  const viaAsso = hasard() < 0.3;
  const formuleId = choisir(FORMULES);
  const maxAyants = { essentiel: 0, famille: 5, serenite: 7 }[formuleId] ?? 0; // selon « personnes couvertes »
  const p = await S.adherer(a(adhesion), {
    nom: NOMS[i].toUpperCase(),
    prenom: PRENOMS[i],
    dateNaissance: `${String(entre(1, 28)).padStart(2, '0')}/${String(entre(1, 12)).padStart(2, '0')}/${entre(1958, 2004)}`,
    lieuNaissance: choisir(['Foumban', 'Foumbot', 'Koutaba', 'Njimom', 'Massangam', 'Malantouen', 'Bafoussam', 'Kouoptamo']),
    cni: `FICTIF${String(i + 1).padStart(5, '0')}`,
    cniPhoto: PHOTO,
    telephone: `6900001${String(i + 1).padStart(2, '0')}`,
    localite: choisir(LOCALITES),
    typeAdhesion: viaAsso ? 'Via une association' : 'Individuelle',
    association: viaAsso ? choisir(ASSOCIATIONS) : undefined,
    formuleId,
    ayantsDroit: entre(0, maxAyants),
    pin: '1234',
  });
  const id = p.membre.id;
  // Cotisations : la plupart à jour, quelques retards, des espèces à confirmer.
  const moisDus = p.situation.moisDus + ilYa;
  const profilType = hasard();
  let payes = profilType < 0.7 ? moisDus : profilType < 0.88 ? Math.max(0, moisDus - entre(1, 2)) : 0;
  let k = 0;
  while (payes > 0) {
    const bloc = Math.min(payes, choisir([1, 1, 1, 3]));
    const quand = new Date(adhesion.getFullYear(), adhesion.getMonth() + k, Math.min(28, adhesion.getDate() + 2), 10);
    if (quand > maintenant) break;
    await S.cotiser(a(quand), id, bloc, choisir(MOMO));
    payes -= bloc;
    k += bloc;
  }
  if (profilType >= 0.88) await S.cotiser(ctx, id, 1, 'Espèces (bureau Pamezi)'); // en attente au bureau
  const final = await S.profil(ctx, id);
  membres.push({ id, aJour: final.situation.aJour });
}

// Trois membres en retard ont déclaré un paiement en espèces, à confirmer par le bureau.
for (const m of membres.filter((x) => !x.aJour).slice(0, 3)) await S.cotiser(ctx, m.id, 1, 'Espèces (bureau Pamezi)');

// Demandes de soins pour des membres à jour, à différents stades.
const aJour = membres.filter((m) => m.aJour);
const etapes: ('en_cours' | 'validee' | 'payee' | 'rejetee')[] = ['en_cours', 'en_cours', 'en_cours', 'en_cours', 'validee', 'validee', 'validee', 'payee', 'payee', 'payee', 'payee', 'rejetee'];
const MOTIFS = [['Consultation', 5000, 15000], ['Médicaments', 3000, 25000], ['Analyses', 5000, 20000], ['Imagerie', 25000, 60000], ['Hospitalisation', 40000, 150000], ['Accouchement', 50000, 120000]] as const;
for (const [n, etape] of etapes.entries()) {
  const m = aJour[(n * 7) % aJour.length];
  const [motif, min, max] = choisir([...MOTIFS]);
  const { demande } = await S.demander(ctx, m.id, { centre: 'Hôpital Nah Pôn', motif, montant: Math.round(entre(min, max) / 500) * 500 });
  if (etape === 'validee' || etape === 'payee') await S.traiterDemande(ctx, bureau, demande.id, 'validee');
  if (etape === 'payee') await S.traiterDemande(ctx, bureau, demande.id, 'payee', 'Réglé à l’hôpital (fictif)');
  if (etape === 'rejetee') await S.traiterDemande(ctx, bureau, demande.id, 'rejetee', 'Maladie hors catégories prises en charge (fictif)');
}
// Une suspension et une démission.
await S.modifierMembre(ctx, bureau, membres[5].id, { statut: 'suspendu' });
await S.modifierMembre(ctx, bureau, membres[17].id, { statut: 'demission' });

// Marquage « fictif » et numéros PMZ-DEMO-xxxx (hors numérotation des vrais membres).
const docsMembres = (await ctx.depot.membres.tous())
  .sort((x, y) => x.dateAdhesion.localeCompare(y.dateAdhesion))
  .map((m, i) => ({ ...m, numero: `PMZ-DEMO-${String(i + 1).padStart(4, '0')}`, fictif: true }));
const fictif = <T>(xs: T[]) => xs.map((x) => ({ ...x, fictif: true }));
const docsCotis = fictif(await ctx.depot.cotisations.tous());
const docsDemandes = fictif(await ctx.depot.demandes.tous());

const json = (x: unknown) => JSON.stringify(x).replace(/\$/g, '\\u0024'); // pas de « $ » dans le dollar-quoting
const sql = [
  '-- 30 membres FICTIFS générés par scripts/fictifs/generer.ts (supprimer avec scripts/fictifs/supprimer.sql)',
  `insert into pamezi.membres (id, data) select x->>'id', x from jsonb_array_elements($j$${json(docsMembres)}$j$::jsonb) x;`,
  `insert into pamezi.cotisations (id, data) select x->>'id', x from jsonb_array_elements($j$${json(docsCotis)}$j$::jsonb) x;`,
  `insert into pamezi.demandes (id, data) select x->>'id', x from jsonb_array_elements($j$${json(docsDemandes)}$j$::jsonb) x;`,
].join('\n');
fs.writeFileSync('scripts/fictifs/inserer.sql', sql + '\n');

const resume = {
  membres: docsMembres.length,
  aJour: membres.filter((m) => m.aJour).length,
  cotisations: docsCotis.length,
  enAttente: docsCotis.filter((c) => c.statut === 'en_attente').length,
  demandes: Object.fromEntries(['en_cours', 'validee', 'payee', 'rejetee'].map((s) => [s, docsDemandes.filter((d) => d.statut === s).length])),
  localites: [...new Set(docsMembres.map((m) => m.localite))].length,
  taille: `${Math.round(sql.length / 1024)} Ko`,
};
console.log(resume);
