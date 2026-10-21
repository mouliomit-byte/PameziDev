import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { EcranAdmin } from '@/components/admin';
import { Action, Alerte, Badge, Bouton, C, Carte, Champ, Choix, Ligne, s, Section } from '@/components/ui';
import { useAdmin, useDonnees } from '@/lib/admin';
import { api } from '@/lib/api';
import { dateFr, fcfa } from '@/lib/data';
import { messageErreur } from '@/lib/store';
import {
  formaterTelephone,
  LIBELLE_STATUT_COTISATION,
  LIBELLE_STATUT_DEMANDE,
  LIBELLE_STATUT_MEMBRE,
  type StatutMembre,
} from '@shared/regles';

const DUREES = ['1', '3', '6', '12'] as const;

export default function FicheMembre() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { avecJeton } = useAdmin();
  const { donnees: p, erreur, chargement, recharger } = useDonnees((j) => api.admin.membre(j, id), [id]);
  const { donnees: formules } = useDonnees((j) => api.admin.formules(j), []);
  const [message, setMessage] = useState<{ texte: string; type: 'erreur' | 'succes' } | null>(null);
  const [mois, setMois] = useState<(typeof DUREES)[number]>('1');
  const [pin, setPin] = useState('');
  const [occupe, setOccupe] = useState(false);

  const agir = async (f: (j: string) => Promise<unknown>, succes: string) => {
    setOccupe(true);
    setMessage(null);
    try {
      await avecJeton(f);
      setMessage({ texte: succes, type: 'succes' });
      await recharger();
    } catch (e) {
      setMessage({ texte: messageErreur(e), type: 'erreur' });
    } finally {
      setOccupe(false);
    }
  };
  const changerStatut = (statut: StatutMembre, texte: string) => agir((j) => api.admin.modifierMembre(j, id, { statut }), texte);

  if (!p) return <EcranAdmin chargement={chargement} erreur={erreur}>{null}</EcranAdmin>;
  const m = p.membre;

  return (
    <EcranAdmin erreur={erreur}>
      <Carte>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <View style={{ flexShrink: 1 }}>
            <Text style={s.titre}>{m.nom}</Text>
            <Text style={[s.texte, { color: C.bleu, fontWeight: '800', letterSpacing: 1 }]}>{m.numero}</Text>
          </View>
          <View style={{ gap: 6, alignItems: 'flex-end' }}>
            <Badge texte={LIBELLE_STATUT_MEMBRE[m.statut]} couleur={m.statut === 'actif' ? C.vert : C.rouge} />
            <Badge texte={p.situation.aJour ? 'À jour' : `${p.situation.moisDus - p.situation.moisPayes} mois de retard`} couleur={p.situation.aJour ? C.vert : '#B7791F'} />
          </View>
        </View>
        <Ligne icone="call" gauche="Téléphone" droite={formaterTelephone(m.telephone)} />
        <Ligne icone="location" gauche="Localité" droite={m.localite} />
        <Ligne icone="people-circle" gauche="Adhésion" droite={m.association ?? m.typeAdhesion} />
        <Ligne icone="pricetags" gauche="Formule" droite={p.formule ? `${p.formule.nom} · ${fcfa(p.formule.cotisation)}/mois` : '—'} />
        <Ligne icone="people" gauche="Ayants droit" droite={String(m.ayantsDroit)} />
        <Ligne icone="calendar" gauche="Membre depuis" droite={dateFr(m.dateAdhesion)} />
        <Ligne icone="wallet" gauche="Total cotisé" droite={fcfa(p.totalCotise)} />
        <Ligne icone="medkit" gauche="Pris en charge" droite={`${fcfa(p.totalPrisEnCharge)} · reste ${fcfa(p.plafondRestant)}`} />
      </Carte>

      {message ? <Alerte texte={message.texte} type={message.type} /> : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <Carte style={{ flexGrow: 1, flexBasis: 300 }}>
          <Text style={s.h2}>Encaisser des espèces</Text>
          <Text style={[s.petit, { marginBottom: 10 }]}>Le membre paie au bureau : la cotisation est enregistrée et confirmée tout de suite.</Text>
          <Choix label="Nombre de mois" options={DUREES} valeur={mois} onChange={setMois} />
          <Bouton
            titre={p.formule ? `Encaisser ${fcfa(p.formule.cotisation * Number(mois))}` : 'Encaisser'}
            icone="cash"
            desactive={occupe || m.statut === 'demission'}
            onPress={() => agir((j) => api.admin.encaisserEspeces(j, id, Number(mois)), `${mois} mois encaissé(s).`)}
          />
        </Carte>

        <Carte style={{ flexGrow: 1, flexBasis: 300 }}>
          <Text style={s.h2}>Adhésion</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {m.statut !== 'actif' ? <Action titre="Réactiver" couleur={C.vert} plein onPress={() => changerStatut('actif', 'Adhésion réactivée.')} desactive={occupe} /> : null}
            {m.statut === 'actif' ? <Action titre="Suspendre" couleur="#B7791F" onPress={() => changerStatut('suspendu', 'Adhésion suspendue.')} desactive={occupe} /> : null}
            {m.statut !== 'demission' ? <Action titre="Enregistrer la démission" couleur={C.rouge} onPress={() => changerStatut('demission', 'Démission enregistrée.')} desactive={occupe} /> : null}
          </View>
          {formules ? (
            <Choix
              label="Changer de formule"
              options={formules.map((f) => f.nom)}
              valeur={p.formule?.nom ?? null}
              onChange={(nom) => {
                const f = formules.find((x) => x.nom === nom);
                if (f && f.id !== m.formuleId) agir((j) => api.admin.modifierMembre(j, id, { formuleId: f.id }), `Formule ${f.nom} appliquée.`);
              }}
            />
          ) : null}
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <Champ label="Nouveau code secret" value={pin} onChangeText={(v) => setPin(v.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={4} placeholder="4 chiffres" />
            </View>
            <View style={{ marginBottom: 16 }}>
              <Action
                titre="Remplacer"
                onPress={() => agir((j) => api.admin.reinitialiserPin(j, id, pin), 'Code secret remplacé : communiquez-le au membre.').then(() => setPin(''))}
                desactive={occupe || pin.length !== 4}
              />
            </View>
          </View>
        </Carte>
      </View>

      <Section icone="wallet">Cotisations</Section>
      <Carte style={{ paddingVertical: 6 }}>
        {p.cotisations.length === 0 ? <Text style={[s.petit, { paddingVertical: 10 }]}>Aucune cotisation.</Text> : null}
        {p.cotisations.map((c) => (
          <View key={c.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.bord, gap: 8 }}>
            <View style={{ flexShrink: 1 }}>
              <Text style={[s.texte, { fontWeight: '700' }]}>
                {fcfa(c.montant)} · {c.mois} mois
              </Text>
              <Text style={s.petit}>
                {dateFr(c.date)} · {c.mode} · réf. {c.reference}
              </Text>
            </View>
            <Badge texte={LIBELLE_STATUT_COTISATION[c.statut]} couleur={c.statut === 'confirmee' ? C.vert : c.statut === 'rejetee' ? C.rouge : '#B7791F'} />
          </View>
        ))}
      </Carte>

      <Section icone="document-text">Demandes de prise en charge</Section>
      <Carte style={{ paddingVertical: 6 }}>
        {p.demandes.length === 0 ? <Text style={[s.petit, { paddingVertical: 10 }]}>Aucune demande.</Text> : null}
        {p.demandes.map((d) => (
          <View key={d.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.bord, gap: 8 }}>
            <View style={{ flexShrink: 1 }}>
              <Text style={[s.texte, { fontWeight: '700' }]}>
                {d.motif} · {fcfa(d.priseEnCharge)} sur {fcfa(d.montant)}
              </Text>
              <Text style={s.petit}>
                {d.centre} · {dateFr(d.date)}
                {d.commentaire ? ` · ${d.commentaire}` : ''}
              </Text>
            </View>
            <Badge texte={LIBELLE_STATUT_DEMANDE[d.statut]} couleur={d.statut === 'en_cours' ? '#B7791F' : d.statut === 'rejetee' ? C.rouge : C.vert} />
          </View>
        ))}
      </Carte>
    </EcranAdmin>
  );
}
