import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Bouton, C, Carte, Champ, Choix, Ecran, Ligne, s, Vide } from '@/components/ui';
import { CENTRES, fcfa, MOTIFS } from '@/lib/data';
import { Demande as D, situation, usePamezi } from '@/lib/store';

const CENTRES_OUVERTS = CENTRES.filter((c) => c.conventionne).map((c) => c.nom);

export default function Demande() {
  const { membre, formule, cotisations, plafondRestant, demander } = usePamezi();
  const [centre, setCentre] = useState<string | null>(CENTRES_OUVERTS.length === 1 ? CENTRES_OUVERTS[0] : null);
  const [motif, setMotif] = useState<string | null>(null);
  const [montant, setMontant] = useState('');
  const [envoyee, setEnvoyee] = useState<D | null>(null);

  if (!membre || !formule) {
    return (
      <Ecran bords={['bottom']}>
        <Vide icone="person-add" texte="Adhérez d’abord à la Mutuelle de Santé Pamezi.">
          <Bouton titre="Adhérer" onPress={() => router.replace('/adhesion')} />
        </Vide>
      </Ecran>
    );
  }

  if (!situation(membre, cotisations).aJour) {
    return (
      <Ecran bords={['bottom']}>
        <Vide icone="alert-circle" texte="Vos cotisations ne sont pas à jour. Régularisez-les pour être pris en charge.">
          <Bouton titre="Régler ma cotisation" icone="wallet" onPress={() => router.replace('/cotiser')} />
        </Vide>
      </Ecran>
    );
  }

  if (envoyee) {
    return (
      <Ecran bords={['bottom']}>
        <Carte style={{ alignItems: 'center', paddingVertical: 26 }}>
          <View style={[s.pastille, { width: 76, height: 76, borderRadius: 38 }]}>
            <Ionicons name="paper-plane" size={36} color={C.bleu} />
          </View>
          <Text style={[s.h2, { marginTop: 12 }]}>Demande transmise</Text>
          <Text style={[s.petit, { textAlign: 'center' }]}>Elle sera examinée par la mutuelle et le centre de soins.</Text>
        </Carte>
        <Carte style={{ paddingVertical: 6 }}>
          <Ligne gauche="Facture" droite={fcfa(envoyee.montant)} />
          <Ligne gauche="Part Pamezi" droite={fcfa(envoyee.priseEnCharge)} />
          <Ligne gauche="Votre part" droite={fcfa(envoyee.montant - envoyee.priseEnCharge)} />
        </Carte>
        <Bouton titre="Terminer" onPress={() => router.replace('/soins')} />
      </Ecran>
    );
  }

  const m = parseInt(montant.replace(/\D/g, ''), 10) || 0;
  const estimation = Math.min(Math.round((m * formule.taux) / 100), plafondRestant);

  return (
    <Ecran bords={['bottom']}>
      <Choix label="Centre de soins" options={CENTRES_OUVERTS} valeur={centre} onChange={setCentre} />
      <Choix label="Motif" options={MOTIFS} valeur={motif} onChange={setMotif} />
      <Champ label="Montant de la facture (FCFA)" value={montant} onChangeText={setMontant} keyboardType="number-pad" placeholder="Ex. : 15000" />

      {m > 0 ? (
        <Carte style={{ backgroundColor: C.bleuClair }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={s.texte}>Part Pamezi ({formule.taux} %)</Text>
            <Text style={[s.texte, { fontWeight: '900', color: C.vert }]}>{fcfa(estimation)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Text style={s.texte}>Votre part</Text>
            <Text style={[s.texte, { fontWeight: '800' }]}>{fcfa(m - estimation)}</Text>
          </View>
          <Text style={[s.petit, { marginTop: 8 }]}>
            Plafond restant : {fcfa(plafondRestant)}. Sous réserve que la maladie fasse partie des catégories prises en charge.
          </Text>
        </Carte>
      ) : null}

      <Bouton
        titre="Envoyer la demande"
        icone="send"
        desactive={!centre || !motif || m <= 0}
        onPress={() => centre && motif && setEnvoyee(demander({ centre, motif, montant: m }))}
      />
    </Ecran>
  );
}
