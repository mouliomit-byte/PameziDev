// Session du membre : jeton, profil (membre, cotisations, demandes…) et données publiques.
// Les données viennent de l'API (serveur ou mode démonstration, voir api.ts) ;
// une copie est gardée sur l'appareil pour s'afficher même sans réseau.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import {
  type Centre,
  CENTRES_DEPART,
  type Cotisation,
  type Demande,
  type Formule,
  FORMULES_DEPART,
  type Membre,
  type ModePaiement,
  type Profil,
  type Situation,
} from '@shared/regles';
import type { DonneesAdhesion } from '@shared/service';

import { api, ErreurApi } from './api';

const CLE = 'pamezi:session:v3';

type Session = { jeton: string | null; profil: Profil | null; invitations: number };
const VIDE: Session = { jeton: null, profil: null, invitations: 0 };

type Ctx = {
  pret: boolean;
  modeDemo: boolean;
  membre: Membre | null;
  formule: Formule | null;
  cotisations: Cotisation[];
  demandes: Demande[];
  situation: Situation;
  totalCotise: number;
  totalRembourse: number;
  plafondRestant: number;
  formules: Formule[];
  centres: Centre[];
  invitations: number;
  adherer: (d: DonneesAdhesion) => Promise<void>;
  connecter: (telephone: string, pin: string) => Promise<void>;
  cotiser: (mois: number, mode: ModePaiement) => Promise<Cotisation>;
  demander: (d: { centre: string; motif: string; montant: number }) => Promise<Demande>;
  rafraichir: () => Promise<void>;
  inviter: () => void;
  deconnecter: () => void;
};

const Contexte = createContext<Ctx | null>(null);

export function PameziProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(VIDE);
  const [pret, setPret] = useState(false);
  const [formules, setFormules] = useState<Formule[]>(FORMULES_DEPART);
  const [centres, setCentres] = useState<Centre[]>(CENTRES_DEPART);

  const maj = useCallback((f: (s: Session) => Session) => {
    setSession((s) => {
      const n = f(s);
      AsyncStorage.setItem(CLE, JSON.stringify(n)).catch(() => {});
      return n;
    });
  }, []);

  const recevoirProfil = useCallback((profil: Profil, jeton?: string) => maj((s) => ({ ...s, profil, jeton: jeton ?? s.jeton })), [maj]);

  // Chargement : session gardée sur l'appareil, puis mise à jour depuis l'API.
  useEffect(() => {
    let actif = true;
    (async () => {
      let jeton: string | null = null;
      try {
        const brut = await AsyncStorage.getItem(CLE);
        if (brut && actif) {
          const s = { ...VIDE, ...JSON.parse(brut) } as Session;
          jeton = s.jeton;
          setSession(s);
        }
      } catch {}
      if (actif) setPret(true);
      api.formules().then((f) => actif && f.length && setFormules(f)).catch(() => {});
      api.centres().then((c) => actif && c.length && setCentres(c)).catch(() => {});
      if (jeton) {
        try {
          const profil = await api.membre.profil(jeton);
          if (actif) recevoirProfil(profil);
        } catch (e) {
          // Session refusée (expirée, compte fermé) : on se déconnecte. Erreur réseau : on garde la copie locale.
          if (actif && e instanceof ErreurApi && (e.statut === 401 || e.statut === 403 || e.statut === 404)) maj(() => VIDE);
        }
      }
    })();
    return () => {
      actif = false;
    };
  }, [maj, recevoirProfil]);

  const exigerJeton = useCallback(() => {
    if (!session.jeton) throw new ErreurApi(401, 'Connectez-vous d’abord.');
    return session.jeton;
  }, [session.jeton]);

  const valeur = useMemo<Ctx>(() => {
    const p = session.profil;
    return {
      pret,
      modeDemo: api.mode === 'demo',
      membre: p?.membre ?? null,
      formule: p?.formule ?? null,
      cotisations: p?.cotisations ?? [],
      demandes: p?.demandes ?? [],
      situation: p?.situation ?? { moisPayes: 0, moisDus: 0, aJour: false, enAttente: 0 },
      totalCotise: p?.totalCotise ?? 0,
      totalRembourse: p?.totalPrisEnCharge ?? 0,
      plafondRestant: p?.plafondRestant ?? 0,
      formules,
      centres,
      invitations: session.invitations,
      adherer: async (d) => {
        const r = await api.membre.adherer(d);
        recevoirProfil(r.profil, r.jeton);
      },
      connecter: async (telephone, pin) => {
        const r = await api.membre.connecter(telephone, pin);
        recevoirProfil(r.profil, r.jeton);
      },
      cotiser: async (mois, mode) => {
        const r = await api.membre.cotiser(exigerJeton(), mois, mode);
        recevoirProfil(r.profil);
        return r.cotisation;
      },
      demander: async (d) => {
        const r = await api.membre.demander(exigerJeton(), d);
        recevoirProfil(r.profil);
        return r.demande;
      },
      rafraichir: async () => {
        if (session.jeton) recevoirProfil(await api.membre.profil(session.jeton));
      },
      inviter: () => maj((s) => ({ ...s, invitations: s.invitations + 1 })),
      deconnecter: () => maj(() => VIDE),
    };
  }, [session, pret, formules, centres, maj, recevoirProfil, exigerJeton]);

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function usePamezi() {
  const c = useContext(Contexte);
  if (!c) throw new Error('usePamezi doit être utilisé dans PameziProvider');
  return c;
}

/** Actualise le profil chaque fois que l'écran reprend le focus (décisions prises dans le back office). */
export function useActualiserAuFocus() {
  const { rafraichir } = usePamezi();
  const ref = useRef(rafraichir);
  useEffect(() => {
    ref.current = rafraichir;
  });
  useFocusEffect(
    useCallback(() => {
      ref.current().catch(() => {});
    }, []),
  );
}

/** Message lisible pour une erreur d'API ou inattendue. */
export function messageErreur(e: unknown): string {
  return e instanceof Error && e.message ? e.message : 'Une erreur est survenue. Réessayez.';
}
