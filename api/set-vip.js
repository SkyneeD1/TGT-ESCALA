// ====================================================================
//  /api/set-vip — marca/desmarca um streamer como VIP (quem paga).
//  VIP entra nas listas VIP (E e F). Só o admin pode.
// ====================================================================
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });

  const SUPA  = process.env.SUPABASE_URL;
  const SR    = process.env.SUPABASE_SERVICE_ROLE;
  const ADMIN = process.env.ADMIN_EMAIL || 'admin@tgt.com';

  const { token, user_id, vip } = req.body || {};
  if (!token || !user_id) return res.status(400).json({ error: 'Faltam dados.' });

  const who = await fetch(`${SUPA}/auth/v1/user`, {
    headers: { apikey: SR, Authorization: `Bearer ${token}` }
  }).then(r => r.json()).catch(() => null);
  if (!who || who.email !== ADMIN) return res.status(403).json({ error: 'Não autorizado.' });

  const r = await fetch(`${SUPA}/rest/v1/profiles?user_id=eq.${user_id}`, {
    method: 'PATCH',
    headers: { apikey: SR, Authorization: `Bearer ${SR}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ vip: !!vip })
  });
  if (!r.ok) { const t = await r.text(); return res.status(400).json({ error: 'Falha: ' + t.slice(0, 200) }); }
  return res.status(200).json({ ok: true, vip: !!vip });
}
