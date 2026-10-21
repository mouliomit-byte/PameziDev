// Règles métier de la Mutuelle de Santé Pamezi.
// Ce fichier est partagé par le serveur (Node) et l'application (Expo) :
// il ne dépend de rien et n'utilise que du TypeScript « effaçable ».

export type StatutMembre = 'actif' | 'suspendu' | 'demission';
export type TypeAdhesion = 'Individuelle' | 'Via une association';
export type ModePaiement = 'MTN Mobile Money' | 'Orange Money' | 'Espèces (bureau Pamezi)';
export type StatutCotisation = 'en_attente' | 'confirmee' | 'rejetee';
export type StatutDemande = 'en_cours' | 'validee' | 'rejetee' | 'payee';
export type RoleAdmin = 'proprietaire' | 'gestionnaire';

export type Membre = {
  id: string;
  numero: string; // N° d'inscription
  nom: string; // nom de famille
  prenom: string;
  dateNaissance: string; // AAAA-MM-JJ
  lieuNaissance: string;
  cni: string; // numéro de la carte nationale d'identité
  pieceCni: boolean; // photo ou scan de la CNI fourni
  telephone: string; // 9 chiffres, sans indicatif
  localite: string;
  typeAdhesion: TypeAdhesion;
  association?: string;
  formuleId: string;
  ayantsDroit: number;
  statut: StatutMembre;
  dateAdhesion: string;
};

export type Cotisation = {
  id: string;
  membreId: string;
  montant: number;
  mois: number;
  mode: ModePaiement;
  statut: StatutCotisation;
  reference: string;
  date: string;
  traiteLe?: string;
  traitePar?: string;
};

export type Demande = {
  id: string;
  membreId: string;
  centre: string;
  motif: string;
  montant: number;
  priseEnCharge: number;
  statut: StatutDemande;
  commentaire?: string;
  date: string;
  traiteLe?: string;
  traitePar?: string;
};

export type Formule = {
  id: string;
  nom: string;
  cotisation: number;
  personnes: string;
  taux: number;
  plafond: number;
  garanties: string[];
  actif: boolean;
  ordre: number;
};

export type Centre = {
  id: string;
  nom: string;
  statut: string;
  services: string[];
  conventionne: boolean;
};

export type Admin = {
  id: string;
  email: string;
  nom: string;
  role: RoleAdmin;
  actif: boolean;
  creeLe: string;
};

export type EntreeJournal = {
  id: string;
  date: string;
  adminId: string;
  adminNom: string;
  action: string;
  cible: string;
};

export type Situation = { moisPayes: number; moisDus: number; aJour: boolean; enAttente: number };

export type Profil = {
  membre: Membre;
  formule: Formule | null;
  cotisations: Cotisation[];
  demandes: Demande[];
  situation: Situation;
  totalCotise: number;
  totalPrisEnCharge: number;
  plafondRestant: number;
};

export const MODES_PAIEMENT: ModePaiement[] = ['MTN Mobile Money', 'Orange Money', 'Espèces (bureau Pamezi)'];
export const MOTIFS = ['Consultation', 'Médicaments', 'Analyses', 'Imagerie', 'Hospitalisation', 'Accouchement', 'Autre'];
export const OBJECTIF_ADHERENTS = { min: 5000, max: 10000 };

export const LIBELLE_STATUT_MEMBRE: Record<StatutMembre, string> = {
  actif: 'Actif',
  suspendu: 'Suspendu',
  demission: 'Démission',
};
export const LIBELLE_STATUT_COTISATION: Record<StatutCotisation, string> = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  rejetee: 'Rejetée',
};
export const LIBELLE_STATUT_DEMANDE: Record<StatutDemande, string> = {
  en_cours: 'En cours',
  validee: 'Validée',
  rejetee: 'Rejetée',
  payee: 'Payée',
};

export const FORMULES_DEPART: Formule[] = [
  {
    id: 'essentiel',
    nom: 'Essentiel',
    cotisation: 1000,
    personnes: 'Le membre seul',
    taux: 70,
    plafond: 150000,
    garanties: ['Consultations', 'Médicaments essentiels', 'Analyses de base'],
    actif: true,
    ordre: 1,
  },
  {
    id: 'famille',
    nom: 'Famille',
    cotisation: 2500,
    personnes: 'Membre + 5 ayants droit',
    taux: 75,
    plafond: 400000,
    garanties: ['Tout Essentiel', 'Soins des enfants', 'Vaccinations', 'Suivi de grossesse'],
    actif: true,
    ordre: 2,
  },
  {
    id: 'serenite',
    nom: 'Sérénité',
    cotisation: 5000,
    personnes: 'Membre + 7 ayants droit',
    taux: 80,
    plafond: 800000,
    garanties: ['Tout Famille', 'Hospitalisation', 'Accouchement', 'Imagerie (scanner, radio)'],
    actif: true,
    ordre: 3,
  },
];

