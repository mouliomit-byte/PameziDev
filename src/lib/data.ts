export const SLOGAN = 'Ensemble pour une meilleure santé';
export const DEVISE = 'Votre santé, notre priorité.';
export const SOLIDARITE = 'Plus nous sommes nombreux, plus nous sommes forts.';

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

export const FORMULES: Formule[] = [
  {
    id: 'essentiel',
    nom: 'Essentiel',
    cotisation: 1000,
    personnes: '1 personne',
    taux: 70,
    plafond: 150000,
    garanties: ['Consultations', 'Médicaments essentiels', 'Analyses de base'],
  },
  {
    id: 'famille',
    nom: 'Famille',
    cotisation: 2500,
    personnes: "Jusqu'à 6 personnes",
    taux: 75,
    plafond: 400000,
    garanties: ['Tout Essentiel', 'Soins des enfants', 'Vaccinations', 'Suivi de grossesse'],
  },
  {
    id: 'serenite',
    nom: 'Sérénité',
    cotisation: 5000,
    personnes: "Jusqu'à 8 personnes",
    taux: 80,
    plafond: 800000,
    garanties: ['Tout Famille', 'Hospitalisation', 'Accouchement', 'Petite chirurgie'],
  },
];

export const MODES_PAIEMENT = ['MTN Mobile Money', 'Orange Money', 'Espèces (collecteur)'] as const;
export type ModePaiement = (typeof MODES_PAIEMENT)[number];

// Liste indicative : à confirmer avec les conventions signées par la mutuelle.
export const CENTRES = [
  { nom: 'Hôpital de district de Foumban', lieu: 'Foumban' },
  { nom: 'Hôpital de district de Foumbot', lieu: 'Foumbot' },
  { nom: 'Hôpital de district de Malantouen', lieu: 'Malantouen' },
  { nom: 'Centre médical de Koutaba', lieu: 'Koutaba' },
  { nom: 'Centre de santé de Massangam', lieu: 'Massangam' },
  { nom: 'Centre de santé de Njimom', lieu: 'Njimom' },
  { nom: 'Autre formation sanitaire', lieu: 'Noun' },
];

export const MOTIFS = ['Consultation', 'Médicaments', 'Analyses', 'Hospitalisation', 'Accouchement', 'Vaccination', 'Autre'];

export function fcfa(n: number) {
  return `${Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ')} FCFA`;
}

export function dateFr(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function moisFr(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

/** Format court pour les petites cases : 4 870 000 → « 4,87 M FCFA ». */
export function fcfaCourt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} M FCFA`;
  return fcfa(n);
}
