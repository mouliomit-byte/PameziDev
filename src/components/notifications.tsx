import Ionicons from '@expo/vector-icons/Ionicons';
import { type Href, router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { dateFr } from '@/lib/data';
import { type EtatNotifications, useNotificationsAdmin, useNotificationsMembre } from '@/lib/notifications';
import { useAffichage } from '@/lib/theme';
import type { Notification } from '@shared/regles';

import { C, Carte, type IconName, s, Vide } from './ui';

/** Petit bouton rond d'en-tête (cloche, soleil / lune). */
function BoutonRond({ icone, libelle, onPress, pastille }: { icone: IconName; libelle: string; onPress: () => void; pastille?: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelle}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.bord,
        opacity: pressed ? 0.7 : 1,
      })}>
      <Ionicons name={icone} size={21} color={C.accent} />
      {pastille ? (
        <View
          style={{
            position: 'absolute',
            top: -3,
            right: -3,
            minWidth: 19,
            height: 19,
            borderRadius: 10,
            paddingHorizontal: 4,
            backgroundColor: C.rouge,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: C.fond,
          }}>
          <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>{pastille > 9 ? '9+' : pastille}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Bascule clair ⇄ sombre. */
export function BoutonTheme() {
  const { theme, basculer } = useAffichage();
  const sombre = theme === 'sombre';
  return <BoutonRond icone={sombre ? 'sunny' : 'moon'} libelle={sombre ? 'Passer en affichage clair' : 'Passer en affichage sombre'} onPress={basculer} />;
}

export function Cloche({ nonLues, href }: { nonLues: number; href: Href }) {
  return (
    <BoutonRond
      icone={nonLues ? 'notifications' : 'notifications-outline'}
      libelle={nonLues ? `Notifications, ${nonLues} nouvelle(s)` : 'Notifications'}
      pastille={nonLues}
      onPress={() => router.push(href)}
    />
  );
}

const STYLE: Record<Notification['type'], { icone: IconName; couleur: () => string }> = {
  info: { icone: 'information-circle', couleur: () => C.accent },
  succes: { icone: 'checkmark-circle', couleur: () => C.vert },
  alerte: { icone: 'time', couleur: () => C.orange },
  erreur: { icone: 'alert-circle', couleur: () => C.rouge },
};

function quand(iso: string) {
  const ecart = Date.now() - new Date(iso).getTime();
  if (ecart >= 0 && ecart < 60_000) return 'à l’instant';
  if (ecart >= 0 && ecart < 3_600_000) return `il y a ${Math.floor(ecart / 60_000)} min`;
  if (ecart >= 0 && ecart < 86_400_000 && iso.length > 10) return `il y a ${Math.floor(ecart / 3_600_000)} h`;
  return dateFr(iso);
}

/** Liste des notifications ; celles arrivées depuis la dernière ouverture sont marquées « nouveau ». */
export function ListeNotifications({ etat, vide }: { etat: Pick<EtatNotifications, 'liste' | 'lu'>; vide: string }) {
  if (!etat.liste.length) return <Vide icone="notifications-off-outline" texte={vide} />;
  return (
    <Carte style={{ paddingVertical: 4, paddingHorizontal: 0 }}>
      {etat.liste.map((n, i) => {
        const st = STYLE[n.type];
        const nouvelle = n.date > etat.lu;
        return (
          <Pressable
            key={n.id}
            accessibilityRole={n.lien ? 'link' : undefined}
            disabled={!n.lien}
            onPress={() => n.lien && router.push(n.lien as Href)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              gap: 12,
              paddingVertical: 13,
              paddingHorizontal: 16,
              backgroundColor: nouvelle ? C.bleuClair : 'transparent',
              borderBottomWidth: i < etat.liste.length - 1 ? 1 : 0,
              borderBottomColor: C.bord,
              opacity: pressed ? 0.75 : 1,
            })}>
            <View style={[s.pastille, { width: 38, height: 38, borderRadius: 19, backgroundColor: st.couleur() + '22' }]}>
              <Ionicons name={st.icone} size={20} color={st.couleur()} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[s.texte, { fontWeight: '800', flexShrink: 1 }]}>{n.titre}</Text>
                {nouvelle ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.rouge }} accessibilityLabel="nouveau" /> : null}
              </View>
              <Text style={s.petit}>{n.texte}</Text>
              <Text style={[s.petit, { fontSize: 12, color: C.indice }]}>{quand(n.date)}</Text>
            </View>
            {n.lien ? <Ionicons name="chevron-forward" size={18} color={C.gris} style={{ alignSelf: 'center' }} /> : null}
          </Pressable>
        );
      })}
    </Carte>
  );
}

/** Boutons en haut des écrans de l'abonné : affichage clair / sombre et notifications. */
export function OutilsAbonne() {
  const { nonLues } = useNotificationsMembre();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginBottom: 12 }}>
      <BoutonTheme />
      <Cloche nonLues={nonLues} href="/notifications" />
    </View>
  );
}

/** En-tête du back office : affichage clair / sombre et notifications (une fois connecté). */
export function OutilsAdmin() {
  const { nonLues, connecte } = useNotificationsAdmin();
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginRight: 12 }}>
      <BoutonTheme />
      {connecte ? <Cloche nonLues={nonLues} href="/admin/notifications" /> : null}
    </View>
  );
}
