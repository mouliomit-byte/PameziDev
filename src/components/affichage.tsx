import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';

import { C, Choix, s, TEINTES, type Transparence, TRANSPARENCES } from '@/components/ui';
import { type PreferenceAffichage, useAffichage } from '@/lib/theme';
import { COULEURS_APP, type CouleurApp, LIBELLE_COULEUR } from '@shared/regles';

const LIBELLES = { auto: 'Automatique', clair: 'Clair', sombre: 'Sombre' } as const satisfies Record<PreferenceAffichage, string>;
const OPTIONS = Object.values(LIBELLES);

/** Choix de l'affichage : automatique (réglage de l'appareil), clair ou sombre. */
export function ChoixAffichage() {
  const { preference, choisir } = useAffichage();
  return (
    <Choix
      label="Affichage"
      options={OPTIONS}
      valeur={LIBELLES[preference]}
      onChange={(v) => choisir((Object.keys(LIBELLES) as PreferenceAffichage[]).find((k) => LIBELLES[k] === v) ?? 'auto')}
    />
  );
}

const LIBELLE_TRANSPARENCE = (t: Transparence) => (t ? `${t} %` : 'Aucune');

/** Effet de verre : transparence des cartes et des barres, sur un fond décoré. */
export function ChoixTransparence() {
  const { transparence, choisirTransparence } = useAffichage();
  return (
    <Choix
      label="Transparence"
      options={TRANSPARENCES.map(LIBELLE_TRANSPARENCE)}
      valeur={LIBELLE_TRANSPARENCE(transparence)}
      onChange={(v) => choisirTransparence(TRANSPARENCES.find((t) => LIBELLE_TRANSPARENCE(t) === v) ?? 0)}
    />
  );
}

/** Nuancier des couleurs possibles de l'application (back office). */
export function ChoixCouleur({ valeur, onChange, desactive }: { valeur: CouleurApp; onChange: (c: CouleurApp) => void; desactive?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {COULEURS_APP.map((c) => {
        const t = TEINTES[c];
        const actif = c === valeur;
        return (
          <Pressable
            key={c}
            accessibilityRole="radio"
            accessibilityState={{ selected: actif, disabled: !!desactive }}
            accessibilityLabel={LIBELLE_COULEUR[c]}
            disabled={desactive}
            onPress={() => onChange(c)}
            style={({ pressed }) => ({
              flexGrow: 1,
              flexBasis: 150,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: 10,
              borderRadius: 14,
              borderWidth: 2,
              borderColor: actif ? C.accent : C.bord,
              backgroundColor: actif ? C.bleuClair : C.surface,
              opacity: desactive && !actif ? 0.55 : pressed ? 0.8 : 1,
            })}>
            <LinearGradient colors={[t.vif, t.principal, t.nuit]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
              {actif ? <Ionicons name="checkmark" size={22} color="#FFFFFF" /> : null}
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={[s.texte, { fontWeight: '800' }]}>{LIBELLE_COULEUR[c]}</Text>
              <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                {[t.principal, t.fonce, t.clair].map((x) => (
                  <View key={x} style={{ width: 16, height: 8, borderRadius: 4, backgroundColor: x, borderWidth: 1, borderColor: C.bord }} />
                ))}
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
