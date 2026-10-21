# Pamezi — Mutuelle de santé du Noun

**Ensemble pour une meilleure santé.** — *Votre santé, notre priorité.*

Application multiplateforme (Android, iOS, Web) de la mutuelle de santé Pamezi, destinée aux
populations des villes et villages du département du Noun. La mutuelle fonctionne comme une
**tontine pour la santé** : chaque membre cotise chaque mois dans une caisse solidaire qui paie une
grande partie des soins quand un membre tombe malade. *Plus nous sommes nombreux, plus nous sommes forts.*

## Fonctionnalités

- **Accueil** : présentation, chiffres de la communauté, fonctionnement, formules.
- **Adhésion** : nom, téléphone (Mobile Money), arrondissement ou village du Noun, formule, bénéficiaires.
- **Tontine santé** : participation, statut « à jour », caisse solidaire, objectif de membres, invitation d'un proche, historique.
- **Cotisation** : 1, 3, 6 ou 12 mois via MTN Mobile Money, Orange Money ou collecteur, avec reçu.
- **Soins** : demande de prise en charge avec calcul de la part Pamezi, plafond restant, formations sanitaires, conseils santé.
- **Ma carte** : carte de membre numérique à présenter au centre de santé.

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
```

Sur téléphone : installer **Expo Go** et scanner le QR code affiché.
Pour publier sur les stores : `npx eas-cli@latest build`.

## État actuel (démonstration)

- Les données sont enregistrées **sur l'appareil** (pas encore de serveur).
- Les paiements Mobile Money sont **simulés** : aucun argent n'est prélevé.
- Les chiffres de la communauté (membres, caisse) sont des valeurs de démonstration.

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
