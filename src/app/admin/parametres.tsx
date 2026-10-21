import { useState } from 'react';
import { Text, View } from 'react-native';

import { EcranAdmin } from '@/components/admin';
import { ChoixAffichage, ChoixCouleur } from '@/components/affichage';
import { Action, Alerte, Badge, Bouton, C, Carte, Champ, Choix, s, Section } from '@/components/ui';
import { useAdmin, useDonnees } from '@/lib/admin';
import { api } from '@/lib/api';
import { dateFr, fcfa } from '@/lib/data';
import { messageErreur } from '@/lib/store';
import { useAffichage } from '@/lib/theme';
import { type Centre, type CouleurApp, type Formule, LIBELLE_COULEUR } from '@shared/regles';

type Message = { texte: string; type: 'erreur' | 'succes' } | null;

export default function Parametres() {
  const { admin, avecJeton } = useAdmin();
  const proprio = admin?.role === 'proprietaire';
  const formules = useDonnees((j) => api.admin.formules(j), []);
  const centres = useDonnees((j) => api.admin.centres(j), []);
  const gestionnaires = useDonnees((j) => api.admin.gestionnaires(j), []);
  const [message, setMessage] = useState<Message>(null);
  const { couleur, definirCouleur } = useAffichage();
  const [enregistrement, setEnregistrement] = useState(false);

  const changerCouleur = async (c: CouleurApp) => {
    if (c === couleur) return;
    setMessage(null);
    setEnregistrement(true);
    try {
      const r = await avecJeton((j) => api.admin.enregistrerReglages(j, { couleur: c }));
      definirCouleur(r.couleur); // l'écran est redessiné aux nouvelles couleurs
    } catch (e) {
      setMessage({ texte: messageErreur(e), type: 'erreur' });
    } finally {
      setEnregistrement(false);
    }
  };

  /** Exécute une action, affiche le résultat et recharge la section concernée. */
  const agir = async (f: (j: string) => Promise<unknown>, succes: string, recharger: () => Promise<void>) => {
    setMessage(null);
    try {
      await avecJeton(f);
      setMessage({ texte: succes, type: 'succes' });
      await recharger();
      return true;
    } catch (e) {
      setMessage({ texte: messageErreur(e), type: 'erreur' });
      return false;
    }
  };

  return (
    <EcranAdmin erreur={formules.erreur ?? centres.erreur ?? gestionnaires.erreur}>
      {message ? <Alerte texte={message.texte} type={message.type} /> : null}

      <Section icone="color-palette">Apparence</Section>
      <Carte>
        <ChoixAffichage />
        <Text style={s.label}>Couleur de l’application</Text>
        <Text style={[s.petit, { marginBottom: 12 }]}>
          Couleur actuelle : {LIBELLE_COULEUR[couleur]}. Elle s’applique au back office et à l’application des abonnés (à leur prochaine ouverture).
        </Text>
        {!proprio ? <Alerte type="info" texte="Seul le propriétaire peut changer la couleur de l’application." /> : null}
        <ChoixCouleur valeur={couleur} onChange={changerCouleur} desactive={!proprio || enregistrement} />
      </Carte>

      <Section icone="pricetags">Formules et cotisations</Section>
      {!proprio ? <Alerte type="info" texte="Seul le propriétaire peut modifier les formules." /> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {formules.donnees?.map((f) => (
          <FicheFormule
            key={f.id}
            formule={f}
            modifiable={proprio}
            onEnregistrer={(v) => agir((j) => api.admin.enregistrerFormule(j, { ...v, id: f.id }), `Formule ${v.nom ?? f.nom} enregistrée.`, formules.recharger)}
          />
        ))}
        {proprio ? (
          <FicheFormule
            modifiable
            onEnregistrer={(v) => agir((j) => api.admin.enregistrerFormule(j, v), `Formule ${v.nom} créée.`, formules.recharger)}
          />
        ) : null}
      </View>

      <Section icone="business">Centres de soins</Section>
      <Carte style={{ paddingVertical: 6 }}>
        {centres.donnees?.map((c) => (
          <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.bord, flexWrap: 'wrap' }}>
            <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 200 }}>
              <Text style={[s.texte, { fontWeight: '800' }]}>{c.nom}</Text>
              <Text style={s.petit}>{c.services.length ? c.services.join(' · ') : 'Services à préciser'}</Text>
            </View>
            <Badge texte={c.statut} couleur={c.conventionne ? C.vert : C.gris} />
            <Action
              titre={c.conventionne ? 'Retirer la convention' : 'Convention signée'}
              couleur={c.conventionne ? C.orange : C.vert}
              onPress={() =>
                agir((j) => api.admin.enregistrerCentre(j, { id: c.id, conventionne: !c.conventionne }), `${c.nom} mis à jour.`, centres.recharger)
              }
            />
            {proprio ? <Action titre="Supprimer" couleur={C.rouge} onPress={() => agir((j) => api.admin.supprimerCentre(j, c.id), `${c.nom} supprimé.`, centres.recharger)} /> : null}
          </View>
        ))}
        <NouveauCentre onAjouter={(c) => agir((j) => api.admin.enregistrerCentre(j, c), `${c.nom} ajouté.`, centres.recharger)} />
      </Carte>

      <Section icone="key">Comptes du back office</Section>
      <Carte style={{ paddingVertical: 6 }}>
        {gestionnaires.donnees?.map((g) => (
          <View key={g.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.bord, flexWrap: 'wrap' }}>
            <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 200 }}>
              <Text style={[s.texte, { fontWeight: '800' }]}>{g.nom}</Text>
              <Text style={s.petit}>
                {g.email} · créé le {dateFr(g.creeLe)}
              </Text>
            </View>
            <Badge texte={g.role === 'proprietaire' ? 'Propriétaire' : 'Gestionnaire'} couleur={g.role === 'proprietaire' ? C.accent : C.gris} />
            {!g.actif ? <Badge texte="Désactivé" couleur={C.rouge} /> : null}
            {proprio && g.id !== admin?.id ? (
              <Action
                titre={g.actif ? 'Désactiver' : 'Réactiver'}
                couleur={g.actif ? C.rouge : C.vert}
                onPress={() => agir((j) => api.admin.activerGestionnaire(j, g.id, !g.actif), `${g.nom} ${g.actif ? 'désactivé' : 'réactivé'}.`, gestionnaires.recharger)}
              />
            ) : null}
          </View>
        ))}
        {proprio ? (
          <NouveauGestionnaire onCreer={(d) => agir((j) => api.admin.creerGestionnaire(j, d), `Compte de ${d.nom} créé.`, gestionnaires.recharger)} />
        ) : (
          <Text style={[s.petit, { paddingVertical: 10 }]}>Seul le propriétaire peut créer des comptes.</Text>
        )}
      </Carte>
    </EcranAdmin>
  );
}

