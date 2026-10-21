export const NOM = 'Mutuelle de Santé Pamezi';
export const SLOGAN = 'Ensemble pour une meilleure santé !';
export const DEVISE = 'Votre santé, notre priorité !';
export const SOLIDARITE = 'Plus nous sommes nombreux, plus nous sommes forts !';

export const RECEPISSE = {
  numero: '195/RDA/F32DAPP',
  autorite: 'Préfecture du Noun',
  date: '25 juillet 2005',
};

export const OBJECTIF_ADHERENTS = { min: 5000, max: 10000 };

export const CONTACTS = {
  email: 'mutuelledesantepamezi@gmail.com',
  facebook: 'https://www.facebook.com/profile.php?id=6159412983404',
  instagram: 'https://www.instagram.com/mutuelledesantepamezi/',
};

export const OBJECTIFS = [
  'Promouvoir la prévoyance du risque maladie par l’organisation du financement des soins de santé.',
  'Promouvoir l’entraide et la solidarité au profit des membres.',
  'Organiser les actions de prévention des maladies.',
];

export const REGLES_TONTINE = [
  {
    icone: 'card',
    titre: 'Une carte de membre pour chaque adhérent',
    texte: 'Il cotise chaque mois pour lui et ses ayants droit, ce qui ouvre l’accès à la prise en charge en cas de maladie du membre et de sa famille.',
  },
  {
    icone: 'people',
    titre: 'L’adhésion est libre, comme la démission',
    texte: 'Elle peut être individuelle ou se faire via une association.',
  },
  {
    icone: 'shield-checkmark',
    titre: 'Des maladies prises en charge',
    texte: 'Pamezi définit les catégories de maladies prises en charge.',
  },
  {
    icone: 'podium',
    titre: 'Une assemblée générale chaque année',
    texte: 'Elle présente le bilan et, selon les résultats, décide d’élargir les maladies prises en charge, d’ajouter d’autres formes de solidarité ou de diminuer les cotisations.',
  },
  {
    icone: 'business',
    titre: 'Une convention de soins',
    texte: 'Signée avec l’Hôpital Nah Pôn pour commencer ; les autres centres de santé et cliniques de la ville seront approchés au fur et à mesure, pour être plus proches des membres.',
  },
] as const;

// Arrondissements du département du Noun (Région de l'Ouest, Cameroun)
export const LOCALITES = [
  'Foumban',
  'Foumbot',
  'Koutaba',
  'Kouoptamo',
  'Magba',
  'Malantouen',
  'Massangam',
  'Njimom',
  'Bangourain',
  'Autre village du Noun',
] as const;

export type FormuleId = 'essentiel' | 'famille' | 'serenite';

export type Formule = {
  id: FormuleId;
  nom: string;
  cotisation: number; // FCFA / mois
  personnes: string;
  taux: number; // % pris en charge
  plafond: number; // FCFA / an
  garanties: string[];
};

// Barème indicatif : les montants définitifs sont fixés par l'assemblée générale.
export const FORMULES: Formule[] = [
  {
    id: 'essentiel',
    nom: 'Essentiel',
    cotisation: 1000,
    personnes: 'Le membre seul',
    taux: 70,
    plafond: 150000,
    garanties: ['Consultations', 'Médicaments essentiels', 'Analyses de base'],
  },
  {
    id: 'famille',
    nom: 'Famille',
    cotisation: 2500,
    personnes: 'Membre + 5 ayants droit',
    taux: 75,
    plafond: 400000,
    garanties: ['Tout Essentiel', 'Soins des enfants', 'Vaccinations', 'Suivi de grossesse'],
  },
  {
    id: 'serenite',
    nom: 'Sérénité',
    cotisation: 5000,
    personnes: 'Membre + 7 ayants droit',
    taux: 80,
    plafond: 800000,
    garanties: ['Tout Famille', 'Hospitalisation', 'Accouchement', 'Imagerie (scanner, radio)'],
  },
];

export const MODES_PAIEMENT = ['MTN Mobile Money', 'Orange Money', 'Espèces (bureau Pamezi)'] as const;
export type ModePaiement = (typeof MODES_PAIEMENT)[number];

export const CENTRES = [
  { nom: 'Hôpital Nah Pôn', statut: 'Convention de soins signée', services: ['Consultations', 'Scanner', 'Radiologie'], conventionne: true },
  { nom: 'Autres centres et cliniques de la ville', statut: 'En cours d’approche', services: [], conventionne: false },
];

export const MOTIFS = ['Consultation', 'Médicaments', 'Analyses', 'Imagerie', 'Hospitalisation', 'Accouchement', 'Autre'];

export function nombre(n: number) {
  // Espaces insécables : un montant ne se coupe jamais en fin de ligne.
  return n.toLocaleString('fr-FR').replace(/[\s\u202f]/g, '\u00a0');
}

export function fcfa(n: number) {
  return `${nombre(Math.round(n))}\u00a0FCFA`;
}

export function dateFr(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
