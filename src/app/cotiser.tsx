import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { Bouton, C, Carte, Choix, Ecran, Ligne, s, Vide } from '@/components/ui';
import { fcfa, MODES_PAIEMENT, ModePaiement } from '@/lib/data';
import { Cotisation, usePamezi } from '@/lib/store';

const DUREES = ['1 mois', '3 mois', '6 mois', '12 mois'] as const;

export default function Cotiser() {
  const { membre, formule, cotiser } = usePamezi();
  const [duree, setDuree] = useState<(typeof DUREES)[number]>('1 mois');
  const [mode, setMode] = useState<ModePaiement | null>(null);
  const [recu, setRecu] = useState<Cotisation | null>(null);

  if (!membre || !formule) {
    return (
      <Ecran bords={['bottom']}>
        <Vide icone="person-add" texte="Adhérez d’abord à Pamezi.">
          <Bouton titre="Adhérer" onPress={() => router.replace('/adhesion')} />
        </Vide>
      </Ecran>
    );
  }

  if (recu) {
    return (
      <Ecran bords={['bottom']}>
        <Carte style={{ alignItems: 'center' }}>
          <Ionicons name="checkmark-circle" size={64} color={C.vert} />
          <Text style={[s.h2, { marginTop: 8 }]}>Merci {membre.nom.split(' ')[0]} !</Text>
          <Text style={[s.texte, { textAlign: 'center' }]}>
            Votre cotisation de {fcfa(recu.montant)} renforce la tontine santé de tout le Noun.
          </Text>
        </Carte>
        <Carte>
          <Ligne gauche="Membre" droite={membre.numero} />
          <Ligne gauche="Période" droite={`${recu.mois} mois`} />
          <Ligne gauche="Paiement" droite={recu.mode} />
          <Ligne gauche="Référence" droite={recu.id.toUpperCase()} />
        </Carte>
        <Bouton titre="Terminer" onPress={() => router.replace('/tontine')} />
      </Ecran>
    );
  }

  const mois = parseInt(duree, 10);
  const montant = formule.cotisation * mois;

  return (
    <Ecran bords={['bottom']}>
      <Carte style={{ backgroundColor: C.vertClair, borderColor: C.vert }}>
        <Text style={s.petit}>Formule {formule.nom}</Text>
        <Text style={{ fontSize: 28, fontWeight: '900', color: C.vertFonce }}>{fcfa(montant)}</Text>
        <Text style={s.petit}>{fcfa(formule.cotisation)} × {mois} mois</Text>
      </Carte>

      <Choix label="Je paie pour" options={DUREES} valeur={duree} onChange={setDuree} />
      <Choix label="Moyen de paiement" options={MODES_PAIEMENT} valeur={mode} onChange={setMode} />

      {mode && mode !== 'Espèces (collecteur)' ? (
        <Text style={[s.petit, { marginBottom: 10 }]}>
          Une demande de paiement sera envoyée au {membre.telephone}. Confirmez avec votre code secret {mode}.
        </Text>
      ) : mode ? (
        <Text style={[s.petit, { marginBottom: 10 }]}>Remettez la somme au collecteur Pamezi de {membre.localite} et gardez votre reçu.</Text>
      ) : null}

      <Bouton
        titre={`Payer ${fcfa(montant)}`}
        icone="wallet"
        desactive={!mode}
        onPress={() => mode && setRecu(cotiser(mois, mode))}
      />
      <Text style={[s.petit, { marginTop: 10, textAlign: 'center' }]}>
        Version de démonstration : aucun argent n’est prélevé.
      </Text>
    </Ecran>
  );
}
