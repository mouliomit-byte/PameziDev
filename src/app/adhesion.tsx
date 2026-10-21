import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Alerte, Bouton, C, Carte, Champ, Choix, Ecran, s, Section } from '@/components/ui';
import { fcfa, LOCALITES } from '@/lib/data';
import { messageErreur, usePamezi } from '@/lib/store';
import type { TypeAdhesion } from '@shared/regles';

type Localite = (typeof LOCALITES)[number];
const TYPES = ['Individuelle', 'Via une association'] as const;

export default function Adhesion() {
  const { adherer, membre, formules } = usePamezi();
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [localite, setLocalite] = useState<Localite | null>(null);
  const [village, setVillage] = useState('');
  const [type, setType] = useState<TypeAdhesion>('Individuelle');
  const [association, setAssociation] = useState('');
  const [formule, setFormule] = useState<string>('famille');
  const [ayantsDroit, setAyantsDroit] = useState('0');
  const [accepte, setAccepte] = useState(false);
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const tel = telephone.replace(/\D/g, '').replace(/^237/, '');
  const telValide = /^6\d{8}$/.test(tel);
  const lieu = localite === 'Autre village du Noun' ? village.trim() : localite;
  const assoValide = type === 'Individuelle' || association.trim().length >= 2;
  const pinValide = /^\d{4}$/.test(pin) && pin === pin2;
  const valide = nom.trim().length >= 3 && telValide && !!lieu && assoValide && pinValide && accepte && !envoi;

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

  const valider = async () => {
    setEnvoi(true);
    setErreur(null);
    try {
      await adherer({
        nom: nom.trim(),
        telephone: tel,
        localite: lieu!,
        typeAdhesion: type,
        association: type === 'Via une association' ? association.trim() : undefined,
        formuleId: formule,
        ayantsDroit: Math.max(0, parseInt(ayantsDroit, 10) || 0),
        pin,
      });
      router.replace('/cotiser');
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Ecran bords={['bottom']}>
      <Text style={[s.petit, { marginBottom: 6 }]}>
        L’adhésion est libre, comme la démission. Elle peut être individuelle ou se faire via une association.
      </Text>
      <Link href="/connexion" replace style={[s.texte, { color: C.bleu, fontWeight: '700', marginBottom: 6 }]}>
        Déjà membre ? Se connecter
      </Link>

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
      {formules.map((f) => {
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

      <Section icone="lock-closed">Votre code secret</Section>
      <Text style={[s.petit, { marginBottom: 10 }]}>4 chiffres, pour vous connecter à votre compte sur un autre téléphone. Ne le donnez à personne.</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Champ label="Code secret" value={pin} onChangeText={(v) => setPin(v.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={4} secureTextEntry placeholder="••••" />
        </View>
        <View style={{ flex: 1 }}>
          <Champ label="Confirmer le code" value={pin2} onChangeText={(v) => setPin2(v.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={4} secureTextEntry placeholder="••••" />
        </View>
      </View>
      {pin2.length === 4 && pin !== pin2 ? <Alerte texte="Les deux codes ne sont pas identiques." /> : null}

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

      <Alerte texte={erreur} />
      <Bouton titre={envoi ? 'Envoi en cours…' : 'Valider mon adhésion'} icone="checkmark-circle" onPress={valider} desactive={!valide} />
      <Text style={[s.petit, { marginTop: 10, textAlign: 'center' }]}>Vous réglerez votre première cotisation à l’étape suivante.</Text>
    </Ecran>
  );
}
