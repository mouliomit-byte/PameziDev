// Affichage clair ou sombre : « Automatique » suit le réglage du téléphone ou de l'ordinateur.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, Fragment, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { appliquerTheme, type Theme } from '@/components/ui';

export type PreferenceAffichage = 'auto' | 'clair' | 'sombre';

const CLE = 'pamezi:affichage';

const Contexte = createContext<{ preference: PreferenceAffichage; theme: Theme; choisir: (p: PreferenceAffichage) => void }>({
  preference: 'auto',
  theme: 'clair',
  choisir: () => {},
});

export function AffichageProvider({ children }: { children: ReactNode }) {
  const systeme = useColorScheme();
  const [preference, setPreference] = useState<PreferenceAffichage>('auto');

  useEffect(() => {
    AsyncStorage.getItem(CLE)
      .then((v) => {
        if (v === 'clair' || v === 'sombre') setPreference(v);
      })
      .catch(() => {});
  }, []);

  const choisir = useCallback((p: PreferenceAffichage) => {
    setPreference(p);
    AsyncStorage.setItem(CLE, p).catch(() => {});
  }, []);

  const theme: Theme = preference === 'auto' ? (systeme === 'dark' ? 'sombre' : 'clair') : preference;
  // La palette est changée avant que les écrans ne soient redessinés.
  appliquerTheme(theme);

  const valeur = useMemo(() => ({ preference, theme, choisir }), [preference, theme, choisir]);
  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export const useAffichage = () => useContext(Contexte);

/**
 * Redessine un écran quand l'affichage change (les couleurs sont lues au moment du rendu).
 * S'utilise comme `screenLayout` des navigateurs : la navigation en cours est conservée.
 */
export function RedessinerAuTheme({ children }: { children: ReactNode }) {
  const { theme } = useAffichage();
  return <Fragment key={theme}>{children}</Fragment>;
}
