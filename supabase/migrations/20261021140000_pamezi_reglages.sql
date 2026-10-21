-- Réglages de l'application (couleur choisie par le propriétaire) : un seul document, id « app ».
create table if not exists pamezi.reglages (id text primary key, data jsonb not null);
alter table pamezi.reglages enable row level security;
revoke all on pamezi.reglages from anon, authenticated;
grant all on pamezi.reglages to service_role;
