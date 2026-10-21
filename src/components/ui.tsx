import Ionicons from '@expo/vector-icons/Ionicons';
import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const C = {
  vert: '#0F7A4A',
  vertFonce: '#0A5534',
  vertClair: '#E7F4EC',
  or: '#E3A72F',
  orClair: '#FDF3DE',
  rouge: '#C0392B',
  texte: '#1C2B23',
  gris: '#5E6B64',
  bord: '#DCE5DF',
  fond: '#F5F8F6',
  blanc: '#FFFFFF',
};

export type IconName = keyof typeof Ionicons.glyphMap;

export function Ecran({ children, bords = ['top'] }: { children: ReactNode; bords?: ('top' | 'bottom')[] }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.fond }} edges={bords}>
      <ScrollView contentContainerStyle={s.ecran} keyboardShouldPersistTaps="handled">
        <View style={s.colonne}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function Titre({ children, sous }: { children: ReactNode; sous?: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.titre}>{children}</Text>
      {sous ? <Text style={s.sous}>{sous}</Text> : null}
    </View>
  );
}

export function Carte({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[s.carte, style]}>{children}</View>;
}

export function Bouton({
  titre,
  onPress,
  icone,
  variante = 'plein',
  desactive,
}: {
  titre: string;
  onPress: () => void;
  icone?: IconName;
  variante?: 'plein' | 'contour' | 'or';
  desactive?: boolean;
}) {
  const fond = variante === 'plein' ? C.vert : variante === 'or' ? C.or : 'transparent';
  const couleur = variante === 'contour' ? C.vert : variante === 'or' ? C.texte : C.blanc;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={desactive}
      style={({ pressed }) => [
        s.bouton,
        { backgroundColor: fond, borderColor: variante === 'contour' ? C.vert : fond, opacity: desactive ? 0.45 : pressed ? 0.8 : 1 },
      ]}>
      {icone ? <Ionicons name={icone} size={20} color={couleur} /> : null}
      <Text style={[s.boutonTexte, { color: couleur }]}>{titre}</Text>
    </Pressable>
  );
}

export function Champ({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor="#98A39D" style={s.input} {...props} />
    </View>
  );
}

export function Choix<T extends string>({
  label,
  options,
  valeur,
  onChange,
}: {
  label: string;
  options: readonly T[];
  valeur: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <View style={s.puces}>
        {options.map((o) => {
          const actif = o === valeur;
          return (
            <Pressable
              key={o}
              accessibilityRole="radio"
              accessibilityState={{ selected: actif }}
              onPress={() => onChange(o)}
              style={[s.puce, actif && { backgroundColor: C.vert, borderColor: C.vert }]}>
              <Text style={[s.puceTexte, actif && { color: C.blanc }]}>{o}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Stat({ icone, valeur, label }: { icone: IconName; valeur: string; label: string }) {
  return (
    <View style={s.stat}>
      <Ionicons name={icone} size={22} color={C.vert} />
      <Text style={s.statValeur}>{valeur}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export function Ligne({ gauche, droite, icone }: { gauche: string; droite: string; icone?: IconName }) {
  return (
    <View style={s.ligne}>
      {icone ? <Ionicons name={icone} size={18} color={C.gris} style={{ marginRight: 8 }} /> : null}
      <Text style={[s.texte, { flex: 1 }]}>{gauche}</Text>
      <Text style={[s.texte, { fontWeight: '700' }]}>{droite}</Text>
    </View>
  );
}

export function Badge({ texte, couleur = C.vert }: { texte: string; couleur?: string }) {
  return (
    <View style={[s.badge, { backgroundColor: couleur + '22' }]}>
      <Text style={[s.badgeTexte, { color: couleur }]}>{texte}</Text>
    </View>
  );
}

export function Vide({ icone, texte, children }: { icone: IconName; texte: string; children?: ReactNode }) {
  return (
    <Carte style={{ alignItems: 'center', paddingVertical: 28 }}>
      <Ionicons name={icone} size={40} color={C.or} />
      <Text style={[s.texte, { textAlign: 'center', marginVertical: 12 }]}>{texte}</Text>
      {children}
    </Carte>
  );
}

export const s = StyleSheet.create({
  ecran: { padding: 16, paddingBottom: 40, alignItems: 'center' },
  colonne: { width: '100%', maxWidth: 640 },
  titre: { fontSize: 26, fontWeight: '800', color: C.texte },
  sous: { fontSize: 15, color: C.gris, marginTop: 4 },
  h2: { fontSize: 18, fontWeight: '700', color: C.texte, marginBottom: 10 },
  texte: { fontSize: 15, color: C.texte, lineHeight: 21 },
  petit: { fontSize: 13, color: C.gris, lineHeight: 18 },
  carte: {
    backgroundColor: C.blanc,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.bord,
  },
  bouton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 6,
  },
  boutonTexte: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600', color: C.texte, marginBottom: 6 },
  input: {
    backgroundColor: C.blanc,
    borderWidth: 1,
    borderColor: C.bord,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: C.texte,
  },
  puces: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  puce: { borderWidth: 1, borderColor: C.bord, backgroundColor: C.blanc, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  puceTexte: { fontSize: 14, color: C.texte, fontWeight: '500' },
  stat: { flex: 1, backgroundColor: C.blanc, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.bord, alignItems: 'flex-start', gap: 4 },
  statValeur: { fontSize: 17, fontWeight: '800', color: C.texte },
  statLabel: { fontSize: 12, color: C.gris },
  ligne: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.bord },
  badge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTexte: { fontSize: 12, fontWeight: '700' },
});
