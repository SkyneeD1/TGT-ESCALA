// ====================================================================
//  /api/delete-user — exclui um streamer DE VEZ (login + dados).
//  Como profiles/disponibilidade têm "on delete cascade", apagar o
//  usuário do Auth já remove os dados dele juntos. Só o admin pode.
// ====================================================================
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });

  const SUPA  = process.env.SUPABASE_URL;
  const SR    = process.env.SUPABASE_SERVICE_ROLE;
  const ADMIN = process.env.ADMIN_EMAIL || 'admin@tgt.com';

  const { token, user_id } = req.body || {};
  if (!token || !user_id) return res.status(400).json({ error: 'Faltam dados.' });

  const who = await fetch(`${SUPA}/auth/v1/user`, {
    headers: { apikey: SR, Authorization: `Bearer ${token}` }
  }).then(r => r.json()).catch(() => null);
  if (!who || who.email !== ADMIN) return res.status(403).json({ error: 'Não autorizado.' });

  const del = await fetch(`${SUPA}/auth/v1/admin/users/${user_id}`, {
    method: 'DELETE',
    headers: { apikey: SR, Authorization: `Bearer ${SR}` }
  });
  if (!del.ok) {
    const t = await del.text();
    return res.status(400).json({ error: 'Falha ao excluir: ' + t.slice(0, 200) });
  }
  return res.status(200).json({ ok: true });
}