export const CENTRES_DEPART: Centre[] = [
  {
    id: 'nah-pon',
    nom: 'Hôpital Nah Pôn',
    statut: 'Convention de soins signée',
    services: ['Consultations', 'Scanner', 'Radiologie'],
    conventionne: true,
  },
  {
    id: 'autres',
    nom: 'Autres centres et cliniques de la ville',
    statut: 'En cours d’approche',
    services: [],
    conventionne: false,
  },
];

/** Erreur prévue (saisie invalide, droit manquant…) : son message s'affiche tel quel à l'utilisateur. */
export class ErreurMetier extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'ErreurMetier';
  }
}

export function normaliserTelephone(saisie: string): string {
  return String(saisie ?? '').replace(/\D/g, '').replace(/^237/, '');
}

export function telephoneValide(tel: string): boolean {
  return /^6\d{8}$/.test(tel);
}

export function formaterTelephone(tel: string): string {
  return `+237 ${tel.replace(/(\d)(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')}`;
}

/** « Nom Prénom », dans l'ordre du guide des procédures. */
export function nomComplet(m: { nom: string; prenom?: string }): string {
  return [m.nom, m.prenom].filter(Boolean).join(' ');
}

/** « 25/07/1985 » → « 1985-07-25 » ; null si la date n'existe pas. */
export function lireDateNaissance(saisie: string): string | null {
  const m = /^\s*(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\s*$/.exec(String(saisie ?? ''));
  if (!m) return /^\d{4}-\d{2}-\d{2}$/.test(String(saisie)) && !isNaN(Date.parse(saisie)) ? saisie : null;
  const [j, mo, a] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(a, mo - 1, j));
  if (d.getUTCFullYear() !== a || d.getUTCMonth() !== mo - 1 || d.getUTCDate() !== j) return null;
  return `${a}-${String(mo).padStart(2, '0')}-${String(j).padStart(2, '0')}`;
}

/** Âge révolu à la date donnée. */
export function calculerAge(dateNaissance: string, maintenant: Date): number {
  const [a, m, j] = dateNaissance.split('-').map(Number);
  let age = maintenant.getFullYear() - a;
  if (maintenant.getMonth() + 1 < m || (maintenant.getMonth() + 1 === m && maintenant.getDate() < j)) age--;
  return age;
}

export function formaterDate(iso: string): string {
  const [a, m, j] = iso.slice(0, 10).split('-');
  return `${j}/${m}/${a}`;
}

