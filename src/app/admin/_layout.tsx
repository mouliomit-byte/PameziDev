import { Stack } from 'expo-router';

import { C } from '@/components/ui';
import { AdminProvider } from '@/lib/admin';

export default function AdminLayout() {
  return (
    <AdminProvider>
      <Stack
        screenOptions={{
          headerTintColor: C.bleu,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: C.fond },
          headerTitleStyle: { fontWeight: '800', color: C.bleuFonce },
          contentStyle: { backgroundColor: C.fond },
          headerBackTitle: 'Retour',
        }}>
        <Stack.Screen name="index" options={{ title: 'Back office Pamezi' }} />
        <Stack.Screen name="membres" options={{ title: 'Membres' }} />
        <Stack.Screen name="membre/[id]" options={{ title: 'Fiche membre' }} />
        <Stack.Screen name="cotisations" options={{ title: 'Cotisations' }} />
        <Stack.Screen name="demandes" options={{ title: 'Demandes de prise en charge' }} />
        <Stack.Screen name="parametres" options={{ title: 'Paramètres' }} />
        <Stack.Screen name="journal" options={{ title: 'Journal des actions' }} />
      </Stack>
    </AdminProvider>
  );
}
