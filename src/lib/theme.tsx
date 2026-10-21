// Affichage clair ou sombre (« Automatique » suit le réglage de l'appareil),
// et couleur de l'application choisie par le propriétaire dans le back office.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, Fragment, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { appliquerTheme, type Theme } from '@/components/ui';
import { type CouleurApp, estCouleurApp, REGLAGES_DEPART } from '@shared/regles';

import { api } from './api';

export type PreferenceAffichage = 'auto' | 'clair' | 'sombre';

const CLE = 'pamezi:affichage';
const CLE_COULEUR = 'pamezi:couleur';

type Ctx = {
  preference: PreferenceAffichage;
  theme: Theme;
  couleur: CouleurApp;
  choisir: (p: PreferenceAffichage) => void;
  /** Bascule directe clair ⇄ sombre (bouton soleil / lune). */
  basculer: () => void;
  /** Applique une couleur tout de suite (après l'enregistrement dans le back office). */
  definirCouleur: (c: CouleurApp) => void;
};

const Contexte = createContext<Ctx>({
  preference: 'auto',
  theme: 'clair',
  couleur: REGLAGES_DEPART.couleur,
  choisir: () => {},
  basculer: () => {},
  definirCouleur: () => {},
});

export function AffichageProvider({ children }: { children: ReactNode }) {
  const systeme = useColorScheme();
  const [preference, setPreference] = useState<PreferenceAffichage>('auto');
  const [couleur, setCouleur] = useState<CouleurApp>(REGLAGES_DEPART.couleur);

  const definirCouleur = useCallback((c: CouleurApp) => {
    setCouleur(c);
    AsyncStorage.setItem(CLE_COULEUR, c).catch(() => {});
  }, []);

  useEffect(() => {
    let actif = true;
    AsyncStorage.multiGet([CLE, CLE_COULEUR])
      .then(([[, p], [, c]]) => {
        if (!actif) return;
        if (p === 'clair' || p === 'sombre') setPreference(p);
        if (estCouleurApp(c)) setCouleur(c);
      })
      .catch(() => {})
      // La couleur gardée sur l'appareil s'affiche d'abord, puis celle du serveur la remplace.
      .finally(() =>
        api
          .reglages()
          .then((r) => actif && estCouleurApp(r.couleur) && definirCouleur(r.couleur))
          .catch(() => {}),
      );
    return () => {
      actif = false;
    };
  }, [definirCouleur]);

  const choisir = useCallback((p: PreferenceAffichage) => {
    setPreference(p);
    AsyncStorage.setItem(CLE, p).catch(() => {});
  }, []);

  const theme: Theme = preference === 'auto' ? (systeme === 'dark' ? 'sombre' : 'clair') : preference;
  // La palette est changée avant que les écrans ne soient redessinés.
  appliquerTheme(theme, couleur);

  const basculer = useCallback(() => choisir(theme === 'sombre' ? 'clair' : 'sombre'), [choisir, theme]);

  const valeur = useMemo(
    () => ({ preference, theme, couleur, choisir, basculer, definirCouleur }),
    [preference, theme, couleur, choisir, basculer, definirCouleur],
  );
  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export const useAffichage = () => useContext(Contexte);

/**
 * Redessine un écran quand l'affichage ou la couleur change (les couleurs sont lues au rendu).
 * S'utilise comme `screenLayout` des navigateurs : la navigation en cours est conservée.
 */
export function RedessinerAuTheme({ children }: { children: ReactNode }) {
  const { theme, couleur } = useAffichage();
  return <Fragment key={`${theme}-${couleur}`}>{children}</Fragment>;
}
