import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { OutilsAbonne } from '@/components/notifications';
import { Badge, Bouton, C, Carte, Ecran, s, Section, Titre, Vide } from '@/components/ui';
import { dateFr, DEVISE, fcfa } from '@/lib/data';
import { useActualiserAuFocus, usePamezi } from '@/lib/store';
import { LIBELLE_STATUT_DEMANDE } from '@shared/regles';

const PREVENTION = [
  { icone: 'water', texte: 'Buvez une eau propre : faites-la bouillir ou traitez-la.' },
  { icone: 'bed', texte: 'Dormez sous moustiquaire imprégnée pour éviter le paludisme.' },
  { icone: 'hand-left', texte: 'Lavez-vous les mains au savon avant de manger.' },
  { icone: 'medical', texte: 'Faites vacciner les enfants selon le calendrier du centre de santé.' },
  { icone: 'heart', texte: 'Faites contrôler votre tension et votre glycémie au moins une fois par an.' },
] as const;

export default function Soins() {
  const { membre, formule, demandes, totalRembourse, plafondRestant, centres } = usePamezi();
  useActualiserAuFocus();

  return (
    <Ecran>
      <OutilsAbonne />
      <Titre sous={DEVISE}>Mes soins</Titre>

      {membre && formule ? (
        <>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 6 }}>
            <Carte style={{ flex: 1 }}>
              <Text style={s.petit}>Pris en charge</Text>
              <Text style={{ fontSize: 19, fontWeight: '900', color: C.texte, marginTop: 4 }}>{fcfa(totalRembourse)}</Text>
            </Carte>
            <Carte style={{ flex: 1 }}>
              <Text style={s.petit}>Plafond restant</Text>
              <Text style={{ fontSize: 19, fontWeight: '900', color: C.accent, marginTop: 4 }}>{fcfa(plafondRestant)}</Text>
            </Carte>
          </View>
          <Bouton titre="Nouvelle demande de prise en charge" icone="add-circle" onPress={() => router.push('/demande')} />

          <Section icone="document-text">Mes demandes</Section>
          {demandes.length === 0 ? (
            <Vide icone="document-text" texte="Aucune demande. Présentez votre carte de membre au centre de santé, puis enregistrez la facture ici." />
          ) : (
            demandes.map((d) => (
              <Carte key={d.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[s.texte, { fontWeight: '800' }]}>{d.motif}</Text>
                  <Badge
                    texte={LIBELLE_STATUT_DEMANDE[d.statut]}
                    couleur={d.statut === 'en_cours' ? C.orange : d.statut === 'rejetee' ? C.rouge : C.vert}
                  />
                </View>
                <Text style={s.petit}>
                  {d.centre} · {dateFr(d.date)}
                </Text>
                <View style={{ height: 1, backgroundColor: C.bord, marginVertical: 10 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={s.petit}>Facture {fcfa(d.montant)}</Text>
                  <Text style={[s.texte, { fontWeight: '800', color: C.vert }]}>Pamezi : {fcfa(d.priseEnCharge)}</Text>
                </View>
              </Carte>
            ))
          )}
        </>
      ) : (
        <Vide icone="medkit" texte="Adhérez pour être pris en charge en cas de maladie, vous et votre famille.">
          <Bouton titre="Adhérer" icone="person-add" onPress={() => router.push('/adhesion')} />
        </Vide>
      )}

      <Section icone="business">Centres de soins</Section>
      {centres.map((c) => (
        <Carte key={c.nom} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <View style={[s.pastille, !c.conventionne && { backgroundColor: C.fond }]}>
            <Ionicons name={c.conventionne ? 'business' : 'time'} size={22} color={c.conventionne ? C.accent : C.gris} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[s.texte, { fontWeight: '800' }]}>{c.nom}</Text>
            <Badge texte={c.statut} couleur={c.conventionne ? C.vert : C.gris} />
            {c.services.length ? <Text style={s.petit}>{c.services.join(' · ')}</Text> : null}
          </View>
        </Carte>
      ))}

      <Section icone="leaf">Prévention</Section>
      <Carte style={{ paddingVertical: 6 }}>
        {PREVENTION.map((c, i) => (
          <View
            key={c.texte}
            style={[{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 11 }, i < PREVENTION.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.bord }]}>
            <Ionicons name={c.icone} size={20} color={C.accent} />
            <Text style={[s.texte, { flex: 1 }]}>{c.texte}</Text>
          </View>
        ))}
      </Carte>
    </Ecran>
  );
}
