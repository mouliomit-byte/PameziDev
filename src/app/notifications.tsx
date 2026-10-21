import { router } from 'expo-router';
import { Text } from 'react-native';

import { ListeNotifications } from '@/components/notifications';
import { Bouton, Ecran, s } from '@/components/ui';
import { useMarquerLuesEnPartant, useNotificationsMembre } from '@/lib/notifications';
import { useActualiserAuFocus } from '@/lib/store';

export default function Notifications() {
  const etat = useNotificationsMembre();
  useActualiserAuFocus();
  useMarquerLuesEnPartant(etat.marquerLues);

  if (!etat.connecte) {
    return (
      <Ecran bords={['bottom']}>
        <Text style={[s.texte, { marginBottom: 12 }]}>
          Connectez-vous pour suivre ici vos cotisations, vos demandes de prise en charge et les messages de la mutuelle.
        </Text>
        <Bouton titre="Se connecter" icone="log-in" onPress={() => router.replace('/connexion')} />
        <Bouton titre="Adhérer à Pamezi" icone="person-add" variante="contour" onPress={() => router.replace('/adhesion')} />
      </Ecran>
    );
  }
  return (
    <Ecran bords={['bottom']}>
      <ListeNotifications etat={etat} vide="Aucune notification pour le moment." />
    </Ecran>
  );
}
