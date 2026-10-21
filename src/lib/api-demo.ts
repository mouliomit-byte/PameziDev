// Mode démonstration : le service de la mutuelle tourne dans l'appareil, sans serveur.
// Les données sont gardées dans le stockage local et partagées entre l'espace membre
// et le back office de ce même appareil (on peut adhérer puis se voir dans le back office).

import AsyncStorage from '@react-native-async-storage/async-storage';

import { creerDepotMemoire, type EtatMemoire, etatVide } from '@shared/depot-memoire';
import { type Cotisation, type Demande, ErreurMetier, type Membre } from '@shared/regles';
import * as S from '@shared/service';

import type { Api } from './api';
import { SPECIMEN_CNI } from './specimen-cni';
import FICTIFS from './demo-fictifs.json';
import { ErreurApi } from './erreurs';

const CLE = 'pamezi:demo:v3'; // v3 : les 30 membres fictifs de la base en ligne
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

// Les 30 membres fictifs de la base en ligne (scripts/fictifs/generer.ts), avec leurs cotisations
// et demandes : le mode démonstration montre les mêmes données que le back office en ligne.
async function amorcer(ctx: S.Contexte) {
  await S.initialiser(ctx, { email: DEMO_ADMIN.email, nom: 'Propriétaire (démo)', motDePasse: DEMO_ADMIN.motDePasse });
  if ((await ctx.depot.membres.tous()).length > 0) return;
  const pinHash = await secretsDemo.hacher('1234');
  for (const m of FICTIFS.membres) {
    await ctx.depot.membres.inserer({ ...(m as unknown as Membre), pinHash });
    await ctx.depot.pieces.inserer({ id: m.id, cniPhoto: SPECIMEN_CNI, ajouteLe: m.dateAdhesion });
  }
  for (const c of FICTIFS.cotisations) await ctx.depot.cotisations.inserer(c as unknown as Cotisation);
  for (const d of FICTIFS.demandes) await ctx.depot.demandes.inserer(d as unknown as Demande);
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
    reglages: () => executer((c) => S.lireReglages(c)),
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
      enregistrerReglages: (j, r) => executer(async (c) => S.enregistrerReglages(c, await admin(c, j), r)),
      notifications: (j) => executer(async (c) => {
        await admin(c, j);
        return S.notificationsDuBackOffice(c);
      }),
      exporterCsv: (j) => executer(async (c) => {
        await admin(c, j);
        return S.membresEnCsv(await S.listerMembres(c, {}));
      }),
    },
  };
}
