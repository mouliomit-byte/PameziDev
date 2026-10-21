// Accès aux données de la mutuelle depuis l'application (membres et back office).
//
// Deux modes, choisis à la construction de l'app :
// - « serveur » : EXPO_PUBLIC_API_URL est défini (ex. https://api.pamezi.cm, ou « / » quand
//   l'application Web est servie par le serveur Pamezi lui-même) → appels HTTP à l'API ;
// - « démonstration » : variable absente → le même service tourne dans l'appareil,
//   avec des données locales (utile pour tester sans serveur, et pour l'artefact).

import type {
  Admin,
  Centre,
  Cotisation,
  Demande,
  EntreeJournal,
  Formule,
  ModePaiement,
  Profil,
  RoleAdmin,
  Statistiques,
  StatutCotisation,
  StatutDemande,
  StatutMembre,
} from '@shared/regles';
import type { DonneesAdhesion, LigneCotisation, LigneDemande, LigneMembre } from '@shared/service';

import { creerApiDemo } from './api-demo';
import { ErreurApi } from './erreurs';

export { ErreurApi };

export type ModificationMembre = { statut?: StatutMembre; formuleId?: string; ayantsDroit?: number; localite?: string; nom?: string };

export type Api = {
  mode: 'serveur' | 'demo';
  formules(): Promise<Formule[]>;
  centres(): Promise<Centre[]>;
  stats(): Promise<{ membres: number }>;
  membre: {
    adherer(d: DonneesAdhesion): Promise<{ jeton: string; profil: Profil }>;
    connecter(telephone: string, pin: string): Promise<{ jeton: string; profil: Profil }>;
    profil(jeton: string): Promise<Profil>;
    cotiser(jeton: string, mois: number, mode: ModePaiement): Promise<{ cotisation: Cotisation; profil: Profil }>;
    demander(jeton: string, d: { centre: string; motif: string; montant: number }): Promise<{ demande: Demande; profil: Profil }>;
  };
  admin: {
    connecter(email: string, motDePasse: string): Promise<{ jeton: string; admin: Admin }>;
    moi(j: string): Promise<Admin>;
    tableau(j: string): Promise<Statistiques>;
    membres(j: string, filtre: { q?: string; statut?: StatutMembre | '' }): Promise<LigneMembre[]>;
    membre(j: string, id: string): Promise<Profil>;
    /** Photo ou scan de la CNI du membre (data URI), ou null. */
    pieceIdentite(j: string, id: string): Promise<{ cniPhoto: string | null }>;
    modifierMembre(j: string, id: string, champs: ModificationMembre): Promise<Profil>;
    reinitialiserPin(j: string, id: string, pin: string): Promise<void>;
    encaisserEspeces(j: string, id: string, mois: number): Promise<Profil>;
    cotisations(j: string, statut?: StatutCotisation | ''): Promise<LigneCotisation[]>;
    traiterCotisation(j: string, id: string, decision: StatutCotisation): Promise<void>;
    demandes(j: string, statut?: StatutDemande | ''): Promise<LigneDemande[]>;
    traiterDemande(j: string, id: string, decision: StatutDemande, commentaire?: string): Promise<void>;
    formules(j: string): Promise<Formule[]>;
    enregistrerFormule(j: string, f: Partial<Formule>): Promise<Formule>;
    centres(j: string): Promise<Centre[]>;
    enregistrerCentre(j: string, c: Partial<Centre>): Promise<Centre>;
    supprimerCentre(j: string, id: string): Promise<void>;
    gestionnaires(j: string): Promise<Admin[]>;
    creerGestionnaire(j: string, d: { email: string; nom: string; motDePasse: string; role?: RoleAdmin }): Promise<Admin>;
    activerGestionnaire(j: string, id: string, actif: boolean): Promise<void>;
    journal(j: string): Promise<EntreeJournal[]>;
    /** Liste des membres au format CSV (séparateur « ; », lisible par Excel). */
    exporterCsv(j: string): Promise<string>;
  };
};

