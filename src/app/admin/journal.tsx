import { Text, View } from 'react-native';

import { EcranAdmin } from '@/components/admin';
import { C, Carte, s } from '@/components/ui';
import { useDonnees } from '@/lib/admin';
import { api } from '@/lib/api';

export default function Journal() {
  const { donnees, erreur, chargement } = useDonnees((j) => api.admin.journal(j), []);
  return (
    <EcranAdmin chargement={chargement} erreur={erreur}>
      <Text style={[s.petit, { marginBottom: 10 }]}>Les 200 dernières actions du back office, de la plus récente à la plus ancienne.</Text>
      <Carte style={{ paddingVertical: 6 }}>
        {donnees?.length === 0 ? <Text style={[s.petit, { paddingVertical: 10 }]}>Aucune action pour le moment.</Text> : null}
        {donnees?.map((e) => (
          <View key={e.id} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.bord, gap: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <Text style={[s.texte, { fontWeight: '800' }]}>{e.action}</Text>
              <Text style={s.petit}>
                {new Date(e.date).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <Text style={s.petit}>
              {e.cible} · par {e.adminNom}
            </Text>
          </View>
        ))}
      </Carte>
    </EcranAdmin>
  );
}
