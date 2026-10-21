import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Bouton, C, Carte, Ecran, s, Stat } from '@/components/ui';
import { DEVISE, fcfa, fcfaCourt, FORMULES, SLOGAN, SOLIDARITE } from '@/lib/data';
import { situation, usePamezi } from '@/lib/store';

const ETAPES = [
  { icone: 'person-add', titre: 'J’adhère', texte: 'Inscription simple avec mon téléphone, dans ma ville ou mon village.' },
  { icone: 'wallet', titre: 'Je cotise chaque mois', texte: 'Par MTN MoMo, Orange Money ou auprès du collecteur du village.' },
  { icone: 'people', titre: 'La tontine santé grandit', texte: 'Toutes les cotisations forment une caisse commune, gérée ensemble.' },
  { icone: 'medkit', titre: 'Je suis soigné', texte: 'Quand un membre tombe malade, la caisse paie une grande partie des soins.' },
] as const;

export default function Accueil() {
  const { membre, formule, communaute, cotisations } = usePamezi();
  const sit = situation(membre, cotisations);

  return (
    <Ecran>
      <View style={{ backgroundColor: C.vert, borderRadius: 20, padding: 20, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ backgroundColor: C.or, borderRadius: 12, padding: 8 }}>
            <Ionicons name="heart" size={26} color={C.vertFonce} />
          </View>
          <Text style={{ color: C.blanc, fontSize: 30, fontWeight: '900', letterSpacing: 1 }}>Pamezi</Text>
        </View>
        <Text style={{ color: C.blanc, fontSize: 19, fontWeight: '700', marginTop: 14 }}>{SLOGAN}</Text>
        <Text style={{ color: '#CFEBDC', fontSize: 15, marginTop: 4 }}>{DEVISE}</Text>
        <Text style={{ color: C.or, fontSize: 13, fontWeight: '600', marginTop: 10 }}>
          Mutuelle de santé des villes et villages du Noun
        </Text>
      </View>

      {membre && formule ? (
        <Carte>
          <Text style={s.h2}>Bonjour {membre.nom.split(' ')[0]} 👋</Text>
          <Text style={s.texte}>
            Formule {formule.nom} · {membre.localite}
          </Text>
          <Text style={[s.texte, { color: sit.aJour ? C.vert : C.rouge, fontWeight: '700', marginTop: 6 }]}>
            {sit.aJour
              ? 'Vos cotisations sont à jour. Vous êtes couvert.'
              : `${sit.moisDus - sit.moisPayes} mois de cotisation à régler.`}
          </Text>
          {!sit.aJour ? <Bouton titre="Payer maintenant" icone="wallet" onPress={() => router.push('/cotiser')} /> : null}
        </Carte>
      ) : (
        <Carte style={{ backgroundColor: C.orClair, borderColor: C.or }}>
          <Text style={s.h2}>Rejoignez la tontine santé</Text>
          <Text style={s.texte}>
            Dès {fcfa(FORMULES[0].cotisation)} par mois, soyez soigné sans vous ruiner. {SOLIDARITE}
          </Text>
          <Bouton titre="Adhérer maintenant" icone="person-add" onPress={() => router.push('/adhesion')} />
        </Carte>
      )}

      <Text style={s.h2}>Notre force, c’est le nombre</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        <Stat icone="people" valeur={communaute.membres.toLocaleString('fr-FR')} label="membres" />
        <Stat icone="cash" valeur={fcfaCourt(communaute.caisse)} label="caisse solidaire" />
        <Stat icone="location" valeur={String(communaute.villages)} label="villes et villages" />
      </View>

      <Text style={s.h2}>Comment ça marche ?</Text>
      {ETAPES.map((e, i) => (
        <Carte key={e.titre} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <View style={{ backgroundColor: C.vertClair, borderRadius: 12, padding: 10 }}>
            <Ionicons name={e.icone} size={22} color={C.vert} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.texte, { fontWeight: '700' }]}>
              {i + 1}. {e.titre}
            </Text>
            <Text style={s.petit}>{e.texte}</Text>
          </View>
        </Carte>
      ))}

      <Text style={s.h2}>Nos formules</Text>
      {FORMULES.map((f) => (
        <Carte key={f.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={[s.h2, { marginBottom: 2 }]}>{f.nom}</Text>
            <Text style={{ fontSize: 17, fontWeight: '800', color: C.vert }}>{fcfa(f.cotisation)}/mois</Text>
          </View>
          <Text style={s.petit}>
            {f.personnes} · {f.taux}% des frais pris en charge · plafond {fcfa(f.plafond)}/an
          </Text>
          <Text style={[s.texte, { marginTop: 6 }]}>{f.garanties.join(' · ')}</Text>
        </Carte>
      ))}
    </Ecran>
  );
}
