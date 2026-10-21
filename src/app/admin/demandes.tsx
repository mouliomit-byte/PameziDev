import { Link } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { EcranAdmin } from '@/components/admin';
import { Action, Alerte, Badge, C, Carte, Onglets, s } from '@/components/ui';
import { useAdmin, useDonnees } from '@/lib/admin';
import { api } from '@/lib/api';
import { dateFr, fcfa } from '@/lib/data';
import { messageErreur } from '@/lib/store';
import { LIBELLE_STATUT_DEMANDE, type StatutDemande } from '@shared/regles';

const FILTRES: { valeur: StatutDemande | ''; libelle: string }[] = [
  { valeur: 'en_cours', libelle: 'À examiner' },
  { valeur: 'validee', libelle: 'Validées à payer' },
  { valeur: 'payee', libelle: 'Payées' },
  { valeur: 'rejetee', libelle: 'Rejetées' },
  { valeur: '', libelle: 'Toutes' },
];

export default function Demandes() {
  const { avecJeton } = useAdmin();
  const [statut, setStatut] = useState<StatutDemande | ''>('en_cours');
  const { donnees, erreur, chargement, recharger } = useDonnees((j) => api.admin.demandes(j, statut), [statut]);
  const [message, setMessage] = useState<{ texte: string; type: 'erreur' | 'succes' } | null>(null);
  const [occupe, setOccupe] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const decider = async (id: string, decision: StatutDemande) => {
    setOccupe(id);
    setMessage(null);
    try {
      await avecJeton((j) => api.admin.traiterDemande(j, id, decision, notes[id]));
      const textes: Record<string, string> = {
        validee: 'Demande validée : elle passe dans « Validées à payer ».',
        rejetee: 'Demande rejetée. Le membre voit le statut dans son application.',
        payee: 'Prise en charge marquée comme payée.',
      };
      setMessage({ texte: textes[decision], type: 'succes' });
      await recharger();
    } catch (e) {
      setMessage({ texte: messageErreur(e), type: 'erreur' });
    } finally {
      setOccupe(null);
    }
  };

  const total = donnees?.reduce((s, d) => s + d.priseEnCharge, 0) ?? 0;

  return (
    <EcranAdmin chargement={chargement} erreur={erreur}>
      <Onglets options={FILTRES} valeur={statut} onChange={setStatut} />
      {message ? <Alerte texte={message.texte} type={message.type} /> : null}
      <Text style={[s.petit, { marginBottom: 8 }]}>{donnees ? `${donnees.length} demande(s) · part Pamezi ${fcfa(total)}` : ' '}</Text>
      {donnees?.length === 0 ? (
        <Carte>
          <Text style={s.petit}>Aucune demande dans cette liste.</Text>
        </Carte>
      ) : null}
      {donnees?.map((d) => (
        <Carte key={d.id} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <View style={{ flexShrink: 1 }}>
              <Link href={{ pathname: '/admin/membre/[id]', params: { id: d.membreId } }} style={[s.texte, { fontWeight: '800', color: C.bleuFonce }]}>
                {d.membreNom}
              </Link>
              <Text style={s.petit}>
                {d.membreNumero} · {dateFr(d.date)}
              </Text>
            </View>
            <Badge texte={LIBELLE_STATUT_DEMANDE[d.statut]} couleur={d.statut === 'en_cours' ? '#B7791F' : d.statut === 'rejetee' ? C.rouge : C.vert} />
          </View>
          <Text style={[s.texte, { marginTop: 8 }]}>
            <Text style={{ fontWeight: '800' }}>{d.motif}</Text> · {d.centre}
          </Text>
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
            <Text style={s.petit}>Facture {fcfa(d.montant)}</Text>
            <Text style={[s.petit, { color: C.vert, fontWeight: '800' }]}>Part Pamezi {fcfa(d.priseEnCharge)}</Text>
            <Text style={s.petit}>Part du membre {fcfa(d.montant - d.priseEnCharge)}</Text>
          </View>
          {d.commentaire || d.traitePar ? (
            <Text style={[s.petit, { marginTop: 6 }]}>
              {d.commentaire ? `« ${d.commentaire} »` : ''}
              {d.traitePar ? ` · ${d.traitePar}` : ''}
            </Text>
          ) : null}
          {d.statut === 'en_cours' || d.statut === 'validee' ? (
            <>
              <TextInput
                value={notes[d.id] ?? ''}
                onChangeText={(v) => setNotes((n) => ({ ...n, [d.id]: v }))}
                placeholder="Commentaire (facultatif, visible dans le journal)"
                placeholderTextColor="#98A6B8"
                style={[s.input, { marginTop: 10, fontSize: 14, paddingVertical: 10 }]}
                accessibilityLabel="Commentaire"
              />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {d.statut === 'en_cours' ? (
                  <Action titre="Valider" couleur={C.vert} plein onPress={() => decider(d.id, 'validee')} desactive={occupe === d.id} />
                ) : (
                  <Action titre="Marquer comme payée" couleur={C.vert} plein onPress={() => decider(d.id, 'payee')} desactive={occupe === d.id} />
                )}
                <Action titre="Rejeter" couleur={C.rouge} onPress={() => decider(d.id, 'rejetee')} desactive={occupe === d.id} />
              </View>
            </>
          ) : null}
        </Carte>
      ))}
    </EcranAdmin>
  );
}
