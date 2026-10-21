// Opérations de la mutuelle (membres, cotisations, demandes, back office).
// Le même code tourne sur le serveur (base SQLite) et dans l'application en mode
// démonstration (mémoire locale) : seul le « dépôt » de données change.

import {
  type Admin,
  type Centre,
  type Cotisation,
  type Demande,
  type EntreeJournal,
  type Formule,
  type Membre,
  type ModePaiement,
  type Profil,
  type RoleAdmin,
  type StatutCotisation,
  type StatutDemande,
  type StatutMembre,
  type TypeAdhesion,
  AGE_MINIMUM,
  calculerAge,
  calculerPriseEnCharge,
  calculerStatistiques,
  CENTRES_DEPART,
  construireProfil,
  ErreurMetier,
  FORMULES_DEPART,
  formaterDate,
  lireDateNaissance,
  MODES_PAIEMENT,
  MOTIFS,
  nomComplet,
  normaliserCni,
  normaliserTelephone,
  numeroMembre,
  prisEnChargeAnnee,
  telephoneValide,
} from './regles.ts';

export type MembreStocke = Membre & { pinHash: string };
export type AdminStocke = Admin & { motDePasseHash: string };
/** Photo ou scan de la CNI, rangée à part (id = id du membre) pour garder les listes légères. */
export type PieceIdentite = { id: string; cniPhoto: string; ajouteLe: string };

export interface Collection<T extends { id: string }> {
  tous(): Promise<T[]>;
  parId(id: string): Promise<T | undefined>;
  /** Recherche exacte sur un champ indexé (telephone, membreId, email…). */
  trouver(champ: keyof T & string, valeur: string): Promise<T[]>;
  inserer(x: T): Promise<void>;
  modifier(id: string, champs: Partial<T>): Promise<void>;
  supprimer(id: string): Promise<void>;
}

export interface Depot {
  membres: Collection<MembreStocke>;
  cotisations: Collection<Cotisation>;
  demandes: Collection<Demande>;
  formules: Collection<Formule>;
  centres: Collection<Centre>;
  admins: Collection<AdminStocke>;
  journal: Collection<EntreeJournal>;
  pieces: Collection<PieceIdentite>;
}

export interface Secrets {
  hacher(secret: string): Promise<string>;
  verifier(secret: string, hash: string): Promise<boolean>;
  identifiant(): string;
}

export type Contexte = { depot: Depot; secrets: Secrets; maintenant: () => Date };

const sansSecret = <T extends object>(x: T, cle: string) => {
  const copie = { ...x } as Record<string, unknown>;
  delete copie[cle];
  return copie as never;
};
const membrePublic = (m: MembreStocke): Membre => sansSecret(m, 'pinHash');
const adminPublic = (a: AdminStocke): Admin => sansSecret(a, 'motDePasseHash');

function exiger(condition: unknown, message: string, code = 400): asserts condition {
  if (!condition) throw new ErreurMetier(code, message);
}

function entier(v: unknown, min: number, max: number, nom: string): number {
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  exiger(Number.isInteger(n) && n >= min && n <= max, `${nom} invalide.`);
  return n;
}

function texte(v: unknown, min: number, max: number, nom: string): string {
  const t = String(v ?? '').trim();
  exiger(t.length >= min && t.length <= max, `${nom} invalide.`);
  return t;
}

const reference = (ctx: Contexte) => ctx.secrets.identifiant().replace(/-/g, '').slice(0, 8).toUpperCase();

// ---------------------------------------------------------------------------
// Initialisation

/** Crée les formules, les centres et le compte propriétaire s'ils n'existent pas encore. */
export async function initialiser(
  ctx: Contexte,
  proprietaire?: { email: string; nom: string; motDePasse: string },
): Promise<{ proprietaireCree: boolean }> {
  if ((await ctx.depot.formules.tous()).length === 0) for (const f of FORMULES_DEPART) await ctx.depot.formules.inserer(f);
  if ((await ctx.depot.centres.tous()).length === 0) for (const c of CENTRES_DEPART) await ctx.depot.centres.inserer(c);
  if (!proprietaire || (await ctx.depot.admins.tous()).length > 0) return { proprietaireCree: false };
  await ctx.depot.admins.inserer({
    id: ctx.secrets.identifiant(),
    email: proprietaire.email.toLowerCase(),
    nom: proprietaire.nom,
    role: 'proprietaire',
    actif: true,
    creeLe: ctx.maintenant().toISOString(),
    motDePasseHash: await ctx.secrets.hacher(proprietaire.motDePasse),
  });
  return { proprietaireCree: true };
}

