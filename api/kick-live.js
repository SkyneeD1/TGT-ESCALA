// ====================================================================
//  /api/kick-live — checa quem está AO VIVO no Kick de verdade.
//  Recebe { slugs:[...] } e devolve { ok, live:[slugs que estão live] }.
//  Sem chave/API — usa o endpoint público do Kick.
//  Se o Kick bloquear tudo (Cloudflare), devolve ok:false pro site
//  cair no modo "pela escala" (sem regressão).
// ====================================================================
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });
  const { slugs } = req.body || {};
  if (!Array.isArray(slugs)) return res.status(400).json({ error: 'slugs deve ser lista' });

  const uniq = [...new Set(slugs.map(s => String(s || '').toLowerCase().trim()).filter(Boolean))].slice(0, 80);
  if (!uniq.length) return res.status(200).json({ ok: true, live: [] });

  let okCount = 0;
  const live = [];
  const H = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
  };

  await Promise.all(uniq.map(async slug => {
    try {
      const r = await fetch('https://kick.com/api/v2/channels/' + encodeURIComponent(slug), { headers: H });
      if (!r.ok) return;
      const j = await r.json().catch(() => null);
      if (!j) return;
      okCount++;
      if (j.livestream && (j.livestream.is_live === true || j.livestream.is_live === undefined)) live.push(slug);
    } catch (e) { /* ignora esse canal */ }
  }));

  // se NENHUM canal respondeu, provavelmente o Kick bloqueou → cai pro modo escala
  if (okCount === 0) return res.status(200).json({ ok: false, reason: 'Kick não respondeu' });
  return res.status(200).json({ ok: true, live });
}
