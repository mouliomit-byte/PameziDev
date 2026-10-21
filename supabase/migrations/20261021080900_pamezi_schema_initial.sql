-- Mutuelle de Santé Pamezi : une table « id + document JSON » par collection,
-- avec des colonnes générées et indexées pour les recherches fréquentes.
-- Accès réservé au serveur (fonction « api », connexion directe à la base) :
-- RLS activé, aucune politique publique, schéma non exposé à l'API REST.
create schema if not exists pamezi;

create table pamezi.membres (
  id text primary key,
  data jsonb not null,
  telephone text generated always as (data->>'telephone') stored,
  numero text generated always as (data->>'numero') stored,
  statut text generated always as (data->>'statut') stored,
  cni text generated always as (data->>'cni') stored
);
create unique index membres_telephone on pamezi.membres (telephone);
create unique index membres_cni on pamezi.membres (cni) where cni is not null;
create index membres_numero on pamezi.membres (numero);

create table pamezi.cotisations (
  id text primary key,
  data jsonb not null,
  "membreId" text generated always as (data->>'membreId') stored,
  statut text generated always as (data->>'statut') stored
);
create index cotisations_membre on pamezi.cotisations ("membreId");
create index cotisations_statut on pamezi.cotisations (statut);

create table pamezi.demandes (
  id text primary key,
  data jsonb not null,
  "membreId" text generated always as (data->>'membreId') stored,
  statut text generated always as (data->>'statut') stored
);
create index demandes_membre on pamezi.demandes ("membreId");
create index demandes_statut on pamezi.demandes (statut);

create table pamezi.formules (id text primary key, data jsonb not null);
create table pamezi.centres (id text primary key, data jsonb not null);

create table pamezi.admins (
  id text primary key,
  data jsonb not null,
  email text generated always as (data->>'email') stored
);
create unique index admins_email on pamezi.admins (email);

create table pamezi.journal (
  id text primary key,
  data jsonb not null,
  date text generated always as (data->>'date') stored
);
create index journal_date on pamezi.journal (date);

-- Photos ou scans de CNI (id = id du membre), à part pour garder les listes légères.
create table pamezi.pieces (id text primary key, data jsonb not null);

do $$
declare t text;
begin
  foreach t in array array['membres','cotisations','demandes','formules','centres','admins','journal','pieces'] loop
    execute format('alter table pamezi.%I enable row level security', t);
    execute format('revoke all on pamezi.%I from anon, authenticated', t);
    execute format('grant all on pamezi.%I to service_role', t);
  end loop;
end $$;

revoke all on schema pamezi from anon, authenticated;
grant usage on schema pamezi to service_role;
