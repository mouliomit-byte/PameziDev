import { Text } from 'react-native';

import { EcranAdmin } from '@/components/admin';
import { ListeNotifications } from '@/components/notifications';
import { s } from '@/components/ui';
import { useMarquerLuesEnPartant, useNotificationsAdmin } from '@/lib/notifications';

export default function NotificationsAdmin() {
  const etat = useNotificationsAdmin();
  useMarquerLuesEnPartant(etat.marquerLues);
  return (
    <EcranAdmin>
      <Text style={[s.petit, { marginBottom: 12 }]}>
        Nouvelles adhésions des 30 derniers jours, cotisations en espèces à confirmer et demandes de prise en charge à traiter. Touchez une notification pour l’ouvrir.
      </Text>
      <ListeNotifications etat={etat} vide="Rien à traiter pour le moment." />
    </EcranAdmin>
  );
}
