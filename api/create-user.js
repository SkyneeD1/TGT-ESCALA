// ====================================================================
//  /api/create-user  — cria um streamer (login nick + senha).
//  Só o admin consegue chamar. Usa a SERVICE_ROLE (secreta), por isso
//  roda no servidor (Vercel), nunca no navegador.
//
//  Variáveis de ambiente no Vercel (Settings > Environment Variables):
//    SUPABASE_URL            = https://SEU-PROJETO.supabase.co
//    SUPABASE_SERVICE_ROLE   = (Supabase > Settings > API > service_role)
//    ADMIN_EMAIL             = admin@tgt.com
// ====================================================================
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });

  const SUPA  = process.env.SUPABASE_URL;
  const SR    = process.env.SUPABASE_SERVICE_ROLE;
  const ADMIN = process.env.ADMIN_EMAIL || 'admin@tgt.com';
  if (!SUPA || !SR) return res.status(500).json({ error: 'Servidor sem configuração (env vars).' });

  const { token, nick, senha, link } = req.body || {};
  if (!token || !nick || !senha) return res.status(400).json({ error: 'Faltam dados (nick/senha).' });

  // 1) confirma que quem chamou é o admin
  const who = await fetch(`${SUPA}/auth/v1/user`, {
    headers: { apikey: SR, Authorization: `Bearer ${token}` }
  }).then(r => r.json()).catch(() => null);
  if (!who || who.email !== ADMIN) return res.status(403).json({ error: 'Não autorizado.' });

  const nickLimpo = String(nick).trim();
  const email = nickLimpo.toLowerCase() + '@tgt.com';

  // 2) cria o usuário (já confirmado, sem precisar de e-mail real)
  const cr = await fetch(`${SUPA}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { apikey: SR, Authorization: `Bearer ${SR}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: senha, email_confirm: true })
  }).then(r => r.json()).catch(() => null);

  if (!cr || !cr.id) {
    const m = (cr && (cr.msg || cr.message || cr.error_description)) || 'Falha ao criar (nick já existe?).';
    return res.status(400).json({ error: m });
  }

  // 3) cria o perfil (nick + link). service_role ignora o RLS.
  await fetch(`${SUPA}/rest/v1/profiles`, {
    method: 'POST',
    headers: { apikey: SR, Authorization: `Bearer ${SR}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ user_id: cr.id, nick: nickLimpo, link: link || '' })
  }).catch(() => {});

  return res.status(200).json({ ok: true, id: cr.id, nick: nickLimpo });
}
