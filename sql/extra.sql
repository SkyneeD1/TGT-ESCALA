-- =====================================================================
--  EXTRA — rode no Supabase (SQL Editor) DEPOIS do schema.sql.
--  Adiciona: status ativo/desativado + tabela da escala publicada
--  (pra cada streamer ver a escala dele, só leitura).
-- =====================================================================

-- status do streamer (pra mostrar ativo/desativado na lista do admin)
alter table profiles add column if not exists ativo boolean default true;

-- escala publicada (uma linha só, id=1). O admin grava ao enviar;
-- todos os logados leem (cada um filtra o próprio nick na tela).
create table if not exists escala_pub (
  id            int primary key default 1,
  semana_inicio text,
  dados         jsonb not null default '{}',   -- { "A": {"d-h":"nick"}, ... }
  updated_at    timestamptz default now()
);

alter table escala_pub enable row level security;

drop policy if exists e_sel on escala_pub;
create policy e_sel on escala_pub for select
  using ( auth.uid() is not null );             -- qualquer logado lê

drop policy if exists e_ins on escala_pub;
create policy e_ins on escala_pub for insert
  with check ( auth.email() = 'admin@tgt.com' ); -- só admin grava
drop policy if exists e_upd on escala_pub;
create policy e_upd on escala_pub for update
  using ( auth.email() = 'admin@tgt.com' );
