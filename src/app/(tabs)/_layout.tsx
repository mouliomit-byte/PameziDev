import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { ColorValue } from 'react-native';

import { C, IconName } from '@/components/ui';
import { RedessinerAuTheme, useAffichage } from '@/lib/theme';

function icone(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color as string} size={size} />;
  };
}

export default function TabsLayout() {
  useAffichage(); // redessine la barre d'onglets au changement d'affichage
  return (
    <Tabs
      screenLayout={({ children }) => <RedessinerAuTheme>{children}</RedessinerAuTheme>}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.gris,
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
        tabBarStyle: { borderTopColor: C.bord, backgroundColor: C.surface },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: icone('home') }} />
      <Tabs.Screen name="tontine" options={{ title: 'Tontine', tabBarIcon: icone('people') }} />
      <Tabs.Screen name="soins" options={{ title: 'Soins', tabBarIcon: icone('medkit') }} />
      <Tabs.Screen name="profil" options={{ title: 'Ma carte', tabBarIcon: icone('card') }} />
    </Tabs>
  );
}
