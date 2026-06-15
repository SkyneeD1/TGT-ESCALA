// ====================================================================
//  /api/toggle-user — ativa/desativa um streamer.
//  Desativar = bloqueia o login (ban), mas mantém os dados.
//  Ativar    = libera o login de novo.
//  Também atualiza profiles.ativo pra mostrar o status na lista.
//  Só o admin pode.
// ====================================================================
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });

  const SUPA  = process.env.SUPABASE_URL;
  const SR    = process.env.SUPABASE_SERVICE_ROLE;
  const ADMIN = process.env.ADMIN_EMAIL || 'admin@tgt.com';

  const { token, user_id, ativar } = req.body || {};
  if (!token || !user_id) return res.status(400).json({ error: 'Faltam dados.' });

  const who = await fetch(`${SUPA}/auth/v1/user`, {
    headers: { apikey: SR, Authorization: `Bearer ${token}` }
  }).then(r => r.json()).catch(() => null);
  if (!who || who.email !== ADMIN) return res.status(403).json({ error: 'Não autorizado.' });

  // 1) bane / desbane no Auth (876000h ≈ 100 anos)
  const upd = await fetch(`${SUPA}/auth/v1/admin/users/${user_id}`, {
    method: 'PUT',
    headers: { apikey: SR, Authorization: `Bearer ${SR}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ban_duration: ativar ? 'none' : '876000h' })
  });
  if (!upd.ok) {
    const t = await upd.text();
    return res.status(400).json({ error: 'Falha ao alterar: ' + t.slice(0, 200) });
  }

  // 2) marca o status no perfil (pra mostrar na lista)
  await fetch(`${SUPA}/rest/v1/profiles?user_id=eq.${user_id}`, {
    method: 'PATCH',
    headers: { apikey: SR, Authorization: `Bearer ${SR}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ ativo: !!ativar })
  }).catch(() => {});

  return res.status(200).json({ ok: true, ativo: !!ativar });
}