/** Numéro de CNI : lettres et chiffres, sans espaces. */
export function normaliserCni(saisie: string): string {
  return String(saisie ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export const AGE_MINIMUM = 18;

export function numeroMembre(annee: number, rang: number): string {
  return `PMZ-${annee}-${String(rang).padStart(5, '0')}`;
}

/** Mois couverts par les cotisations confirmées, comparés aux mois écoulés depuis l'adhésion. */
export function calculerSituation(membre: Membre, cotisations: Cotisation[], maintenant: Date): Situation {
  const debut = new Date(membre.dateAdhesion);
  const moisDus = Math.max(1, (maintenant.getFullYear() - debut.getFullYear()) * 12 + maintenant.getMonth() - debut.getMonth() + 1);
  const moisPayes = cotisations.filter((c) => c.statut === 'confirmee').reduce((s, c) => s + c.mois, 0);
  const enAttente = cotisations.filter((c) => c.statut === 'en_attente').reduce((s, c) => s + c.mois, 0);
  return { moisPayes, moisDus, aJour: moisPayes >= moisDus, enAttente };
}

/** Montant déjà pris en charge sur l'année civile en cours (demandes non rejetées). */
export function prisEnChargeAnnee(demandes: Demande[], maintenant: Date): number {
  const annee = maintenant.getFullYear();
  return demandes
    .filter((d) => d.statut !== 'rejetee' && new Date(d.date).getFullYear() === annee)
    .reduce((s, d) => s + d.priseEnCharge, 0);
}

export function calculerPriseEnCharge(montant: number, taux: number, plafondRestant: number): number {
  return Math.max(0, Math.min(Math.round((montant * taux) / 100), plafondRestant));
}

export function construireProfil(
  membre: Membre,
  formule: Formule | null,
  cotisations: Cotisation[],
  demandes: Demande[],
  maintenant: Date,
): Profil {
  const trier = <T extends { date: string }>(xs: T[]) => [...xs].sort((a, b) => b.date.localeCompare(a.date));
  const totalPrisEnCharge = demandes.filter((d) => d.statut !== 'rejetee').reduce((s, d) => s + d.priseEnCharge, 0);
  return {
    membre,
    formule,
    cotisations: trier(cotisations),
    demandes: trier(demandes),
    situation: calculerSituation(membre, cotisations, maintenant),
    totalCotise: cotisations.filter((c) => c.statut === 'confirmee').reduce((s, c) => s + c.montant, 0),
    totalPrisEnCharge,
    plafondRestant: Math.max(0, (formule?.plafond ?? 0) - prisEnChargeAnnee(demandes, maintenant)),
  };
}

export type Statistiques = {
  membres: number;
  actifs: number;
  aJour: number;
  suspendus: number;
  nouveauxCeMois: number;
  encaisse: number;
  prisEnChargePaye: number;
  prisEnChargeEngage: number;
  solde: number;
  cotisationsEnAttente: number;
  demandesEnCours: number;
  parLocalite: { libelle: string; valeur: number }[];
  parFormule: { libelle: string; valeur: number }[];
  encaissementsParMois: { libelle: string; valeur: number }[];
  objectif: typeof OBJECTIF_ADHERENTS;
};

export function calculerStatistiques(
  membres: Membre[],
  cotisations: Cotisation[],
  demandes: Demande[],
  formules: Formule[],
  maintenant: Date,
): Statistiques {
  const cotisParMembre = new Map<string, Cotisation[]>();
  for (const c of cotisations) cotisParMembre.set(c.membreId, [...(cotisParMembre.get(c.membreId) ?? []), c]);
  const actifs = membres.filter((m) => m.statut === 'actif');
  const aJour = actifs.filter((m) => calculerSituation(m, cotisParMembre.get(m.id) ?? [], maintenant).aJour).length;
  const confirmees = cotisations.filter((c) => c.statut === 'confirmee');
  const encaisse = confirmees.reduce((s, c) => s + c.montant, 0);
  const prisEnChargePaye = demandes.filter((d) => d.statut === 'payee').reduce((s, d) => s + d.priseEnCharge, 0);
  const prisEnChargeEngage = demandes.filter((d) => d.statut === 'validee').reduce((s, d) => s + d.priseEnCharge, 0);

  const compter = (cles: string[]) => {
    const m = new Map<string, number>();
    for (const k of cles) m.set(k, (m.get(k) ?? 0) + 1);
    return [...m.entries()].map(([libelle, valeur]) => ({ libelle, valeur })).sort((a, b) => b.valeur - a.valeur);
  };
  const nomFormule = (id: string) => formules.find((f) => f.id === id)?.nom ?? id;

  const encaissementsParMois: { libelle: string; valeur: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
    const valeur = confirmees
      .filter((c) => {
        const x = new Date(c.date);
        return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth();
      })
      .reduce((s, c) => s + c.montant, 0);
    encaissementsParMois.push({ libelle: d.toLocaleDateString('fr-FR', { month: 'short' }), valeur });
  }

  return {
    membres: membres.length,
    actifs: actifs.length,
    aJour,
    suspendus: membres.filter((m) => m.statut === 'suspendu').length,
    nouveauxCeMois: membres.filter((m) => {
      const d = new Date(m.dateAdhesion);
      return d.getFullYear() === maintenant.getFullYear() && d.getMonth() === maintenant.getMonth();
    }).length,
    encaisse,
    prisEnChargePaye,
    prisEnChargeEngage,
    solde: encaisse - prisEnChargePaye,
    cotisationsEnAttente: cotisations.filter((c) => c.statut === 'en_attente').length,
    demandesEnCours: demandes.filter((d) => d.statut === 'en_cours').length,
    parLocalite: compter(membres.map((m) => m.localite)),
    parFormule: compter(membres.map((m) => nomFormule(m.formuleId))),
    encaissementsParMois,
    objectif: OBJECTIF_ADHERENTS,
  };
}
