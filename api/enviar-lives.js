// ====================================================================
//  /api/enviar-lives — recebe as 6 listas do painel admin e repassa
//  pro salvar_lives.php do thegoldenteam.com.br.
//  Faz a ponte porque o site (https) não pode chamar http direto.
//  Só o admin pode usar.
// ====================================================================
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Método inválido' });

  const SUPA  = process.env.SUPABASE_URL;
  const SR    = process.env.SUPABASE_SERVICE_ROLE;
  const ADMIN = process.env.ADMIN_EMAIL || 'admin@tgt.com';
  const ALVO  = process.env.SALVAR_LIVES_URL || 'http://thegoldenteam.com.br/admin/API/salvar_lives.php';

  const { token, senha, semana_inicio, listas } = req.body || {};
  if (!token || !listas) return res.status(400).json({ success: false, error: 'Faltam dados.' });

  // confirma que é o admin
  const who = await fetch(`${SUPA}/auth/v1/user`, {
    headers: { apikey: SR, Authorization: `Bearer ${token}` }
  }).then(r => r.json()).catch(() => null);
  if (!who || who.email !== ADMIN) return res.status(403).json({ success: false, error: 'Não autorizado.' });

  // repassa pro TGT (servidor->servidor, sem bloqueio de mixed content)
  try {
    const r = await fetch(ALVO, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha, semana_inicio, listas })
    });
    const txt = await r.text();
    let j = null; try { j = JSON.parse(txt); } catch (e) {}
    if (j) return res.status(200).json(j);
    return res.status(200).json({ success: false, error: 'Resposta inesperada do TGT', raw: txt.slice(0, 300) });
  } catch (e) {
    return res.status(502).json({ success: false, error: 'Falha ao contatar o thegoldenteam: ' + e.message });
  }
}
