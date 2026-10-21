// Session du back office (propriétaire et gestionnaires) et chargement des données.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { createContext, type DependencyList, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

import type { Admin } from '@shared/regles';

import { api, ErreurApi } from './api';

const CLE = 'pamezi:admin:v1';

type Ctx = {
  pret: boolean;
  jeton: string | null;
  admin: Admin | null;
  connecter: (email: string, motDePasse: string) => Promise<void>;
  deconnecter: () => void;
  /** Exécute un appel avec le jeton ; une session expirée déconnecte automatiquement. */
  avecJeton: <T>(f: (jeton: string) => Promise<T>) => Promise<T>;
};

const Contexte = createContext<Ctx | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [pret, setPret] = useState(false);
  const [session, setSession] = useState<{ jeton: string | null; admin: Admin | null }>({ jeton: null, admin: null });

  const enregistrer = useCallback((s: { jeton: string | null; admin: Admin | null }) => {
    setSession(s);
    AsyncStorage.setItem(CLE, JSON.stringify(s)).catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const brut = await AsyncStorage.getItem(CLE);
        const s = brut ? JSON.parse(brut) : null;
        if (s?.jeton) {
          setSession(s);
          try {
            enregistrer({ jeton: s.jeton, admin: await api.admin.moi(s.jeton) });
          } catch (e) {
            if (e instanceof ErreurApi && e.statut === 401) enregistrer({ jeton: null, admin: null });
          }
        }
      } catch {}
      setPret(true);
    })();
  }, [enregistrer]);

  const deconnecter = useCallback(() => enregistrer({ jeton: null, admin: null }), [enregistrer]);

  const avecJeton = useCallback(
    async <T,>(f: (jeton: string) => Promise<T>) => {
      if (!session.jeton) throw new ErreurApi(401, 'Connectez-vous d’abord.');
      try {
        return await f(session.jeton);
      } catch (e) {
        if (e instanceof ErreurApi && e.statut === 401) deconnecter();
        throw e;
      }
    },
    [session.jeton, deconnecter],
  );

  const connecter = useCallback(
    async (email: string, motDePasse: string) => {
      const r = await api.admin.connecter(email, motDePasse);
      enregistrer({ jeton: r.jeton, admin: r.admin });
    },
    [enregistrer],
  );

  return (
    <Contexte.Provider value={{ pret, jeton: session.jeton, admin: session.admin, connecter, deconnecter, avecJeton }}>
      {children}
    </Contexte.Provider>
  );
}

export function useAdmin() {
  const c = useContext(Contexte);
  if (!c) throw new Error('useAdmin doit être utilisé dans AdminProvider');
  return c;
}

/**
 * Charge des données du back office, et les recharge quand l'écran reprend le focus
 * ou quand une dépendance change. `recharger()` relance le chargement après une action.
 */
export function useDonnees<T>(charger: (jeton: string) => Promise<T>, deps: DependencyList) {
  const { avecJeton, jeton } = useAdmin();
  const [donnees, setDonnees] = useState<T | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);
  const ref = useRef(charger);
  useEffect(() => {
    ref.current = charger;
  });
  // Les dépendances (filtres, identifiant…) sont des valeurs simples : leur forme texte suffit à détecter un changement.
  const cle = JSON.stringify(deps);

  const recharger = useCallback(async () => {
    if (!jeton) return;
    setChargement(true);
    try {
      setDonnees(await avecJeton((j) => ref.current(j)));
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Chargement impossible.');
    } finally {
      setChargement(false);
    }
    // `cle` relance le chargement quand un filtre change (la fonction elle-même est lue via `ref`).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jeton, avecJeton, cle]);

  useFocusEffect(
    useCallback(() => {
      recharger();
    }, [recharger]),
  );

  return { donnees, erreur, chargement, recharger };
}
