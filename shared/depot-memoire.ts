// Dépôt de données en mémoire : utilisé par le mode démonstration de l'application
// et par les tests. Chaque modification déclenche `sauver` avec l'état complet.

import type { Collection, Depot } from './service.ts';

export type EtatMemoire = Record<keyof Depot, Record<string, unknown>[]>;

const NOMS: (keyof Depot)[] = ['membres', 'cotisations', 'demandes', 'formules', 'centres', 'admins', 'journal'];

export function etatVide(): EtatMemoire {
  return Object.fromEntries(NOMS.map((n) => [n, []])) as unknown as EtatMemoire;
}

export function creerDepotMemoire(etat: EtatMemoire, sauver: (e: EtatMemoire) => void = () => {}): Depot {
  const collection = <T extends { id: string }>(nom: keyof Depot): Collection<T> => {
    const lignes = () => (etat[nom] ??= []) as unknown as T[];
    const copie = <X>(x: X): X => JSON.parse(JSON.stringify(x));
    return {
      async tous() {
        return copie(lignes());
      },
      async parId(id) {
        const x = lignes().find((l) => l.id === id);
        return x ? copie(x) : undefined;
      },
      async trouver(champ, valeur) {
        return copie(lignes().filter((l) => String(l[champ]) === valeur));
      },
      async inserer(x) {
        lignes().push(copie(x));
        sauver(etat);
      },
      async modifier(id, champs) {
        const x = lignes().find((l) => l.id === id);
        if (x) Object.assign(x, copie(champs));
        sauver(etat);
      },
      async supprimer(id) {
        etat[nom] = lignes().filter((l) => l.id !== id) as unknown as Record<string, unknown>[];
        sauver(etat);
      },
    };
  };
  return Object.fromEntries(NOMS.map((n) => [n, collection(n)])) as unknown as Depot;
}
