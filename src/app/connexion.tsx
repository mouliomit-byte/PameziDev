import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { Alerte, Bouton, C, Champ, Ecran, s } from '@/components/ui';
import { messageErreur, usePamezi } from '@/lib/store';

export default function Connexion() {
  const { connecter, modeDemo } = usePamezi();
  const [telephone, setTelephone] = useState('');
  const [pin, setPin] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const valide = telephone.replace(/\D/g, '').length >= 9 && /^\d{4}$/.test(pin) && !envoi;

  const valider = async () => {
    setEnvoi(true);
    setErreur(null);
    try {
      await connecter(telephone, pin);
      router.replace('/profil');
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Ecran bords={['bottom']}>
      <Text style={[s.texte, { marginBottom: 16 }]}>Retrouvez votre carte de membre, vos cotisations et vos demandes de soins.</Text>
      <Champ label="Téléphone" value={telephone} onChangeText={setTelephone} placeholder="6XX XX XX XX" keyboardType="phone-pad" maxLength={16} />
      <Champ
        label="Code secret"
        value={pin}
        onChangeText={(v) => setPin(v.replace(/\D/g, ''))}
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry
        placeholder="••••"
        aide="Code oublié ? Le bureau de la mutuelle peut vous en donner un nouveau."
      />
      {modeDemo ? <Alerte type="info" texte="Démonstration : les membres d’exemple se connectent avec le code 1234 (ex. 670 00 01 01)." /> : null}
      <Alerte texte={erreur} />
      <Bouton titre={envoi ? 'Connexion…' : 'Se connecter'} icone="log-in" onPress={valider} desactive={!valide} />
      <Link href="/adhesion" replace style={[s.texte, { color: C.bleu, fontWeight: '700', textAlign: 'center', marginTop: 18 }]}>
        Pas encore membre ? Adhérer
      </Link>
    </Ecran>
  );
}
