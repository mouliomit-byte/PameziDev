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
            headerTintColor: C.vert,
            headerTitleStyle: { fontWeight: '700', color: C.texte },
            contentStyle: { backgroundColor: C.fond },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="adhesion" options={{ title: 'Adhérer à Pamezi', presentation: 'modal' }} />
          <Stack.Screen name="cotiser" options={{ title: 'Payer ma cotisation', presentation: 'modal' }} />
          <Stack.Screen name="demande" options={{ title: 'Demande de prise en charge', presentation: 'modal' }} />
        </Stack>
      </PameziProvider>
    </SafeAreaProvider>
  );
}
