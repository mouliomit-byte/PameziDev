import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Bouton, C, Carte, Ecran, Ligne, Logo, s, Section, Titre, Tricolore, Vide } from '@/components/ui';
import { CONTACTS, dateFr, SLOGAN } from '@/lib/data';
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

      {/* Carte de membre */}
      <View style={{ backgroundColor: C.bleu, borderRadius: 22, overflow: 'hidden', marginBottom: 16 }}>
        <View style={{ position: 'absolute', right: -50, top: -50, width: 190, height: 190, borderRadius: 95, backgroundColor: C.bleuFonce, opacity: 0.6 }} />
        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Logo taille={42} inverse />
            <View>
              <Text style={{ color: C.blanc, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>CARTE DE MEMBRE</Text>
              <Text style={{ color: C.blanc, fontSize: 16, fontWeight: '900' }}>Mutuelle de Santé Pamezi</Text>
            </View>
          </View>
          <Text style={{ color: C.blanc, fontSize: 23, fontWeight: '900', marginTop: 24 }}>{membre.nom}</Text>
          <Text style={{ color: C.jaune, fontSize: 18, fontWeight: '800', letterSpacing: 2.5, marginTop: 4 }}>{membre.numero}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
            <Info titre="FORMULE" valeur={formule.nom} />
            <Info titre="AYANTS DROIT" valeur={String(membre.ayantsDroit)} />
            <Info titre="STATUT" valeur={sit.aJour ? 'Actif' : 'Suspendu'} couleur={sit.aJour ? C.jaune : '#FFB4A8'} />
          </View>
        </View>
        <View style={{ backgroundColor: C.bleuNuit, paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: C.bleuPale, fontSize: 12, fontStyle: 'italic' }}>{SLOGAN}</Text>
          <Tricolore largeur={42} />
        </View>
      </View>

      <Section icone="person">Mes informations</Section>
      <Carte style={{ paddingVertical: 6 }}>
        <Ligne icone="call" gauche="Téléphone" droite={membre.telephone} />
        <Ligne icone="location" gauche="Localité" droite={membre.localite} />
        <Ligne
          icone="people-circle"
          gauche="Adhésion"
          droite={membre.association ?? membre.typeAdhesion}
        />
        <Ligne icone="calendar" gauche="Membre depuis" droite={dateFr(membre.dateAdhesion)} />
        <Ligne icone="shield-checkmark" gauche="Prise en charge" droite={`${formule.taux} %`} />
      </Carte>

      <Section icone="help-buoy">Besoin d’aide ?</Section>
      <Carte>
        <Text style={s.texte}>
          Pour toute question, une modification de vos ayants droit ou une démission, écrivez-nous à{' '}
          <Text style={{ fontWeight: '800', color: C.bleu }}>{CONTACTS.email}</Text>.
        </Text>
      </Carte>

      {confirmer ? (
        <Carte style={{ borderWidth: 1, borderColor: C.rouge }}>
          <Text style={s.texte}>Effacer les données Pamezi de cet appareil ? Votre adhésion n’est pas annulée.</Text>
          <Bouton titre="Oui, effacer" variante="danger" onPress={() => { reinitialiser(); setConfirmer(false); }} />
          <Bouton titre="Annuler" variante="contour" onPress={() => setConfirmer(false)} />
        </Carte>
      ) : (
        <Bouton titre="Se déconnecter de cet appareil" icone="log-out" variante="contour" onPress={() => setConfirmer(true)} />
      )}
    </Ecran>
  );
}

function Info({ titre, valeur, couleur = C.blanc }: { titre: string; valeur: string; couleur?: string }) {
  return (
    <View>
      <Text style={{ color: C.bleuPale, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>{titre}</Text>
      <Text style={{ color: couleur, fontWeight: '800', fontSize: 15, marginTop: 2 }}>{valeur}</Text>
    </View>
  );
}
