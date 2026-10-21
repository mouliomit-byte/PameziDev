import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { C, IconName } from '@/components/ui';

const icone =
  (name: IconName) =>
  ({ color, size }: { color: import("react-native").ColorValue; size: number }) => <Ionicons name={name} color={color as string} size={size} />;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.vert,
        tabBarInactiveTintColor: C.gris,
        tabBarLabelStyle: { fontWeight: '600' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: icone('home') }} />
      <Tabs.Screen name="tontine" options={{ title: 'Tontine', tabBarIcon: icone('people') }} />
      <Tabs.Screen name="soins" options={{ title: 'Soins', tabBarIcon: icone('medkit') }} />
      <Tabs.Screen name="profil" options={{ title: 'Ma carte', tabBarIcon: icone('card') }} />
    </Tabs>
  );
}
