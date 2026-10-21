# Mutuelle de Santé Pamezi

**Ensemble pour une meilleure santé !** — *Votre santé, notre priorité !*

Association déclarée — récépissé n° 195/RDA/F32DAPP, Préfecture du Noun, 25 juillet 2005.

Application multiplateforme (Android, iOS, Web) de la Mutuelle de Santé Pamezi, destinée aux
populations des villes et villages du département du Noun. La mutuelle fonctionne comme une
**tontine pour la santé** : chaque membre cotise chaque mois dans une caisse solidaire qui paie une
grande partie des soins quand un membre tombe malade. *Plus nous sommes nombreux, plus nous sommes forts.*

## Objectifs de la mutuelle

1. Promouvoir la prévoyance du risque maladie par l'organisation du financement des soins de santé.
2. Promouvoir l'entraide et la solidarité au profit des membres.
3. Organiser les actions de prévention des maladies.

Objectif : **5 000 à 10 000 adhérents**. Convention de soins avec l'**Hôpital Nah Pôn**.

## Fonctionnalités

- **Accueil** : identité Pamezi, objectifs, règles de la tontine, objectif d'adhérents, formules, partenaire de soins, contacts, mention légale.
- **Adhésion** : individuelle ou via une association ; téléphone, arrondissement ou village du Noun, formule, ayants droit, acceptation des statuts.
- **Tontine santé** : participation, statut « à jour », règles, invitation d'un proche, historique.
- **Cotisation** : 1, 3, 6 ou 12 mois via MTN Mobile Money, Orange Money ou au bureau, avec reçu.
- **Soins** : demande de prise en charge (part Pamezi / part du membre), plafond restant, centres de soins, prévention.
- **Ma carte** : carte de membre numérique (numéro, formule, ayants droit, statut).

## Identité visuelle

Bleu Pamezi `#0070C6` (dégradé `#1580DB` → `#084A88`), titres `#0B59A3`, logo « M » cerclé, filet vert `#007A5E`, rouge `#D91613`, jaune `#FCD116` aux couleurs du Cameroun
(repris de l'affiche officielle). Couleurs dans `src/components/ui.tsx`, icônes dans `assets/`.

## Contacts

- mutuelledesantepamezi@gmail.com
- Facebook : https://www.facebook.com/profile.php?id=6159412983404
- Instagram : https://www.instagram.com/mutuelledesantepamezi/

| Formule | Cotisation | Personnes | Prise en charge | Plafond annuel |
|---|---|---|---|---|
| Essentiel | 1 000 FCFA/mois | 1 | 70 % | 150 000 FCFA |
| Famille | 2 500 FCFA/mois | jusqu'à 6 | 75 % | 400 000 FCFA |
| Sérénité | 5 000 FCFA/mois | jusqu'à 8 | 80 % | 800 000 FCFA |

Montants, taux et liste des centres sont des **valeurs de départ** à ajuster dans `src/lib/data.ts`.

## Lancer l'application

```bash
npm install
npx expo start        # puis « a » (Android), « i » (iOS) ou « w » (Web)
npm run build:web     # version Web statique dans dist/
npm run typecheck
npm run lint
```

Sur téléphone : installer **Expo Go** et scanner le QR code affiché.
Pour publier sur les stores : `npx eas-cli@latest build`.

## État actuel (démonstration)

- Les données sont enregistrées **sur l'appareil** (pas encore de serveur).
- Les paiements Mobile Money sont **simulés** : aucun argent n'est prélevé.

Prochaines étapes : serveur commun (membres, caisse, demandes), API MTN MoMo / Orange Money,
espace délégués et gestionnaires, validation des demandes par les centres de santé.

## Structure

```
src/app/            écrans (Expo Router)
  (tabs)/           Accueil, Tontine, Soins, Ma carte
  adhesion.tsx      formulaire d'adhésion
  cotiser.tsx       paiement de cotisation
  demande.tsx       demande de prise en charge
src/components/ui.tsx  composants et couleurs
src/lib/data.ts     formules, localités, centres
src/lib/store.tsx   état de l'application (sauvegardé sur l'appareil)
```