// ---------------------------------------------------------------------------
// Public

export async function formulesActives(ctx: Contexte): Promise<Formule[]> {
  return (await ctx.depot.formules.tous()).filter((f) => f.actif).sort((a, b) => a.ordre - b.ordre);
}

export async function listerCentres(ctx: Contexte): Promise<Centre[]> {
  return (await ctx.depot.centres.tous()).sort((a, b) => Number(b.conventionne) - Number(a.conventionne));
}

export async function statistiquesPubliques(ctx: Contexte) {
  const membres = (await ctx.depot.membres.tous()).filter((m) => m.statut !== 'demission');
  return { membres: membres.length, objectif: { min: 5000, max: 10000 } };
}

// ---------------------------------------------------------------------------
// Espace membre

export type DonneesAdhesion = {
  nom: string;
  prenom: string;
  dateNaissance: string; // JJ/MM/AAAA ou AAAA-MM-JJ
  lieuNaissance: string;
  cni: string;
  /** Photo ou scan de la CNI en data URI (image JPEG/PNG/WebP, 1,5 Mo au plus). */
  cniPhoto: string;
  telephone: string;
  localite: string;
  typeAdhesion: TypeAdhesion;
  association?: string;
  formuleId: string;
  ayantsDroit: number;
  pin: string;
};

export async function profil(ctx: Contexte, membreId: string): Promise<Profil> {
  const m = await ctx.depot.membres.parId(membreId);
  exiger(m, 'Membre introuvable.', 404);
  const [formule, cotisations, demandes] = await Promise.all([
    ctx.depot.formules.parId(m.formuleId),
    ctx.depot.cotisations.trouver('membreId', m.id),
    ctx.depot.demandes.trouver('membreId', m.id),
  ]);
  return construireProfil(membrePublic(m), formule ?? null, cotisations, demandes, ctx.maintenant());
}

export async function adherer(ctx: Contexte, d: DonneesAdhesion): Promise<Profil> {
  const nom = texte(d.nom, 2, 60, 'Nom');
  const prenom = texte(d.prenom, 2, 60, 'Prénom');
  const dateNaissance = lireDateNaissance(d.dateNaissance);
  exiger(dateNaissance, 'Date de naissance invalide (format JJ/MM/AAAA).');
  const age = calculerAge(dateNaissance, ctx.maintenant());
  exiger(age >= 0 && age <= 120, 'Date de naissance invalide.');
  exiger(age >= AGE_MINIMUM, `L’adhérent doit avoir au moins ${AGE_MINIMUM} ans. Les enfants sont couverts comme ayants droit.`);
  const lieuNaissance = texte(d.lieuNaissance, 2, 80, 'Lieu de naissance');
  const cni = normaliserCni(d.cni);
  exiger(cni.length >= 6 && cni.length <= 20, 'Numéro de CNI invalide.');
  const photo = String(d.cniPhoto ?? '');
  exiger(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photo), 'Ajoutez la photo ou le scan de votre CNI.');
  exiger(photo.length <= 2_000_000, 'La photo de la CNI est trop lourde (1,5 Mo au plus).');
  const telephone = normaliserTelephone(d.telephone);
  exiger(telephoneValide(telephone), 'Numéro camerounais à 9 chiffres commençant par 6.');
  exiger(/^\d{4}$/.test(String(d.pin ?? '')), 'Le code secret doit contenir 4 chiffres.');
  const localite = texte(d.localite, 2, 60, 'Localité');
  exiger(d.typeAdhesion === 'Individuelle' || d.typeAdhesion === 'Via une association', 'Type d’adhésion invalide.');
  const association = d.typeAdhesion === 'Via une association' ? texte(d.association, 2, 100, 'Nom de l’association') : undefined;
  const formule = await ctx.depot.formules.parId(String(d.formuleId));
  exiger(formule && formule.actif, 'Formule indisponible.');
  const ayantsDroit = entier(d.ayantsDroit ?? 0, 0, 20, 'Nombre d’ayants droit');
  const existant = await ctx.depot.membres.trouver('telephone', telephone);
  exiger(existant.length === 0, 'Ce numéro est déjà inscrit. Connectez-vous avec votre code secret.', 409);
  exiger((await ctx.depot.membres.trouver('cni', cni)).length === 0, 'Ce numéro de CNI est déjà inscrit à la mutuelle.', 409);

  const maintenant = ctx.maintenant();
  const membres = await ctx.depot.membres.tous();
  const annee = maintenant.getFullYear();
  const rang = membres.filter((m) => m.numero.startsWith(`PMZ-${annee}-`)).length + 1;
  const m: MembreStocke = {
    id: ctx.secrets.identifiant(),
    numero: numeroMembre(annee, rang),
    nom,
    prenom,
    dateNaissance,
    lieuNaissance,
    cni,
    pieceCni: true,
    telephone,
    localite,
    typeAdhesion: d.typeAdhesion,
    ...(association ? { association } : {}),
    formuleId: formule.id,
    ayantsDroit,
    statut: 'actif',
    dateAdhesion: maintenant.toISOString(),
    pinHash: await ctx.secrets.hacher(String(d.pin)),
  };
  await ctx.depot.membres.inserer(m);
  await ctx.depot.pieces.inserer({ id: m.id, cniPhoto: photo, ajouteLe: maintenant.toISOString() });
  return profil(ctx, m.id);
}

