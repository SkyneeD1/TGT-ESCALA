-- =====================================================================
--  ESCALA DOURADA — banco (Supabase / Postgres)
--  Rode TUDO isto no Supabase: menu "SQL Editor" > New query > Run.
--  Depois troque o e-mail do admin abaixo se quiser outro.
-- =====================================================================

-- Quem é o admin (o login que pode ver todo mundo e criar usuários).
-- Mantemos 'admin@tgt.com'. Se mudar aqui, mude também no Vercel (ADMIN_EMAIL).

-- ---------- tabelas ----------
create table if not exists profiles (
  user_id    uuid primary key references auth.users on delete cascade,
  nick       text unique not null,
  link       text default '',          -- canal do streamer (kick/twitch/youtube)
  updated_at timestamptz default now()
);

create table if not exists disponibilidade (
  user_id    uuid primary key references auth.users on delete cascade,
  nick       text,
  prefs      jsonb not null default '[]',  -- array de "d-h" (d: 0=seg..6=dom, h:0..23)
  updated_at timestamptz default now()
);

-- ---------- segurança por linha (cada um só mexe no seu; admin vê tudo) ----------
alter table profiles        enable row level security;
alter table disponibilidade enable row level security;

-- PROFILES
drop policy if exists p_sel on profiles;
create policy p_sel on profiles for select
  using ( auth.uid() = user_id or auth.email() = 'admin@tgt.com' );
drop policy if exists p_ins on profiles;
create policy p_ins on profiles for insert
  with check ( auth.uid() = user_id );
drop policy if exists p_upd on profiles;
create policy p_upd on profiles for update
  using ( auth.uid() = user_id );

-- DISPONIBILIDADE
drop policy if exists d_sel on disponibilidade;
create policy d_sel on disponibilidade for select
  using ( auth.uid() = user_id or auth.email() = 'admin@tgt.com' );
drop policy if exists d_ins on disponibilidade;
create policy d_ins on disponibilidade for insert
  with check ( auth.uid() = user_id );
drop policy if exists d_upd on disponibilidade;
create policy d_upd on disponibilidade for update
  using ( auth.uid() = user_id );

-- =====================================================================
-- Depois de rodar isto:
-- 1) Authentication > Providers > Email: DESLIGUE "Confirm email".
-- 2) Authentication > Users > Add user:
--       email: admin@tgt.com   senha: (escolha)   marque "Auto confirm".
--    Esse é o seu login de administrador.
-- =====================================================================
