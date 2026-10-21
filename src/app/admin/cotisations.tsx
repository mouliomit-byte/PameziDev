import { Link } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { EcranAdmin } from '@/components/admin';
import { Action, Alerte, Badge, C, Carte, Onglets, s } from '@/components/ui';
import { useAdmin, useDonnees } from '@/lib/admin';
import { api } from '@/lib/api';
import { dateFr, fcfa } from '@/lib/data';
import { messageErreur } from '@/lib/store';
import { LIBELLE_STATUT_COTISATION, type StatutCotisation } from '@shared/regles';

const FILTRES: { valeur: StatutCotisation | ''; libelle: string }[] = [
  { valeur: 'en_attente', libelle: 'À confirmer' },
  { valeur: 'confirmee', libelle: 'Confirmées' },
  { valeur: 'rejetee', libelle: 'Rejetées' },
  { valeur: '', libelle: 'Toutes' },
];

export default function Cotisations() {
  const { avecJeton } = useAdmin();
  const [statut, setStatut] = useState<StatutCotisation | ''>('en_attente');
  const { donnees, erreur, chargement, recharger } = useDonnees((j) => api.admin.cotisations(j, statut), [statut]);
  const [message, setMessage] = useState<{ texte: string; type: 'erreur' | 'succes' } | null>(null);
  const [occupe, setOccupe] = useState<string | null>(null);

  const decider = async (id: string, decision: StatutCotisation) => {
    setOccupe(id);
    setMessage(null);
    try {
      await avecJeton((j) => api.admin.traiterCotisation(j, id, decision));
      setMessage({ texte: decision === 'confirmee' ? 'Cotisation confirmée : le membre la voit dans son application.' : 'Cotisation rejetée.', type: 'succes' });
      await recharger();
    } catch (e) {
      setMessage({ texte: messageErreur(e), type: 'erreur' });
    } finally {
      setOccupe(null);
    }
  };

  const total = donnees?.reduce((s, c) => s + c.montant, 0) ?? 0;

  return (
    <EcranAdmin chargement={chargement} erreur={erreur}>
      <Text style={[s.petit, { marginBottom: 10 }]}>
        Les paiements Mobile Money sont confirmés automatiquement. Les paiements en espèces déclarés par les membres attendent ici que le bureau confirme la réception.
      </Text>
      <Onglets options={FILTRES} valeur={statut} onChange={setStatut} />
      {message ? <Alerte texte={message.texte} type={message.type} /> : null}
      <Text style={[s.petit, { marginBottom: 8 }]}>{donnees ? `${donnees.length} cotisation(s) · ${fcfa(total)}` : ' '}</Text>
      {donnees?.length === 0 ? (
        <Carte>
          <Text style={s.petit}>{statut === 'en_attente' ? 'Aucune cotisation à confirmer. Tout est à jour.' : 'Aucune cotisation.'}</Text>
        </Carte>
      ) : null}
      {donnees?.map((c) => (
        <Carte key={c.id} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <View style={{ flexShrink: 1 }}>
              <Link href={{ pathname: '/admin/membre/[id]', params: { id: c.membreId } }} style={[s.texte, { fontWeight: '800', color: C.bleuFonce }]}>
                {c.membreNom}
              </Link>
              <Text style={s.petit}>
                {c.membreNumero} · {dateFr(c.date)} · réf. {c.reference}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={[s.texte, { fontWeight: '900' }]}>{fcfa(c.montant)}</Text>
              <Badge texte={LIBELLE_STATUT_COTISATION[c.statut]} couleur={c.statut === 'confirmee' ? C.vert : c.statut === 'rejetee' ? C.rouge : '#B7791F'} />
            </View>
          </View>
          <Text style={[s.petit, { marginTop: 6 }]}>
            {c.mois} mois · {c.mode}
            {c.traitePar ? ` · traité par ${c.traitePar}` : ''}
          </Text>
          {c.statut === 'en_attente' ? (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <Action titre="Confirmer la réception" couleur={C.vert} plein onPress={() => decider(c.id, 'confirmee')} desactive={occupe === c.id} />
              <Action titre="Rejeter" couleur={C.rouge} onPress={() => decider(c.id, 'rejetee')} desactive={occupe === c.id} />
            </View>
          ) : null}
        </Carte>
      ))}
    </EcranAdmin>
  );
}
