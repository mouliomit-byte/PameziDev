// Mode démonstration : le service de la mutuelle tourne dans l'appareil, sans serveur.
// Les données sont gardées dans le stockage local et partagées entre l'espace membre
// et le back office de ce même appareil (on peut adhérer puis se voir dans le back office).

import AsyncStorage from '@react-native-async-storage/async-storage';

import { creerDepotMemoire, type EtatMemoire, etatVide } from '@shared/depot-memoire';
import { ErreurMetier, type ModePaiement } from '@shared/regles';
import * as S from '@shared/service';

import type { Api } from './api';
import { SPECIMEN_CNI } from './specimen-cni';
import { ErreurApi } from './erreurs';

const CLE = 'pamezi:demo:v2'; // v2 : identité complète (nom, prénom, naissance, CNI)
export const DEMO_ADMIN = { email: 'proprietaire@pamezi.cm', motDePasse: 'demo-pamezi' };

// Les codes secrets ne protègent rien en démonstration : simple empreinte non cryptographique.
const empreinte = (s: string) => {
  let h = 5381;
  for (const c of s) h = (h * 33) ^ c.charCodeAt(0);
  return `demo$${(h >>> 0).toString(36)}`;
};
const secretsDemo: S.Secrets = {
  hacher: async (s) => empreinte(s),
  verifier: async (s, h) => empreinte(s) === h,
  identifiant: () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
};

// Membres d'exemple (fictifs) pour que le back office montre quelque chose dès l'ouverture.
const EXEMPLES: { nom: string; prenom: string; ne: string; lieu: string; tel: string; localite: string; formuleId: string; ayants: number; ilYa: number; mois: number[]; asso?: string }[] = [
  { nom: 'Mfondi', prenom: 'Ibrahim', ne: '12/03/1978', lieu: 'Foumban', tel: '670000101', localite: 'Foumban', formuleId: 'famille', ayants: 5, ilYa: 4, mois: [3, 2] },
  { nom: 'Njoya', prenom: 'Mariama', ne: '04/11/1990', lieu: 'Foumbot', tel: '670000102', localite: 'Foumbot', formuleId: 'essentiel', ayants: 0, ilYa: 3, mois: [4] },
  { nom: 'Pefoura', prenom: 'Abdou', ne: '21/06/1969', lieu: 'Koutaba', tel: '670000103', localite: 'Koutaba', formuleId: 'serenite', ayants: 6, ilYa: 2, mois: [3] },
  { nom: 'Mbouombouo', prenom: 'Fadimatou', ne: '09/09/1985', lieu: 'Njimom', tel: '670000104', localite: 'Njimom', formuleId: 'famille', ayants: 3, ilYa: 2, mois: [3], asso: 'Association des femmes de Njimom' },
  { nom: 'Nchare', prenom: 'Salifou', ne: '30/01/1995', lieu: 'Massangam', tel: '670000105', localite: 'Massangam', formuleId: 'essentiel', ayants: 0, ilYa: 1, mois: [1] },
  { nom: 'Mounpain', prenom: 'Awa', ne: '17/05/1988', lieu: 'Malantouen', tel: '670000106', localite: 'Malantouen', formuleId: 'famille', ayants: 4, ilYa: 0, mois: [] },
];

async function amorcer(ctx: S.Contexte) {
  await S.initialiser(ctx, { email: DEMO_ADMIN.email, nom: 'Propriétaire (démo)', motDePasse: DEMO_ADMIN.motDePasse });
  if ((await ctx.depot.membres.tous()).length > 0) return;
  const maintenant = new Date();
  for (const [i, e] of EXEMPLES.entries()) {
    const date = new Date(maintenant.getFullYear(), maintenant.getMonth() - e.ilYa, 5 + i, 10);
    const passe = { ...ctx, maintenant: () => date };
    const p = await S.adherer(passe, {
      nom: e.nom,
      prenom: e.prenom,
      dateNaissance: e.ne,
      lieuNaissance: e.lieu,
      cni: `10${e.tel.slice(-7)}`,
      cniPhoto: SPECIMEN_CNI,
      telephone: e.tel,
      localite: e.localite,
      typeAdhesion: e.asso ? 'Via une association' : 'Individuelle',
      association: e.asso,
      formuleId: e.formuleId,
      ayantsDroit: e.ayants,
      pin: '1234',
    });
    let mois = 0;
    for (const m of e.mois) {
      const quand = { ...ctx, maintenant: () => new Date(date.getFullYear(), date.getMonth() + mois, 8, 9) };
      await S.cotiser(quand, p.membre.id, m, (i % 2 ? 'Orange Money' : 'MTN Mobile Money') as ModePaiement);
      mois += m;
    }
  }
  const membres = await ctx.depot.membres.tous();
  const par = (tel: string) => membres.find((m) => m.telephone === tel)!.id;
  // Une cotisation en espèces à confirmer, et des demandes à différents stades.
  await S.cotiser(ctx, par('670000106'), 1, 'Espèces (bureau Pamezi)');
  const admin = (await ctx.depot.admins.tous())[0];
  await S.demander(ctx, par('670000101'), { centre: 'Hôpital Nah Pôn', motif: 'Consultation', montant: 12000 });
  await S.demander(ctx, par('670000102'), { centre: 'Hôpital Nah Pôn', motif: 'Analyses', montant: 8500 });
  const d3 = await S.demander(ctx, par('670000103'), { centre: 'Hôpital Nah Pôn', motif: 'Imagerie', montant: 45000 });
  await S.traiterDemande(ctx, admin, d3.demande.id, 'validee');
  await S.traiterDemande(ctx, admin, d3.demande.id, 'payee', 'Réglé à l’hôpital');
}

