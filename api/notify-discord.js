// ====================================================================
//  /api/notify-discord — avisa no Discord quando alguém abre um ticket.
//
//  CONFIGURAÇÃO (Vercel → Settings → Environment Variables):
//    DISCORD_WEBHOOK = https://discord.com/api/webhooks/....  (cole o link aqui)
//
//  O link do webhook NUNCA fica no repositório nem no navegador — só aqui,
//  como variável de ambiente. Se não estiver configurado, a função só ignora
//  (não quebra a criação do ticket).
// ====================================================================
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });

  const SUPA = process.env.SUPABASE_URL;
  const SR   = process.env.SUPABASE_SERVICE_ROLE;
  const HOOK = process.env.DISCORD_WEBHOOK;

  // sem webhook configurado → não faz nada (não é erro)
  if (!HOOK) return res.status(200).json({ ok: false, skipped: 'sem DISCORD_WEBHOOK' });

  const { token, tipo, nick, assunto, mensagem, lista, dia, hora } = req.body || {};

  // exige usuário logado (evita spam anônimo no canal)
  if (!token) return res.status(400).json({ error: 'Sem token.' });
  const who = await fetch(`${SUPA}/auth/v1/user`, {
    headers: { apikey: SR, Authorization: `Bearer ${token}` }
  }).then(r => r.json()).catch(() => null);
  if (!who || !who.id) return res.status(403).json({ error: 'Não autorizado.' });

  const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const eCompra = tipo === 'compra';
  const cor = eCompra ? 0x4fe018 : 0xffc83d; // verde compra / dourado suporte
  const titulo = eCompra ? '🛒 Novo pedido de COMPRA de horário' : '🎫 Novo ticket de SUPORTE';

  const campos = [{ name: 'Streamer', value: String(nick || '—'), inline: true }];
  if (eCompra && lista != null) {
    const d = (dia != null && DIAS[dia]) ? DIAS[dia] : '?';
    const h = (hora != null) ? String(hora).padStart(2, '0') + ':00' : '?';
    campos.push({ name: 'Horário', value: `Lista ${lista} · ${d} ${h}`, inline: true });
  }

  const payload = {
    embeds: [{
      title: titulo,
      description: (assunto ? `**${assunto}**\n` : '') + (mensagem ? String(mensagem).slice(0, 800) : ''),
      color: cor,
      fields: campos,
      footer: { text: 'TGT — The Golden Team' }
    }]
  };

  const r = await fetch(HOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!r.ok) { const t = await r.text(); return res.status(400).json({ error: 'Discord recusou: ' + t.slice(0, 200) }); }
  return res.status(200).json({ ok: true });
}
