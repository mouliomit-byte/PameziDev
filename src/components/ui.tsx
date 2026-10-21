import Ionicons from '@expo/vector-icons/Ionicons';
import { ReactNode, useId } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';

import type { CouleurApp } from '@shared/regles';

// Couleurs relevées sur l'affiche officielle de la Mutuelle de Santé Pamezi.
const CLAIR = {
  bleu: '#0070C6', // bandeaux, boutons et cercles d'icônes
  accent: '#0070C6', // textes et icônes bleus
  bleuVif: '#1580DB', // pastilles de titres, haut des dégradés
  bleuFonce: '#0B59A3', // titres (« MUTUELLE DE SANTÉ PAMEZI »)
  bleuNuit: '#084A88', // bas des dégradés
  bleuClair: '#DCEAF6', // fonds de pastilles
  bleuPale: '#C6E6F9', // vagues bleu ciel, textes sur bleu
  vert: '#007A5E', // drapeau du Cameroun
  vertClair: '#E3F4EA',
  rouge: '#D91613',
  jaune: '#FCD116',
  orange: '#B7791F', // « en attente », « en retard »
  texte: '#123A61', // texte bleu profond, comme sur l'affiche
  gris: '#56708C',
  indice: '#98A6B8', // texte d'exemple des champs
  // Fond et cartes adoucis (gris bleuté, blanc cassé) : pas de blanc pur qui éblouit.
  bord: '#CCDAE7',
  fond: '#E8EEF4',
  surface: '#F6F8FA', // cartes, champs
  blanc: '#FFFFFF', // texte sur fond bleu
  encre: '#0B59A3', // texte foncé sur bouton blanc (bandeaux)
  degrade: ['#1580DB', '#0070C6', '#084A88'] as [string, string, string],
};

/** Affichage sombre : bleu nuit profond, mêmes repères que l'affiche, contrastes relevés. */
const SOMBRE: typeof CLAIR = {
  bleu: '#1A7ACB',
  accent: '#62B2F0',
  bleuVif: '#2A8FE0',
  bleuFonce: '#93CBF6',
  bleuNuit: '#0A3D70',
  bleuClair: '#17324D',
  bleuPale: '#C6E6F9',
  vert: '#2DB389',
  vertClair: '#123A30',
  rouge: '#F2584C',
  jaune: '#FCD116',
  orange: '#E3A440',
  texte: '#E3EEF9',
  gris: '#96ABC2',
  indice: '#6A819B',
  bord: '#243B53',
  fond: '#0A1520',
  surface: '#122334',
  blanc: '#FFFFFF',
  encre: '#0B59A3',
  degrade: ['#1668B5', '#0E5698', '#07335F'],
};

export type Theme = 'clair' | 'sombre';

/**
 * Teintes de marque possibles (choisies par le propriétaire dans le back office).
 * Les noms des jetons (« bleu », « bleuFonce »…) restent ceux de la teinte d'origine.
 */
export const TEINTES: Record<CouleurApp, { principal: string; vif: string; fonce: string; nuit: string; clair: string; pale: string }> = {
  bleu: { principal: '#0070C6', vif: '#1580DB', fonce: '#0B59A3', nuit: '#084A88', clair: '#E6F3FC', pale: '#C6E6F9' },
  vert: { principal: '#00795C', vif: '#14946F', fonce: '#00634B', nuit: '#004737', clair: '#E1F3ED', pale: '#BFE9DB' },
  turquoise: { principal: '#00788A', vif: '#0E93A6', fonce: '#00626F', nuit: '#00474F', clair: '#DFF2F4', pale: '#BCE7EC' },
  violet: { principal: '#6A3FB5', vif: '#7F55CC', fonce: '#57329A', nuit: '#3E2273', clair: '#EFE9FA', pale: '#DACDF3' },
  bordeaux: { principal: '#A3123A', vif: '#C21F4B', fonce: '#86102F', nuit: '#5E0A21', clair: '#FBE7EC', pale: '#F6C9D5' },
  orange: { principal: '#B85400', vif: '#D86E0E', fonce: '#994600', nuit: '#6E3200', clair: '#FDEEDF', pale: '#FAD8B5' },
};

