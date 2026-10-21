// Formulaire d'inscription (guide des procédures, § 1 : N° d'inscription, nom, prénom,
// date et lieu de naissance, âge, numéro et photo de la CNI, téléphone).

import Ionicons from '@expo/vector-icons/Ionicons';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';

import { Alerte, Bouton, C, Carte, Champ, Choix, Degrade, Ecran, Ligne, Logo, s, Section, Tricolore } from '@/components/ui';
import { fcfa, LOCALITES } from '@/lib/data';
import { messageErreur, usePamezi } from '@/lib/store';
import {
  AGE_MINIMUM,
  calculerAge,
  formaterTelephone,
  lireDateNaissance,
  nomComplet,
  normaliserCni,
  telephoneValide,
  type TypeAdhesion,
} from '@shared/regles';

type Localite = (typeof LOCALITES)[number];
const TYPES = ['Individuelle', 'Via une association'] as const;

/** « 25071985 » → « 25/07/1985 » pendant la saisie. */
function masquerDate(v: string) {
  const c = v.replace(/\D/g, '').slice(0, 8);
  return [c.slice(0, 2), c.slice(2, 4), c.slice(4, 8)].filter(Boolean).join('/');
}

/** Réduit la photo (1200 px de large, JPEG) pour un envoi rapide même avec une connexion faible. */
async function preparerPhoto(asset: ImagePicker.ImagePickerAsset): Promise<string> {
  const contexte = ImageManipulator.manipulate(asset.uri);
  if (!asset.width || asset.width > 1200) contexte.resize({ width: 1200 });
  const image = await contexte.renderAsync();
  const resultat = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.6, base64: true });
  if (!resultat.base64) throw new Error('Image illisible');
  return `data:image/jpeg;base64,${resultat.base64}`;
}

