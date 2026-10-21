import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Share, Text, View } from 'react-native';

import { Badge, Bouton, C, Carte, Degrade, Ecran, Ligne, s, Section, Titre, Vide } from '@/components/ui';
import { CONTACTS, dateFr, fcfa, nombre, OBJECTIF_ADHERENTS, SLOGAN, SOLIDARITE } from '@/lib/data';
import { useActualiserAuFocus, usePamezi } from '@/lib/store';
import { LIBELLE_STATUT_COTISATION } from '@shared/regles';

export default function Tontine() {
  const { membre, formule, cotisations, situation: sit, totalCotise, invitations, inviter } = usePamezi();
  useActualiserAuFocus();

  if (!membre || !formule) {
    return (
      <Ecran>
        <Titre sous={SOLIDARITE}>Tontine santé</Titre>
        <Vide icone="people" texte="Adhérez à la Mutuelle de Santé Pamezi pour participer à la tontine pour la santé.">
          <Bouton titre="Adhérer" icone="person-add" onPress={() => router.push('/adhesion')} />
        </Vide>
      </Ecran>
    );
  }


  const partager = async () => {
    try {
      const r = await Share.share({
        message:
          `Rejoins la Mutuelle de Santé Pamezi : ${SLOGAN}\n` +
          `Une tontine pour la santé : on cotise chaque mois et on est pris en charge en cas de maladie, avec sa famille.\n` +
          `Mon numéro de membre : ${membre.numero}\nInfos : ${CONTACTS.instagram}`,
      });
      if (r.action !== Share.dismissedAction) inviter();
    } catch {}
  };

  return (
    <Ecran>
      <Titre sous={SOLIDARITE}>Tontine santé</Titre>

      <Degrade style={{ borderRadius: 22, padding: 20, marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: C.bleuPale, fontSize: 14, fontWeight: '600' }}>Ma participation</Text>
          <View style={{ backgroundColor: sit.aJour ? C.jaune : '#FFD7D2', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: sit.aJour ? C.bleuNuit : C.rouge }}>
              {sit.aJour ? 'À JOUR' : `${sit.moisDus - sit.moisPayes} MOIS EN RETARD`}
            </Text>
          </View>
        </View>
        <Text style={{ color: C.blanc, fontSize: 34, fontWeight: '900', marginVertical: 6 }}>{fcfa(totalCotise)}</Text>
        <Text style={{ color: C.blanc, fontSize: 14 }}>
          {sit.moisPayes} mois payés · {fcfa(formule.cotisation)} par mois · formule {formule.nom}
        </Text>
        <Bouton titre="Cotiser" icone="wallet" variante="blanc" onPress={() => router.push('/cotiser')} />
      </Degrade>

      <Carte>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={s.pastille}>
            <Ionicons name="megaphone" size={22} color={C.bleu} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.h2, { marginBottom: 0 }]}>
              Objectif : {nombre(OBJECTIF_ADHERENTS.min)} à {nombre(OBJECTIF_ADHERENTS.max)} adhérents
            </Text>
          </View>
        </View>
        <Text style={[s.texte, { marginTop: 10 }]}>
          Chaque nouvel adhérent renforce la caisse commune : le risque maladie est partagé entre plus de familles, et l’assemblée générale peut élargir les maladies prises en charge ou diminuer les cotisations.
        </Text>
        <Bouton titre="Inviter un proche" icone="share-social" variante="contour" onPress={partager} />
        {invitations > 0 ? (
          <Text style={[s.petit, { marginTop: 8, textAlign: 'center' }]}>Merci ! Vous avez partagé Pamezi {invitations} fois.</Text>
        ) : null}
      </Carte>

      <Section icone="document-text">Règles de la tontine</Section>
      <Carte style={{ paddingVertical: 6 }}>
        <Ligne icone="calendar" gauche="Cotisation" droite="Chaque mois" />
        <Ligne icone="people" gauche="Couverture" droite={`Vous + ${membre.ayantsDroit} ayant(s) droit`} />
        <Ligne icone="shield-checkmark" gauche="Prise en charge" droite={`${formule.taux} %`} />
        <Ligne icone="podium" gauche="Assemblée générale" droite="Chaque année" />
        <Ligne icone="exit" gauche="Adhésion / démission" droite="Libres" />
      </Carte>

      <Section icone="receipt">Historique des cotisations</Section>
      {cotisations.length === 0 ? (
        <Vide icone="receipt" texte="Aucune cotisation enregistrée pour le moment." />
      ) : (
        <Carte style={{ paddingVertical: 6 }}>
          {cotisations.map((c) => (
            <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.bord }}>
              <View style={{ flex: 1 }}>
                <Text style={[s.texte, { fontWeight: '700' }]}>{c.mois} mois</Text>
                <Text style={s.petit}>
                  {dateFr(c.date)} · {c.mode}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={[s.texte, { fontWeight: '800' }]}>{fcfa(c.montant)}</Text>
                <Badge
                  texte={LIBELLE_STATUT_COTISATION[c.statut]}
                  couleur={c.statut === 'confirmee' ? C.vert : c.statut === 'rejetee' ? C.rouge : '#B7791F'}
                />
              </View>
            </View>
          ))}
        </Carte>
      )}
    </Ecran>
  );
}
