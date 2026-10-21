import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Bouton, C, Carte, Champ, Choix, Ecran, s, Section } from '@/components/ui';
import { fcfa, FORMULES, FormuleId, LOCALITES } from '@/lib/data';
import { Membre, usePamezi } from '@/lib/store';

type Localite = (typeof LOCALITES)[number];
const TYPES = ['Individuelle', 'Via une association'] as const;

export default function Adhesion() {
  const { adherer, membre } = usePamezi();
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [localite, setLocalite] = useState<Localite | null>(null);
  const [village, setVillage] = useState('');
  const [type, setType] = useState<Membre['typeAdhesion']>('Individuelle');
  const [association, setAssociation] = useState('');
  const [formule, setFormule] = useState<FormuleId>('famille');
  const [ayantsDroit, setAyantsDroit] = useState('0');
  const [accepte, setAccepte] = useState(false);

  const tel = telephone.replace(/\D/g, '').replace(/^237/, '');
  const telValide = /^6\d{8}$/.test(tel);
  const lieu = localite === 'Autre village du Noun' ? village.trim() : localite;
  const assoValide = type === 'Individuelle' || association.trim().length >= 2;
  const valide = nom.trim().length >= 3 && telValide && !!lieu && assoValide && accepte;

  if (membre) {
    return (
      <Ecran bords={['bottom']}>
        <Carte style={{ alignItems: 'center' }}>
          <Ionicons name="checkmark-circle" size={56} color={C.vert} />
          <Text style={[s.h2, { marginTop: 8 }]}>Vous êtes déjà membre</Text>
          <Text style={s.texte}>Numéro : {membre.numero}</Text>
        </Carte>
        <Bouton titre="Voir ma carte" icone="card" onPress={() => router.replace('/profil')} />
      </Ecran>
    );
  }

  const valider = () => {
    adherer({
      nom: nom.trim(),
      telephone: `+237 ${tel.replace(/(\d)(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')}`,
      localite: lieu!,
      typeAdhesion: type,
      association: type === 'Via une association' ? association.trim() : undefined,
      formule,
      ayantsDroit: Math.max(0, parseInt(ayantsDroit, 10) || 0),
    });
    router.replace('/cotiser');
  };

  return (
    <Ecran bords={['bottom']}>
      <Text style={[s.petit, { marginBottom: 6 }]}>
        L’adhésion est libre, comme la démission. Elle peut être individuelle ou se faire via une association.
      </Text>

      <Section icone="person">Vos informations</Section>
      <Champ label="Nom et prénom" value={nom} onChangeText={setNom} placeholder="Ex. : Njoya Aïcha" autoCapitalize="words" />
      <Champ
        label="Téléphone"
        value={telephone}
        onChangeText={setTelephone}
        placeholder="6XX XX XX XX"
        keyboardType="phone-pad"
        maxLength={16}
        aide={telephone.length > 0 && !telValide ? undefined : 'Numéro utilisé pour le paiement Mobile Money.'}
      />
      {telephone.length > 0 && !telValide ? (
        <Text style={[s.petit, { color: C.rouge, marginTop: -10, marginBottom: 14 }]}>Numéro camerounais à 9 chiffres commençant par 6.</Text>
      ) : null}

      <Choix label="Ville ou arrondissement" options={LOCALITES} valeur={localite} onChange={setLocalite} />
      {localite === 'Autre village du Noun' ? (
        <Champ label="Nom du village" value={village} onChangeText={setVillage} placeholder="Ex. : Mayap" />
      ) : null}

      <Choix label="Type d’adhésion" options={TYPES} valeur={type} onChange={setType} />
      {type === 'Via une association' ? (
        <Champ label="Nom de l’association" value={association} onChangeText={setAssociation} placeholder="Ex. : Association des femmes de Njimom" />
      ) : null}

      <Section icone="pricetags">Votre formule</Section>
      {FORMULES.map((f) => {
        const actif = f.id === formule;
        return (
          <Pressable key={f.id} onPress={() => setFormule(f.id)} accessibilityRole="radio" accessibilityState={{ selected: actif }}>
            <Carte style={{ borderWidth: 2, borderColor: actif ? C.bleu : 'transparent', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name={actif ? 'radio-button-on' : 'radio-button-off'} size={22} color={actif ? C.bleu : C.gris} />
              <View style={{ flex: 1 }}>
                <Text style={[s.texte, { fontWeight: '800' }]}>{f.nom}</Text>
                <Text style={s.petit}>
                  {f.personnes} · {f.taux} % pris en charge
                </Text>
              </View>
              <Text style={{ fontWeight: '900', color: C.bleu }}>{fcfa(f.cotisation)}</Text>
            </Carte>
          </Pressable>
        );
      })}

      <Champ
        label="Nombre d’ayants droit (conjoint, enfants…)"
        value={ayantsDroit}
        onChangeText={setAyantsDroit}
        keyboardType="number-pad"
        maxLength={2}
        aide="Les personnes à votre charge couvertes par votre cotisation."
      />

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepte }}
        onPress={() => setAccepte(!accepte)}
        style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
        <Ionicons name={accepte ? 'checkbox' : 'square-outline'} size={22} color={accepte ? C.bleu : C.gris} />
        <Text style={[s.petit, { flex: 1, color: C.texte }]}>
          J’accepte les statuts de la Mutuelle de Santé Pamezi et je m’engage à cotiser chaque mois.
        </Text>
      </Pressable>

      <Bouton titre="Valider mon adhésion" icone="checkmark-circle" onPress={valider} desactive={!valide} />
      <Text style={[s.petit, { marginTop: 10, textAlign: 'center' }]}>Vous réglerez votre première cotisation à l’étape suivante.</Text>
    </Ecran>
  );
}
