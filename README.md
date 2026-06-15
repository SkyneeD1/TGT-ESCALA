# Escala Dourada — Plataforma Web (Fase 1)

Plataforma onde cada streamer entra com **nick + senha** e marca a própria
disponibilidade. O admin cria os logins. Tudo **grátis** (Vercel + Supabase).

```
Streamer → entra (nick/senha) → marca horários → salva no Supabase
Admin    → cria logins · vê quem preencheu   (Fase 2: gera escala e envia)
```

## Arquivos
- `index.html` — página do streamer (login + grade de disponibilidade).
- `admin.html` — painel do admin (criar streamers + acompanhar).
- `api/create-user.js` — função no Vercel que cria os logins (usa chave secreta).
- `config.js` — URL + chave pública do Supabase (você preenche).
- `sql/schema.sql` — cria as tabelas e a segurança no Supabase.

---

## Passo 1 — Criar o banco (Supabase, grátis)
1. Crie conta em **supabase.com** → **New project** (guarde a senha do banco).
2. Menu **SQL Editor** → **New query** → cole todo o `sql/schema.sql` → **Run**.
3. Menu **Authentication → Providers → Email** → **desligue** "Confirm email" → Save.
4. Menu **Authentication → Users → Add user**:
   - Email: `admin@tgt.local` · Senha: (escolha) · marque **Auto Confirm User** → criar.
   - Esse é seu login de admin.

## Passo 2 — Pegar as chaves
Menu **Settings → API**. Anote:
- **Project URL** → vai no `config.js` (e no Vercel como `SUPABASE_URL`).
- **anon public** → vai no `config.js` como `SUPABASE_ANON_KEY`.
- **service_role** (secreta!) → vai SÓ no Vercel como `SUPABASE_SERVICE_ROLE`.

Edite o `config.js` e cole a Project URL e a anon public.

## Passo 3 — Subir no Vercel (grátis)
Jeito mais fácil (sem instalar nada):
1. Crie um repositório no **GitHub** e suba esta pasta `plataforma-escala`
   (botão "Add file → Upload files" no GitHub serve).
2. Em **vercel.com** → **Add New → Project** → importe esse repositório.
3. Em **Environment Variables**, adicione as 3:
   - `SUPABASE_URL` = https://SEU-PROJETO.supabase.co
   - `SUPABASE_SERVICE_ROLE` = (a chave service_role)
   - `ADMIN_EMAIL` = admin@tgt.local
4. **Deploy**. Pronto — você recebe um endereço tipo `https://escala-tgt.vercel.app`.

## Passo 4 — Usar
- **Você (admin):** abra `…vercel.app/admin.html`, entre com `admin@tgt.local`,
  crie os streamers (nick + senha + link do canal).
- **Streamer:** abre `…vercel.app/` (a raiz), entra com o nick/senha que você deu,
  marca os horários e clica **Salvar**.
- No painel admin você vê quem já preencheu e quantas horas marcou.

---

## Fase 2 (próxima)
Adicionar no `admin.html` o botão que:
1. puxa todos os perfis + disponibilidades do Supabase,
2. importa o xlsx de **pontuação** (como hoje),
3. gera a escala (listas **I–IV** automático, **V e VI** VIP à mão),
4. envia pro sistema via `salvar_lives.php` (que o exe já lê).

É basicamente plugar o montador `escala-dourada.html` no banco. Quando a Fase 1
estiver no ar e funcionando, a gente faz a Fase 2.

## Trocar o e-mail do admin
Se quiser outro e-mail, mude nos **3 lugares**: `sql/schema.sql` (as 2 policies),
`config.js` (`ADMIN_EMAIL`) e a env var `ADMIN_EMAIL` no Vercel.
