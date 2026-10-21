-- Supprime toutes les données FICTIVES (générées par scripts/fictifs/generer.ts).
delete from pamezi.cotisations where data->>'fictif' = 'true';
delete from pamezi.demandes where data->>'fictif' = 'true';
delete from pamezi.pieces where id in (select id from pamezi.membres where data->>'fictif' = 'true');
delete from pamezi.membres where data->>'fictif' = 'true';
