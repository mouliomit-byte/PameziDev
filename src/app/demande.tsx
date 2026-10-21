import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { Bouton, C, Carte, Champ, Choix, Ecran, s, Vide } from '@/components/ui';
import { CENTRES, fcfa, MOTIFS } from '@/lib/data';
import { Demande as D, situation, usePamezi } from '@/lib/store';

const NOMS_CENTRES = CENTRES.map((c) => c.nom);

export default function Demande() {
  const { membre, formule, cotisations, plafondRestant, demander } = usePamezi();
  const [centre, setCentre] = useState<string | null>(null);
  const [motif, setMotif] = useState<string | null>(null);
  const [montant, setMontant] = useState('');
  const [envoyee, setEnvoyee] = useState<D | null>(null);

  if (!membre || !formule) {
    return (
      <Ecran bords={['bottom']}>
        <Vide icone="person-add" texte="Adhérez d’abord à Pamezi.">
          <Bouton titre="Adhérer" onPress={() => router.replace('/adhesion')} />
        </Vide>
      </Ecran>
    );
  }

  if (!situation(membre, cotisations).aJour) {
    return (
      <Ecran bords={['bottom']}>
        <Vide icone="alert-circle" texte="Vos cotisations ne sont pas à jour. Réglez-les pour être pris en charge.">
          <Bouton titre="Payer ma cotisation" icone="wallet" onPress={() => router.replace('/cotiser')} />
        </Vide>
      </Ecran>
    );
  }

  if (envoyee) {
    return (
      <Ecran bords={['bottom']}>
        <Carte style={{ alignItems: 'center' }}>
          <Ionicons name="paper-plane" size={56} color={C.vert} />
          <Text style={[s.h2, { marginTop: 8 }]}>Demande envoyée</Text>
          <Text style={[s.texte, { textAlign: 'center' }]}>
            Pamezi prendra en charge {fcfa(envoyee.priseEnCharge)} sur {fcfa(envoyee.montant)}. Votre part : {fcfa(envoyee.montant - envoyee.priseEnCharge)}.
          </Text>
        </Carte>
        <Bouton titre="Terminer" onPress={() => router.replace('/soins')} />
      </Ecran>
    );
  }

  const m = parseInt(montant.replace(/\D/g, ''), 10) || 0;
  const estimation = Math.min(Math.round((m * formule.taux) / 100), plafondRestant);

  return (
    <Ecran bords={['bottom']}>
      <Choix label="Formation sanitaire" options={NOMS_CENTRES} valeur={centre} onChange={setCentre} />
      <Choix label="Motif" options={MOTIFS} valeur={motif} onChange={setMotif} />
      <Champ label="Montant de la facture (FCFA)" value={montant} onChangeText={setMontant} keyboardType="number-pad" placeholder="Ex. : 15000" />

      {m > 0 ? (
        <Carte style={{ backgroundColor: C.vertClair, borderColor: C.vert }}>
          <Text style={s.texte}>
            Pamezi paie <Text style={{ fontWeight: '800' }}>{fcfa(estimation)}</Text> ({formule.taux}%)
          </Text>
          <Text style={s.petit}>Votre part : {fcfa(m - estimation)} · plafond restant {fcfa(plafondRestant)}</Text>
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
