import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { FORMULES, FormuleId, ModePaiement } from './data';

export type Membre = {
  numero: string;
  nom: string;
  telephone: string;
  localite: string;
  typeAdhesion: 'Individuelle' | 'Via une association';
  association?: string;
  formule: FormuleId;
  ayantsDroit: number;
  dateAdhesion: string;
};

export type Cotisation = { id: string; date: string; montant: number; mode: ModePaiement; mois: number };

export type Demande = {
  id: string;
  date: string;
  centre: string;
  motif: string;
  montant: number;
  priseEnCharge: number;
  statut: 'En cours' | 'Validée' | 'Payée';
};

type Etat = { membre: Membre | null; cotisations: Cotisation[]; demandes: Demande[]; invitations: number };

const VIDE: Etat = { membre: null, cotisations: [], demandes: [], invitations: 0 };
const CLE = 'pamezi:etat:v2';

type Ctx = Etat & {
  pret: boolean;
  formule: (typeof FORMULES)[number] | undefined;
  totalCotise: number;
  totalRembourse: number;
  plafondRestant: number;
  adherer: (m: Omit<Membre, 'numero' | 'dateAdhesion'>) => void;
  cotiser: (mois: number, mode: ModePaiement) => Cotisation | null;
  demander: (d: { centre: string; motif: string; montant: number }) => Demande | null;
  inviter: () => void;
  reinitialiser: () => void;
};

const Contexte = createContext<Ctx | null>(null);

const id = () => Math.random().toString(36).slice(2, 10);

export function PameziProvider({ children }: { children: ReactNode }) {
  const [etat, setEtat] = useState<Etat>(VIDE);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CLE)
      .then((v) => v && setEtat({ ...VIDE, ...JSON.parse(v) }))
      .catch(() => {})
      .finally(() => setPret(true));
  }, []);

  const maj = useCallback((f: (e: Etat) => Etat) => {
    setEtat((e) => {
      const n = f(e);
      AsyncStorage.setItem(CLE, JSON.stringify(n)).catch(() => {});
      return n;
    });
  }, []);

  const formule = FORMULES.find((f) => f.id === etat.membre?.formule);
  const totalCotise = etat.cotisations.reduce((s, c) => s + c.montant, 0);
  const totalRembourse = etat.demandes.reduce((s, d) => s + d.priseEnCharge, 0);
  const plafondRestant = Math.max(0, (formule?.plafond ?? 0) - totalRembourse);

  const valeur = useMemo<Ctx>(
    () => ({
      ...etat,
      pret,
      formule,
      totalCotise,
      totalRembourse,
      plafondRestant,
      adherer: (m) =>
        maj((e) => ({
          ...e,
          membre: {
            ...m,
            numero: `PMZ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1e5)).padStart(5, '0')}`,
            dateAdhesion: new Date().toISOString(),
          },
        })),
      cotiser: (mois, mode) => {
        if (!formule) return null;
        const c: Cotisation = { id: id(), date: new Date().toISOString(), montant: formule.cotisation * mois, mode, mois };
        maj((e) => ({ ...e, cotisations: [c, ...e.cotisations] }));
        return c;
      },
      demander: ({ centre, motif, montant }) => {
        if (!formule) return null;
        const d: Demande = {
          id: id(),
          date: new Date().toISOString(),
          centre,
          motif,
          montant,
          priseEnCharge: Math.min(Math.round((montant * formule.taux) / 100), plafondRestant),
          statut: 'En cours',
        };
        maj((e) => ({ ...e, demandes: [d, ...e.demandes] }));
        return d;
      },
      inviter: () => maj((e) => ({ ...e, invitations: e.invitations + 1 })),
      reinitialiser: () => maj(() => VIDE),
    }),
    [etat, pret, formule, totalCotise, totalRembourse, plafondRestant, maj],
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function usePamezi() {
  const c = useContext(Contexte);
  if (!c) throw new Error('usePamezi doit être utilisé dans PameziProvider');
  return c;
}

/** Mois couverts par les cotisations depuis l'adhésion : à jour si >= mois écoulés. */
export function situation(membre: Membre | null, cotisations: Cotisation[]) {
  if (!membre) return { moisPayes: 0, moisDus: 0, aJour: false };
  const debut = new Date(membre.dateAdhesion);
  const now = new Date();
  const moisDus = (now.getFullYear() - debut.getFullYear()) * 12 + now.getMonth() - debut.getMonth() + 1;
  const moisPayes = cotisations.reduce((s, c) => s + c.mois, 0);
  return { moisPayes, moisDus, aJour: moisPayes >= moisDus };
}
