// ====================================================================
//  /api/delete-user — exclui um streamer DE VEZ (login + dados) e
//  remove os horários dele da escala (rascunho e publicada).
//  Como profiles/disponibilidade têm "on delete cascade", apagar o
//  usuário do Auth já remove esses dados; a escala (JSON) é limpa aqui.
//  Só o admin pode.
// ====================================================================
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });

  const SUPA  = process.env.SUPABASE_URL;
  const SR    = process.env.SUPABASE_SERVICE_ROLE;
  const ADMIN = process.env.ADMIN_EMAIL || 'admin@tgt.com';

  const { token, user_id, nick } = req.body || {};
  if (!token || !user_id) return res.status(400).json({ error: 'Faltam dados.' });

  const who = await fetch(`${SUPA}/auth/v1/user`, {
    headers: { apikey: SR, Authorization: `Bearer ${token}` }
  }).then(r => r.json()).catch(() => null);
  if (!who || who.email !== ADMIN) return res.status(403).json({ error: 'Não autorizado.' });

  // 1) apaga o usuário (cascade remove profile + disponibilidade)
  const del = await fetch(`${SUPA}/auth/v1/admin/users/${user_id}`, {
    method: 'DELETE',
    headers: { apikey: SR, Authorization: `Bearer ${SR}` }
  });
  if (!del.ok) {
    const t = await del.text();
    return res.status(400).json({ error: 'Falha ao excluir: ' + t.slice(0, 200) });
  }

  // 2) remove os horários dele da escala (rascunho + publicada)
  if (nick) await limparDaEscala(SUPA, SR, nick);

  return res.status(200).json({ ok: true });
}

async function limparDaEscala(SUPA, SR, nick) {
  const SLOTS = ['A', 'B', 'C', 'D', 'E', 'F'];
  const alvo = String(nick).toLowerCase();
  const h = { apikey: SR, Authorization: `Bearer ${SR}` };
  for (const tbl of ['escala_pub', 'escala_rascunho']) {
    try {
      const rows = await fetch(`${SUPA}/rest/v1/${tbl}?id=eq.1&select=dados`, { headers: h }).then(r => r.json());
      if (!Array.isArray(rows) || !rows[0] || !rows[0].dados) continue;
      const dados = rows[0].dados;
      let changed = false;
      SLOTS.forEach(s => {
        const o = dados[s];
        if (o) for (const k in o) {
          if (String(o[k]).toLowerCase() === alvo) { delete o[k]; changed = true; }
        }
      });
      if (dados.__links && dados.__links[nick] !== undefined) { delete dados.__links[nick]; changed = true; }
      if (changed) {
        await fetch(`${SUPA}/rest/v1/${tbl}?id=eq.1`, {
          method: 'PATCH',
          headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ dados })
        });
      }
    } catch (e) { /* ignora */ }
  }
}