export async function connecterMembre(ctx: Contexte, telephoneSaisi: string, pin: string): Promise<Profil> {
  const telephone = normaliserTelephone(telephoneSaisi);
  const [m] = await ctx.depot.membres.trouver('telephone', telephone);
  const ok = m ? await ctx.secrets.verifier(String(pin ?? ''), m.pinHash) : false;
  exiger(m && ok, 'Numéro ou code secret incorrect.', 401);
  exiger(m.statut !== 'demission', 'Ce compte a été fermé. Contactez la mutuelle pour adhérer à nouveau.', 403);
  return profil(ctx, m.id);
}

export async function cotiser(ctx: Contexte, membreId: string, moisSaisis: number, mode: ModePaiement) {
  const m = await ctx.depot.membres.parId(membreId);
  exiger(m, 'Membre introuvable.', 404);
  exiger(m.statut !== 'demission', 'Ce compte est fermé.', 403);
  const mois = entier(moisSaisis, 1, 12, 'Nombre de mois');
  exiger(MODES_PAIEMENT.includes(mode), 'Moyen de paiement invalide.');
  const formule = await ctx.depot.formules.parId(m.formuleId);
  exiger(formule, 'Formule introuvable.', 404);
  // Mobile Money : confirmé par l'opérateur (simulé pour l'instant). Espèces : le bureau confirme à réception.
  const especes = mode === 'Espèces (bureau Pamezi)';
  const c: Cotisation = {
    id: ctx.secrets.identifiant(),
    membreId: m.id,
    montant: formule.cotisation * mois,
    mois,
    mode,
    statut: especes ? 'en_attente' : 'confirmee',
    reference: reference(ctx),
    date: ctx.maintenant().toISOString(),
  };
  await ctx.depot.cotisations.inserer(c);
  return { cotisation: c, profil: await profil(ctx, m.id) };
}

export async function demander(ctx: Contexte, membreId: string, d: { centre: string; motif: string; montant: number }) {
  const p = await profil(ctx, membreId);
  exiger(p.membre.statut === 'actif', 'Votre adhésion est suspendue. Contactez la mutuelle.', 403);
  exiger(p.situation.aJour, 'Vos cotisations ne sont pas à jour.', 403);
  exiger(p.formule, 'Formule introuvable.', 404);
  const centre = texte(d.centre, 2, 100, 'Centre de soins');
  exiger(MOTIFS.includes(d.motif), 'Motif invalide.');
  const montant = entier(d.montant, 1, 50_000_000, 'Montant');
  const demande: Demande = {
    id: ctx.secrets.identifiant(),
    membreId,
    centre,
    motif: d.motif,
    montant,
    priseEnCharge: calculerPriseEnCharge(montant, p.formule.taux, p.plafondRestant),
    statut: 'en_cours',
    date: ctx.maintenant().toISOString(),
  };
  await ctx.depot.demandes.inserer(demande);
  return { demande, profil: await profil(ctx, membreId) };
}

