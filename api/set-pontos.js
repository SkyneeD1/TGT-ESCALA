// ====================================================================
//  /api/set-pontos — admin sobe a pontuação (do Excel) e grava em
//  profiles.pontos. Recebe { token, pontos: { nick: valor, ... } }.
// ====================================================================
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });
  const SUPA = process.env.SUPABASE_URL, SR = process.env.SUPABASE_SERVICE_ROLE, ADMIN = process.env.ADMIN_EMAIL || 'admin@tgt.com';
  const { token, pontos } = req.body || {};
  if (!token || !pontos) return res.status(400).json({ error: 'Faltam dados.' });

  const who = await fetch(`${SUPA}/auth/v1/user`, { headers: { apikey: SR, Authorization: `Bearer ${token}` } })
    .then(r => r.json()).catch(() => null);
  if (!who || who.email !== ADMIN) return res.status(403).json({ error: 'Não autorizado.' });

  const entries = Object.entries(pontos);
  const results = await Promise.all(entries.map(([nick, val]) =>
    fetch(`${SUPA}/rest/v1/profiles?nick=eq.${encodeURIComponent(nick)}`, {
      method: 'PATCH',
      headers: { apikey: SR, Authorization: `Bearer ${SR}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ pontos: Number(val) || 0 })
    }).then(r => r.ok).catch(() => false)
  ));
  return res.status(200).json({ ok: true, atualizados: results.filter(Boolean).length, total: entries.length });
}