/** Mélange deux couleurs #RRGGBB (t = part de la seconde). */
function melanger(a: string, b: string, t: number) {
  const x = (h: string, i: number) => parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16);
  return `#${[0, 1, 2].map((i) => Math.round(x(a, i) * (1 - t) + x(b, i) * t).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function palette(theme: Theme, couleur: CouleurApp): typeof CLAIR {
  if (couleur === 'bleu') return theme === 'sombre' ? SOMBRE : CLAIR; // teinte de l'affiche, réglée à la main
  const p = TEINTES[couleur];
  if (theme === 'clair')
    return {
      ...CLAIR,
      bleu: p.principal,
      accent: p.principal,
      bleuVif: p.vif,
      bleuFonce: p.fonce,
      bleuNuit: p.nuit,
      bleuClair: melanger(p.clair, '#D5DDE5', 0.25),
      bleuPale: p.pale,
      encre: p.fonce,
      texte: melanger(p.nuit, '#1A1F26', 0.45),
      gris: melanger(p.principal, '#5F6B78', 0.78),
      bord: melanger(p.principal, '#D2DAE2', 0.85),
      fond: melanger(p.clair, '#E6EBF0', 0.6),
      degrade: [p.vif, p.principal, p.nuit],
    };
  const nuit = '#0A0D12';
  return {
    ...SOMBRE,
    bleu: melanger(p.principal, '#FFFFFF', 0.08),
    accent: melanger(p.principal, '#FFFFFF', 0.45),
    bleuVif: melanger(p.vif, '#FFFFFF', 0.08),
    bleuFonce: melanger(p.principal, '#FFFFFF', 0.6),
    bleuNuit: p.nuit,
    bleuClair: melanger(p.principal, nuit, 0.7),
    bleuPale: p.pale,
    encre: p.fonce,
    texte: melanger(p.pale, '#FFFFFF', 0.6),
    gris: melanger(p.principal, '#A5AEB8', 0.75),
    indice: melanger(p.principal, '#6F7882', 0.8),
    bord: melanger(p.principal, nuit, 0.7),
    fond: melanger(p.principal, nuit, 0.92),
    surface: melanger(p.principal, nuit, 0.84),
    degrade: [melanger(p.vif, '#000000', 0.15), melanger(p.principal, '#000000', 0.22), melanger(p.nuit, '#000000', 0.3)],
  };
}

/** Palette courante (modifiée sur place quand on change d'affichage ou de couleur). */
export const C = { ...CLAIR };
let themeActif: Theme = 'clair';
let couleurActive: CouleurApp = 'bleu';
export const themeCourant = () => themeActif;

export type IconName = keyof typeof Ionicons.glyphMap;

export function Ecran({
  children,
  bords = ['top'],
  large,
}: {
  children: ReactNode;
  bords?: ('top' | 'bottom')[];
  /** Colonne plus large (back office sur ordinateur). */
  large?: boolean;
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.fond }} edges={bords}>
      <ScrollView contentContainerStyle={s.ecran} keyboardShouldPersistTaps="handled">
        <View style={[s.colonne, large && { maxWidth: 1120 }]}>{children}</View>
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
  // Identifiant unique : sur le Web, un dégradé défini dans un écran masqué ne s'affiche pas ailleurs.
  const idDegrade = `pmz${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg width={taille} height={taille} viewBox="0 0 100 100" accessibilityLabel="Logo Pamezi">
      <Defs>
        <SvgGradient id={idDegrade} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={C.bleuVif} />
          <Stop offset="0.55" stopColor={C.bleu} />
          <Stop offset="1" stopColor={C.bleuNuit} />
        </SvgGradient>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill={inverse ? C.blanc : `url(#${idDegrade})`} />
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
    <LinearGradient colors={C.degrade} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[{ overflow: 'hidden' }, style]}>
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
    contour: { fond: 'transparent', bord: C.accent, encre: C.accent },
    blanc: { fond: '#FFFFFF', bord: '#FFFFFF', encre: C.encre }, // sur les bandeaux bleus
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
      <TextInput
        placeholderTextColor={C.indice}
        style={[s.input, props.multiline && { minHeight: 96, textAlignVertical: 'top' }]}
        accessibilityLabel={label || undefined}
        {...props}
      />
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
      {icone ? <Ionicons name={icone} size={18} color={C.accent} style={{ marginRight: 10 }} /> : null}
      <Text style={[s.texte, { flex: 1, color: C.gris }]}>{gauche}</Text>
      <Text style={[s.texte, { fontWeight: '700', flexShrink: 1, textAlign: 'right' }]}>{droite}</Text>
    </View>
  );
}

export function Badge({ texte, couleur = C.accent }: { texte: string; couleur?: string }) {
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
        <Ionicons name={icone} size={30} color={C.accent} />
      </View>
      <Text style={[s.texte, { textAlign: 'center', marginVertical: 14, color: C.gris }]}>{texte}</Text>
      {children ? <View style={{ alignSelf: 'stretch' }}>{children}</View> : null}
    </Carte>
  );
}

