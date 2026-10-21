// Édition de l'application, choisie à la construction (EXPO_PUBLIC_EDITION) :
// - « client »  : application des abonnés, sans aucun accès au back office ;
// - « gestion » : back office seul (propriétaire et gestionnaires) ;
// - absente     : les deux (développement).
const valeur = process.env.EXPO_PUBLIC_EDITION;
export const EDITION: 'client' | 'gestion' | 'complete' = valeur === 'client' || valeur === 'gestion' ? valeur : 'complete';
export const AVEC_BACK_OFFICE = EDITION !== 'client';
export const AVEC_ESPACE_CLIENT = EDITION !== 'gestion';
