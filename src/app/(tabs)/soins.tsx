import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Badge, Bouton, C, Carte, Ecran, s, Titre, Vide } from '@/components/ui';
import { CENTRES, dateFr, DEVISE, fcfa } from '@/lib/data';
import { usePamezi } from '@/lib/store';

const CONSEILS = [
  { icone: 'water', texte: 'Buvez une eau propre : faites-la bouillir ou traitez-la.' },
  { icone: 'bug', texte: 'Dormez sous moustiquaire imprégnée pour éviter le paludisme.' },
  { icone: 'hand-left', texte: 'Lavez-vous les mains au savon avant de manger.' },
  { icone: 'medical', texte: 'Faites vacciner les enfants selon le calendrier du centre de santé.' },
] as const;

export default function Soins() {
  const { membre, formule, demandes, totalRembourse, plafondRestant } = usePamezi();

  return (
    <Ecran>
      <Titre sous={DEVISE}>Mes soins</Titre>

      {membre && formule ? (
        <>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            <Carte style={{ flex: 1, marginBottom: 0 }}>
              <Text style={s.petit}>Pris en charge</Text>
              <Text style={[s.h2, { marginBottom: 0 }]}>{fcfa(totalRembourse)}</Text>
            </Carte>
            <Carte style={{ flex: 1, marginBottom: 0 }}>
              <Text style={s.petit}>Plafond restant</Text>
              <Text style={[s.h2, { marginBottom: 0, color: C.vert }]}>{fcfa(plafondRestant)}</Text>
            </Carte>
          </View>
          <Bouton titre="Nouvelle demande de prise en charge" icone="add-circle" onPress={() => router.push('/demande')} />
          <View style={{ height: 16 }} />

          <Text style={s.h2}>Mes demandes</Text>
          {demandes.length === 0 ? (
            <Vide icone="document-text" texte="Aucune demande. Présentez votre carte Pamezi au centre de santé, puis enregistrez la facture ici." />
          ) : (
            demandes.map((d) => (
              <Carte key={d.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[s.texte, { fontWeight: '700' }]}>{d.motif}</Text>
                  <Badge texte={d.statut} couleur={d.statut === 'En cours' ? C.or : C.vert} />
                </View>
                <Text style={s.petit}>
                  {d.centre} · {dateFr(d.date)}
                </Text>
                <Text style={[s.texte, { marginTop: 6 }]}>
                  Facture {fcfa(d.montant)} → Pamezi paie <Text style={{ fontWeight: '800', color: C.vert }}>{fcfa(d.priseEnCharge)}</Text>
                </Text>
              </Carte>
            ))
          )}
        </>
      ) : (
        <Vide icone="medkit" texte="Adhérez pour bénéficier de la prise en charge de vos soins.">
          <Bouton titre="Adhérer" icone="person-add" onPress={() => router.push('/adhesion')} />
        </Vide>
      )}

      <Text style={s.h2}>Formations sanitaires du Noun</Text>
      <Carte>
        {CENTRES.map((c) => (
          <View key={c.nom} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
            <Ionicons name="business" size={18} color={C.vert} />
            <View style={{ flex: 1 }}>
              <Text style={s.texte}>{c.nom}</Text>
              <Text style={s.petit}>{c.lieu}</Text>
            </View>
          </View>
        ))}
        <Text style={[s.petit, { marginTop: 6 }]}>Liste indicative : renseignez-vous auprès de votre délégué Pamezi.</Text>
      </Carte>

      <Text style={s.h2}>Conseils santé</Text>
      {CONSEILS.map((c) => (
        <Carte key={c.texte} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Ionicons name={c.icone} size={22} color={C.or} />
          <Text style={[s.texte, { flex: 1 }]}>{c.texte}</Text>
        </Carte>
      ))}
    </Ecran>
  );
}