const creerStyles = () => StyleSheet.create({
  ecran: { padding: 16, paddingBottom: 48, alignItems: 'center' },
  colonne: { width: '100%', maxWidth: 680 },
  titre: { fontSize: 28, fontWeight: '900', color: C.bleuFonce, letterSpacing: -0.3 },
  sous: { fontSize: 15, color: C.gris, fontStyle: 'italic' },
  h2: { fontSize: 18, fontWeight: '800', color: C.texte, marginBottom: 10 },
  texte: { fontSize: 15, color: C.texte, lineHeight: 22 },
  petit: { fontSize: 13, color: C.gris, lineHeight: 19 },
  carte: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: themeActif === 'sombre' ? '#000000' : '#0B59A3',
    shadowOpacity: themeActif === 'sombre' ? 0.3 : 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    // En sombre, l'ombre se voit peu : un filet délimite les cartes.
    borderWidth: themeActif === 'sombre' ? 1 : 0,
    borderColor: C.bord,
  },
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
    backgroundColor: C.surface,
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
    backgroundColor: C.surface,
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

/** Styles partagés (recalculés sur place quand on change d'affichage). */
export const s = creerStyles();

/** Passe toute l'interface en clair ou en sombre ; les écrans sont ensuite redessinés (voir lib/theme). */
export function appliquerTheme(theme: Theme, couleur: CouleurApp = couleurActive) {
  if (theme === themeActif && couleur === couleurActive) return;
  themeActif = theme;
  couleurActive = couleur;
  Object.assign(C, palette(theme, couleur));
  Object.assign(s, creerStyles());
}

/** Message d'erreur ou d'information affiché dans la page (les boîtes de dialogue ne marchent pas partout). */
export function Alerte({ texte, type = 'erreur' }: { texte: string | null; type?: 'erreur' | 'info' | 'succes' }) {
  if (!texte) return null;
  const couleur = type === 'erreur' ? C.rouge : type === 'succes' ? C.vert : C.accent;
  const icone: IconName = type === 'erreur' ? 'alert-circle' : type === 'succes' ? 'checkmark-circle' : 'information-circle';
  return (
    <View
      accessibilityRole="alert"
      style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: couleur + '14', borderRadius: 12, padding: 12, marginVertical: 8 }}>
      <Ionicons name={icone} size={20} color={couleur} />
      <Text style={[s.texte, { flex: 1, color: type === 'erreur' ? C.rouge : C.texte }]}>{texte}</Text>
    </View>
  );
}

/** Chiffre clé du tableau de bord. */
export function Kpi({
  icone,
  valeur,
  unite,
  libelle,
  detail,
  couleur = C.accent,
}: {
  icone: IconName;
  valeur: string;
  unite?: string;
  libelle: string;
  detail?: string;
  couleur?: string;
}) {
  return (
    <View style={[s.carte, { flexGrow: 1, flexBasis: 160, marginBottom: 0, gap: 6 }]}>
      <View style={[s.pastille, { width: 36, height: 36, borderRadius: 18, backgroundColor: couleur + '1A' }]}>
        <Ionicons name={icone} size={18} color={couleur} />
      </View>
      <Text style={{ fontSize: 22, fontWeight: '900', color: C.texte, fontVariant: ['tabular-nums'] }}>
        {valeur}
        {unite ? <Text style={{ fontSize: 13, fontWeight: '700', color: C.gris }}>{` ${unite}`}</Text> : null}
      </Text>
      <Text style={[s.petit, { color: C.texte, fontWeight: '600' }]}>{libelle}</Text>
      {detail ? <Text style={s.petit}>{detail}</Text> : null}
    </View>
  );
}

/** Barres horizontales simples (répartition, montants par mois). */
export function Barres({ lignes, format = (n: number) => String(n) }: { lignes: { libelle: string; valeur: number }[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...lignes.map((l) => l.valeur));
  if (!lignes.length) return <Text style={s.petit}>Aucune donnée pour le moment.</Text>;
  return (
    <View style={{ gap: 10 }}>
      {lignes.map((l) => (
        <View key={l.libelle} style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <Text style={[s.petit, { color: C.texte, flexShrink: 1 }]}>{l.libelle}</Text>
            <Text style={[s.petit, { color: C.texte, fontWeight: '700', fontVariant: ['tabular-nums'] }]}>{format(l.valeur)}</Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: C.bleuClair, overflow: 'hidden' }}>
            <View style={{ width: `${(l.valeur / max) * 100}%`, height: '100%', borderRadius: 4, backgroundColor: C.bleu }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Onglets de filtre (« En attente », « Confirmées »…). */
export function Onglets<T extends string>({ options, valeur, onChange }: { options: { valeur: T; libelle: string }[]; valeur: T; onChange: (v: T) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
      {options.map((o) => {
        const actif = o.valeur === valeur;
        return (
          <Pressable
            key={o.valeur}
            accessibilityRole="tab"
            accessibilityState={{ selected: actif }}
            onPress={() => onChange(o.valeur)}
            style={[s.puce, actif && { backgroundColor: C.bleu, borderColor: C.bleu }]}>
            <Text style={[s.puceTexte, actif && { color: C.blanc }]}>{o.libelle}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Petit bouton d'action dans une ligne de liste. */
export function Action({ titre, onPress, couleur = C.accent, plein, desactive }: { titre: string; onPress: () => void; couleur?: string; plein?: boolean; desactive?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={desactive}
      style={({ pressed }) => ({
        borderWidth: 1.5,
        borderColor: couleur,
        backgroundColor: plein ? couleur : 'transparent',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
        minHeight: 40,
        justifyContent: 'center',
        opacity: desactive ? 0.4 : pressed ? 0.75 : 1,
      })}>
      <Text style={{ color: plein ? (themeActif === 'sombre' ? C.fond : C.blanc) : couleur, fontWeight: '800', fontSize: 14 }}>{titre}</Text>
    </Pressable>
  );
}