function FicheFormule({ formule, modifiable, onEnregistrer }: { formule?: Formule; modifiable: boolean; onEnregistrer: (v: Partial<Formule>) => Promise<boolean> }) {
  const [nom, setNom] = useState(formule?.nom ?? '');
  const [cotisation, setCotisation] = useState(String(formule?.cotisation ?? ''));
  const [taux, setTaux] = useState(String(formule?.taux ?? ''));
  const [plafond, setPlafond] = useState(String(formule?.plafond ?? ''));
  const [personnes, setPersonnes] = useState(formule?.personnes ?? '');
  const [garanties, setGaranties] = useState((formule?.garanties ?? []).join(', '));
  const [actif, setActif] = useState(formule?.actif ?? true);
  const nombre = (v: string) => parseInt(v.replace(/\D/g, ''), 10) || 0;

  if (!modifiable && formule) {
    return (
      <Carte style={{ flexGrow: 1, flexBasis: 260 }}>
        <Text style={s.h2}>{formule.nom}</Text>
        <Text style={s.texte}>
          {fcfa(formule.cotisation)}/mois · {formule.taux} % · plafond {fcfa(formule.plafond)}
        </Text>
        <Text style={s.petit}>{formule.personnes}</Text>
      </Carte>
    );
  }

  return (
    <Carte style={{ flexGrow: 1, flexBasis: 260 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={[s.h2, { marginBottom: 0 }]}>{formule ? formule.nom : 'Nouvelle formule'}</Text>
        {formule ? <Badge texte={actif ? 'Proposée' : 'Masquée'} couleur={actif ? C.vert : C.gris} /> : null}
      </View>
      {!formule ? <Champ label="Nom" value={nom} onChangeText={setNom} placeholder="Ex. : Scolaire" /> : null}
      <Champ label="Cotisation mensuelle (FCFA)" value={cotisation} onChangeText={setCotisation} keyboardType="number-pad" />
      <Champ label="Prise en charge (%)" value={taux} onChangeText={setTaux} keyboardType="number-pad" maxLength={3} />
      <Champ label="Plafond annuel (FCFA)" value={plafond} onChangeText={setPlafond} keyboardType="number-pad" />
      <Champ label="Personnes couvertes" value={personnes} onChangeText={setPersonnes} placeholder="Ex. : Membre + 5 ayants droit" />
      <Champ label="Garanties (séparées par des virgules)" value={garanties} onChangeText={setGaranties} multiline />
      {formule ? <Choix label="Visibilité" options={['Proposée', 'Masquée'] as const} valeur={actif ? 'Proposée' : 'Masquée'} onChange={(v) => setActif(v === 'Proposée')} /> : null}
      <Bouton
        titre={formule ? 'Enregistrer' : 'Créer la formule'}
        icone="save"
        desactive={!formule && nom.trim().length < 2}
        onPress={async () => {
          const ok = await onEnregistrer({
            ...(formule ? {} : { nom: nom.trim() }),
            cotisation: nombre(cotisation),
            taux: nombre(taux),
            plafond: nombre(plafond),
            personnes: personnes.trim(),
            garanties: garanties.split(',').map((g) => g.trim()).filter(Boolean),
            actif,
          });
          if (ok && !formule) {
            setNom('');
            setCotisation('');
            setTaux('');
            setPlafond('');
            setPersonnes('');
            setGaranties('');
          }
        }}
      />
    </Carte>
  );
}

function NouveauCentre({ onAjouter }: { onAjouter: (c: Partial<Centre>) => Promise<boolean> }) {
  const [nom, setNom] = useState('');
  const [services, setServices] = useState('');
  return (
    <View style={{ paddingVertical: 12, gap: 4 }}>
      <Text style={s.label}>Ajouter un centre</Text>
      <Champ label="Nom du centre" value={nom} onChangeText={setNom} placeholder="Ex. : Clinique de Foumbot" />
      <Champ label="Services (séparés par des virgules)" value={services} onChangeText={setServices} placeholder="Consultations, Maternité" />
      <Bouton
        titre="Ajouter le centre"
        icone="add"
        variante="contour"
        desactive={nom.trim().length < 2}
        onPress={async () => {
          if (await onAjouter({ nom: nom.trim(), services: services.split(',').map((x) => x.trim()).filter(Boolean), conventionne: false })) {
            setNom('');
            setServices('');
          }
        }}
      />
    </View>
  );
}

function NouveauGestionnaire({ onCreer }: { onCreer: (d: { email: string; nom: string; motDePasse: string }) => Promise<boolean> }) {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  return (
    <View style={{ paddingVertical: 12, gap: 4 }}>
      <Text style={s.label}>Ajouter un gestionnaire</Text>
      <Text style={[s.petit, { marginBottom: 8 }]}>Il pourra gérer les membres, cotisations et demandes, sans modifier les formules ni les comptes.</Text>
      <Champ label="Nom" value={nom} onChangeText={setNom} placeholder="Ex. : Délégué de Foumbot" />
      <Champ label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <Champ label="Mot de passe provisoire (8 caractères minimum)" value={motDePasse} onChangeText={setMotDePasse} secureTextEntry />
      <Bouton
        titre="Créer le compte"
        icone="person-add"
        variante="contour"
        desactive={!nom.trim() || !email.includes('@') || motDePasse.length < 8}
        onPress={async () => {
          if (await onCreer({ nom: nom.trim(), email: email.trim(), motDePasse })) {
            setNom('');
            setEmail('');
            setMotDePasse('');
          }
        }}
      />
    </View>
  );
}
