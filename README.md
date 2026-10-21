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

## Les trois parties

| Partie | Pour qui | Où |
|---|---|---|
| **Application membre** | Les adhérents | Android, iPhone, Web |
| **Back office** (`/admin`) | Le propriétaire et les gestionnaires | Même application : Android, iPhone, Web (ordinateur) |
| **Serveur (back-end)** | — | `server/` : API + base de données + hébergement du site Web |

### Application membre
- **Accueil** : identité Pamezi, objectifs, règles de la tontine, formules, partenaire de soins, contacts.
- **Adhésion** : individuelle ou via une association, formule, ayants droit, **code secret à 4 chiffres**.
- **Connexion** : numéro de téléphone + code secret (pour retrouver son compte sur un autre téléphone).
- **Cotisation** : 1 à 12 mois. Mobile Money : confirmé tout de suite (simulé pour l'instant). Espèces : en attente jusqu'à confirmation par le bureau.
- **Soins** : demande de prise en charge, statut suivi (en cours, validée, payée, rejetée), plafond restant.
- **Ma carte** : carte de membre numérique ; statut (actif, en retard, suspendu).

### Back office (propriétaire et gestionnaires)
- **Tableau de bord** : adhérents, à jour, cotisations encaissées, soins payés, solde de la caisse, objectif 5 000 à 10 000, encaissements par mois, adhérents par localité et par formule.
- **Membres** : recherche, filtres, fiche complète, suspendre / réactiver / démission, changer de formule, **encaisser des espèces au bureau**, remplacer un code secret oublié, **export Excel (CSV)**.
- **Cotisations** : confirmer ou rejeter les paiements en espèces déclarés.
- **Demandes de soins** : valider, rejeter, marquer comme payée, avec commentaire.
- **Paramètres** : formules (cotisation, taux, plafond, garanties, visibilité), centres de soins (convention signée ou non), comptes gestionnaires.
- **Journal** : chaque action du back office est tracée (qui, quoi, quand).

Rôles : le **propriétaire** peut tout faire ; un **gestionnaire** gère membres, cotisations, demandes et centres, mais ne modifie ni les formules ni les comptes.

## Identité visuelle

Bleu Pamezi `#0070C6` (dégradé `#1580DB` → `#084A88`), titres `#0B59A3`, logo « M » cerclé (repris de l’affiche), filet vert `#007A5E`, rouge `#D91613`, jaune `#FCD116` aux couleurs du Cameroun
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

## Lancer en local

Prérequis : Node.js 22.18 ou plus récent.

```bash
npm install                 # application
npm --prefix server install # serveur

# 1) Tout-en-un : serveur + site Web (membres et back office) sur http://localhost:8787
npm run build:web           # construit le site branché sur l'API du même serveur
ADMIN_EMAIL=vous@exemple.cm ADMIN_MOT_DE_PASSE='un-mot-de-passe-solide' npm run serveur

# 2) Application mobile branchée sur le serveur (Expo Go ou build EAS)
EXPO_PUBLIC_API_URL=http://<adresse-du-serveur>:8787 npx expo start

# 3) Sans serveur : mode démonstration (données sur l'appareil, membres d'exemple)
npx expo start
```

Back office : ouvrir `/admin` (lien « Espace gestionnaire » en bas de l'accueil).
En démonstration : `proprietaire@pamezi.cm` / `demo-pamezi`.

Vérifications :

```bash
npm run typecheck && npm run lint   # application
npm run serveur:test                # 18 tests de l'API (adhésion → back office)
```

## Déployer en production

1. **Serveur** (VPS, Hostinger Node.js, Render, Railway…) : copier le projet, `npm --prefix server install`,
   `npm run build:web`, puis lancer `npm run serveur` derrière HTTPS avec les variables :

   | Variable | Rôle |
   |---|---|
   | `PORT` | Port d'écoute (8787 par défaut) |
   | `PAMEZI_DONNEES` | Dossier de la base SQLite — **à sauvegarder régulièrement** |
   | `ADMIN_EMAIL`, `ADMIN_MOT_DE_PASSE`, `ADMIN_NOM` | Compte propriétaire créé au premier démarrage |
   | `PAMEZI_SECRET` | Clé de signature des sessions (sinon générée dans le dossier de données) |
   | `CORS_ORIGINES` | Origines autorisées, séparées par des virgules (toutes par défaut) |

2. **Applications Android / iPhone** : définir `EXPO_PUBLIC_API_URL=https://votre-domaine` (fichier `.env`,
   voir `.env.example`, ou variables EAS), puis `npx eas-cli@latest build`.

## API

Toutes les routes sont sous `/api`. Membres : jeton de session (90 jours). Back office : jeton de 12 heures.

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/sante`, `/formules`, `/centres`, `/stats` | Public |
| POST | `/membres` | Adhésion (renvoie jeton + profil) |
| POST | `/membres/connexion` | Connexion téléphone + code secret |
| GET | `/moi` | Profil du membre (cotisations, demandes, situation) |
| POST | `/moi/cotisations`, `/moi/demandes` | Cotiser, demander une prise en charge |
| POST | `/admin/connexion` | Connexion back office |
| GET | `/admin/tableau-de-bord` | Statistiques |
| GET/PATCH | `/admin/membres`, `/admin/membres/:id` | Liste, fiche, modification |
| POST | `/admin/membres/:id/especes`, `/admin/membres/:id/pin` | Encaisser des espèces, nouveau code |
| GET | `/admin/membres.csv` | Export Excel |
| GET/POST | `/admin/cotisations`, `/admin/cotisations/:id/decision` | Confirmer / rejeter |
| GET/POST | `/admin/demandes`, `/admin/demandes/:id/decision` | Valider / rejeter / payer |
| GET/PUT | `/admin/formules`, `/admin/centres` | Paramètres (DELETE `/admin/centres/:id`) |
| GET/POST/PATCH | `/admin/gestionnaires` | Comptes du back office |
| GET | `/admin/journal` | Historique des actions |

Sécurité : codes secrets et mots de passe chiffrés (scrypt), sessions signées (HMAC-SHA256),
blocage après 10 tentatives de connexion en 15 minutes, taille des requêtes limitée, en-têtes de sécurité.

## Encore à faire avant le lancement

- **Paiement Mobile Money réel** : brancher l'API MTN MoMo / Orange Money (aujourd'hui simulé et confirmé d'office).
- **SMS** : envoyer le code secret ou les confirmations par SMS.
- Valider avec le bureau les montants des formules, les taux et la liste des centres (barème indicatif).

## Structure

```
shared/                 règles métier et service, communs au serveur et à l'application
  regles.ts             types, calculs (situation, prise en charge, statistiques)
  service.ts            opérations : adhésion, cotisation, demandes, back office
  depot-memoire.ts      stockage en mémoire (mode démonstration, tests)
server/                 back-end Node.js (Hono + SQLite intégré à Node)
  src/app.ts            routes de l'API
  src/depot-sqlite.ts   stockage SQLite
  src/securite.ts       chiffrement, jetons, limitation des tentatives
  test/api.test.ts      tests de bout en bout de l'API
src/app/                écrans (Expo Router)
  (tabs)/               Accueil, Tontine, Soins, Ma carte
  adhesion, connexion, cotiser, demande
  admin/                back office : tableau de bord, membres, cotisations, demandes, paramètres, journal
src/lib/                api.ts (HTTP ou démonstration), store.tsx (session membre), admin.tsx (session back office)
src/components/         composants d'interface
```