export default function Adhesion() {
  const { adherer, membre, formules } = usePamezi();
  // 1. Identité
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [naissance, setNaissance] = useState('');
  const [lieuNaissance, setLieuNaissance] = useState('');
  // 2. Pièce d'identité
  const [cni, setCni] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [erreurPhoto, setErreurPhoto] = useState<string | null>(null);
  const [traitementPhoto, setTraitementPhoto] = useState(false);
  // 3. Contact et localité
  const [telephone, setTelephone] = useState('');
  const [localite, setLocalite] = useState<Localite | null>(null);
  const [village, setVillage] = useState('');
  // 4. Adhésion
  const [type, setType] = useState<TypeAdhesion>('Individuelle');
  const [association, setAssociation] = useState('');
  const [formule, setFormule] = useState<string>('famille');
  const [ayantsDroit, setAyantsDroit] = useState('0');
  // 5. Code secret et engagement
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [accepte, setAccepte] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [inscrit, setInscrit] = useState(false);

  const dateIso = naissance.length === 10 ? lireDateNaissance(naissance) : null;
  const age = dateIso ? calculerAge(dateIso, new Date()) : null;
  const ageValide = age !== null && age >= AGE_MINIMUM && age <= 120;
  const cniNorm = normaliserCni(cni);
  const tel = telephone.replace(/\D/g, '').replace(/^237/, '');
  const lieu = localite === 'Autre village du Noun' ? village.trim() : localite;

  const manquants = [
    nom.trim().length < 2 && 'nom',
    prenom.trim().length < 2 && 'prénom',
    !ageValide && 'date de naissance',
    lieuNaissance.trim().length < 2 && 'lieu de naissance',
    (cniNorm.length < 6 || cniNorm.length > 20) && 'numéro de CNI',
    !photo && 'photo de la CNI',
    !telephoneValide(tel) && 'téléphone',
    !lieu && 'localité',
    type === 'Via une association' && association.trim().length < 2 && 'association',
    !(/^\d{4}$/.test(pin) && pin === pin2) && 'code secret',
    !accepte && 'acceptation des statuts',
  ].filter(Boolean) as string[];

  const choisirPhoto = async (source: 'camera' | 'galerie') => {
    setErreurPhoto(null);
    try {
      if (source === 'camera' && Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setErreurPhoto('Autorisez l’appareil photo dans les réglages du téléphone, ou choisissez une image existante.');
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
      const resultat = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (resultat.canceled || !resultat.assets?.[0]) return;
      setTraitementPhoto(true);
      setPhoto(await preparerPhoto(resultat.assets[0]));
    } catch {
      setErreurPhoto('Impossible de lire cette image. Essayez une autre photo ou un scan.');
    } finally {
      setTraitementPhoto(false);
    }
  };

  const valider = async () => {
    setEnvoi(true);
    setErreur(null);
    try {
      await adherer({
        nom: nom.trim(),
        prenom: prenom.trim(),
        dateNaissance: naissance,
        lieuNaissance: lieuNaissance.trim(),
        cni: cniNorm,
        cniPhoto: photo!,
        telephone: tel,
        localite: lieu!,
        typeAdhesion: type,
        association: type === 'Via une association' ? association.trim() : undefined,
        formuleId: formule,
        ayantsDroit: Math.max(0, parseInt(ayantsDroit, 10) || 0),
        pin,
      });
      setInscrit(true);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnvoi(false);
    }
  };

  // Confirmation d'inscription, avec le N° attribué.
  if (inscrit && membre) {
    return (
      <Ecran bords={['bottom']}>
        <Degrade style={{ borderRadius: 22, padding: 22, alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Ionicons name="checkmark-circle" size={56} color={C.blanc} />
          <Text style={{ color: C.blanc, fontSize: 22, fontWeight: '900', textAlign: 'center' }}>Inscription enregistrée</Text>
          <Text style={{ color: C.bleuPale, fontSize: 13, fontWeight: '700', letterSpacing: 1.5 }}>N° D’INSCRIPTION</Text>
          <Text style={{ color: C.jaune, fontSize: 26, fontWeight: '900', letterSpacing: 2 }}>{membre.numero}</Text>
          <Tricolore largeur={80} />
        </Degrade>
        <Carte style={{ paddingVertical: 6 }}>
          <Ligne gauche="Nom et prénom" droite={nomComplet(membre)} />
          <Ligne gauche="Téléphone" droite={formaterTelephone(membre.telephone)} />
          <Ligne gauche="Formule" droite={formules.find((f) => f.id === membre.formuleId)?.nom ?? membre.formuleId} />
        </Carte>
        <Text style={[s.texte, { marginBottom: 6 }]}>
          Notez votre N° d’inscription. Votre carte de membre est prête dans l’onglet « Ma carte ». Réglez votre première cotisation pour être pris en charge.
        </Text>
        <Bouton titre="Payer ma première cotisation" icone="wallet" onPress={() => router.replace('/cotiser')} />
        <Bouton titre="Voir ma carte de membre" icone="card" variante="contour" onPress={() => router.replace('/profil')} />
      </Ecran>
    );
  }

  if (membre) {
    return (
      <Ecran bords={['bottom']}>
        <Carte style={{ alignItems: 'center' }}>
          <Ionicons name="checkmark-circle" size={56} color={C.vert} />
          <Text style={[s.h2, { marginTop: 8 }]}>Vous êtes déjà membre</Text>
          <Text style={s.texte}>N° d’inscription : {membre.numero}</Text>
        </Carte>
        <Bouton titre="Voir ma carte" icone="card" onPress={() => router.replace('/profil')} />
      </Ecran>
    );
  }

  return (
    <Ecran bords={['bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Logo taille={44} />
        <View style={{ flex: 1 }}>
          <Text style={[s.h2, { marginBottom: 0 }]}>Formulaire d’inscription</Text>
          <Text style={s.petit}>Mutuelle de Santé Pamezi · environ 3 minutes</Text>
        </View>
      </View>
      <Text style={[s.petit, { marginBottom: 4 }]}>
        L’adhésion est libre, comme la démission. Elle peut être individuelle ou se faire via une association. Votre N° d’inscription est attribué à la validation.
      </Text>
      <Link href="/connexion" replace style={[s.texte, { color: C.bleu, fontWeight: '700', marginBottom: 4 }]}>
        Déjà membre ? Se connecter
      </Link>

      {/* 1. Identité */}
      <Section icone="person">1. Identité</Section>
      <Carte>
        <Champ label="Nom" value={nom} onChangeText={setNom} placeholder="Ex. : NJOYA" autoCapitalize="characters" autoComplete="family-name" />
        <Champ label="Prénom" value={prenom} onChangeText={setPrenom} placeholder="Ex. : Aïcha" autoCapitalize="words" autoComplete="given-name" />
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Champ
              label="Date de naissance"
              value={naissance}
              onChangeText={(v) => setNaissance(masquerDate(v))}
              placeholder="JJ/MM/AAAA"
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>
          <View style={{ width: 96 }}>
            <Text style={s.label}>Âge</Text>
            <View style={[s.input, { backgroundColor: C.bleuClair, borderColor: C.bleuClair }]}>
              <Text style={[s.texte, { fontWeight: '800', color: C.bleuFonce }]}>{age !== null && age >= 0 ? `${age} ans` : '—'}</Text>
            </View>
          </View>
        </View>
        {naissance.length === 10 && !dateIso ? <Alerte texte="Cette date n’existe pas. Vérifiez le jour et le mois." /> : null}
        {age !== null && age >= 0 && age < AGE_MINIMUM ? (
          <Alerte texte={`L’adhérent doit avoir au moins ${AGE_MINIMUM} ans. Les enfants sont inscrits comme ayants droit d’un parent.`} />
        ) : null}
        <Champ label="Lieu de naissance" value={lieuNaissance} onChangeText={setLieuNaissance} placeholder="Ex. : Foumban" autoCapitalize="words" />
      </Carte>

      {/* 2. Pièce d'identité */}
      <Section icone="id-card">2. Carte nationale d’identité</Section>
      <Carte>
        <Champ label="Numéro de CNI" value={cni} onChangeText={setCni} placeholder="Ex. : 123456789" autoCapitalize="characters" maxLength={24} />
        <Text style={s.label}>Photo ou scan de la CNI</Text>
        {photo ? (
          <View style={{ gap: 10 }}>
            <Image
              source={{ uri: photo }}
              accessibilityLabel="Aperçu de la carte d’identité"
              style={{ width: '100%', aspectRatio: 1.6, borderRadius: 12, backgroundColor: C.bleuClair }}
              resizeMode="contain"
            />
            <Alerte type="succes" texte="Photo ajoutée. Vérifiez que le nom et le numéro sont lisibles." />
          </View>
        ) : (
          <View style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.bleuPale, borderRadius: 12, padding: 16, alignItems: 'center', gap: 6 }}>
            <Ionicons name="camera" size={30} color={C.bleu} />
            <Text style={[s.petit, { textAlign: 'center' }]}>Photographiez le recto de votre CNI à plat, bien éclairée, ou choisissez un scan.</Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <View style={{ flexGrow: 1, flexBasis: 140 }}>
            <Bouton titre={photo ? 'Reprendre' : 'Prendre une photo'} icone="camera" onPress={() => choisirPhoto('camera')} desactive={traitementPhoto} />
          </View>
          <View style={{ flexGrow: 1, flexBasis: 140 }}>
            <Bouton titre="Choisir une image" icone="images" variante="contour" onPress={() => choisirPhoto('galerie')} desactive={traitementPhoto} />
          </View>
        </View>
        {traitementPhoto ? <Alerte type="info" texte="Préparation de la photo…" /> : null}
        <Alerte texte={erreurPhoto} />
      </Carte>

      {/* 3. Contact et localité */}
      <Section icone="call">3. Contact et localité</Section>
      <Carte>
        <Champ
          label="Téléphone"
          value={telephone}
          onChangeText={setTelephone}
          placeholder="6XX XX XX XX"
          keyboardType="phone-pad"
          autoComplete="tel"
          maxLength={16}
          aide="Numéro utilisé pour vous connecter et payer par Mobile Money."
        />
        {telephone.length > 0 && !telephoneValide(tel) ? <Alerte texte="Numéro camerounais à 9 chiffres commençant par 6." /> : null}
        <Choix label="Ville ou arrondissement" options={LOCALITES} valeur={localite} onChange={setLocalite} />
        {localite === 'Autre village du Noun' ? <Champ label="Nom du village" value={village} onChangeText={setVillage} placeholder="Ex. : Mayap" /> : null}
      </Carte>

      {/* 4. Adhésion */}
      <Section icone="pricetags">4. Adhésion et formule</Section>
      <Carte>
        <Choix label="Type d’adhésion" options={TYPES} valeur={type} onChange={setType} />
        {type === 'Via une association' ? (
          <Champ label="Nom de l’association" value={association} onChangeText={setAssociation} placeholder="Ex. : Association des femmes de Njimom" />
        ) : null}
        <Text style={s.label}>Formule</Text>
        <View style={{ gap: 8, marginBottom: 16 }}>
          {formules.map((f) => {
            const actif = f.id === formule;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFormule(f.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: actif }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderColor: actif ? C.bleu : C.bord, backgroundColor: actif ? C.bleuClair : C.blanc, borderRadius: 14, padding: 14 }}>
                <Ionicons name={actif ? 'radio-button-on' : 'radio-button-off'} size={22} color={actif ? C.bleu : C.gris} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.texte, { fontWeight: '800' }]}>{f.nom}</Text>
                  <Text style={s.petit}>{`${f.personnes} · ${f.taux} % pris en charge`}</Text>
                </View>
                <Text style={{ fontWeight: '900', color: C.bleu }}>{fcfa(f.cotisation)}</Text>
              </Pressable>
            );
          })}
        </View>
        <Champ
          label="Nombre d’ayants droit (conjoint, enfants…)"
          value={ayantsDroit}
          onChangeText={(v) => setAyantsDroit(v.replace(/\D/g, ''))}
          keyboardType="number-pad"
          maxLength={2}
          aide="Les personnes à votre charge couvertes par votre cotisation."
        />
      </Carte>

      {/* 5. Code secret */}
      <Section icone="lock-closed">5. Code secret</Section>
      <Carte>
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
      </Carte>

      {/* 6. Engagement et validation */}
      <Section icone="checkmark-done">6. Validation</Section>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepte }}
        onPress={() => setAccepte(!accepte)}
        style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 8, minHeight: 44 }}>
        <Ionicons name={accepte ? 'checkbox' : 'square-outline'} size={22} color={accepte ? C.bleu : C.gris} />
        <Text style={[s.petit, { flex: 1, color: C.texte }]}>
          Je certifie l’exactitude de ces informations, j’accepte les statuts de la Mutuelle de Santé Pamezi et je m’engage à cotiser chaque mois.
        </Text>
      </Pressable>

      {manquants.length ? <Alerte type="info" texte={`À compléter : ${manquants.join(', ')}.`} /> : null}
      <Alerte texte={erreur} />
      <Bouton titre={envoi ? 'Envoi en cours…' : 'Valider mon inscription'} icone="checkmark-circle" onPress={valider} desactive={manquants.length > 0 || envoi} />
      <Text style={[s.petit, { marginTop: 10, textAlign: 'center' }]}>
        Vos informations et la photo de votre CNI ne sont visibles que par le bureau de la mutuelle.
      </Text>
    </Ecran>
  );
}
