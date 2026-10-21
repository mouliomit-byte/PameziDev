import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { C } from '@/components/ui';
import { PameziProvider } from '@/lib/store';
import { AffichageProvider, RedessinerAuTheme, useAffichage } from '@/lib/theme';

// Ces routes sont des navigateurs : leurs propres écrans se redessinent eux-mêmes au changement d'affichage.
const NAVIGATEURS = new Set(['(tabs)', 'admin']);

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AffichageProvider>
        <PameziProvider>
          <Navigation />
        </PameziProvider>
      </AffichageProvider>
    </SafeAreaProvider>
  );
}

function Navigation() {
  const { theme } = useAffichage();
  const base = theme === 'sombre' ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider
      value={{
        ...base,
        colors: { ...base.colors, primary: C.accent, background: C.fond, card: C.surface, text: C.texte, border: C.bord, notification: C.rouge },
      }}>
      <StatusBar style={theme === 'sombre' ? 'light' : 'dark'} />
      <Stack
        screenLayout={({ route, children }) => (NAVIGATEURS.has(route.name) ? children : <RedessinerAuTheme>{children}</RedessinerAuTheme>)}
        screenOptions={{
          headerTintColor: C.accent,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: C.fond },
          headerTitleStyle: { fontWeight: '800', color: C.bleuFonce },
          contentStyle: { backgroundColor: C.fond },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="adhesion" options={{ title: 'Adhérer à Pamezi', presentation: 'modal' }} />
        <Stack.Screen name="cotiser" options={{ title: 'Payer ma cotisation', presentation: 'modal' }} />
        <Stack.Screen name="demande" options={{ title: 'Demande de prise en charge', presentation: 'modal' }} />
        <Stack.Screen name="connexion" options={{ title: 'Se connecter', presentation: 'modal' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications', presentation: 'modal' }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