function creerApiHttp(adresse: string): Api {
  const base = adresse === '/' ? '' : adresse.replace(/\/+$/, '');
  async function appel<T>(methode: string, chemin: string, corps?: unknown, jeton?: string): Promise<T> {
    let r: Response;
    try {
      r = await fetch(`${base}/api${chemin}`, {
        method: methode,
        headers: {
          ...(corps !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
        },
        body: corps === undefined ? undefined : JSON.stringify(corps),
      });
    } catch {
      throw new ErreurApi(0, 'Connexion au serveur Pamezi impossible. Vérifiez votre connexion internet.');
    }
    const donnees = await r.json().catch(() => ({}));
    if (!r.ok) throw new ErreurApi(r.status, donnees?.erreur ?? `Erreur ${r.status}`);
    return donnees as T;
  }
  const q = (params: Record<string, string | undefined>) => {
    const s = Object.entries(params)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join('&');
    return s ? `?${s}` : '';
  };
  return {
    mode: 'serveur',
    formules: () => appel('GET', '/formules'),
    centres: () => appel('GET', '/centres'),
    stats: () => appel('GET', '/stats'),
    membre: {
      adherer: (d) => appel('POST', '/membres', d),
      connecter: (telephone, pin) => appel('POST', '/membres/connexion', { telephone, pin }),
      profil: (j) => appel('GET', '/moi', undefined, j),
      cotiser: (j, mois, mode) => appel('POST', '/moi/cotisations', { mois, mode }, j),
      demander: (j, d) => appel('POST', '/moi/demandes', d, j),
    },
    admin: {
      connecter: (email, motDePasse) => appel('POST', '/admin/connexion', { email, motDePasse }),
      moi: (j) => appel('GET', '/admin/moi', undefined, j),
      tableau: (j) => appel('GET', '/admin/tableau-de-bord', undefined, j),
      membres: (j, f) => appel('GET', `/admin/membres${q({ q: f.q, statut: f.statut })}`, undefined, j),
      membre: (j, id) => appel('GET', `/admin/membres/${id}`, undefined, j),
      pieceIdentite: (j, id) => appel('GET', `/admin/membres/${id}/piece`, undefined, j),
      modifierMembre: (j, id, champs) => appel('PATCH', `/admin/membres/${id}`, champs, j),
      reinitialiserPin: (j, id, pin) => appel('POST', `/admin/membres/${id}/pin`, { pin }, j),
      encaisserEspeces: (j, id, mois) => appel('POST', `/admin/membres/${id}/especes`, { mois }, j),
      cotisations: (j, statut) => appel('GET', `/admin/cotisations${q({ statut })}`, undefined, j),
      traiterCotisation: (j, id, decision) => appel('POST', `/admin/cotisations/${id}/decision`, { decision }, j),
      demandes: (j, statut) => appel('GET', `/admin/demandes${q({ statut })}`, undefined, j),
      traiterDemande: (j, id, decision, commentaire) => appel('POST', `/admin/demandes/${id}/decision`, { decision, commentaire }, j),
      formules: (j) => appel('GET', '/admin/formules', undefined, j),
      enregistrerFormule: (j, f) => appel('PUT', '/admin/formules', f, j),
      centres: (j) => appel('GET', '/admin/centres', undefined, j),
      enregistrerCentre: (j, c) => appel('PUT', '/admin/centres', c, j),
      supprimerCentre: (j, id) => appel('DELETE', `/admin/centres/${id}`, undefined, j),
      gestionnaires: (j) => appel('GET', '/admin/gestionnaires', undefined, j),
      creerGestionnaire: (j, d) => appel('POST', '/admin/gestionnaires', d, j),
      activerGestionnaire: (j, id, actif) => appel('PATCH', `/admin/gestionnaires/${id}`, { actif }, j),
      journal: (j) => appel('GET', '/admin/journal', undefined, j),
      exporterCsv: async (j) => {
        const r = await fetch(`${base}/api/admin/membres.csv`, { headers: { Authorization: `Bearer ${j}` } }).catch(() => null);
        if (!r || !r.ok) throw new ErreurApi(r?.status ?? 0, 'Export impossible pour le moment.');
        return r.text();
      },
    },
  };
}

const ADRESSE = process.env.EXPO_PUBLIC_API_URL?.trim();

export const api: Api = ADRESSE ? creerApiHttp(ADRESSE) : creerApiDemo();
