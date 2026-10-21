import Ionicons from '@expo/vector-icons/Ionicons';
import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';

// Couleurs relevées sur l'affiche officielle de la Mutuelle de Santé Pamezi.
export const C = {
  bleu: '#0070C6', // bandeaux et cercles d'icônes
  bleuVif: '#1580DB', // pastilles de titres, haut des dégradés
  bleuFonce: '#0B59A3', // titres (« MUTUELLE DE SANTÉ PAMEZI »)
  bleuNuit: '#084A88', // bas des dégradés
  bleuClair: '#E6F3FC', // fonds de pastilles
  bleuPale: '#C6E6F9', // vagues bleu ciel, textes sur bleu
  vert: '#007A5E', // drapeau du Cameroun
  rouge: '#D91613',
  jaune: '#FCD116',
  texte: '#123A61', // texte bleu profond, comme sur l'affiche
  gris: '#56708C',
  bord: '#D6E6F4',
  fond: '#F5FAFE',
  blanc: '#FFFFFF',
};

/** Dégradé bleu des bandeaux de l'affiche. */
export const DEGRADE = [C.bleuVif, C.bleu, C.bleuNuit] as const;

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

/** Tracé du « M » du logo Pamezi, repris de l'affiche officielle (viewBox 100×100). */
export const TRACE_M = 'M30 68 V32 H40 L50 48 L60 32 H70 V68 H61 V47 L50 63 L39 47 V68 Z';

/**
 * Logo Pamezi : « M » dans un cercle cerclé d'un anneau, comme sur l'affiche.
 * Par défaut : M blanc sur disque bleu dégradé ; `inverse` : M bleu sur disque blanc.
 */
export function Logo({ taille = 48, inverse }: { taille?: number; inverse?: boolean }) {
  const encre = inverse ? C.bleu : C.blanc;
  return (
    <Svg width={taille} height={taille} viewBox="0 0 100 100" accessibilityLabel="Logo Pamezi">
      <Defs>
        <SvgGradient id="pmz" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={C.bleuVif} />
          <Stop offset="0.55" stopColor={C.bleu} />
          <Stop offset="1" stopColor={C.bleuNuit} />
        </SvgGradient>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill={inverse ? C.blanc : 'url(#pmz)'} />
      <Circle cx="50" cy="50" r="39" fill="none" stroke={encre} strokeWidth="5" />
      <Path d={TRACE_M} fill={encre} />
    </Svg>
  );
}

/** Filet tricolore vert-rouge-jaune, comme sur l'affiche. */
export function Tricolore({ largeur = 96, hauteur = 4 }: { largeur?: number | `${number}%`; hauteur?: number }) {
  return (
    <View style={{ flexDirection: 'row', width: largeur, height: hauteur, borderRadius: hauteur, overflow: 'hidden' }}>
      <View style={{ flex: 1, backgroundColor: C.vert }} />
      <View style={{ flex: 1, backgroundColor: C.rouge }} />
      <View style={{ flex: 1, backgroundColor: C.jaune }} />
    </View>
  );
}

export function Titre({ children, sous }: { children: ReactNode; sous?: string }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={s.titre}>{children}</Text>
      <View style={{ marginTop: 8 }}>
        <Tricolore largeur={56} />
      </View>
      {sous ? <Text style={[s.sous, { marginTop: 8 }]}>{sous}</Text> : null}
    </View>
  );
}

/** En-tête de section façon « pastille » de l'affiche. */
export function Section({ icone, children }: { icone: IconName; children: ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.sectionIcone}>
        <Ionicons name={icone} size={18} color={C.blanc} />
      </View>
      <Text style={s.sectionTexte}>{children}</Text>
    </View>
  );
}

export function Degrade({ children, style }: { children?: ReactNode; style?: ViewStyle }) {
  return (
    <LinearGradient colors={DEGRADE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[{ overflow: 'hidden' }, style]}>
      {children}
    </LinearGradient>
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
  variante?: 'plein' | 'contour' | 'blanc' | 'danger';
  desactive?: boolean;
}) {
  const styles = {
    plein: { fond: C.bleu, bord: C.bleu, encre: C.blanc },
    contour: { fond: 'transparent', bord: C.bleu, encre: C.bleu },
    blanc: { fond: C.blanc, bord: C.blanc, encre: C.bleuFonce },
    danger: { fond: C.rouge, bord: C.rouge, encre: C.blanc },
  }[variante];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!desactive }}
      onPress={onPress}
      disabled={desactive}
      style={({ pressed }) => [
        s.bouton,
        { backgroundColor: styles.fond, borderColor: styles.bord, opacity: desactive ? 0.4 : pressed ? 0.85 : 1 },
      ]}>
      {icone ? <Ionicons name={icone} size={20} color={styles.encre} /> : null}
      <Text style={[s.boutonTexte, { color: styles.encre }]}>{titre}</Text>
    </Pressable>
  );
}

