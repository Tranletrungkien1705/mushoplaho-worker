// Mushoplaho — Cloudflare Worker (bản nâng cấp CHUYỂN ĐỔI + GIỮ CHÂN)
// Thêm so với bản live: bắt liên hệ (web), sinh Mã đơn, trang /track tra cứu, bot check đơn thật.
// Env secrets: FB_PAGE_TOKEN, FB_VERIFY_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY,
//              ACCESSTRADE_TOKEN, AT_CAMPAIGN_SHOPEE, AT_CAMPAIGN_TIKTOK, AT_CAMPAIGN_LAZADA
// Cần cột Supabase submissions: order_code text, contact text (ngoài các cột sẵn có).

const FB_GROUP = 'https://www.facebook.com/groups/1693634255519569';
const PAYOUT = 'Lịch hoàn: ngày 20–25 hàng tháng, sau khi Shopee đối soát (~75–105 ngày).';

const FAQ = {
  greeting:
`👋 Chào bạn đến với MUSHOPLAHO — Mua Là Hoàn!
Gửi LINK sản phẩm Shopee/TikTok/Lazada vào đây, shop gửi lại link hoàn tiền — bạn mua qua link đó được HOÀN 50% hoa hồng của đơn 🎁
Gõ "menu" để xem hướng dẫn.`,
  howto:
`🛒 CÁCH MUA ĐỂ ĐƯỢC HOÀN
1. Gửi link sản phẩm (Shopee/TikTok/Lazada) vào đây
2. Shop gửi lại LINK HOÀN TIỀN + MÃ ĐƠN
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
  menu:
`📋 MENU MUSHOPLAHO
• Gõ "cách mua" — hướng dẫn mua & hoàn
• Gõ "hoàn tiền" — lịch hoàn tiền
• Gõ "nội quy" — điều kiện hoàn
• Gõ "check đơn" — tra cứu đơn của bạn
• Gõ "hỗ trợ" — gặp CSKH
• Hoặc gửi thẳng LINK sản phẩm để nhận link hoàn tiền!`
};

function detectPlatform(url) {
  if (/shopee/i.test(url)) return 'shopee';
  if (/tiktok|douyin|vt\.tiktok/i.test(url)) return 'tiktok';
  if (/lazada/i.test(url)) return 'lazada';
  return 'unknown';
}

function genOrderCode() {
  const a = Date.now().toString(36).slice(-4).toUpperCase();
  const b = Math.floor(Math.random() * 46656).toString(36).toUpperCase().padStart(3, '0');
  return 'MLH-' + a + b;
}

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

// Đọc đơn theo mã hoặc theo liên hệ/psid
async function supabaseFind(q, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY || !q) return [];
  const safe = encodeURIComponent(q.trim());
  const filter = `or=(order_code.eq.${safe},contact.eq.${safe},buyer_psid.eq.${safe})`;
  try {
    const r = await fetch(env.SUPABASE_URL + `/rest/v1/submissions?${filter}&order=id.desc&limit=10`, {
      headers: { apikey: env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY }
    });
    if (!r.ok) return [];
    return await r.json().catch(() => []);
  } catch (e) { return []; }
}

async function supabaseList(env, limit) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return [];
  try {
    const r = await fetch(env.SUPABASE_URL + `/rest/v1/submissions?select=order_code,contact,bank_info,admin_note,platform,status,original_url,created_at&order=id.desc&limit=${limit || 50}`, {
      headers: { apikey: env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY }
    });
    if (!r.ok) return [];
    return await r.json().catch(() => []);
  } catch (e) { return []; }
}

async function supabaseUpdate(orderCode, patch, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY || !orderCode) return false;
  const clean = {};
  ['status', 'bank_info', 'admin_note'].forEach(k => { if (patch && patch[k] !== undefined) clean[k] = patch[k]; });
  if (!Object.keys(clean).length) return false;
  try {
    const r = await fetch(env.SUPABASE_URL + `/rest/v1/submissions?order_code=eq.${encodeURIComponent(orderCode)}`, {
      method: 'PATCH',
      headers: { apikey: env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify(clean)
    });
    return r.ok;
  } catch (e) { return false; }
}

function checkAdmin(pass, env) { return !!(pass && env.ADMIN_TOKEN && pass === env.ADMIN_TOKEN); }

function statusLabel(s) {
  const m = { notified: '🟡 Đã tạo link — chờ bạn mua', web: '🟡 Đã tạo link — chờ bạn mua',
    purchased: '🟢 Đã ghi nhận mua', confirmed: '🔵 Shopee đã đối soát', paid: '✅ Đã hoàn tiền' };
  return m[s] || '🟡 Đang xử lý';
}

async function sendMessenger(psid, text, env) {
  try {
    await fetch('https://graph.facebook.com/v19.0/me/messages?access_token=' + encodeURIComponent(env.FB_PAGE_TOKEN), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ recipient: { id: psid }, messaging_type: 'RESPONSE', message: { text } })
    });
  } catch (e) { /* ignore */ }
}

async function sendTyping(psid, env) {
  try {
    await fetch('https://graph.facebook.com/v19.0/me/messages?access_token=' + encodeURIComponent(env.FB_PAGE_TOKEN), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: { id: psid }, sender_action: 'typing_on' })
    });
  } catch (e) { /* ignore */ }
}

async function buildReply(msg, env) {
  const psid = (msg.sender && msg.sender.id) || '';
  const text = (msg.message && msg.message.text) || '';
  const payload = (msg.postback && msg.postback.payload) || (msg.message && msg.message.quick_reply && msg.message.quick_reply.payload) || '';
  const isEcho = !!(msg.message && msg.message.is_echo);
  if (!psid || isEcho || (!text && !payload)) return null;

  const t = (text || '').toLowerCase().trim();

  // 1) Có link -> tạo affiliate + mã đơn + lưu
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  if (urlMatch) {
    const url = urlMatch[0];
    const [, mk] = await Promise.all([sendTyping(psid, env), makeAffiliate(url, env)]);
    const { platform, aff } = mk;
    const code = genOrderCode();
    await supabaseInsert({ buyer_psid: psid, buyer_text: text, original_url: url, platform, affiliate_url: aff, order_code: code, status: 'notified' }, env);
    return { psid, reply:
`🎁 Link Mua-Là-Hoàn của bạn:
${aff}

🧾 Mã đơn: ${code}
👉 Bấm link trên rồi mua như bình thường để được hoàn 50% hoa hồng.
Gõ "check đơn" để tra cứu, "hoàn tiền" để xem lịch hoàn 💸` };
  }

  // 2) Check đơn (mã MLH- hoặc từ khoá)
  if (payload === 'FAQ_CHECK' || /mlh-/i.test(t) || t.includes('check đơn') || t.includes('check don') || t.includes('kiểm tra') || t.includes('kiem tra') || t.includes('tra cứu') || t.includes('tra cuu') || t.includes('đơn của')) {
    await sendTyping(psid, env);
    const codeInText = (text.match(/MLH-[A-Z0-9]+/i) || [])[0];
    const rows = await supabaseFind(codeInText || psid, env);
    if (!rows.length) return { psid, reply: '🔎 Chưa thấy đơn nào. Bạn gửi LINK sản phẩm để tạo đơn mới, hoặc nhắn đúng MÃ ĐƠN (MLH-...) nhé!' };
    const lines = rows.slice(0, 5).map(r => `• ${r.order_code || '(chưa có mã)'} — ${statusLabel(r.status)}`).join('\n');
    return { psid, reply: `🧾 Đơn của bạn:\n${lines}\n\n${PAYOUT}` };
  }

  // 3) FAQ
  let reply;
  if (payload === 'FAQ_HOWTO' || t.includes('cách mua') || t.includes('cach mua')) reply = FAQ.howto;
  else if (payload === 'FAQ_SCHEDULE' || t.includes('hoàn tiền') || t.includes('hoan tien') || t.includes('lịch') || t.includes('khi nào')) reply = FAQ.schedule;
  else if (payload === 'FAQ_RULES' || t.includes('nội quy') || t.includes('noi quy') || t.includes('điều kiện') || t.includes('quy định')) reply = FAQ.rules;
  else if (payload === 'FAQ_SUPPORT' || t.includes('hỗ trợ') || t.includes('ho tro') || t.includes('cskh') || t.includes('support')) reply = FAQ.support;
  else if (payload === 'GET_STARTED' || /^(hi|hello|hey|chào|chao|alo|menu|start)/.test(t)) reply = FAQ.greeting;
  else reply = FAQ.menu;
  return { psid, reply };
}

const SHOP_HTML = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#FF6B4A">
<title>Mushoplaho - Mua Là Hoàn</title>
<meta property="og:title" content="Mushoplaho — Mua Là Hoàn">
<meta property="og:description" content="Dán link Shopee, nhận lại đến 50% hoa hồng. Miễn phí, không cần cài app.">
<meta property="og:type" content="website">
<style>
  :root{--o1:#FF9F45;--o2:#FF5C7A;--g1:#12b76a;--g2:#039855;--bg:#fff6f1;--ink:#2b2b2b;--mut:#8a8a8a}
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
  body{font-family:-apple-system,"Segoe UI",Roboto,Arial,sans-serif;background:var(--bg);color:var(--ink);line-height:1.5}
  .wrap{max-width:600px;margin:0 auto;padding:0 15px 40px}
  header{background:linear-gradient(135deg,var(--o1),var(--o2));color:#fff;text-align:center;padding:36px 16px 30px;border-radius:0 0 30px 30px}
  .logo{width:72px;height:72px;border-radius:20px;background:rgba(255,255,255,.18);border:3px solid rgba(255,255,255,.9);
    display:flex;align-items:center;justify-content:center;font-size:42px;font-weight:800;margin:0 auto 10px}
  header h1{font-size:25px;font-weight:800;letter-spacing:.3px}
  header .sub{opacity:.96;margin-top:5px;font-size:14px}
  .badge{display:inline-block;margin-top:13px;background:#fff;color:#FF4E73;font-weight:800;padding:9px 20px;border-radius:999px;font-size:15px;box-shadow:0 4px 14px rgba(0,0,0,.12)}
  .proof{margin-top:10px;font-size:13px;opacity:.95}
  .card{background:#fff;border-radius:20px;box-shadow:0 6px 22px rgba(255,110,80,.13);padding:20px;margin-top:18px}
  .card h2{font-size:17px;margin-bottom:12px;display:flex;align-items:center;gap:8px}
  .inrow{display:flex;gap:8px}
  input{width:100%;padding:14px 15px;border:2px solid #ffd9c9;border-radius:14px;font-size:16px;outline:none;min-width:0;margin-top:10px}
  input:first-of-type{margin-top:0}
  input:focus{border-color:var(--o1)}
  .inrow input{margin-top:0}
  .paste{flex:0 0 auto;padding:0 14px;border:2px solid #ffd9c9;background:#fff3ec;border-radius:14px;font-size:14px;font-weight:700;color:#FF6B3D;cursor:pointer}
  .btn{display:block;width:100%;text-align:center;border:none;cursor:pointer;font-size:17px;font-weight:800;color:#fff;
    background:linear-gradient(135deg,var(--o1),var(--o2));padding:15px;border-radius:14px;margin-top:12px;text-decoration:none;box-shadow:0 6px 16px rgba(255,90,110,.28)}
  .btn:active{transform:translateY(1px)}
  .btn.buy{background:linear-gradient(135deg,var(--g1),var(--g2));font-size:18px;box-shadow:0 6px 16px rgba(3,152,85,.28)}
  .btn.ghost{background:#fff;color:#039855;border:2px solid #039855;box-shadow:none;font-size:15px;padding:12px}
  .btn.group{background:#1877f2;box-shadow:0 6px 16px rgba(24,119,242,.28)}
  .muted{color:var(--mut);font-size:13px;margin-top:8px;text-align:center}
  .code{font-weight:800;color:#FF4E73;font-size:16px}
  #result{display:none;margin-top:16px}
  .ok{background:#eafff3;border:1px solid #b7f0cf;border-radius:16px;padding:16px;text-align:center}
  #err{display:none;color:#d92d20;text-align:center;margin-top:10px;font-size:14px}
  .trust{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:14px}
  .trust span{background:#fff;border:1px solid #ffe1d4;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:700;color:#FF6B3D}
  .steps{list-style:none;counter-reset:s}
  .steps li{counter-increment:s;position:relative;padding:11px 0 11px 46px;border-bottom:1px dashed #ffe3d6;font-size:15px}
  .steps li:last-child{border:none}
  .steps li::before{content:counter(s);position:absolute;left:0;top:9px;width:32px;height:32px;border-radius:50%;
    background:linear-gradient(135deg,var(--o1),var(--o2));color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center}
  .spin{display:inline-block;width:16px;height:16px;border:3px solid rgba(255,255,255,.5);border-top-color:#fff;border-radius:50%;animation:sp .7s linear infinite;vertical-align:-3px}
  @keyframes sp{to{transform:rotate(360deg)}}
  .toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(80px);background:#222;color:#fff;padding:12px 20px;border-radius:999px;font-size:14px;opacity:0;transition:.3s;z-index:9}
  .toast.show{transform:translateX(-50%) translateY(0);opacity:1}
  footer{text-align:center;color:var(--mut);font-size:12px;margin-top:24px;line-height:1.7}
  a.link{color:#FF6B3D;font-weight:700;text-decoration:none}
  .calc-in{display:flex;gap:8px;align-items:center;margin-top:0}
  .calc-in input{margin-top:0}
  .calc-out{margin-top:12px;background:#eafff3;border:1px solid #b7f0cf;border-radius:14px;padding:14px;text-align:center;font-weight:800;color:#039855}
  .calc-out b{font-size:22px}
  .tl{list-style:none;margin-top:4px}
  .tl li{position:relative;padding:0 0 16px 26px;border-left:2px solid #ffd9c9;margin-left:6px;font-size:14px}
  .tl li:last-child{border-left-color:transparent;padding-bottom:0}
  .tl li::before{content:'';position:absolute;left:-8px;top:2px;width:14px;height:14px;border-radius:50%;background:linear-gradient(135deg,var(--o1),var(--o2))}
  .tl b{color:#FF4E73}
  .faq details{border-bottom:1px solid #ffe3d6;padding:12px 0}
  .faq details:last-child{border:none}
  .faq summary{font-weight:700;cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:10px}
  .faq summary::-webkit-details-marker{display:none}
  .faq summary::after{content:'+';color:var(--o2);font-weight:800}
  .faq details[open] summary::after{content:'\\2212'}
  .faq p{color:#555;font-size:14px;margin-top:8px}
  .refer{background:linear-gradient(135deg,#eef4ff,#fff);border:1px dashed #a9c2ff}
</style>
</head>
<body>
<header>
  <div class="logo">M</div>
  <h1>Mushoplaho</h1>
  <div class="sub">Mua Là Hoàn — mua Shopee, nhận lại tiền 💸</div>
  <div class="badge">Hoàn đến 50% hoa hồng</div>
  <div class="proof" id="proof">🔥 Đang tải...</div>
</header>

<div class="wrap">
  <div class="card">
    <h2>🛒 Dán link sản phẩm Shopee</h2>
    <div class="inrow">
      <input id="url" type="url" inputmode="url" placeholder="Dán link Shopee vào đây..." autocomplete="off">
      <button class="paste" id="paste" type="button">📋 Dán</button>
    </div>
    <button class="btn" id="go">🎁 Nhận link hoàn tiền ngay</button>
    <input id="contact" type="text" placeholder="SĐT/Zalo (không bắt buộc — để được nhắc khi tiền về)" autocomplete="off" style="margin-top:10px">
    <div id="err"></div>
    <div id="result">
      <div class="ok">
        <p style="font-weight:800;margin-bottom:6px">🎁 Link của bạn đã sẵn sàng!</p>
        <p class="muted" style="margin:0 0 10px">🧾 Mã đơn: <span class="code" id="ocode"></span> — lưu lại để tra cứu</p>
        <a class="btn buy" id="buy" target="_blank" rel="noopener">🛒 Mở Shopee &amp; mua ngay</a>
        <button class="btn ghost" id="copy" type="button">📄 Sao chép link</button>
        <p class="muted">Bấm nút mở thẳng Shopee. Mua như bình thường để được hoàn 50% nhé!</p>
        <p class="muted"><a class="link" href="/track" id="tolink">🔎 Tra cứu đơn của tôi</a></p>
      </div>
    </div>
    <div class="trust"><span>✅ Chính hãng Shopee</span><span>🔒 An toàn</span><span>🆓 Miễn phí</span><span>📱 Không cần cài app</span></div>
  </div>

  <div class="card" id="wallet" style="display:none">
    <h2>🧾 Đơn của bạn <span class="mut" id="wcount" style="font-weight:400"></span></h2>
    <div id="walletlist"></div>
    <p class="muted" style="text-align:left"><a class="link" href="/track">🔎 Tra cứu / xem tất cả</a></p>
  </div>

  <div class="card">
    <h2>🧮 Ước tính tiền hoàn</h2>
    <input id="calcv" type="number" inputmode="numeric" placeholder="Nhập giá trị đơn (đ) — vd 500000">
    <div class="calc-out" id="calcout">Nhập giá đơn để xem số tiền có thể hoàn 💸</div>
    <p class="muted">Ước tính ~2–7% giá trị đơn (tuỳ ngành hàng). Số thực nhận theo hoa hồng Shopee đối soát.</p>
  </div>

  <div class="card">
    <h2>💡 Cách hoạt động</h2>
    <ol class="steps">
      <li>Dán link Shopee + SĐT/Facebook, bấm nút phía trên.</li>
      <li>Bấm <b>“Mở Shopee &amp; mua ngay”</b> → mua như bình thường.</li>
      <li>Tham gia Nhóm → gửi ảnh đơn → <b>nhận hoàn 50%</b> hoa hồng.</li>
    </ol>
    <p class="muted"><a class="link" href="/track">🔎 Đã có mã đơn? Tra cứu tại đây</a></p>
  </div>

  <div class="card">
    <h2>💸 Lịch nhận tiền hoàn</h2>
    <ul class="tl">
      <li><b>Ngày 18</b> hàng tháng — chốt báo cáo &amp; xin STK (nếu lần đầu)</li>
      <li><b>Ngày 20–25</b> — chuyển tiền hoàn vào tài khoản bạn</li>
      <li><b>Ngày 26</b> — thông báo hoàn tất</li>
      <li>Đơn được hoàn sau khi Shopee đối soát (~75–105 ngày)</li>
    </ul>
  </div>

  <div class="card refer">
    <h2>🎁 Giới thiệu bạn bè</h2>
    <p class="muted" style="margin:0 0 10px;text-align:left">Rủ bạn cùng mua hoàn tiền — cộng đồng deal càng mạnh, ưu đãi càng nhiều.</p>
    <button class="btn ghost" id="share" type="button">🔗 Chia sẻ Mushoplaho</button>
  </div>

  <div class="card faq">
    <h2>❓ Câu hỏi thường gặp</h2>
    <details><summary>Có mất phí không?</summary><p>Hoàn toàn miễn phí. Bạn chỉ dán link, mua như bình thường và nhận lại tiền.</p></details>
    <details><summary>Bao lâu thì nhận được tiền?</summary><p>Sau khi Shopee đối soát (~75–105 ngày), tiền hoàn chuyển vào ngày 20–25 hàng tháng.</p></details>
    <details><summary>Vì sao phải bấm link shop gửi trước khi mua?</summary><p>Link đó ghi nhận đơn của bạn để tính hoa hồng. Mua không qua link sẽ không được hoàn.</p></details>
    <details><summary>Hàng có chính hãng không?</summary><p>Bạn mua thẳng trên Shopee — sản phẩm, giá, bảo hành đều theo Shopee &amp; người bán.</p></details>
    <details><summary>Làm sao nhận tiền hoàn?</summary><p>Tham gia Nhóm Facebook, gửi ảnh đơn + STK ngân hàng. Shop đối chiếu và chuyển theo lịch.</p></details>
  </div>

  <div class="card" style="text-align:center">
    <h2 style="justify-content:center">👥 Nhận tiền hoàn của bạn</h2>
    <p class="muted" style="margin:0 0 14px">Tham gia Nhóm để gửi đơn &amp; nhận tiền hoàn. Cộng đồng cập nhật deal hot mỗi ngày!</p>
    <a class="btn group" id="grp" href="${FB_GROUP}" target="_blank" rel="noopener">Tham gia Nhóm nhận hoàn tiền</a>
  </div>

  <footer>
    Mushoplaho · Mua Là Hoàn · Sản phẩm chính hãng từ Shopee<br>
    Mọi giao dịch &amp; bảo hành theo chính sách của Shopee &amp; người bán.
  </footer>
</div>
<div class="toast" id="toast"></div>

<script>
var API=location.origin+'/';var $=function(id){return document.getElementById(id)};
var go=$('go'),url=$('url'),contact=$('contact'),res=$('result'),buy=$('buy'),err=$('err'),toast=$('toast');
var UID=(function(){try{var u=localStorage.getItem('mlh_uid');if(!u){u='d'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);localStorage.setItem('mlh_uid',u)}return u}catch(e){return 'd0'}})();
try{var sc=localStorage.getItem('mlh_contact');if(sc)contact.value=sc}catch(e){}
function loadWallet(){
  var c='';try{c=localStorage.getItem('mlh_contact')||''}catch(e){}
  var q=(c&&c.length>=4)?c:('dev:'+UID);
  fetch('/track-lookup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q:q})})
   .then(function(r){return r.json()}).then(function(d){var o=(d&&d.orders)||[];if(!o.length)return;
     $('wcount').textContent='('+o.length+' đơn)';
     $('walletlist').innerHTML=o.slice(0,6).map(function(r){return '<div style="border-bottom:1px dashed #ffe3d6;padding:9px 0;font-size:14px"><b>'+(r.order_code||'')+'</b> — '+(r.status_label||'')+'<div class="mut">'+(r.platform||'')+' · '+(r.when||'')+'</div></div>'}).join('');
     $('wallet').style.display='block';}).catch(function(){});
}
function tst(m){toast.textContent=m;toast.classList.add('show');setTimeout(function(){toast.classList.remove('show')},1800)}
function fail(m){err.textContent=m;err.style.display='block'}
$('paste').addEventListener('click',function(){
  if(navigator.clipboard&&navigator.clipboard.readText){navigator.clipboard.readText().then(function(t){url.value=(t||'').trim();url.focus()}).catch(function(){tst('Hãy dán tay vào ô nhé')});}
  else tst('Hãy dán tay vào ô nhé');
});
go.addEventListener('click',function(){
  err.style.display='none';res.style.display='none';
  var u=(url.value||'').trim(),c=(contact.value||'').trim();
  if(!/^https?:\\/\\//.test(u)){fail('Bạn hãy dán 1 link sản phẩm Shopee hợp lệ nhé.');return}
  var old=go.textContent;go.innerHTML='<span class="spin"></span> Đang tạo link...';go.disabled=true;
  fetch(API+'shop-convert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:u,contact:c,uid:UID})})
   .then(function(r){return r.json()})
   .then(function(d){go.textContent=old;go.disabled=false;
     if(d&&d.buy_url){buy.href=d.buy_url;buy.dataset.link=d.buy_url;$('ocode').textContent=d.order_code||'';
       if(d.order_code)$('tolink').href='/track?q='+encodeURIComponent(d.order_code);
       if(c)try{localStorage.setItem('mlh_contact',c)}catch(e){}
       res.style.display='block';res.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(loadWallet,1000)}
     else fail((d&&d.error)||'Chưa tạo được link, bạn thử lại nhé.')})
   .catch(function(){go.textContent=old;go.disabled=false;fail('Lỗi mạng, thử lại sau nhé.')});
});
$('copy').addEventListener('click',function(){var l=buy.dataset.link||buy.href;
  if(navigator.clipboard){navigator.clipboard.writeText(l).then(function(){tst('Đã sao chép link ✅')}).catch(function(){tst(l)})}else tst(l);});
url.addEventListener('keydown',function(e){if(e.key==='Enter')contact.focus()});
contact.addEventListener('keydown',function(e){if(e.key==='Enter')go.click()});
var cv=$('calcv');
if(cv)cv.addEventListener('input',function(){var v=parseInt((cv.value||'').replace(/\\D/g,''),10)||0;
  if(v<1000){$('calcout').textContent='Nhập giá đơn để xem số tiền có thể hoàn 💸';return}
  var lo=Math.round(v*0.02),hi=Math.round(v*0.07);
  $('calcout').innerHTML='Có thể hoàn ≈ <b>'+lo.toLocaleString('vi-VN')+'đ – '+hi.toLocaleString('vi-VN')+'đ</b>';});
var sh=$('share');
if(sh)sh.addEventListener('click',function(){var u=location.origin;
  if(navigator.share){navigator.share({title:'Mushoplaho — Mua Là Hoàn',text:'Mua Shopee nhận lại tiền!',url:u}).catch(function(){})}
  else if(navigator.clipboard){navigator.clipboard.writeText(u).then(function(){tst('Đã sao chép link ✅')})}else tst(u);});
fetch(API+'shop-stats').then(function(r){return r.json()}).then(function(d){var n=(d&&d.count!=null)?d.count:0;if(n<50)n=50+n;
  $('proof').textContent='🔥 Đã tạo '+n.toLocaleString('vi-VN')+' link hoàn tiền cho khách';})
 .catch(function(){$('proof').textContent='🔥 Cộng đồng hoàn tiền đang lớn mỗi ngày'});
loadWallet();
<\/script>
</body>
</html>`;

const TRACK_HTML = `<!doctype html>
<html lang="vi"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#FF6B4A"><title>Tra cứu đơn - Mushoplaho</title>
<style>
  :root{--o1:#FF9F45;--o2:#FF5C7A;--bg:#fff6f1;--ink:#2b2b2b;--mut:#8a8a8a}
  *{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,"Segoe UI",Roboto,Arial,sans-serif;background:var(--bg);color:var(--ink);line-height:1.5}
  .wrap{max-width:600px;margin:0 auto;padding:0 15px 40px}
  header{background:linear-gradient(135deg,var(--o1),var(--o2));color:#fff;text-align:center;padding:30px 16px;border-radius:0 0 30px 30px}
  header h1{font-size:22px;font-weight:800}
  .card{background:#fff;border-radius:20px;box-shadow:0 6px 22px rgba(255,110,80,.13);padding:20px;margin-top:18px}
  input{width:100%;padding:14px 15px;border:2px solid #ffd9c9;border-radius:14px;font-size:16px;outline:none}
  input:focus{border-color:var(--o1)}
  .btn{display:block;width:100%;text-align:center;border:none;cursor:pointer;font-size:17px;font-weight:800;color:#fff;background:linear-gradient(135deg,var(--o1),var(--o2));padding:15px;border-radius:14px;margin-top:12px}
  .row{border-bottom:1px dashed #ffe3d6;padding:12px 0;font-size:15px}.row:last-child{border:none}
  .st{font-weight:700}.mut{color:var(--mut);font-size:13px}
  a.link{color:#FF6B3D;font-weight:700;text-decoration:none;display:inline-block;margin-top:14px}
</style></head><body>
<header><h1>🔎 Tra cứu đơn hoàn tiền</h1></header>
<div class="wrap">
  <div class="card">
    <input id="q" placeholder="Nhập MÃ ĐƠN (MLH-...) hoặc SĐT/Facebook" autocomplete="off">
    <button class="btn" id="go">Tra cứu</button>
    <div id="out" style="margin-top:8px"></div>
    <a class="link" href="/">← Về trang tạo link</a>
  </div>
</div>
<script>
var $=function(i){return document.getElementById(i)};var out=$('out');
function render(rows){
  if(!rows.length){out.innerHTML='<p class="mut" style="margin-top:12px">Không tìm thấy đơn. Kiểm tra lại mã/SĐT nhé.</p>';return}
  out.innerHTML=rows.map(function(r){return '<div class="row"><div class="st">'+(r.order_code||'(chưa có mã)')+' — '+r.status_label+'</div><div class="mut">'+(r.platform||'')+' · '+(r.when||'')+'</div></div>';}).join('')
   +'<p class="mut" style="margin-top:12px">💸 Lịch hoàn: ngày 20–25 hàng tháng, sau khi Shopee đối soát (~75–105 ngày).</p>';
}
function look(){var q=($('q').value||'').trim();if(q.length<4){out.innerHTML='<p class="mut" style="margin-top:12px">Nhập mã đơn hoặc SĐT nhé.</p>';return}
  out.innerHTML='<p class="mut" style="margin-top:12px">Đang tra...</p>';
  fetch('/track-lookup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q:q})})
   .then(function(r){return r.json()}).then(function(d){render((d&&d.orders)||[])})
   .catch(function(){out.innerHTML='<p class="mut">Lỗi, thử lại sau.</p>'});}
$('go').addEventListener('click',look);$('q').addEventListener('keydown',function(e){if(e.key==='Enter')look()});
var qs=new URLSearchParams(location.search).get('q');if(qs){$('q').value=qs;look()}
<\/script>
</body></html>`;

const ADMIN_HTML = `<!doctype html>
<html lang="vi"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Admin - Mushoplaho</title>
<style>
  :root{--o1:#FF9F45;--o2:#FF5C7A;--bg:#f4f6fb;--ink:#222;--mut:#888}
  *{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,"Segoe UI",Roboto,Arial,sans-serif;background:var(--bg);color:var(--ink)}
  header{background:linear-gradient(135deg,var(--o1),var(--o2));color:#fff;padding:18px 16px;font-weight:800;font-size:18px}
  .wrap{max-width:960px;margin:0 auto;padding:16px}
  .card{background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.06);padding:16px;margin-top:14px}
  input,select,button{font-size:15px;padding:9px 11px;border:1px solid #d7dce5;border-radius:8px;outline:none}
  input:focus,select:focus{border-color:var(--o1)}
  button{background:var(--o2);color:#fff;border:none;font-weight:700;cursor:pointer}
  button.sm{padding:6px 10px;font-size:13px}
  table{width:100%;border-collapse:collapse;font-size:14px}
  th,td{text-align:left;padding:9px 8px;border-bottom:1px solid #eef1f6;vertical-align:middle}
  th{color:var(--mut);font-size:12px;text-transform:uppercase;letter-spacing:.4px}
  .mut{color:var(--mut);font-size:13px}
  .bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  a{color:var(--o2)}
  .ov{overflow-x:auto}
  .st-paid{color:#039855;font-weight:700}
</style></head><body>
<header>🔐 Mushoplaho Admin</header>
<div class="wrap">
  <div class="card" id="login">
    <div class="bar"><input id="pass" type="password" placeholder="Mật khẩu admin" style="flex:1;min-width:200px">
    <button id="btnLogin">Đăng nhập</button></div>
    <p class="mut" id="lerr" style="margin-top:8px;color:#d92d20"></p>
  </div>
  <div class="card" id="panel" style="display:none">
    <div class="bar" style="justify-content:space-between">
      <div><b id="cnt">0</b> đơn · <span class="mut">mới nhất trước</span></div>
      <div class="bar"><input id="filter" placeholder="Lọc mã/SĐT/sàn" style="width:200px"><button class="sm" id="reload">Tải lại</button></div>
    </div>
    <div class="ov"><table id="tbl"><thead><tr>
      <th>Mã đơn</th><th>Liên hệ</th><th>STK ngân hàng</th><th>Sàn</th><th>Trạng thái</th><th>Ghi chú</th><th></th><th>Link</th>
    </tr></thead><tbody></tbody></table></div>
  </div>
</div>
<script>
var $=function(i){return document.getElementById(i)};var PASS='';
var STATUSES=[['notified','Chờ mua'],['purchased','Đã mua'],['confirmed','Đối soát'],['paid','Đã hoàn'],['cancelled','Huỷ']];
function opts(cur){return STATUSES.map(function(s){return '<option value="'+s[0]+'"'+((s[0]===cur||(cur==='web'&&s[0]==='notified'))?' selected':'')+'>'+s[1]+'</option>'}).join('')}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function login(){PASS=$('pass').value;$('lerr').textContent='';load(true)}
function load(first){
  fetch('/admin-list',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pass:PASS})})
   .then(function(r){if(r.status===401){throw new Error('Sai mật khẩu')}return r.json()})
   .then(function(d){$('login').style.display='none';$('panel').style.display='block';render(d.orders||[])})
   .catch(function(e){if(first)$('lerr').textContent=e.message||'Lỗi'});
}
function render(rows){
  window._rows=rows;var f=($('filter').value||'').toLowerCase();
  var list=rows.filter(function(r){return !f||((r.order_code||'')+ (r.contact||'')+(r.platform||'')).toLowerCase().indexOf(f)>=0});
  $('cnt').textContent=list.length;
  $('tbl').tBodies[0].innerHTML=list.map(function(r){
    var d=r.created_at?String(r.created_at).slice(0,10):'';
    return '<tr><td><b>'+esc(r.order_code)+'</b><div class="mut">'+d+'</div></td><td>'+esc(r.contact)+'</td>'
      +'<td><input class="stk" data-c="'+esc(r.order_code)+'" value="'+esc(r.bank_info)+'" placeholder="STK / NH / tên" style="width:160px"></td>'
      +'<td>'+esc(r.platform)+'</td>'
      +'<td><select data-c="'+esc(r.order_code)+'">'+opts(r.status)+'</select></td>'
      +'<td><input class="note" data-c="'+esc(r.order_code)+'" value="'+esc(r.admin_note)+'" placeholder="ghi chú" style="width:120px"></td>'
      +'<td><button class="sm" data-save="'+esc(r.order_code)+'">Lưu</button></td>'
      +'<td><a href="'+esc(r.original_url)+'" target="_blank">xem</a></td></tr>';
  }).join('');
  Array.prototype.forEach.call(document.querySelectorAll('[data-save]'),function(b){b.onclick=function(){
    var code=b.getAttribute('data-save');var sel=document.querySelector('select[data-c="'+code+'"]');
    var stk=document.querySelector('input.stk[data-c="'+code+'"]');var note=document.querySelector('input.note[data-c="'+code+'"]');
    b.textContent='...';fetch('/admin-update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pass:PASS,order_code:code,status:sel.value,bank_info:stk?stk.value:undefined,admin_note:note?note.value:undefined})})
     .then(function(r){return r.json()}).then(function(d){b.textContent=d.ok?'✓':'lỗi';setTimeout(function(){b.textContent='Lưu'},1200)});
  }});
}
$('btnLogin').onclick=login;$('pass').addEventListener('keydown',function(e){if(e.key==='Enter')login()});
$('reload').onclick=function(){load(false)};$('filter').addEventListener('input',function(){render(window._rows||[])});
<\/script>
</body></html>`;

function html(body) { return new Response(body, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }); }
function json(obj, status) { return new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }); }

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Messenger verify (GET) + landing
    if (request.method === 'GET' && (path === '/webhook' || path === '/')) {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      if (mode === 'subscribe' && token && token === env.FB_VERIFY_TOKEN) return new Response(challenge, { status: 200 });
      if (path === '/') return html(SHOP_HTML);
      return new Response('Forbidden', { status: 403 });
    }

    // Messenger events (POST)
    if (request.method === 'POST' && (path === '/webhook' || path === '/')) {
      const body = await request.json().catch(() => ({}));
      const entries = (body && body.entry) || [];
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

    if (request.method === 'GET' && path === '/shop') return html(SHOP_HTML);
    if (request.method === 'GET' && path === '/track') return html(TRACK_HTML);

    // Web tạo link: BẮT BUỘC contact + sinh mã đơn
    if (request.method === 'POST' && path === '/shop-convert') {
      const body = await request.json().catch(() => ({}));
      const u = (body.url || '').trim();
      const contactRaw = (body.contact || '').trim();
      const uid = (body.uid || '').trim().slice(0, 40);
      if (!/^https?:\/\//.test(u)) return json({ error: 'Link không hợp lệ' }, 400);
      // Lien he tuy chon: neu khong nhap thi gan theo device-id (van tra cuu duoc)
      const contact = contactRaw.length >= 4 ? contactRaw : (uid ? 'dev:' + uid : 'web');
      const { platform, aff } = await makeAffiliate(u, env);
      const code = genOrderCode();
      await supabaseInsert({ buyer_psid: 'web', buyer_text: 'web', contact, order_code: code, original_url: u, platform, affiliate_url: aff, status: 'web' }, env);
      return json({ buy_url: aff, order_code: code });
    }

    // Tra cứu đơn
    if (request.method === 'POST' && path === '/track-lookup') {
      const body = await request.json().catch(() => ({}));
      const rows = await supabaseFind((body.q || ''), env);
      const orders = rows.map(r => ({
        order_code: r.order_code, platform: r.platform, status_label: statusLabel(r.status),
        when: r.created_at ? String(r.created_at).slice(0, 10) : ''
      }));
      return json({ orders });
    }

    // Admin: trang + list + update trang thai (bao ve bang ADMIN_TOKEN)
    if (request.method === 'GET' && path === '/admin') return html(ADMIN_HTML);
    if (request.method === 'POST' && path === '/admin-list') {
      const body = await request.json().catch(() => ({}));
      if (!checkAdmin(body.pass, env)) return json({ error: 'unauthorized' }, 401);
      return json({ orders: await supabaseList(env, 100) });
    }
    if (request.method === 'POST' && path === '/admin-update') {
      const body = await request.json().catch(() => ({}));
      if (!checkAdmin(body.pass, env)) return json({ error: 'unauthorized' }, 401);
      return json({ ok: await supabaseUpdate(body.order_code, body, env) });
    }

    // Social proof counter
    if (request.method === 'GET' && path === '/shop-stats') {
      let count = 0;
      try {
        const r = await fetch(env.SUPABASE_URL + '/rest/v1/submissions?select=id', {
          headers: { apikey: env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY, 'Prefer': 'count=exact', 'Range': '0-0' }
        });
        const cr = r.headers.get('content-range') || '';
        const m = cr.match(/\/(\d+)/);
        if (m) count = parseInt(m[1], 10);
      } catch (e) { /* ignore */ }
      return json({ count });
    }

    return new Response('Not found', { status: 404 });
  }
};
