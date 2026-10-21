import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Chargement, EcranAdmin, Tuile } from '@/components/admin';
import { Alerte, Barres, Bouton, C, Carte, Champ, Ecran, Kpi, Logo, s, Section, Tricolore } from '@/components/ui';
import { useAdmin, useDonnees } from '@/lib/admin';
import { api } from '@/lib/api';
import { DEMO_ADMIN } from '@/lib/api-demo';
import { fcfa, nombre } from '@/lib/data';
import { messageErreur } from '@/lib/store';

export default function BackOffice() {
  const { pret, admin } = useAdmin();
  if (!pret) return <Chargement />;
  return admin ? <TableauDeBord /> : <ConnexionAdmin />;
}

function ConnexionAdmin() {
  const { connecter } = useAdmin();
  const demo = api.mode === 'demo';
  const [email, setEmail] = useState(demo ? DEMO_ADMIN.email : '');
  const [motDePasse, setMotDePasse] = useState(demo ? DEMO_ADMIN.motDePasse : '');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const valider = async () => {
    setEnvoi(true);
    setErreur(null);
    try {
      await connecter(email, motDePasse);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Ecran bords={['bottom']}>
      <View style={{ alignItems: 'center', gap: 10, marginVertical: 18 }}>
        <Logo taille={72} />
        <Text style={[s.titre, { textAlign: 'center' }]}>Espace gestionnaire</Text>
        <Tricolore largeur={64} />
        <Text style={[s.petit, { textAlign: 'center' }]}>Réservé au propriétaire et aux gestionnaires de la Mutuelle de Santé Pamezi.</Text>
      </View>
      <Carte>
        <Champ label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Champ label="Mot de passe" value={motDePasse} onChangeText={setMotDePasse} secureTextEntry autoComplete="password" />
        {demo ? <Alerte type="info" texte={`Démonstration : ${DEMO_ADMIN.email} / ${DEMO_ADMIN.motDePasse} (déjà rempli).`} /> : null}
        <Alerte texte={erreur} />
        <Bouton titre={envoi ? 'Connexion…' : 'Se connecter'} icone="log-in" onPress={valider} desactive={!email || !motDePasse || envoi} />
      </Carte>
      <Bouton titre="Retour à l’application" icone="arrow-back" variante="contour" onPress={() => router.replace('/')} />
    </Ecran>
  );
}

function TableauDeBord() {
  const { admin, deconnecter } = useAdmin();
  const { donnees: t, erreur, chargement } = useDonnees((j) => api.admin.tableau(j), []);
  const progression = t ? Math.min(1, t.membres / t.objectif.min) : 0;

  return (
    <EcranAdmin accueil chargement={chargement && !t} erreur={erreur}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Logo taille={48} />
        <View style={{ flex: 1, minWidth: 180 }}>
          <Text style={[s.h2, { marginBottom: 0 }]}>Bonjour {admin?.nom}</Text>
          <Text style={s.petit}>
            {admin?.role === 'proprietaire' ? 'Propriétaire' : 'Gestionnaire'} · {admin?.email}
          </Text>
        </View>
        <View style={{ minWidth: 150 }}>
          <Bouton titre="Déconnexion" icone="log-out" variante="contour" onPress={deconnecter} />
        </View>
      </View>
      {api.mode === 'demo' ? (
        <Alerte type="info" texte="Mode démonstration : membres fictifs, données gardées sur cet appareil. Branchez le serveur Pamezi pour les vraies données." />
      ) : null}

      {t ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
            <Kpi icone="people" valeur={nombre(t.membres)} libelle="Adhérents" detail={`${t.nouveauxCeMois} ce mois-ci`} />
            <Kpi icone="checkmark-done" valeur={nombre(t.aJour)} libelle="À jour de cotisation" detail={`sur ${nombre(t.actifs)} actifs`} couleur={C.vert} />
            <Kpi icone="wallet" valeur={nombre(t.encaisse)} unite="FCFA" libelle="Cotisations encaissées" />
            <Kpi icone="medkit" valeur={nombre(t.prisEnChargePaye)} unite="FCFA" libelle="Soins payés" detail={`${fcfa(t.prisEnChargeEngage)} validés à payer`} />
            <Kpi icone="cash" valeur={nombre(t.solde)} unite="FCFA" libelle="Solde de la caisse" couleur={t.solde >= 0 ? C.vert : C.rouge} />
          </View>

          <Section icone="grid">Gestion</Section>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
            <Tuile href="/admin/membres" icone="people" titre="Membres" detail="Fiches, statuts, espèces, codes secrets" />
            <Tuile href="/admin/cotisations" icone="wallet" titre="Cotisations" detail="Confirmer les paiements reçus" alerte={t.cotisationsEnAttente} />
            <Tuile href="/admin/demandes" icone="document-text" titre="Demandes de soins" detail="Valider, rejeter, payer" alerte={t.demandesEnCours} />
            <Tuile href="/admin/parametres" icone="settings" titre="Paramètres" detail="Formules, centres, gestionnaires" />
            <Tuile href="/admin/journal" icone="time" titre="Journal" detail="Qui a fait quoi, et quand" />
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <Carte style={{ flexGrow: 1, flexBasis: 300 }}>
              <Text style={s.h2}>Objectif : {nombre(t.objectif.min)} à {nombre(t.objectif.max)} adhérents</Text>
              <View style={{ height: 12, backgroundColor: C.bleuClair, borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
                <View style={{ width: `${progression * 100}%`, height: '100%', backgroundColor: C.bleu }} />
              </View>
              <Text style={s.petit}>
                {nombre(t.membres)} adhérents, soit {Math.round(progression * 100)} % du premier palier.
              </Text>
            </Carte>
            <Carte style={{ flexGrow: 1, flexBasis: 300 }}>
              <Text style={s.h2}>Encaissements des 6 derniers mois</Text>
              <Barres lignes={t.encaissementsParMois} format={fcfa} />
            </Carte>
            <Carte style={{ flexGrow: 1, flexBasis: 300 }}>
              <Text style={s.h2}>Adhérents par localité</Text>
              <Barres lignes={t.parLocalite} />
            </Carte>
            <Carte style={{ flexGrow: 1, flexBasis: 300 }}>
              <Text style={s.h2}>Adhérents par formule</Text>
              <Barres lignes={t.parFormule} />
            </Carte>
          </View>
        </>
      ) : null}
    </EcranAdmin>
  );
}