export function creerApiDemo(): Api {
  let pret: Promise<S.Contexte> | null = null;
  let minuteur: ReturnType<typeof setTimeout> | null = null;

  const contexte = () =>
    (pret ??= (async () => {
      let etat: EtatMemoire = etatVide();
      try {
        const brut = await AsyncStorage.getItem(CLE);
        if (brut) etat = { ...etat, ...JSON.parse(brut) };
      } catch {}
      const sauver = (e: EtatMemoire) => {
        if (minuteur) clearTimeout(minuteur);
        minuteur = setTimeout(() => AsyncStorage.setItem(CLE, JSON.stringify(e)).catch(() => {}), 150);
      };
      const ctx: S.Contexte = { depot: creerDepotMemoire(etat, sauver), secrets: secretsDemo, maintenant: () => new Date() };
      await amorcer(ctx);
      return ctx;
    })());

  // Exécute une opération du service et traduit ses erreurs comme le ferait le serveur.
  async function executer<T>(f: (ctx: S.Contexte) => Promise<T>): Promise<T> {
    try {
      return await f(await contexte());
    } catch (e) {
      if (e instanceof ErreurMetier) throw new ErreurApi(e.code, e.message);
      throw e;
    }
  }
  const lire = (jeton: string, role: 'membre' | 'admin') => {
    const [r, id] = jeton.split(':');
    if (r !== role || !id) throw new ErreurApi(401, 'Session expirée. Reconnectez-vous.');
    return id;
  };
  const admin = (ctx: S.Contexte, j: string) => S.adminActif(ctx, lire(j, 'admin'));

  return {
    mode: 'demo',
    formules: () => executer((c) => S.formulesActives(c)),
    centres: () => executer((c) => S.listerCentres(c)),
    stats: () => executer((c) => S.statistiquesPubliques(c)),
    membre: {
      adherer: (d) => executer(async (c) => {
        const profil = await S.adherer(c, d);
        return { jeton: `membre:${profil.membre.id}`, profil };
      }),
      connecter: (tel, pin) => executer(async (c) => {
        const profil = await S.connecterMembre(c, tel, pin);
        return { jeton: `membre:${profil.membre.id}`, profil };
      }),
      profil: (j) => executer((c) => S.profil(c, lire(j, 'membre'))),
      cotiser: (j, mois, mode) => executer((c) => S.cotiser(c, lire(j, 'membre'), mois, mode)),
      demander: (j, d) => executer((c) => S.demander(c, lire(j, 'membre'), d)),
    },
    admin: {
      connecter: (email, mdp) => executer(async (c) => {
        const a = await S.connecterAdmin(c, email, mdp);
        return { jeton: `admin:${a.id}`, admin: a };
      }),
      moi: (j) => executer((c) => admin(c, j)),
      tableau: (j) => executer(async (c) => {
        await admin(c, j);
        return S.tableauDeBord(c);
      }),
      membres: (j, f) => executer(async (c) => {
        await admin(c, j);
        return S.listerMembres(c, f);
      }),
      membre: (j, id) => executer(async (c) => {
        await admin(c, j);
        return S.profil(c, id);
      }),
      pieceIdentite: (j, id) => executer(async (c) => {
        await admin(c, j);
        return S.pieceIdentite(c, id);
      }),
      modifierMembre: (j, id, champs) => executer(async (c) => S.modifierMembre(c, await admin(c, j), id, champs)),
      reinitialiserPin: (j, id, pin) => executer(async (c) => S.reinitialiserPin(c, await admin(c, j), id, pin)),
      encaisserEspeces: (j, id, mois) => executer(async (c) => S.encaisserEspeces(c, await admin(c, j), id, mois)),
      cotisations: (j, statut) => executer(async (c) => {
        await admin(c, j);
        return S.listerCotisations(c, statut);
      }),
      traiterCotisation: (j, id, d) => executer(async (c) => S.traiterCotisation(c, await admin(c, j), id, d)),
      demandes: (j, statut) => executer(async (c) => {
        await admin(c, j);
        return S.listerDemandes(c, statut);
      }),
      traiterDemande: (j, id, d, com) => executer(async (c) => S.traiterDemande(c, await admin(c, j), id, d, com)),
      formules: (j) => executer(async (c) => {
        await admin(c, j);
        return S.toutesFormules(c);
      }),
      enregistrerFormule: (j, f) => executer(async (c) => S.enregistrerFormule(c, await admin(c, j), f)),
      centres: (j) => executer(async (c) => {
        await admin(c, j);
        return S.listerCentres(c);
      }),
      enregistrerCentre: (j, centre) => executer(async (c) => S.enregistrerCentre(c, await admin(c, j), centre)),
      supprimerCentre: (j, id) => executer(async (c) => S.supprimerCentre(c, await admin(c, j), id)),
      gestionnaires: (j) => executer(async (c) => {
        await admin(c, j);
        return S.listerAdmins(c);
      }),
      creerGestionnaire: (j, d) => executer(async (c) => S.creerAdmin(c, await admin(c, j), d)),
      activerGestionnaire: (j, id, actif) => executer(async (c) => S.activerAdmin(c, await admin(c, j), id, actif)),
      journal: (j) => executer(async (c) => {
        await admin(c, j);
        return S.listerJournal(c);
      }),
      exporterCsv: (j) => executer(async (c) => {
        await admin(c, j);
        return S.membresEnCsv(await S.listerMembres(c, {}));
      }),
    },
  };
}