export function Champ({ label, aide, ...props }: TextInputProps & { label: string; aide?: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor="#98A6B8" style={s.input} {...props} />
      {aide ? <Text style={[s.petit, { marginTop: 4 }]}>{aide}</Text> : null}
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
    <View style={{ marginBottom: 16 }}>
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
              style={[s.puce, actif && { backgroundColor: C.bleu, borderColor: C.bleu }]}>
              {actif ? <Ionicons name="checkmark" size={14} color={C.blanc} /> : null}
              <Text style={[s.puceTexte, actif && { color: C.blanc }]}>{o}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Ligne({ gauche, droite, icone }: { gauche: string; droite: string; icone?: IconName }) {
  return (
    <View style={s.ligne}>
      {icone ? <Ionicons name={icone} size={18} color={C.bleu} style={{ marginRight: 10 }} /> : null}
      <Text style={[s.texte, { flex: 1, color: C.gris }]}>{gauche}</Text>
      <Text style={[s.texte, { fontWeight: '700', flexShrink: 1, textAlign: 'right' }]}>{droite}</Text>
    </View>
  );
}

export function Badge({ texte, couleur = C.bleu }: { texte: string; couleur?: string }) {
  return (
    <View style={[s.badge, { backgroundColor: couleur + '1F' }]}>
      <Text style={[s.badgeTexte, { color: couleur }]}>{texte}</Text>
    </View>
  );
}

export function Numero({ n }: { n: number }) {
  return (
    <View style={s.numero}>
      <Text style={{ color: C.blanc, fontWeight: '800', fontSize: 15 }}>{n}</Text>
    </View>
  );
}

export function Vide({ icone, texte, children }: { icone: IconName; texte: string; children?: ReactNode }) {
  return (
    <Carte style={{ alignItems: 'center', paddingVertical: 28 }}>
      <View style={[s.pastille, { width: 64, height: 64, borderRadius: 32 }]}>
        <Ionicons name={icone} size={30} color={C.bleu} />
      </View>
      <Text style={[s.texte, { textAlign: 'center', marginVertical: 14, color: C.gris }]}>{texte}</Text>
      {children ? <View style={{ alignSelf: 'stretch' }}>{children}</View> : null}
    </Carte>
  );
}

const ombre = {
  shadowColor: '#0B59A3',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

export const s = StyleSheet.create({
  ecran: { padding: 16, paddingBottom: 48, alignItems: 'center' },
  colonne: { width: '100%', maxWidth: 680 },
  titre: { fontSize: 28, fontWeight: '900', color: C.bleuFonce, letterSpacing: -0.3 },
  sous: { fontSize: 15, color: C.gris, fontStyle: 'italic' },
  h2: { fontSize: 18, fontWeight: '800', color: C.texte, marginBottom: 10 },
  texte: { fontSize: 15, color: C.texte, lineHeight: 22 },
  petit: { fontSize: 13, color: C.gris, lineHeight: 19 },
  carte: { backgroundColor: C.blanc, borderRadius: 18, padding: 18, marginBottom: 14, ...ombre },
  section: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, marginBottom: 12 },
  sectionIcone: { backgroundColor: C.bleuVif, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sectionTexte: { fontSize: 15, fontWeight: '900', color: C.bleuFonce, textTransform: 'uppercase', letterSpacing: 0.6, flex: 1 },
  bouton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 8,
  },
  boutonTexte: { fontSize: 16, fontWeight: '800' },
  label: { fontSize: 14, fontWeight: '700', color: C.texte, marginBottom: 8 },
  input: {
    backgroundColor: C.blanc,
    borderWidth: 1,
    borderColor: C.bord,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: C.texte,
  },
  puces: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  puce: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: C.bord,
    backgroundColor: C.blanc,
    borderRadius: 22,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  puceTexte: { fontSize: 14, color: C.texte, fontWeight: '600' },
  ligne: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.bord },
  badge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  badgeTexte: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  numero: { backgroundColor: C.bleu, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pastille: { backgroundColor: C.bleuClair, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
