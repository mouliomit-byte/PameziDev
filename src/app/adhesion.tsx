import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Bouton, C, Carte, Champ, Choix, Ecran, s } from '@/components/ui';
import { fcfa, FORMULES, FormuleId, LOCALITES, SOLIDARITE } from '@/lib/data';
import { usePamezi } from '@/lib/store';

type Localite = (typeof LOCALITES)[number];

export default function Adhesion() {
  const { adherer, membre } = usePamezi();
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [localite, setLocalite] = useState<Localite | null>(null);
  const [village, setVillage] = useState('');
  const [formule, setFormule] = useState<FormuleId>('famille');
  const [beneficiaires, setBeneficiaires] = useState('1');

  const tel = telephone.replace(/\D/g, '');
  const telValide = /^6\d{8}$/.test(tel);
  const lieu = localite === 'Autre village du Noun' ? village.trim() : localite;
  const valide = nom.trim().length >= 3 && telValide && !!lieu;

  if (membre) {
    return (
      <Ecran bords={['bottom']}>
        <Carte>
          <Text style={s.h2}>Vous êtes déjà membre 🎉</Text>
          <Text style={s.texte}>Numéro : {membre.numero}</Text>
          <Bouton titre="Voir ma carte" icone="card" onPress={() => router.replace('/profil')} />
        </Carte>
      </Ecran>
    );
  }

  const valider = () => {
    adherer({
      nom: nom.trim(),
      telephone: `+237 ${tel.replace(/(\d)(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')}`,
      localite: lieu!,
      formule,
      beneficiaires: Math.max(1, parseInt(beneficiaires, 10) || 1),
    });
    router.replace('/cotiser');
  };

  return (
    <Ecran bords={['bottom']}>
      <Text style={[s.texte, { marginBottom: 16 }]}>{SOLIDARITE} Remplissez ce formulaire pour rejoindre la tontine santé.</Text>

      <Champ label="Nom et prénom" value={nom} onChangeText={setNom} placeholder="Ex. : Njoya Aïcha" autoCapitalize="words" />
      <Champ
        label="Téléphone (Mobile Money)"
        value={telephone}
        onChangeText={setTelephone}
        placeholder="6XX XX XX XX"
        keyboardType="phone-pad"
        maxLength={13}
      />
      {telephone.length > 0 && !telValide ? (
        <Text style={[s.petit, { color: C.rouge, marginTop: -8, marginBottom: 12 }]}>Numéro camerounais à 9 chiffres commençant par 6.</Text>
      ) : null}

      <Choix label="Ville ou arrondissement" options={LOCALITES} valeur={localite} onChange={setLocalite} />
      {localite === 'Autre village du Noun' ? (
        <Champ label="Nom du village" value={village} onChangeText={setVillage} placeholder="Ex. : Mayap" />
      ) : null}

      <Text style={s.label}>Formule</Text>
      {FORMULES.map((f) => {
        const actif = f.id === formule;
        return (
          <Pressable key={f.id} onPress={() => setFormule(f.id)} accessibilityRole="radio" accessibilityState={{ selected: actif }}>
            <Carte style={{ borderColor: actif ? C.vert : C.bord, borderWidth: actif ? 2 : 1, backgroundColor: actif ? C.vertClair : C.blanc }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[s.texte, { fontWeight: '800' }]}>{f.nom}</Text>
                <Text style={{ fontWeight: '800', color: C.vert }}>{fcfa(f.cotisation)}/mois</Text>
              </View>
              <Text style={s.petit}>
                {f.personnes} · {f.taux}% pris en charge
              </Text>
            </Carte>
          </Pressable>
        );
      })}

      <Champ
        label="Nombre de bénéficiaires (vous compris)"
        value={beneficiaires}
        onChangeText={setBeneficiaires}
        keyboardType="number-pad"
        maxLength={2}
      />

      <Bouton titre="Valider mon adhésion" icone="checkmark-circle" onPress={valider} desactive={!valide} />
      <Text style={[s.petit, { marginTop: 10, textAlign: 'center' }]}>Vous paierez votre première cotisation à l’étape suivante.</Text>
    </Ecran>
  );
}
