// Dépôt de données Postgres (Supabase) : mêmes collections « id + document JSON »
// que la version SQLite, dans le schéma privé « pamezi » (voir supabase/migrations).

import type postgres from 'postgres';

import type { Collection, Depot } from './_lib/shared/service.ts';

// Colonnes générées et indexées (doivent correspondre à la migration).
const INDEX: Record<keyof Depot, string[]> = {
  membres: ['telephone', 'numero', 'statut', 'cni'],
  cotisations: ['membreId', 'statut'],
  demandes: ['membreId', 'statut'],
  formules: [],
  centres: [],
  admins: ['email'],
  journal: ['date'],
  pieces: [],
};

const NOM_SUR = /^[a-zA-Z]+$/;

export function creerDepotPostgres(sql: postgres.Sql): Depot {
  const collection = <T extends { id: string }>(nom: keyof Depot): Collection<T> => {
    const table = sql(`pamezi.${nom}`);
    const lire = (lignes: { data: unknown }[]) => lignes.map((l) => l.data as T);
    return {
      async tous() {
        return lire(await sql`select data from ${table}`);
      },
      async parId(id) {
        return lire(await sql`select data from ${table} where id = ${id}`)[0];
      },
      async trouver(champ, valeur) {
        if (!NOM_SUR.test(champ)) throw new Error(`Champ invalide : ${champ}`);
        return INDEX[nom].includes(champ)
          ? lire(await sql`select data from ${table} where ${sql(String(champ))} = ${valeur}`)
          : lire(await sql`select data from ${table} where data->>${champ} = ${valeur}`);
      },
      async inserer(x) {
        await sql`insert into ${table} (id, data) values (${x.id}, ${sql.json(x as never)})`;
      },
      async modifier(id, champs) {
        // Fusion atomique des champs modifiés dans le document existant.
        await sql`update ${table} set data = data || ${sql.json(JSON.parse(JSON.stringify(champs)))} where id = ${id}`;
      },
      async supprimer(id) {
        await sql`delete from ${table} where id = ${id}`;
      },
    };
  };
  return Object.fromEntries(Object.keys(INDEX).map((n) => [n, collection(n as keyof Depot)])) as unknown as Depot;
}
