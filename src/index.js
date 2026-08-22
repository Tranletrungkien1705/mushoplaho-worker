// Mulaho-lite — Cloudflare Worker (thay n8n)
// Luồng: Messenger webhook -> detect sàn -> AccessTrade (fallback link gốc) -> Supabase -> reply + FAQ
// Deploy: wrangler deploy. Set secrets: xem README.
// Env (secrets): FB_PAGE_TOKEN, FB_VERIFY_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY,
//                ACCESSTRADE_TOKEN, AT_CAMPAIGN_SHOPEE, AT_CAMPAIGN_TIKTOK, AT_CAMPAIGN_LAZADA

const FAQ = {
  greeting:
`👋 Chào bạn đến với MUSHOPLAHO — Mua Là Hoàn!
Gửi LINK sản phẩm Shopee/TikTok/Lazada vào đây, shop gửi lại link hoàn tiền — bạn mua qua link đó được HOÀN 50% hoa hồng của đơn 🎁
Gõ "menu" để xem hướng dẫn.`,
  howto:
`🛒 CÁCH MUA ĐỂ ĐƯỢC HOÀN
1. Gửi link sản phẩm (Shopee/TikTok/Lazada) vào đây
2. Shop gửi lại LINK HOÀN TIỀN
3. Bấm link đó → chọn hàng → thanh toán ngay trong phiên
👉 Hoàn 50% hoa hồng của đơn hàng.`,
  schedule:
`💸 LỊCH XỬ LÝ HOÀN TIỀN
✅ Ngày 18 hàng tháng: chốt báo cáo & xin số tài khoản (nếu lần đầu)
✅ Ngày 20–25: chuyển tiền hoàn vào STK của bạn
✅ Ngày 26: thông báo hoàn tất
Lưu ý: đơn chỉ được hoàn sau khi Shopee đối soát (~75–105 ngày).`,
  rules:
`📋 NỘI QUY HOÀN TIỀN
✅ Phải bấm link shop gửi TRƯỚC khi mua
✅ Bấm link rồi chọn hàng & thanh toán ngay trong phiên (đừng để sẵn hàng trong giỏ)
✅ Đơn không hủy/hoàn trong 7 ngày
❌ Không tự mua gian lận, không đặt hộ
⏱ Hoàn sau khi Shopee đối soát (~75–105 ngày)`,
  support:
`💬 Shop đã nhận yêu cầu hỗ trợ của bạn và sẽ phản hồi trực tiếp trong giờ làm việc.
Bạn cứ để lại câu hỏi ở đây nhé 🥰`,
  check:
`🔎 Bạn nhắn MÃ ĐƠN hoặc LINK đã gửi, shop kiểm tra giúp bạn nhé!`,
  menu:
`📋 MENU MUSHOPLAHO
• Gõ "cách mua" — hướng dẫn mua & hoàn
• Gõ "hoàn tiền" — lịch hoàn tiền
• Gõ "nội quy" — điều kiện hoàn
• Gõ "hỗ trợ" — gặp CSKH
• Hoặc gửi thẳng LINK sản phẩm để nhận link hoàn tiền!`
};

function detectPlatform(url) {
  if (/shopee/i.test(url)) return 'shopee';
  if (/tiktok|douyin|vt\.tiktok/i.test(url)) return 'tiktok';
  if (/lazada/i.test(url)) return 'lazada';
  return 'unknown';
}

// Tạo link affiliate qua AccessTrade; lỗi/không có campaign -> trả link gốc
async function makeAffiliate(url, env) {
  const platform = detectPlatform(url);
  const TOKEN = env.ACCESSTRADE_TOKEN || '';
  const CAMP = { shopee: env.AT_CAMPAIGN_SHOPEE || '', tiktok: env.AT_CAMPAIGN_TIKTOK || '', lazada: env.AT_CAMPAIGN_LAZADA || '' };
  const cid = CAMP[platform];
  let aff = url;
  if (TOKEN && cid && /^https?:/.test(url)) {
    try {
      const r = await fetch('https://api.accesstrade.vn/v1/product_link/create', {
        method: 'POST',
        headers: { 'Authorization': 'Token ' + TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: cid, urls: [url] })
      });
      const j = await r.json().catch(() => ({}));
      const d = j && j.data;
      if (d && Array.isArray(d.success_link) && d.success_link[0]) aff = d.success_link[0].short_link || d.success_link[0].aff_link || url;
      else if (Array.isArray(d) && d[0]) aff = d[0].short_link || d[0].aff_link || url;
    } catch (e) { /* fallback link gốc */ }
  }
  return { platform, aff };
}

async function supabaseInsert(row, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return;
  try {
    await fetch(env.SUPABASE_URL + '/rest/v1/submissions', {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(row)
    });
  } catch (e) { /* ignore */ }
}

async function sendMessenger(psid, text, env) {
  try {
    await fetch('https://graph.facebook.com/v19.0/me/messages?access_token=' + encodeURIComponent(env.FB_PAGE_TOKEN), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: { id: psid }, messaging_type: 'RESPONSE', message: { text } })
    });
  } catch (e) { /* ignore */ }
}

