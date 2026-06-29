// ====================================================================
//  /api/set-password — admin redefine a senha de um usuário.
//  Usa a service role (Auth Admin API). Só o admin pode.
// ====================================================================
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });

  const SUPA  = process.env.SUPABASE_URL;
  const SR    = process.env.SUPABASE_SERVICE_ROLE;
  const ADMIN = process.env.ADMIN_EMAIL || 'admin@tgt.com';

  const { token, user_id, password } = req.body || {};
  if (!token || !user_id || !password) return res.status(400).json({ error: 'Faltam dados.' });
  if (String(password).length < 6) return res.status(400).json({ error: 'Senha muito curta (mín. 6).' });

  const who = await fetch(`${SUPA}/auth/v1/user`, {
    headers: { apikey: SR, Authorization: `Bearer ${token}` }
  }).then(r => r.json()).catch(() => null);
  if (!who || who.email !== ADMIN) return res.status(403).json({ error: 'Não autorizado.' });

  const r = await fetch(`${SUPA}/auth/v1/admin/users/${user_id}`, {
    method: 'PUT',
    headers: { apikey: SR, Authorization: `Bearer ${SR}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: String(password) })
  });
  if (!r.ok) { const t = await r.text(); return res.status(400).json({ error: 'Falha: ' + t.slice(0, 200) }); }
  return res.status(200).json({ ok: true });
}