// ---------------------------------------------------------------------------
// Back office

async function tracer(ctx: Contexte, admin: Admin, action: string, cible: string) {
  await ctx.depot.journal.inserer({
    id: ctx.secrets.identifiant(),
    date: ctx.maintenant().toISOString(),
    adminId: admin.id,
    adminNom: admin.nom,
    action,
    cible,
  });
}

export async function adminActif(ctx: Contexte, adminId: string): Promise<Admin> {
  const a = await ctx.depot.admins.parId(adminId);
  exiger(a && a.actif, 'Session expirée. Reconnectez-vous.', 401);
  return adminPublic(a);
}

function exigerProprietaire(admin: Admin) {
  exiger(admin.role === 'proprietaire', 'Action réservée au propriétaire.', 403);
}

export async function connecterAdmin(ctx: Contexte, email: string, motDePasse: string): Promise<Admin> {
  const [a] = await ctx.depot.admins.trouver('email', String(email ?? '').trim().toLowerCase());
  const ok = a ? await ctx.secrets.verifier(String(motDePasse ?? ''), a.motDePasseHash) : false;
  exiger(a && ok, 'E-mail ou mot de passe incorrect.', 401);
  exiger(a.actif, 'Ce compte gestionnaire est désactivé.', 403);
  return adminPublic(a);
}

export async function tableauDeBord(ctx: Contexte) {
  const [membres, cotisations, demandes, formules] = await Promise.all([
    ctx.depot.membres.tous(),
    ctx.depot.cotisations.tous(),
    ctx.depot.demandes.tous(),
    ctx.depot.formules.tous(),
  ]);
  return calculerStatistiques(membres.map(membrePublic), cotisations, demandes, formules, ctx.maintenant());
}

export type LigneMembre = Membre & { aJour: boolean; nomFormule: string };

export async function listerMembres(ctx: Contexte, filtre: { q?: string; statut?: StatutMembre | '' }): Promise<LigneMembre[]> {
  const [membres, cotisations, formules] = await Promise.all([
    ctx.depot.membres.tous(),
    ctx.depot.cotisations.tous(),
    ctx.depot.formules.tous(),
  ]);
  const q = (filtre.q ?? '').trim().toLowerCase();
  const maintenant = ctx.maintenant();
  return membres
    .filter((m) => !filtre.statut || m.statut === filtre.statut)
    .filter((m) => !q || [m.nom, m.prenom ?? '', `${m.prenom ?? ''} ${m.nom}`, m.numero, m.telephone, m.cni ?? '', m.localite, m.association ?? ''].some((v) => v.toLowerCase().includes(q)))
    .map((m) => {
      const p = construireProfil(membrePublic(m), null, cotisations.filter((c) => c.membreId === m.id), [], maintenant);
      return { ...p.membre, aJour: p.situation.aJour, nomFormule: formules.find((f) => f.id === m.formuleId)?.nom ?? m.formuleId };
    })
    .sort((a, b) => b.dateAdhesion.localeCompare(a.dateAdhesion));
}

export async function modifierMembre(
  ctx: Contexte,
  admin: Admin,
  id: string,
  champs: { statut?: StatutMembre; formuleId?: string; ayantsDroit?: number; localite?: string; nom?: string },
): Promise<Profil> {
  const m = await ctx.depot.membres.parId(id);
  exiger(m, 'Membre introuvable.', 404);
  const maj: Partial<MembreStocke> = {};
  if (champs.statut !== undefined) {
    exiger(['actif', 'suspendu', 'demission'].includes(champs.statut), 'Statut invalide.');
    maj.statut = champs.statut;
  }
  if (champs.formuleId !== undefined) {
    exiger(await ctx.depot.formules.parId(champs.formuleId), 'Formule introuvable.');
    maj.formuleId = champs.formuleId;
  }
  if (champs.ayantsDroit !== undefined) maj.ayantsDroit = entier(champs.ayantsDroit, 0, 20, 'Nombre d’ayants droit');
  if (champs.localite !== undefined) maj.localite = texte(champs.localite, 2, 60, 'Localité');
  if (champs.nom !== undefined) maj.nom = texte(champs.nom, 3, 80, 'Nom');
  await ctx.depot.membres.modifier(id, maj);
  await tracer(ctx, admin, `Membre modifié (${Object.keys(maj).join(', ')})`, `${m.numero} · ${nomComplet(m)}`);
  return profil(ctx, id);
}

