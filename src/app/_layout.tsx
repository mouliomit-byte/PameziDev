import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { C } from '@/components/ui';
import { PameziProvider } from '@/lib/store';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PameziProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerTintColor: C.bleu,
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
          <Stack.Screen name="admin" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ headerShown: false }} />
        </Stack>
      </PameziProvider>
    </SafeAreaProvider>
  );
}
