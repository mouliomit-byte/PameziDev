// Dépôt de données SQLite (module node:sqlite intégré à Node, aucune dépendance native).
// Chaque collection est une table « id + document JSON », avec des colonnes générées
// et indexées pour les recherches fréquentes (téléphone, membre, e-mail).

import { DatabaseSync } from 'node:sqlite';

import type { Collection, Depot } from '../../shared/service.ts';

const INDEX: Record<keyof Depot, string[]> = {
  membres: ['telephone', 'numero', 'statut'],
  cotisations: ['membreId', 'statut'],
  demandes: ['membreId', 'statut'],
  formules: [],
  centres: [],
  admins: ['email'],
  journal: ['date'],
};

const NOM_SUR = /^[a-zA-Z]+$/;

export function ouvrirBase(chemin: string): DatabaseSync {
  const db = new DatabaseSync(chemin);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  for (const [table, champs] of Object.entries(INDEX)) {
    const colonnes = champs.map((c) => `, ${c} TEXT GENERATED ALWAYS AS (json_extract(data, '$.${c}')) VIRTUAL`).join('');
    db.exec(`CREATE TABLE IF NOT EXISTS ${table} (id TEXT PRIMARY KEY, data TEXT NOT NULL${colonnes})`);
    for (const c of champs) db.exec(`CREATE INDEX IF NOT EXISTS ${table}_${c} ON ${table}(${c})`);
  }
  return db;
}

export function creerDepotSqlite(db: DatabaseSync): Depot {
  const collection = <T extends { id: string }>(table: keyof Depot): Collection<T> => {
    const lire = (lignes: unknown[]) => lignes.map((l) => JSON.parse((l as { data: string }).data) as T);
    const tous = db.prepare(`SELECT data FROM ${table}`);
    const parId = db.prepare(`SELECT data FROM ${table} WHERE id = ?`);
    const inserer = db.prepare(`INSERT INTO ${table} (id, data) VALUES (?, ?)`);
    const ecrire = db.prepare(`UPDATE ${table} SET data = ? WHERE id = ?`);
    const supprimer = db.prepare(`DELETE FROM ${table} WHERE id = ?`);
    return {
      async tous() {
        return lire(tous.all());
      },
      async parId(id) {
        return lire(parId.all(id))[0];
      },
      async trouver(champ, valeur) {
        if (!NOM_SUR.test(champ)) throw new Error(`Champ invalide : ${champ}`);
        const colonne = INDEX[table].includes(champ) ? champ : `json_extract(data, '$.${champ}')`;
        return lire(db.prepare(`SELECT data FROM ${table} WHERE ${colonne} = ?`).all(valeur));
      },
      async inserer(x) {
        inserer.run(x.id, JSON.stringify(x));
      },
      async modifier(id, champs) {
        const actuel = lire(parId.all(id))[0];
        if (!actuel) return;
        ecrire.run(JSON.stringify({ ...actuel, ...champs }), id);
      },
      async supprimer(id) {
        supprimer.run(id);
      },
    };
  };
  return Object.fromEntries(Object.keys(INDEX).map((t) => [t, collection(t as keyof Depot)])) as unknown as Depot;
}
