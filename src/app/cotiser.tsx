import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Bouton, C, Carte, Choix, Ecran, Ligne, s, Tricolore, Vide } from '@/components/ui';
import { dateFr, fcfa, MODES_PAIEMENT, ModePaiement } from '@/lib/data';
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
        <Vide icone="person-add" texte="Adhérez d’abord à la Mutuelle de Santé Pamezi.">
          <Bouton titre="Adhérer" onPress={() => router.replace('/adhesion')} />
        </Vide>
      </Ecran>
    );
  }

  if (recu) {
    return (
      <Ecran bords={['bottom']}>
        <Carte style={{ alignItems: 'center', paddingVertical: 26 }}>
          <View style={{ backgroundColor: '#E3F4EA', width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark" size={44} color={C.vert} />
          </View>
          <Text style={[s.h2, { marginTop: 12, marginBottom: 4 }]}>Cotisation enregistrée</Text>
          <Text style={{ fontSize: 28, fontWeight: '900', color: C.bleu }}>{fcfa(recu.montant)}</Text>
          <Text style={[s.petit, { textAlign: 'center', marginTop: 6 }]}>
            Merci {membre.nom.split(' ')[0]} : votre cotisation renforce la tontine pour la santé.
          </Text>
        </Carte>
        <Carte style={{ paddingVertical: 6 }}>
          <Text style={[s.label, { marginTop: 10 }]}>Reçu</Text>
          <Ligne gauche="Membre" droite={membre.numero} />
          <Ligne gauche="Date" droite={dateFr(recu.date)} />
          <Ligne gauche="Période" droite={`${recu.mois} mois`} />
          <Ligne gauche="Paiement" droite={recu.mode} />
          <Ligne gauche="Référence" droite={recu.id.toUpperCase()} />
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <Tricolore largeur={60} />
          </View>
        </Carte>
        <Bouton titre="Terminer" onPress={() => router.replace('/tontine')} />
      </Ecran>
    );
  }

  const mois = parseInt(duree, 10);
  const montant = formule.cotisation * mois;

  return (
    <Ecran bords={['bottom']}>
      <View style={{ backgroundColor: C.bleu, borderRadius: 20, padding: 20, marginBottom: 18 }}>
        <Text style={{ color: C.bleuPale, fontWeight: '600' }}>Formule {formule.nom} · {membre.numero}</Text>
        <Text style={{ fontSize: 32, fontWeight: '900', color: C.blanc, marginTop: 4 }}>{fcfa(montant)}</Text>
        <Text style={{ color: C.blanc }}>
          {fcfa(formule.cotisation)} × {mois} mois
        </Text>
      </View>

      <Choix label="Je paie pour" options={DUREES} valeur={duree} onChange={setDuree} />
      <Choix label="Moyen de paiement" options={MODES_PAIEMENT} valeur={mode} onChange={setMode} />

      {mode ? (
        <Carte style={{ flexDirection: 'row', gap: 10, backgroundColor: C.bleuClair }}>
          <Ionicons name="information-circle" size={20} color={C.bleu} />
          <Text style={[s.petit, { flex: 1, color: C.texte }]}>
            {mode === 'Espèces (bureau Pamezi)'
              ? 'Réglez la somme au bureau de la mutuelle et conservez votre reçu.'
              : `Une demande de paiement sera envoyée au ${membre.telephone}. Validez-la avec votre code secret ${mode}.`}
          </Text>
        </Carte>
      ) : null}

      <Bouton titre={`Payer ${fcfa(montant)}`} icone="lock-closed" desactive={!mode} onPress={() => mode && setRecu(cotiser(mois, mode))} />
      <Text style={[s.petit, { marginTop: 10, textAlign: 'center' }]}>Version de démonstration : aucun montant n’est prélevé.</Text>
    </Ecran>
  );
}
