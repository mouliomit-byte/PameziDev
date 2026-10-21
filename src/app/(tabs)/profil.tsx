import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Bouton, C, Carte, Ecran, Ligne, s, Titre, Vide } from '@/components/ui';
import { dateFr, SLOGAN } from '@/lib/data';
import { situation, usePamezi } from '@/lib/store';

export default function Profil() {
  const { membre, formule, cotisations, reinitialiser } = usePamezi();
  const [confirmer, setConfirmer] = useState(false);

  if (!membre || !formule) {
    return (
      <Ecran>
        <Titre>Ma carte</Titre>
        <Vide icone="card" texte="Votre carte de membre apparaîtra ici après votre adhésion.">
          <Bouton titre="Adhérer" icone="person-add" onPress={() => router.push('/adhesion')} />
        </Vide>
      </Ecran>
    );
  }

  const sit = situation(membre, cotisations);

  return (
    <Ecran>
      <Titre sous="À présenter au centre de santé">Ma carte de membre</Titre>

      <View style={{ backgroundColor: C.vertFonce, borderRadius: 20, padding: 20, marginBottom: 16, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: C.or, opacity: 0.25 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="heart" size={22} color={C.or} />
          <Text style={{ color: C.blanc, fontSize: 22, fontWeight: '900' }}>Pamezi</Text>
        </View>
        <Text style={{ color: '#CFEBDC', fontSize: 12, marginTop: 2 }}>{SLOGAN}</Text>
        <Text style={{ color: C.blanc, fontSize: 22, fontWeight: '800', marginTop: 22 }}>{membre.nom}</Text>
        <Text style={{ color: C.or, fontSize: 18, fontWeight: '700', letterSpacing: 2, marginTop: 4 }}>{membre.numero}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
          <View>
            <Text style={{ color: '#CFEBDC', fontSize: 11 }}>FORMULE</Text>
            <Text style={{ color: C.blanc, fontWeight: '700' }}>{formule.nom}</Text>
          </View>
          <View>
            <Text style={{ color: '#CFEBDC', fontSize: 11 }}>LOCALITÉ</Text>
            <Text style={{ color: C.blanc, fontWeight: '700' }}>{membre.localite}</Text>
          </View>
          <View>
            <Text style={{ color: '#CFEBDC', fontSize: 11 }}>STATUT</Text>
            <Text style={{ color: sit.aJour ? C.or : '#FFB4A8', fontWeight: '700' }}>{sit.aJour ? 'Actif' : 'Suspendu'}</Text>
          </View>
        </View>
      </View>

      <Carte>
        <Text style={s.h2}>Mes informations</Text>
        <Ligne icone="call" gauche="Téléphone" droite={membre.telephone} />
        <Ligne icone="people" gauche="Bénéficiaires" droite={String(membre.beneficiaires)} />
        <Ligne icone="calendar" gauche="Membre depuis" droite={dateFr(membre.dateAdhesion)} />
        <Ligne icone="shield-checkmark" gauche="Prise en charge" droite={`${formule.taux}%`} />
      </Carte>

      <Carte>
        <Text style={s.h2}>Besoin d’aide ?</Text>
        <Text style={s.texte}>Contactez votre délégué Pamezi de {membre.localite} ou passez à l’antenne de Foumban.</Text>
      </Carte>

      {confirmer ? (
        <Carte style={{ borderColor: C.rouge }}>
          <Text style={s.texte}>Effacer toutes les données Pamezi de cet appareil ?</Text>
          <Bouton titre="Oui, effacer" variante="plein" onPress={() => { reinitialiser(); setConfirmer(false); }} />
          <Bouton titre="Annuler" variante="contour" onPress={() => setConfirmer(false)} />
        </Carte>
      ) : (
        <Bouton titre="Se déconnecter de cet appareil" icone="log-out" variante="contour" onPress={() => setConfirmer(true)} />
      )}
    </Ecran>
  );
}
