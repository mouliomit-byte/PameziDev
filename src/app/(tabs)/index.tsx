import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, router } from 'expo-router';
import { Linking, Pressable, Text, View } from 'react-native';

import { Badge, Bouton, C, Carte, Degrade, Ecran, IconName, Logo, Numero, s, Section, Tricolore } from '@/components/ui';
import {
  CONTACTS,
  DEVISE,
  fcfa,
  nombre,
  OBJECTIF_ADHERENTS,
  OBJECTIFS,
  RECEPISSE,
  REGLES_TONTINE,
  SLOGAN,
  SOLIDARITE,
} from '@/lib/data';
import { usePamezi } from '@/lib/store';

export default function Accueil() {
  const { membre, formule, situation: sit, formules, centres } = usePamezi();
  const partenaire = centres.find((c) => c.conventionne) ?? centres[0];

  return (
    <Ecran>
      {/* En-tête */}
      <Degrade style={{ borderRadius: 24, padding: 22, marginBottom: 16 }}>
        <View style={{ position: 'absolute', right: -60, top: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: C.bleuVif, opacity: 0.45 }} />
        <View style={{ position: 'absolute', right: 30, bottom: -70, width: 160, height: 160, borderRadius: 80, backgroundColor: '#ffffff', opacity: 0.06 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Logo taille={58} inverse />
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.bleuPale, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 }}>MUTUELLE DE SANTÉ</Text>
            <Text style={{ color: C.blanc, fontSize: 32, fontWeight: '900', letterSpacing: 0.5 }}>PAMEZI</Text>
          </View>
        </View>
        <Text style={{ color: C.blanc, fontSize: 21, fontWeight: '800', fontStyle: 'italic', marginTop: 18 }}>{SLOGAN}</Text>
        <View style={{ marginVertical: 10 }}>
          <Tricolore largeur={120} hauteur={5} />
        </View>
        <Text style={{ color: C.bleuPale, fontSize: 15, fontStyle: 'italic' }}>{DEVISE}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, backgroundColor: 'rgba(255,255,255,0.14)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.jaune }} />
          <Text style={{ color: C.blanc, fontSize: 13, fontWeight: '700' }}>Inscriptions et cotisations ouvertes</Text>
        </View>
      </Degrade>

      {/* Appel à l'action ou situation du membre */}
      {membre && formule ? (
        <Carte>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[s.h2, { marginBottom: 0 }]}>Bonjour {membre.prenom || membre.nom}</Text>
            <Badge texte={sit.aJour ? 'Couvert' : 'À régulariser'} couleur={sit.aJour ? C.vert : C.rouge} />
          </View>
          <Text style={[s.petit, { marginTop: 4 }]}>
            {membre.numero} · Formule {formule.nom} · {membre.localite}
          </Text>
          <Text style={[s.texte, { marginTop: 10 }]}>
            {sit.aJour
              ? 'Vos cotisations sont à jour : vous et vos ayants droit êtes pris en charge.'
              : `${sit.moisDus - sit.moisPayes} mois de cotisation à régler pour rétablir votre prise en charge.`}
          </Text>
          {!sit.aJour ? <Bouton titre="Régler ma cotisation" icone="wallet" onPress={() => router.push('/cotiser')} /> : null}
        </Carte>
      ) : (
        <Carte style={{ borderLeftWidth: 5, borderLeftColor: C.jaune }}>
          <Text style={s.h2}>Rejoignez la tontine pour la santé</Text>
          <Text style={s.texte}>
            Cotisez chaque mois pour vous et votre famille, et soyez pris en charge en cas de maladie.
          </Text>
          <Bouton titre="Adhérer maintenant" icone="person-add" onPress={() => router.push('/adhesion')} />
          <Bouton titre="Déjà membre ? Se connecter" icone="log-in" variante="contour" onPress={() => router.push('/connexion')} />
        </Carte>
      )}

      {/* Objectif d'adhérents */}
      <Degrade style={{ borderRadius: 20, padding: 20, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="megaphone" size={28} color={C.blanc} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.bleuPale, fontSize: 13, fontWeight: '800', letterSpacing: 1 }}>NOUS CIBLONS</Text>
          <Text style={{ color: C.blanc, fontSize: 24, fontWeight: '900' }}>
            {nombre(OBJECTIF_ADHERENTS.min)} à {nombre(OBJECTIF_ADHERENTS.max)}
          </Text>
          <Text style={{ color: C.blanc, fontSize: 15, fontWeight: '700' }}>adhérents</Text>
        </View>
      </Degrade>

      {/* Objectifs */}
      <Section icone="locate">La mutuelle a pour objectif de</Section>
      <Carte>
        {OBJECTIFS.map((o, i) => (
          <View key={o} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 8 }}>
            <Numero n={i + 1} />
            <Text style={[s.texte, { flex: 1 }]}>{o}</Text>
          </View>
        ))}
      </Carte>

      {/* Tontine */}
      <Section icone="people">Une tontine pour la santé</Section>
      {REGLES_TONTINE.map((r) => (
        <Carte key={r.titre} style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
          <View style={s.pastille}>
            <Ionicons name={r.icone} size={22} color={C.bleu} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.texte, { fontWeight: '800', color: C.bleuFonce }]}>{r.titre}</Text>
            <Text style={[s.petit, { marginTop: 2 }]}>{r.texte}</Text>
          </View>
        </Carte>
      ))}

      {/* Formules */}
      <Section icone="pricetags">Nos formules</Section>
      {formules.map((f) => (
        <Carte key={f.id} style={f.id === 'famille' ? { borderWidth: 2, borderColor: C.bleu } : undefined}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              {f.id === 'famille' ? <Badge texte="Recommandée" /> : null}
              <Text style={[s.h2, { marginBottom: 0, marginTop: f.id === 'famille' ? 6 : 0 }]}>{f.nom}</Text>
              <Text style={s.petit}>{f.personnes}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: C.bleu }}>{fcfa(f.cotisation)}</Text>
              <Text style={s.petit}>par mois</Text>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: C.bord, marginVertical: 12 }} />
          <Text style={[s.texte, { fontWeight: '700' }]}>
            {f.taux} % des frais pris en charge · plafond {fcfa(f.plafond)}/an
          </Text>
          {f.garanties.map((g) => (
            <View key={g} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <Ionicons name="checkmark-circle" size={17} color={C.vert} />
              <Text style={s.texte}>{g}</Text>
            </View>
          ))}
        </Carte>
      ))}
      <Text style={[s.petit, { marginBottom: 10, marginTop: -4 }]}>
        Barème indicatif. Les montants et les maladies prises en charge sont fixés par l’assemblée générale.
      </Text>

      {/* Partenaire de soins */}
      {partenaire ? (
        <>
      <Section icone="medkit">Notre partenaire de soins</Section>
      <Carte>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={[s.pastille, { width: 52, height: 52, borderRadius: 14 }]}>
            <Ionicons name="business" size={26} color={C.bleu} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.h2, { marginBottom: 2 }]}>{partenaire.nom}</Text>
            <Badge texte={partenaire.statut} couleur={C.vert} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {partenaire.services.map((sv) => (
            <View key={sv} style={{ backgroundColor: C.bleuClair, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Text style={{ color: C.bleuFonce, fontWeight: '700', fontSize: 13 }}>{sv}</Text>
            </View>
          ))}
        </View>
        <Text style={[s.petit, { marginTop: 12 }]}>
          D’autres centres de santé et cliniques de la ville seront approchés, pour des soins toujours plus proches de vous.
        </Text>
      </Carte>
        </>
      ) : null}

      {/* Contacts */}
      <Section icone="chatbubbles">Nous contacter</Section>
      <Carte style={{ paddingVertical: 6 }}>
        <Contact icone="mail" libelle={CONTACTS.email} url={`mailto:${CONTACTS.email}`} />
        <Contact icone="logo-facebook" libelle="Pamezi sur Facebook" url={CONTACTS.facebook} />
        <Contact icone="logo-instagram" libelle="@mutuelledesantepamezi" url={CONTACTS.instagram} dernier />
      </Carte>

      {/* Pied de page */}
      <View style={{ alignItems: 'center', marginTop: 18, gap: 10 }}>
        <Text style={{ color: C.bleuFonce, fontSize: 18, fontWeight: '800', fontStyle: 'italic', textAlign: 'center' }}>{SOLIDARITE}</Text>
        <Tricolore largeur={140} />
        <Text style={[s.petit, { textAlign: 'center', marginTop: 6 }]}>
          Association déclarée · Récépissé n° {RECEPISSE.numero}{'\n'}
          {RECEPISSE.autorite}, {RECEPISSE.date}
        </Text>
        <Link href="/admin" style={[s.petit, { color: C.bleu, fontWeight: '700', marginTop: 6 }]}>
          Espace gestionnaire
        </Link>
      </View>
    </Ecran>
  );
}

function Contact({ icone, libelle, url, dernier }: { icone: IconName; libelle: string; url: string; dernier?: boolean }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => Linking.openURL(url).catch(() => {})}
      style={({ pressed }) => [
        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, opacity: pressed ? 0.6 : 1 },
        !dernier && { borderBottomWidth: 1, borderBottomColor: C.bord },
      ]}>
      <View style={[s.pastille, { width: 38, height: 38, borderRadius: 19 }]}>
        <Ionicons name={icone} size={19} color={C.bleu} />
      </View>
      <Text style={[s.texte, { flex: 1, fontSize: 14 }]}>
        {libelle}
      </Text>
      <Ionicons name="open-outline" size={16} color={C.gris} />
    </Pressable>
  );
}
