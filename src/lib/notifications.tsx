// Cloche de notifications : la liste est calculée à partir des données (profil du membre,
// ou API du back office) ; « lu » = date de la dernière ouverture, gardée sur l'appareil.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, usePathname } from 'expo-router';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import { type Notification, notificationsMembre } from '@shared/regles';

import { useAdmin } from './admin';
import { api } from './api';
import { usePamezi } from './store';

const RYTHME = 60_000; // nouvelle vérification chaque minute

// --- Dernière lecture, partagée entre la cloche et l'écran des notifications
const lectures = new Map<string, string>();
const chargees = new Set<string>();
const abonnes = new Set<() => void>();
const prevenir = () => abonnes.forEach((f) => f());
const sAbonner = (f: () => void) => {
  abonnes.add(f);
  return () => abonnes.delete(f);
};

function useDerniereLecture(cle: string | null) {
  useEffect(() => {
    if (!cle || chargees.has(cle)) return;
    chargees.add(cle);
    AsyncStorage.getItem(cle)
      .then((v) => {
        if (v && !lectures.has(cle)) {
          lectures.set(cle, v);
          prevenir();
        }
      })
      .catch(() => {});
  }, [cle]);
  const lu = useSyncExternalStore(sAbonner, () => (cle ? (lectures.get(cle) ?? '') : ''));
  const marquerLues = useCallback(() => {
    if (!cle) return;
    const maintenant = new Date().toISOString();
    lectures.set(cle, maintenant);
    prevenir();
    AsyncStorage.setItem(cle, maintenant).catch(() => {});
  }, [cle]);
  return { lu, marquerLues };
}

export type EtatNotifications = {
  liste: Notification[];
  /** Date de la dernière ouverture (ISO) : ce qui est plus récent est « nouveau ». */
  lu: string;
  nonLues: number;
  marquerLues: () => void;
  connecte: boolean;
};

const estNouvelle = (n: Notification, lu: string) => n.date > lu;

// --- Abonné
export function useNotificationsMembre(): EtatNotifications {
  const { membre, formule, cotisations, demandes, situation, totalCotise, totalRembourse, plafondRestant } = usePamezi();
  const liste = useMemo(
    () =>
      membre
        ? notificationsMembre(
            { membre, formule, cotisations, demandes, situation, totalCotise, totalPrisEnCharge: totalRembourse, plafondRestant },
            new Date(),
          )
        : [],
    [membre, formule, cotisations, demandes, situation, totalCotise, totalRembourse, plafondRestant],
  );
  const { lu, marquerLues } = useDerniereLecture(membre ? `pamezi:notifs:membre:${membre.id}` : null);

  return { liste, lu, nonLues: liste.filter((n) => estNouvelle(n, lu)).length, marquerLues, connecte: !!membre };
}

/** Actualise le profil chaque minute : les décisions du bureau arrivent sans rouvrir l'application. */
export function useSuiviMembre() {
  const { membre, rafraichir } = usePamezi();
  const connecte = !!membre;
  useEffect(() => {
    if (!connecte) return;
    const t = setInterval(() => rafraichir().catch(() => {}), RYTHME);
    return () => clearInterval(t);
  }, [connecte, rafraichir]);
}

// --- Back office
const ContexteAdmin = createContext<(EtatNotifications & { recharger: () => void }) | null>(null);

export function NotificationsAdminProvider({ children }: { children: ReactNode }) {
  const { jeton, admin, avecJeton } = useAdmin();
  const [liste, setListe] = useState<Notification[]>([]);
  const chemin = usePathname();
  const { lu, marquerLues } = useDerniereLecture(admin ? `pamezi:notifs:admin:${admin.id}` : null);

  const recharger = useCallback(() => {
    if (!jeton) return;
    avecJeton((j) => api.admin.notifications(j))
      .then(setListe)
      .catch(() => {});
  }, [jeton, avecJeton]);

  // À chaque changement d'écran (une cotisation vient peut-être d'être confirmée), et chaque minute.
  useEffect(() => {
    recharger();
  }, [recharger, chemin]);
  useEffect(() => {
    const t = setInterval(recharger, RYTHME);
    return () => clearInterval(t);
  }, [recharger]);

  const valeur = useMemo(() => {
    const visibles = jeton ? liste : []; // rien après une déconnexion
    return { liste: visibles, lu, nonLues: visibles.filter((n) => estNouvelle(n, lu)).length, marquerLues, connecte: !!jeton, recharger };
  }, [liste, lu, marquerLues, jeton, recharger]);
  return <ContexteAdmin.Provider value={valeur}>{children}</ContexteAdmin.Provider>;
}

export function useNotificationsAdmin() {
  const c = useContext(ContexteAdmin);
  if (!c) throw new Error('useNotificationsAdmin doit être utilisé dans NotificationsAdminProvider');
  return c;
}

/** Les notifications restent surlignées tant que l'écran est ouvert, puis passent « lues » en le quittant. */
export function useMarquerLuesEnPartant(marquerLues: () => void) {
  const ref = useRef(marquerLues);
  useEffect(() => {
    ref.current = marquerLues;
  });
  useFocusEffect(useCallback(() => () => ref.current(), []));
}
