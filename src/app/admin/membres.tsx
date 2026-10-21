import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, Share, Text, TextInput, View } from 'react-native';

import { EcranAdmin } from '@/components/admin';
import { Alerte, Badge, Bouton, C, Carte, Onglets, s } from '@/components/ui';
import { useAdmin, useDonnees } from '@/lib/admin';
import { api } from '@/lib/api';
import { dateFr } from '@/lib/data';
import { messageErreur } from '@/lib/store';
import { formaterTelephone, LIBELLE_STATUT_MEMBRE, type StatutMembre } from '@shared/regles';

const FILTRES: { valeur: StatutMembre | ''; libelle: string }[] = [
  { valeur: '', libelle: 'Tous' },
  { valeur: 'actif', libelle: 'Actifs' },
  { valeur: 'suspendu', libelle: 'Suspendus' },
  { valeur: 'demission', libelle: 'Démissions' },
];

// Une page intégrée dans une autre (aperçu, artefact) ne peut pas télécharger de fichier.
const exportPossible = Platform.OS !== 'web' || (typeof window !== 'undefined' && window.self === window.top);

export default function Membres() {
  const { avecJeton } = useAdmin();
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState<StatutMembre | ''>('');
  const { donnees, erreur, chargement } = useDonnees((j) => api.admin.membres(j, { q, statut }), [q, statut]);
  const [message, setMessage] = useState<{ texte: string; type: 'erreur' | 'succes' } | null>(null);

  const exporter = async () => {
    setMessage(null);
    try {
      const csv = await avecJeton((j) => api.admin.exporterCsv(j));
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const lien = document.createElement('a');
        lien.href = URL.createObjectURL(new Blob(['﻿' + csv.replace(/^﻿/, '')], { type: 'text/csv;charset=utf-8' }));
        lien.download = `membres-pamezi-${new Date().toISOString().slice(0, 10)}.csv`;
        lien.click();
        setMessage({ texte: 'Fichier des membres téléchargé (ouvrable dans Excel).', type: 'succes' });
      } else {
        await Share.share({ title: 'Membres Pamezi', message: csv });
      }
    } catch (e) {
      setMessage({ texte: messageErreur(e), type: 'erreur' });
    }
  };

  return (
    <EcranAdmin chargement={chargement} erreur={erreur}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <View style={[s.input, { flexDirection: 'row', alignItems: 'center', gap: 8, flexGrow: 1, flexBasis: 240, paddingVertical: 0 }]}>
          <Ionicons name="search" size={18} color={C.gris} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Nom, numéro, téléphone, localité…"
            placeholderTextColor="#98A6B8"
            style={{ flex: 1, paddingVertical: 12, fontSize: 16, color: C.texte }}
            accessibilityLabel="Rechercher un membre"
          />
        </View>
        {exportPossible ? (
          <View style={{ minWidth: 180 }}>
            <Bouton titre="Exporter (Excel)" icone="download" variante="contour" onPress={exporter} />
          </View>
        ) : null}
      </View>
      <Onglets options={FILTRES} valeur={statut} onChange={setStatut} />
      {message ? <Alerte texte={message.texte} type={message.type} /> : null}
      <Text style={[s.petit, { marginBottom: 8 }]}>{donnees ? `${donnees.length} membre(s)` : ' '}</Text>

      {donnees?.length === 0 ? <Carte><Text style={s.petit}>Aucun membre ne correspond.</Text></Carte> : null}
      {donnees?.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => router.push({ pathname: '/admin/membre/[id]', params: { id: m.id } })}
            style={({ pressed }) => [s.carte, { opacity: pressed ? 0.8 : 1, marginBottom: 10 }]}
            accessibilityRole="link">
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <View style={{ flexShrink: 1 }}>
                <Text style={[s.texte, { fontWeight: '800' }]}>{m.nom}</Text>
                <Text style={s.petit}>
                  {m.numero} · {formaterTelephone(m.telephone)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
                {m.statut !== 'actif' ? <Badge texte={LIBELLE_STATUT_MEMBRE[m.statut]} couleur={C.rouge} /> : null}
                <Badge texte={m.aJour ? 'À jour' : 'En retard'} couleur={m.aJour ? C.vert : '#B7791F'} />
              </View>
            </View>
            <Text style={[s.petit, { marginTop: 6 }]}>
              {m.localite} · Formule {m.nomFormule} · {m.ayantsDroit} ayant(s) droit · depuis le {dateFr(m.dateAdhesion)}
              {m.association ? ` · ${m.association}` : ''}
            </Text>
          </Pressable>
      ))}
    </EcranAdmin>
  );
}