export async function reinitialiserPin(ctx: Contexte, admin: Admin, id: string, pin: string) {
  const m = await ctx.depot.membres.parId(id);
  exiger(m, 'Membre introuvable.', 404);
  exiger(/^\d{4}$/.test(String(pin ?? '')), 'Le code secret doit contenir 4 chiffres.');
  await ctx.depot.membres.modifier(id, { pinHash: await ctx.secrets.hacher(pin) });
  await tracer(ctx, admin, 'Code secret réinitialisé', `${m.numero} · ${nomComplet(m)}`);
}

export type LigneCotisation = Cotisation & { membreNom: string; membreNumero: string };
export type LigneDemande = Demande & { membreNom: string; membreNumero: string; taux?: number };

async function avecMembres<T extends { membreId: string; date: string }>(ctx: Contexte, lignes: T[]) {
  const membres = new Map((await ctx.depot.membres.tous()).map((m) => [m.id, m]));
  return lignes
    .map((l) => ({ ...l, membreNom: membres.has(l.membreId) ? nomComplet(membres.get(l.membreId)!) : '—', membreNumero: membres.get(l.membreId)?.numero ?? '—' }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function listerCotisations(ctx: Contexte, statut?: StatutCotisation | ''): Promise<LigneCotisation[]> {
  const toutes = await ctx.depot.cotisations.tous();
  return avecMembres(ctx, toutes.filter((c) => !statut || c.statut === statut));
}

export async function traiterCotisation(ctx: Contexte, admin: Admin, id: string, decision: StatutCotisation) {
  const c = await ctx.depot.cotisations.parId(id);
  exiger(c, 'Cotisation introuvable.', 404);
  exiger(decision === 'confirmee' || decision === 'rejetee', 'Décision invalide.');
  exiger(c.statut === 'en_attente', 'Cette cotisation a déjà été traitée.', 409);
  await ctx.depot.cotisations.modifier(id, { statut: decision, traiteLe: ctx.maintenant().toISOString(), traitePar: admin.nom });
  const m = await ctx.depot.membres.parId(c.membreId);
  await tracer(ctx, admin, decision === 'confirmee' ? 'Cotisation confirmée' : 'Cotisation rejetée', `${m?.numero ?? ''} · ${c.montant} FCFA · réf. ${c.reference}`);
}

/** Cotisation payée en espèces au bureau : enregistrée et confirmée directement par le gestionnaire. */
export async function encaisserEspeces(ctx: Contexte, admin: Admin, membreId: string, mois: number) {
  const { cotisation } = await cotiser(ctx, membreId, mois, 'Espèces (bureau Pamezi)');
  await ctx.depot.cotisations.modifier(cotisation.id, { statut: 'confirmee', traiteLe: ctx.maintenant().toISOString(), traitePar: admin.nom });
  const m = await ctx.depot.membres.parId(membreId);
  await tracer(ctx, admin, 'Espèces encaissées', `${m?.numero ?? ''} · ${cotisation.montant} FCFA · ${cotisation.mois} mois`);
  return profil(ctx, membreId);
}

export async function listerDemandes(ctx: Contexte, statut?: StatutDemande | ''): Promise<LigneDemande[]> {
  const toutes = await ctx.depot.demandes.tous();
  return avecMembres(ctx, toutes.filter((d) => !statut || d.statut === statut));
}

const TRANSITIONS: Record<StatutDemande, StatutDemande[]> = {
  en_cours: ['validee', 'rejetee'],
  validee: ['payee', 'rejetee'],
  rejetee: [],
  payee: [],
};

export async function traiterDemande(ctx: Contexte, admin: Admin, id: string, decision: StatutDemande, commentaire?: string) {
  const d = await ctx.depot.demandes.parId(id);
  exiger(d, 'Demande introuvable.', 404);
  exiger(TRANSITIONS[d.statut].includes(decision), `Impossible de passer de « ${d.statut} » à « ${decision} ».`, 409);
  const note = String(commentaire ?? '').trim().slice(0, 300);
  await ctx.depot.demandes.modifier(id, {
    statut: decision,
    traiteLe: ctx.maintenant().toISOString(),
    traitePar: admin.nom,
    ...(note ? { commentaire: note } : {}),
  });
  const m = await ctx.depot.membres.parId(d.membreId);
  const libelle = { validee: 'Demande validée', rejetee: 'Demande rejetée', payee: 'Prise en charge payée', en_cours: '' }[decision];
  await tracer(ctx, admin, libelle, `${m?.numero ?? ''} · ${d.motif} · ${d.priseEnCharge} FCFA`);
}

export async function toutesFormules(ctx: Contexte): Promise<Formule[]> {
  return (await ctx.depot.formules.tous()).sort((a, b) => a.ordre - b.ordre);
}

export async function enregistrerFormule(ctx: Contexte, admin: Admin, f: Partial<Formule> & { id?: string }) {
  exigerProprietaire(admin);
  const existante = f.id ? await ctx.depot.formules.parId(f.id) : undefined;
  const valeurs: Formule = {
    id: existante?.id ?? (texte(f.nom, 2, 40, 'Nom de la formule').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || ctx.secrets.identifiant()),
    nom: texte(f.nom ?? existante?.nom, 2, 40, 'Nom de la formule'),
    cotisation: entier(f.cotisation ?? existante?.cotisation, 100, 1_000_000, 'Cotisation'),
    personnes: texte(f.personnes ?? existante?.personnes ?? '', 0, 80, 'Personnes couvertes'),
    taux: entier(f.taux ?? existante?.taux, 1, 100, 'Taux de prise en charge'),
    plafond: entier(f.plafond ?? existante?.plafond, 0, 100_000_000, 'Plafond'),
    garanties: Array.isArray(f.garanties) ? f.garanties.map((g) => String(g).trim()).filter(Boolean).slice(0, 12) : (existante?.garanties ?? []),
    actif: f.actif ?? existante?.actif ?? true,
    ordre: f.ordre ?? existante?.ordre ?? (await ctx.depot.formules.tous()).length + 1,
  };
  if (existante) await ctx.depot.formules.modifier(existante.id, valeurs);
  else {
    exiger(!(await ctx.depot.formules.parId(valeurs.id)), 'Une formule porte déjà ce nom.', 409);
    await ctx.depot.formules.inserer(valeurs);
  }
  await tracer(ctx, admin, existante ? 'Formule modifiée' : 'Formule créée', `${valeurs.nom} · ${valeurs.cotisation} FCFA/mois · ${valeurs.taux} %`);
  return valeurs;
}

export async function enregistrerCentre(ctx: Contexte, admin: Admin, c: Partial<Centre> & { id?: string }) {
  const existant = c.id ? await ctx.depot.centres.parId(c.id) : undefined;
  const conventionne = c.conventionne ?? existant?.conventionne ?? false;
  const valeurs: Centre = {
    id: existant?.id ?? ctx.secrets.identifiant(),
    nom: texte(c.nom ?? existant?.nom, 2, 100, 'Nom du centre'),
    statut: conventionne ? 'Convention de soins signée' : 'En cours d’approche',
    services: Array.isArray(c.services) ? c.services.map((s) => String(s).trim()).filter(Boolean).slice(0, 12) : (existant?.services ?? []),
    conventionne,
  };
  if (existant) await ctx.depot.centres.modifier(existant.id, valeurs);
  else await ctx.depot.centres.inserer(valeurs);
  await tracer(ctx, admin, existant ? 'Centre modifié' : 'Centre ajouté', `${valeurs.nom} · ${valeurs.statut}`);
  return valeurs;
}

export async function supprimerCentre(ctx: Contexte, admin: Admin, id: string) {
  exigerProprietaire(admin);
  const c = await ctx.depot.centres.parId(id);
  exiger(c, 'Centre introuvable.', 404);
  await ctx.depot.centres.supprimer(id);
  await tracer(ctx, admin, 'Centre supprimé', c.nom);
}

export async function listerAdmins(ctx: Contexte): Promise<Admin[]> {
  return (await ctx.depot.admins.tous()).map(adminPublic).sort((a, b) => a.creeLe.localeCompare(b.creeLe));
}

export async function creerAdmin(ctx: Contexte, admin: Admin, d: { email: string; nom: string; motDePasse: string; role?: RoleAdmin }) {
  exigerProprietaire(admin);
  const email = texte(d.email, 5, 120, 'E-mail').toLowerCase();
  exiger(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email), 'E-mail invalide.');
  exiger(String(d.motDePasse ?? '').length >= 8, 'Le mot de passe doit contenir au moins 8 caractères.');
  exiger((await ctx.depot.admins.trouver('email', email)).length === 0, 'Un compte existe déjà avec cet e-mail.', 409);
  const nouveau: AdminStocke = {
    id: ctx.secrets.identifiant(),
    email,
    nom: texte(d.nom, 2, 80, 'Nom'),
    role: d.role === 'proprietaire' ? 'proprietaire' : 'gestionnaire',
    actif: true,
    creeLe: ctx.maintenant().toISOString(),
    motDePasseHash: await ctx.secrets.hacher(d.motDePasse),
  };
  await ctx.depot.admins.inserer(nouveau);
  await tracer(ctx, admin, 'Gestionnaire créé', `${nouveau.nom} · ${nouveau.email}`);
  return adminPublic(nouveau);
}

export async function activerAdmin(ctx: Contexte, admin: Admin, id: string, actif: boolean) {
  exigerProprietaire(admin);
  exiger(id !== admin.id, 'Vous ne pouvez pas désactiver votre propre compte.');
  const a = await ctx.depot.admins.parId(id);
  exiger(a, 'Compte introuvable.', 404);
  await ctx.depot.admins.modifier(id, { actif: Boolean(actif) });
  await tracer(ctx, admin, actif ? 'Gestionnaire réactivé' : 'Gestionnaire désactivé', `${a.nom} · ${a.email}`);
}

export async function listerJournal(ctx: Contexte, limite = 200): Promise<EntreeJournal[]> {
  return (await ctx.depot.journal.tous()).sort((a, b) => b.date.localeCompare(a.date)).slice(0, limite);
}

/** Fichier Excel des inscriptions, colonnes du guide des procédures (CSV « ; », lisible par Excel). */
export function membresEnCsv(lignes: LigneMembre[], maintenant = new Date()): string {
  const echapper = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const entete = [
    'N° d’inscription', 'Nom', 'Prénom', 'Date de naissance', 'Lieu de naissance', 'Âge', 'N° CNI', 'Photo CNI', 'Téléphone',
    'Localité', 'Adhésion', 'Association', 'Formule', 'Ayants droit', 'Statut', 'À jour', 'Date d’inscription',
  ];
  const corps = lignes.map((m) =>
    [
      m.numero, m.nom, m.prenom ?? '',
      m.dateNaissance ? formaterDate(m.dateNaissance) : '', m.lieuNaissance ?? '',
      m.dateNaissance ? calculerAge(m.dateNaissance, maintenant) : '',
      m.cni ?? '', m.pieceCni ? 'oui' : 'non', `+237 ${m.telephone}`,
      m.localite, m.typeAdhesion, m.association ?? '', m.nomFormule, m.ayantsDroit, m.statut, m.aJour ? 'oui' : 'non',
      formaterDate(m.dateAdhesion),
    ]
      .map(echapper)
      .join(';'),
  );
  return [entete.map(echapper).join(';'), ...corps].join('\n');
}

/** Photo ou scan de la CNI d'un membre (back office). */
export async function pieceIdentite(ctx: Contexte, membreId: string): Promise<{ cniPhoto: string | null }> {
  const p = await ctx.depot.pieces.parId(membreId);
  return { cniPhoto: p?.cniPhoto ?? null };
}

export { prisEnChargeAnnee };