async function buildReply(msg, env) {
  const psid = (msg.sender && msg.sender.id) || '';
  const text = (msg.message && msg.message.text) || '';
  const payload = (msg.postback && msg.postback.payload) || (msg.message && msg.message.quick_reply && msg.message.quick_reply.payload) || '';
  const isEcho = !!(msg.message && msg.message.is_echo);
  if (!psid || isEcho || (!text && !payload)) return null; // bỏ echo/receipt/typing -> tránh vòng lặp vô hạn

  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  if (urlMatch) {
    const url = urlMatch[0];
    const { platform, aff } = await makeAffiliate(url, env);
    await supabaseInsert({ buyer_psid: psid, buyer_text: text, original_url: url, platform, affiliate_url: aff, status: 'notified' }, env);
    return { psid, reply: '🎁 Link Mua-Là-Hoàn của bạn:\n' + aff + '\n\n👉 Bấm link này rồi mua như bình thường để được hoàn 50% hoa hồng nhé!\nGõ "hoàn tiền" để xem lịch hoàn 💸' };
  }

  const t = (text || '').toLowerCase().trim();
  let reply;
  if (payload === 'FAQ_HOWTO' || t.includes('cách mua') || t.includes('cach mua')) reply = FAQ.howto;
  else if (payload === 'FAQ_SCHEDULE' || t.includes('hoàn tiền') || t.includes('hoan tien') || t.includes('lịch') || t.includes('khi nào')) reply = FAQ.schedule;
  else if (payload === 'FAQ_RULES' || t.includes('nội quy') || t.includes('noi quy') || t.includes('điều kiện') || t.includes('quy định')) reply = FAQ.rules;
  else if (payload === 'FAQ_SUPPORT' || t.includes('hỗ trợ') || t.includes('ho tro') || t.includes('cskh') || t.includes('support')) reply = FAQ.support;
  else if (payload === 'FAQ_CHECK' || t.includes('kiểm tra') || t.includes('kiem tra') || t.includes('đơn của')) reply = FAQ.check;
  else if (payload === 'GET_STARTED' || /^(hi|hello|hey|chào|chao|alo|menu|start)/.test(t)) reply = FAQ.greeting;
  else reply = FAQ.menu;
  return { psid, reply };
}

const SHOP_HTML = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MUSHOPLAHO — Mua Là Hoàn</title>
<style>body{font-family:system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 16px;background:#0f1420;color:#e8eef7}h1{font-size:1.4rem}input,button{font-size:1rem;padding:12px;border-radius:10px;border:1px solid #33435c;width:100%;box-sizing:border-box}button{background:#1f6feb;color:#fff;border:0;margin-top:10px;cursor:pointer}#out{margin-top:16px;word-break:break-all}a{color:#6fb0ff}</style></head>
<body><h1>🎁 MUSHOPLAHO — Dán link sản phẩm để nhận link hoàn tiền</h1>
<input id="u" placeholder="Dán link Shopee/TikTok/Lazada..."><button onclick="go()">Lấy link hoàn tiền</button>
<div id="out"></div>
<script>async function go(){const u=document.getElementById('u').value.trim();if(!u)return;const o=document.getElementById('out');o.textContent='Đang xử lý...';try{const r=await fetch('/shop-convert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:u})});const j=await r.json();o.innerHTML='👉 Link Mua-Là-Hoàn: <a href="'+j.buy_url+'" target="_blank">'+j.buy_url+'</a>';}catch(e){o.textContent='Lỗi, thử lại.';}}</script>
</body></html>`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Messenger verify (GET /webhook)
    if (request.method === 'GET' && (path === '/webhook' || path === '/')) {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      if (mode === 'subscribe' && token && token === env.FB_VERIFY_TOKEN) return new Response(challenge, { status: 200 });
      if (path === '/') return new Response(SHOP_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      return new Response('Forbidden', { status: 403 });
    }

    // Messenger events (POST /webhook)
    if (request.method === 'POST' && (path === '/webhook' || path === '/')) {
      const body = await request.json().catch(() => ({}));
      const entries = (body && body.entry) || [];
      // Trả 200 ngay cho Facebook, xử lý nền
      ctx.waitUntil((async () => {
        for (const entry of entries) {
          const messaging = (entry && entry.messaging) || [];
          for (const msg of messaging) {
            const res = await buildReply(msg, env);
            if (res && res.reply) await sendMessenger(res.psid, res.reply, env);
          }
        }
      })());
      return new Response('EVENT_RECEIVED', { status: 200 });
    }

    // Web shop
    if (request.method === 'GET' && path === '/shop') {
      return new Response(SHOP_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    if (request.method === 'POST' && path === '/shop-convert') {
      const body = await request.json().catch(() => ({}));
      const u = (body.url || '').trim();
      const { platform, aff } = await makeAffiliate(u, env);
      await supabaseInsert({ buyer_psid: 'web', buyer_text: 'web', original_url: u, platform, affiliate_url: aff, status: 'web' }, env);
      return new Response(JSON.stringify({ buy_url: aff }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response('Not found', { status: 404 });
  }
};
