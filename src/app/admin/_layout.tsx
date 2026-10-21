import { Redirect, Stack } from 'expo-router';

import { OutilsAdmin } from '@/components/notifications';
import { C } from '@/components/ui';
import { AdminProvider } from '@/lib/admin';
import { AVEC_BACK_OFFICE } from '@/lib/edition';
import { NotificationsAdminProvider } from '@/lib/notifications';
import { RedessinerAuTheme, useAffichage } from '@/lib/theme';

export default function AdminLayout() {
  useAffichage(); // redessine les en-têtes au changement d'affichage
  // L'application des abonnés ne contient pas le back office.
  if (!AVEC_BACK_OFFICE) return <Redirect href="/" />;
  return (
    <AdminProvider>
      <NotificationsAdminProvider>
      <Stack
        screenLayout={({ children }) => <RedessinerAuTheme>{children}</RedessinerAuTheme>}
        screenOptions={{
          headerTintColor: C.accent,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: C.fond },
          headerTitleStyle: { fontWeight: '800', color: C.bleuFonce },
          contentStyle: { backgroundColor: C.fond },
          headerBackTitle: 'Retour',
          headerRight: () => <OutilsAdmin />,
        }}>
        <Stack.Screen name="index" options={{ title: 'Back office Pamezi' }} />
        <Stack.Screen name="membres" options={{ title: 'Membres' }} />
        <Stack.Screen name="membre/[id]" options={{ title: 'Fiche membre' }} />
        <Stack.Screen name="cotisations" options={{ title: 'Cotisations' }} />
        <Stack.Screen name="demandes" options={{ title: 'Demandes de prise en charge' }} />
        <Stack.Screen name="parametres" options={{ title: 'Paramètres' }} />
        <Stack.Screen name="journal" options={{ title: 'Journal des actions' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      </Stack>
      </NotificationsAdminProvider>
    </AdminProvider>
  );
}
