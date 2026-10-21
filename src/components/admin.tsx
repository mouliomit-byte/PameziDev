import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useAdmin } from '@/lib/admin';

import { Alerte, C, Ecran, type IconName, s } from './ui';

/** Écran du back office : réservé aux comptes connectés, avec chargement et erreurs. */
export function EcranAdmin({
  children,
  chargement,
  erreur,
  accueil,
}: {
  children: ReactNode;
  chargement?: boolean;
  erreur?: string | null;
  /** Le tableau de bord lui-même : pas de lien de retour. */
  accueil?: boolean;
}) {
  const { pret, admin } = useAdmin();
  if (!pret) return <Chargement />;
  if (!admin) return <Redirect href="/admin" />;
  return (
    <Ecran large bords={['bottom']}>
      {!accueil && !router.canGoBack() ? (
        <Pressable accessibilityRole="link" onPress={() => router.replace('/admin')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, minHeight: 44 }}>
          <Ionicons name="arrow-back" size={18} color={C.bleu} />
          <Text style={[s.texte, { color: C.bleu, fontWeight: '700' }]}>Tableau de bord</Text>
        </Pressable>
      ) : null}
      <Alerte texte={erreur ?? null} />
      {chargement ? <ActivityIndicator color={C.bleu} style={{ marginVertical: 8 }} /> : null}
      {children}
    </Ecran>
  );
}

export function Chargement() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.fond }}>
      <ActivityIndicator color={C.bleu} size="large" />
    </View>
  );
}

/** Tuile de navigation du tableau de bord. */
export function Tuile({ href, icone, titre, detail, alerte }: { href: '/admin/membres' | '/admin/cotisations' | '/admin/demandes' | '/admin/parametres' | '/admin/journal'; icone: IconName; titre: string; detail: string; alerte?: number }) {
  return (
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push(href)}
        style={({ pressed }) => [s.carte, { flexGrow: 1, flexBasis: 220, marginBottom: 0, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.8 : 1 }]}>
        <View style={s.pastille}>
          <Ionicons name={icone} size={22} color={C.bleu} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.texte, { fontWeight: '800' }]}>{titre}</Text>
          <Text style={s.petit}>{detail}</Text>
        </View>
        {alerte ? (
          <View style={{ backgroundColor: C.rouge, borderRadius: 12, minWidth: 24, height: 24, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: C.blanc, fontWeight: '800', fontSize: 12 }}>{alerte}</Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={18} color={C.gris} />
        )}
      </Pressable>
  );
}
