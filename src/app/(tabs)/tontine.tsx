import { router } from 'expo-router';
import { Share, Text, View } from 'react-native';

import { Badge, Bouton, C, Carte, Ecran, Ligne, s, Titre, Vide } from '@/components/ui';
import { dateFr, fcfa, SLOGAN, SOLIDARITE } from '@/lib/data';
import { situation, usePamezi } from '@/lib/store';

// Objectif de membres : plus nous sommes nombreux, plus la caisse peut soigner.
const PALIERS = [1000, 2500, 5000, 10000];

export default function Tontine() {
  const { membre, formule, cotisations, totalCotise, communaute, filleuls, parrainer } = usePamezi();

  if (!membre || !formule) {
    return (
      <Ecran>
        <Titre sous={SOLIDARITE}>Tontine santé</Titre>
        <Vide icone="people" texte="Adhérez à Pamezi pour participer à la tontine santé et cotiser chaque mois.">
          <Bouton titre="Adhérer" icone="person-add" onPress={() => router.push('/adhesion')} />
        </Vide>
      </Ecran>
    );
  }

  const sit = situation(membre, cotisations);
  const palier = PALIERS.find((p) => p > communaute.membres) ?? PALIERS[PALIERS.length - 1];
  const progres = Math.min(1, communaute.membres / palier);

  const inviter = async () => {
    try {
      await Share.share({
        message: `Rejoins-moi dans Pamezi, la mutuelle de santé du Noun ! ${SLOGAN}. Dès 1 000 FCFA/mois, on se soigne ensemble. Mon numéro de parrain : ${membre.numero}`,
      });
      parrainer();
    } catch {}
  };

  return (
    <Ecran>
      <Titre sous={SOLIDARITE}>Tontine santé</Titre>

      <Carte style={{ backgroundColor: C.vert, borderColor: C.vert }}>
        <Text style={{ color: '#CFEBDC', fontSize: 14 }}>Ma participation à la caisse</Text>
        <Text style={{ color: C.blanc, fontSize: 30, fontWeight: '900', marginVertical: 4 }}>{fcfa(totalCotise)}</Text>
        <Text style={{ color: C.blanc }}>
          {sit.moisPayes} mois payés · cotisation {fcfa(formule.cotisation)}/mois
        </Text>
        <View style={{ marginTop: 10 }}>
          <Badge texte={sit.aJour ? 'À JOUR' : `${sit.moisDus - sit.moisPayes} MOIS EN RETARD`} couleur={sit.aJour ? C.or : '#FFB4A8'} />
        </View>
        <Bouton titre="Cotiser" icone="wallet" variante="or" onPress={() => router.push('/cotiser')} />
      </Carte>

      <Carte>
        <Text style={s.h2}>Ensemble, nous sommes {communaute.membres.toLocaleString('fr-FR')}</Text>
        <Text style={s.petit}>Prochain objectif : {palier.toLocaleString('fr-FR')} membres dans le Noun</Text>
        <View style={{ height: 12, backgroundColor: C.vertClair, borderRadius: 6, marginVertical: 10, overflow: 'hidden' }}>
          <View style={{ width: `${progres * 100}%`, height: '100%', backgroundColor: C.or }} />
        </View>
        <Text style={s.texte}>
          Caisse solidaire : <Text style={{ fontWeight: '800' }}>{fcfa(communaute.caisse)}</Text>
        </Text>
        <Text style={[s.petit, { marginTop: 6 }]}>
          Chaque nouveau membre renforce la caisse : le risque est partagé entre plus de familles et chacun est mieux protégé.
        </Text>
        <Bouton titre="Inviter un proche" icone="share-social" variante="contour" onPress={inviter} />
        {filleuls > 0 ? <Text style={[s.petit, { marginTop: 8 }]}>Vous avez invité {filleuls} personne(s). Merci !</Text> : null}
      </Carte>

      <Carte>
        <Text style={s.h2}>Règles de la tontine</Text>
        <Ligne icone="calendar" gauche="Cotisation" droite="Chaque mois" />
        <Ligne icone="time" gauche="Délai de carence" droite="1 mois" />
        <Ligne icone="shield-checkmark" gauche="Prise en charge" droite={`${formule.taux}%`} />
        <Ligne icone="people-circle" gauche="Assemblée des membres" droite="Chaque trimestre" />
        <Text style={[s.petit, { marginTop: 8 }]}>
          La caisse appartient aux membres. Les comptes sont présentés à chaque assemblée, village par village.
        </Text>
      </Carte>

      <Text style={s.h2}>Historique des cotisations</Text>
      {cotisations.length === 0 ? (
        <Vide icone="receipt" texte="Aucune cotisation pour le moment." />
      ) : (
        <Carte>
          {cotisations.map((c) => (
            <Ligne key={c.id} gauche={`${dateFr(c.date)} · ${c.mode}`} droite={fcfa(c.montant)} />
          ))}
        </Carte>
      )}
    </Ecran>
  );
}
