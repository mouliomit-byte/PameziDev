import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Alerte, Bouton, C, Carte, Choix, Degrade, Ecran, Ligne, s, Tricolore, Vide } from '@/components/ui';
import { dateFr, fcfa } from '@/lib/data';
import { messageErreur, usePamezi } from '@/lib/store';
import { type Cotisation, formaterTelephone, MODES_PAIEMENT, type ModePaiement } from '@shared/regles';

const DUREES = ['1 mois', '3 mois', '6 mois', '12 mois'] as const;

export default function Cotiser() {
  const { membre, formule, cotiser } = usePamezi();
  const [duree, setDuree] = useState<(typeof DUREES)[number]>('1 mois');
  const [mode, setMode] = useState<ModePaiement | null>(null);
  const [recu, setRecu] = useState<Cotisation | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

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
          <View style={{ backgroundColor: C.vertClair, width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark" size={44} color={C.vert} />
          </View>
          <Text style={[s.h2, { marginTop: 12, marginBottom: 4 }]}>{recu.statut === 'confirmee' ? 'Cotisation enregistrée' : 'Cotisation à régler au bureau'}</Text>
          <Text style={{ fontSize: 28, fontWeight: '900', color: C.accent }}>{fcfa(recu.montant)}</Text>
          <Text style={[s.petit, { textAlign: 'center', marginTop: 6 }]}>
            {recu.statut === 'confirmee'
              ? `Merci ${membre.prenom || membre.nom} : votre cotisation renforce la tontine pour la santé.`
              : 'Elle sera confirmée par la mutuelle dès réception des espèces. Présentez cette référence au bureau.'}
          </Text>
        </Carte>
        <Carte style={{ paddingVertical: 6 }}>
          <Text style={[s.label, { marginTop: 10 }]}>Reçu</Text>
          <Ligne gauche="Membre" droite={membre.numero} />
          <Ligne gauche="Date" droite={dateFr(recu.date)} />
          <Ligne gauche="Période" droite={`${recu.mois} mois`} />
          <Ligne gauche="Paiement" droite={recu.mode} />
          <Ligne gauche="Référence" droite={recu.reference} />
          <Ligne gauche="Statut" droite={recu.statut === 'confirmee' ? 'Confirmée' : 'En attente de confirmation'} />
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
      <Degrade style={{ borderRadius: 20, padding: 20, marginBottom: 18 }}>
        <Text style={{ color: C.bleuPale, fontWeight: '600' }}>Formule {formule.nom} · {membre.numero}</Text>
        <Text style={{ fontSize: 32, fontWeight: '900', color: C.blanc, marginTop: 4 }}>{fcfa(montant)}</Text>
        <Text style={{ color: C.blanc }}>
          {fcfa(formule.cotisation)} × {mois} mois
        </Text>
      </Degrade>

      <Choix label="Je paie pour" options={DUREES} valeur={duree} onChange={setDuree} />
      <Choix label="Moyen de paiement" options={MODES_PAIEMENT} valeur={mode} onChange={setMode} />

      {mode ? (
        <Carte style={{ flexDirection: 'row', gap: 10, backgroundColor: C.bleuClair }}>
          <Ionicons name="information-circle" size={20} color={C.accent} />
          <Text style={[s.petit, { flex: 1, color: C.texte }]}>
            {mode === 'Espèces (bureau Pamezi)'
              ? 'Réglez la somme au bureau de la mutuelle et conservez votre reçu.'
              : `Une demande de paiement sera envoyée au ${formaterTelephone(membre.telephone)}. Validez-la avec votre code secret ${mode}.`}
          </Text>
        </Carte>
      ) : null}

      <Alerte texte={erreur} />
      <Bouton
        titre={envoi ? 'Paiement en cours…' : `Payer ${fcfa(montant)}`}
        icone="lock-closed"
        desactive={!mode || envoi}
        onPress={async () => {
          if (!mode) return;
          setEnvoi(true);
          setErreur(null);
          try {
            setRecu(await cotiser(mois, mode));
          } catch (e) {
            setErreur(messageErreur(e));
          } finally {
            setEnvoi(false);
          }
        }}
      />
      <Text style={[s.petit, { marginTop: 10, textAlign: 'center' }]}>
        Paiement Mobile Money simulé pour l’instant : aucun montant n’est prélevé.
      </Text>
    </Ecran>
  );
}
