// Mushoplaho — Cloudflare Worker (bản nâng cấp CHUYỂN ĐỔI + GIỮ CHÂN)
// Thêm so với bản live: bắt liên hệ (web), sinh Mã đơn, trang /track tra cứu, bot check đơn thật.
// Env secrets: FB_PAGE_TOKEN, FB_VERIFY_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY,
//              ACCESSTRADE_TOKEN, AT_CAMPAIGN_SHOPEE, AT_CAMPAIGN_TIKTOK, AT_CAMPAIGN_LAZADA
// Cần cột Supabase submissions: order_code text, contact text (ngoài các cột sẵn có).

import { ICON192, ICON512, OG, OG2, OG3 } from './icons.js';
import { sendWebPush } from './webpush.js';

const VAPID_PUBLIC = 'BGNY3uTCFDGgY6g5UyFMrLmwnRXmWWXAroYoqYrIypZbJ-87xho81HsRNHE9NsQvwY96ADXiAtRPSVIAGyJJfFQ';
const FB_GROUP = 'https://www.facebook.com/groups/1693634255519569';
const PAYOUT = 'Thời gian hoàn: TikTok ~30–45 ngày, Shopee ~2–3 tháng (sau khi sàn đối soát); shop chuyển ngày 20–25 hàng tháng.';

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
⏱ Thời gian: TikTok ~30–45 ngày · Shopee ~2–3 tháng (sau khi sàn đối soát đơn).`,
  rules:
`📋 NỘI QUY HOÀN TIỀN
✅ Phải bấm link shop gửi TRƯỚC khi mua
✅ Bấm link rồi chọn hàng & thanh toán ngay trong phiên (đừng để sẵn hàng trong giỏ)
✅ Đơn không hủy/hoàn trong 7 ngày
❌ Không tự mua gian lận, không đặt hộ
⏱ Hoàn sau khi sàn đối soát: TikTok ~30–45 ngày · Shopee ~2–3 tháng`,
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
  if (/tiktok|douyin|vt\.tiktok/i.test(url)) return 'tiktok';
  if (/lazada/i.test(url)) return 'lazada';
  // Shopee: gom ca link rut gon shp.ee / s.shopee ; shop chi Shopee nen mac dinh = shopee (khong de "unknown" mat hoa hong)
  return 'shopee';
}

function genOrderCode() {
  const a = Date.now().toString(36).slice(-4).toUpperCase();
  const b = Math.floor(Math.random() * 46656).toString(36).toUpperCase().padStart(3, '0');
  return 'MLH-' + a + b;
}

// Lay product_id tu link TikTok Shop (bat buoc cho endpoint product_feeds)
function extractTiktokPid(u) {
  const s = String(u || '');
  const m = s.match(/product\/(\d{6,})/i) || s.match(/[?&]product_id=(\d{6,})/i) || s.match(/\/(\d{12,})(?:[/?]|$)/);
  return m ? m[1] : '';
}

// TikTok Shop: PHAI dung endpoint tiktokshop_product_feeds/create_link (link product-feeds MOI duoc ghi nhan hoa hong).
// Endpoint product_link/create generic tao link co sub5=pub-api -> campaign KHONG tinh tien.
async function makeTiktokAff(url, env, utmContent) {
  let full = url, pid = extractTiktokPid(url);
  if (!pid && /vt\.tiktok|vm\.tiktok|tiktok\.com\/t\//i.test(url)) {   // link rut gon -> follow redirect THU CONG lay product_id
    const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
    let cur = url;
    for (let i = 0; i < 5 && !pid; i++) {
      let r; try { r = await fetch(cur, { redirect: 'manual', headers: { 'User-Agent': UA } }); } catch (e) { break; }
      const loc = r.headers.get('location');
      if (loc) { cur = loc.indexOf('http') === 0 ? loc : new URL(loc, cur).toString(); pid = extractTiktokPid(cur); full = cur; }
      else { if (r.url && extractTiktokPid(r.url)) { full = r.url; pid = extractTiktokPid(r.url); } break; }
    }
  }
  if (!pid) return url;   // khong lay duoc product_id -> tra link goc (khong cashback, khong crash)
  try {
    const body = { product_url: full, product_id: pid };
    if (utmContent) body.utm_content = utmContent;
    const r = await fetch('https://api.accesstrade.vn/v1/tiktokshop_product_feeds/create_link', {
      method: 'POST',
      headers: { 'Authorization': 'Token ' + env.ACCESSTRADE_TOKEN, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body)
    });
    const txt = await r.text();
    let j = {}; try { j = JSON.parse(txt); } catch (e) { }
    if (j && j.status && j.data) return j.data.aff_short_url || j.data.aff_url || url;
  } catch (e) { /* fallback link goc */ }
  return url;
}

async function makeAffiliate(url, env, utmContent) {
  const platform = detectPlatform(url);
  const TOKEN = env.ACCESSTRADE_TOKEN || '';
  if (!TOKEN || !/^https?:/.test(url)) return { platform, aff: url };
  if (platform === 'tiktok') return { platform, aff: await makeTiktokAff(url, env, utmContent) };
  // Shopee (va default) / Lazada: endpoint generic product_link/create
  const cid = platform === 'lazada' ? (env.AT_CAMPAIGN_LAZADA || '') : (env.AT_CAMPAIGN_SHOPEE || '');
  let aff = url;
  if (cid) {
    try {
      const payload = { campaign_id: cid, urls: [url] };
      if (utmContent) payload.utm_content = utmContent;   // nhet ma don -> khop lai o /v1/transactions
      const r = await fetch('https://api.accesstrade.vn/v1/product_link/create', {
        method: 'POST',
        headers: { 'Authorization': 'Token ' + TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const j = await r.json().catch(() => ({}));
      const d = j && j.data;
      if (d && Array.isArray(d.success_link) && d.success_link[0]) aff = d.success_link[0].short_link || d.success_link[0].aff_link || url;
      else if (Array.isArray(d) && d[0]) aff = d[0].short_link || d[0].aff_link || url;
    } catch (e) { /* fallback link gốc */ }
  }
  return { platform, aff };
}

// 15 ban noi dung xoay vong (dang Page moi ngay, khac goc do)
const SITE_URL = 'mushoplaho.kientlt59.workers.dev';
const CONTENT_BANK = [
  `🔥 MẸO MUA SHOPEE ĐƯỢC HOÀN LẠI TIỀN\n\nMua đồ như bình thường, qua 1 bước nhỏ là được hoàn tới 50% hoa hồng của đơn về tài khoản 💸\n👉 Dán link sản phẩm vào: ${SITE_URL}\nMiễn phí, không cần cài app. Ai hay mua Shopee lưu lại nhé!`,
  `Bạn có biết: mỗi đơn Shopee bạn mua đều có một khoản hoa hồng — và bạn có thể lấy lại 50% khoản đó về túi mình 😮\nCách làm 5 giây 👉 ${SITE_URL}`,
  `💬 "Mua Shopee mà được hoàn tiền thật hả?" — Thật nha!\nDán link sản phẩm → nhận link hoàn tiền → mua như thường → tiền hoàn về STK.\nThử đi: ${SITE_URL}`,
  `🛒 Sắp tới sale lớn Shopee rồi!\nTrước khi bấm mua, ghé đây lấy link hoàn tiền để được hoàn thêm 50% hoa hồng nhé 👉 ${SITE_URL}\nMiễn phí, mua bao nhiêu hoàn bấy nhiêu 💸`,
  `So sánh nhanh:\n❌ Mua Shopee bình thường → mất trắng khoản hoa hồng\n✅ Mua qua ${SITE_URL} → hoàn lại 50% về tài khoản\nCùng 1 sản phẩm, cùng 1 giá — chỉ khác 1 bước 😉`,
  `📋 3 bước nhận tiền hoàn:\n1️⃣ Copy link sản phẩm Shopee\n2️⃣ Dán vào ${SITE_URL}\n3️⃣ Bấm "Mở Shopee & mua"\n→ Tiền hoàn về STK theo lịch. Đơn giản vậy thôi!`,
  `Tháng này mua sắm nhiều đúng không 🙈\nĐừng để phí — mỗi đơn Shopee lấy lại được 50% hoa hồng đó.\nGhé ${SITE_URL} dán link là xong 💸`,
  `🎁 Miễn phí 100% — không cài app, không đăng nhập, không lằng nhằng.\nDán link Shopee → nhận link hoàn tiền → mua → nhận lại tiền.\n${SITE_URL}`,
  `Ai hay mua đồ skincare / thời trang / đồ gia dụng trên Shopee điểm danh 🙋\nMua qua ${SITE_URL} để được hoàn lại 50% hoa hồng mỗi đơn nhé, tiếc gì mà không thử 💸`,
  `Người ta mua Shopee xong là hết chuyện.\nBạn mua Shopee xong còn được... hoàn lại tiền 😎\nBí quyết: ${SITE_URL}`,
  `❓ Hỏi: Có mất phí gì không?\n✅ Đáp: KHÔNG. Hoàn toàn miễn phí. Bạn chỉ mua như bình thường và nhận lại % tiền.\nLàm thử: ${SITE_URL}`,
  `Lương về là muốn "quẩy" Shopee ngay 💳\nMua thông minh hơn: qua ${SITE_URL} để hoàn lại 50% hoa hồng mỗi đơn. Mua sướng tay mà vẫn tiết kiệm 💸`,
  `🔎 Đã mua qua link hoàn tiền? Nhớ lưu MÃ ĐƠN để tra cứu tiền hoàn bất cứ lúc nào nhé!\nChưa thử? Bắt đầu tại ${SITE_URL}`,
  `Rủ hội chị em cùng "săn sale + hoàn tiền" cho vui 👯\nAi cũng mua Shopee, sao không cùng lấy lại tiền?\n${SITE_URL}`,
  `💸 Mua Là Hoàn — dán link Shopee, nhận lại đến 50% hoa hồng.\nMiễn phí • Không cài app • Tra cứu minh bạch.\nBắt đầu ngay: ${SITE_URL}`
];

async function autoPostToday(env) {
  const token = env.FB_PAGE_POST_TOKEN;
  if (!token) return { ok: false, error: 'no token' };
  const day = Math.floor(Date.now() / 86400000);
  const msg = CONTENT_BANK[day % CONTENT_BANK.length];
  const imgs = ['/og.png', '/og2.png', '/og3.png'];
  const imgUrl = 'https://' + SITE_URL + imgs[day % 3];
  try {
    const form = new URLSearchParams({ url: imgUrl, caption: msg, access_token: token });
    const r = await fetch('https://graph.facebook.com/v19.0/1240334605834446/photos', { method: 'POST', body: form });
    const j = await r.json().catch(() => ({}));
    return j.id ? { ok: true, id: j.id } : { ok: false, error: (j.error && j.error.message) || 'err' };
  } catch (e) { return { ok: false, error: String(e) }; }
}

// Dang 1 DEAL HOT that (san pham Shopee giam gia) len Page
async function postHotDeal(env) {
  if (!env.FB_PAGE_POST_TOKEN) return { ok: false, error: 'no token' };
  try {
    const r = await fetch('https://api.accesstrade.vn/v1/datafeeds?merchant=shopee&limit=50', { headers: { 'Authorization': 'Token ' + (env.ACCESSTRADE_TOKEN || '') } });
    const j = await r.json().catch(() => ({}));
    let items = ((j && j.data) || []).filter(p => p && p.image && p.aff_link && p.name);
    items.sort((a, b) => (b.discount_rate || 0) - (a.discount_rate || 0));
    if (!items.length) return { ok: false, error: 'no deals' };
    const idx = Math.floor(Date.now() / 3600000) % Math.min(items.length, 25);
    const p = items[idx];
    const price = (parseInt(p.price, 10) || 0).toLocaleString('vi-VN');
    const disc = Math.round(p.discount_rate || 0);
    const caption = `🔥 DEAL HOT HÔM NAY 🔥\n${p.name}\n💰 Giá: ${price}đ${disc > 0 ? ` — GIẢM ${disc}%` : ''}${p.shop_name ? `\n🏪 ${p.shop_name}` : ''}\n\n💸 Mua qua Mushoplaho để được HOÀN 50% hoa hồng!\n👉 Dán link vào: mushoplaho.kientlt59.workers.dev\nHoặc mua ngay: ${p.aff_link}\n\n#dealhot #shopee #hoantien #sansale`;
    const form = new URLSearchParams({ url: p.image, caption, access_token: env.FB_PAGE_POST_TOKEN });
    const fr = await fetch('https://graph.facebook.com/v19.0/1240334605834446/photos', { method: 'POST', body: form });
    const fj = await fr.json().catch(() => ({}));
    if (fj.id) { const pushed = await pushAllDeal(env, p); return { ok: true, id: fj.id, product: p.name, pushed }; }
    return { ok: false, error: (fj.error && fj.error.message) || 'err' };
  } catch (e) { return { ok: false, error: String(e) }; }
}

// Day push "deal hot / flash-sale" den TAT CA nguoi da bat thong bao (nut "Bao khi tien ve")
async function pushAllDeal(env, product) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return 0;
  try {
    const r = await fetch(env.SUPABASE_URL + '/rest/v1/push_subs?select=sub&limit=5000', { headers: { apikey: env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY } });
    const subs = await r.json().catch(() => []);
    const disc = Math.round((product && product.discount_rate) || 0);
    const name = (product && product.name) ? String(product.name).slice(0, 60) : 'Deal hot hôm nay';
    const payload = JSON.stringify({ title: '🔥 DEAL HOT — mua là hoàn 50%!', body: name + (disc > 0 ? ` (giảm ${disc}%)` : '') + ' — đặt qua Mushoplaho để được hoàn tiền 💸', url: '/' });
    let n = 0;
    for (const s of (Array.isArray(subs) ? subs : [])) { if (s.sub) { try { await sendWebPush(s.sub, payload, VAPID_PUBLIC, env.VAPID_PRIVATE, env.VAPID_SUBJECT); n++; } catch (e) { } } }
    return n;
  } catch (e) { return 0; }
}

// Deal hot: tu dong keo tu AccessTrade datafeeds (Shopee) + cache 30'
async function dealsResponse(env, ctx) {
  const cache = caches.default;
  const cacheKey = new Request('https://mushoplaho-cache/deals-v1');
  const hit = await cache.match(cacheKey);
  if (hit) return hit;
  let items = [];
  try {
    const r = await fetch('https://api.accesstrade.vn/v1/datafeeds?merchant=shopee&limit=50', {
      headers: { 'Authorization': 'Token ' + (env.ACCESSTRADE_TOKEN || '') }
    });
    const j = await r.json().catch(() => ({}));
    const data = (j && j.data) || [];
    items = data.filter(p => p && p.image && p.aff_link && p.url)
      .map(p => ({ name: p.name, image: p.image, price: p.price, ori: p.url, aff: p.aff_link, discount_rate: Math.round(p.discount_rate || 0) }))
      .sort((a, b) => (b.discount_rate || 0) - (a.discount_rate || 0))
      .slice(0, 40);
  } catch (e) { /* ignore */ }
  const resp = new Response(JSON.stringify({ deals: items }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' }
  });
  ctx.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
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

// Ghi 1 su kien pheu (visit / buy_click). Bang: events(id, type, uid, created_at)
async function evInsert(type, uid, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return;
  try {
    await fetch(env.SUPABASE_URL + '/rest/v1/events', {
      method: 'POST',
      headers: { apikey: env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ type, uid: (uid || '').slice(0, 40) })
    });
  } catch (e) { /* ignore */ }
}

// Dem so dong khop filter (dung count=exact header)
async function supabaseCount(pathQuery, env) {
  try {
    const r = await fetch(env.SUPABASE_URL + pathQuery, { headers: { apikey: env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY, 'Prefer': 'count=exact', 'Range': '0-0' } });
    const cr = r.headers.get('content-range') || ''; const m = cr.match(/\/(\d+)/); return m ? parseInt(m[1], 10) : 0;
  } catch (e) { return 0; }
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
    const r = await fetch(env.SUPABASE_URL + `/rest/v1/submissions?select=*&order=id.desc&limit=${limit || 50}`, {
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

// Chi update neu chua 'paid' (auto-sync khong duoc ha cap don da hoan cho khach). Ghi ca cashback (tien user = 50% hoa hong).
async function syncSetStatusCashback(orderCode, status, cashback, commission, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY || !orderCode) return false;
  const patch = { status };
  if (cashback != null && !isNaN(cashback)) patch.cashback = cashback;
  if (commission != null && !isNaN(commission)) patch.commission = commission;
  const url = env.SUPABASE_URL + `/rest/v1/submissions?order_code=eq.${encodeURIComponent(orderCode)}&status=neq.paid`;
  const hdr = { apikey: env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' };
  try {
    let r = await fetch(url, { method: 'PATCH', headers: hdr, body: JSON.stringify(patch) });
    // Neu cot cashback/commission chua ton tai -> PATCH 400: thu lai chi voi status (khong regress sync)
    if (!r.ok && (patch.cashback !== undefined || patch.commission !== undefined)) {
      r = await fetch(url, { method: 'PATCH', headers: hdr, body: JSON.stringify({ status }) });
    }
    return r.ok;
  } catch (e) { return false; }
}

// Ti le user duoc huong tren hoa hong publisher (0.5 = hoan 50%)
const CASHBACK_RATE = 0.5;

// Dong bo status + TIEN HOAN tu AccessTrade /v1/transactions (khop utm_content = order_code)
// status AT: 0 hold -> 'purchased', 1 approved -> 'confirmed', 2 rejected -> 'cancelled'. 'paid' (da chuyen khach) van thu cong.
// 1 order_code co the co nhieu dong giao dich (nhieu san pham) -> GOM lai + cong hoa hong.
async function syncAccessTrade(env) {
  const TOKEN = env.ACCESSTRADE_TOKEN;
  if (!TOKEN) return { updated: 0, seen: 0 };
  const until = new Date();
  const since = new Date(until.getTime() - 120 * 24 * 3600 * 1000);
  const iso = d => d.toISOString().slice(0, 19) + 'Z';
  let updated = 0, seen = 0;
  try {
    const r = await fetch(`https://api.accesstrade.vn/v1/transactions?since=${iso(since)}&until=${iso(until)}&limit=1000`, { headers: { 'Authorization': 'Token ' + TOKEN } });
    const j = await r.json().catch(() => ({}));
    const data = (j && j.data) || [];
    const agg = {};   // code -> { s:[status...], com:tong hoa hong }
    for (const t of data) {
      const code = t.utm_content;
      if (!code || !/^MLH-/i.test(code)) continue;
      seen++;
      // ten field hoa hong publisher co the khac tuy version -> thu nhieu ten
      const com = parseFloat(t.pub_commission != null ? t.pub_commission : (t.commission != null ? t.commission : (t.pub_commission_amount != null ? t.pub_commission_amount : 0))) || 0;
      if (!agg[code]) agg[code] = { s: [], com: 0 };
      agg[code].s.push(t.status);
      if (t.status !== 2) agg[code].com += com;   // don huy khong tinh tien
    }
    for (const code of Object.keys(agg)) {
      const a = agg[code];
      const status = a.s.indexOf(1) >= 0 ? 'confirmed' : (a.s.indexOf(0) >= 0 ? 'purchased' : 'cancelled');
      const commission = Math.round(a.com);
      const cashback = Math.round(a.com * CASHBACK_RATE);
      // Phat hien chuyen sang 'confirmed' LAN DAU -> tu nhac khach gui STK (chi push 1 lan nho check status cu)
      let prior = null;
      if (status === 'confirmed') { const rows = await supabaseFind(code, env); prior = (rows && rows[0]) || null; }
      if (await syncSetStatusCashback(code, status, cashback, commission, env)) {
        updated++;
        if (status === 'confirmed' && prior && prior.status !== 'confirmed' && prior.status !== 'paid') {
          const money = cashback > 0 ? ('~' + String(cashback).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ') : 'tiền hoàn';
          await notifyOrderRow(prior, '🎉 Đơn đã đối soát — tiền hoàn sắp về!', 'Đơn ' + code + ' đã được sàn đối soát. Gửi STK để shop chuyển ' + money + ' cho bạn 💸', '/track?q=' + code, env);
        }
      }
    }
  } catch (e) { /* ignore */ }
  return { updated, seen };
}

// Bot tu tra loi cau hoi thuong gap trong chat (khop tu khoa). Khong khop -> null (de admin tra loi).
function botReply(text) {
  // Bo dau tieng Viet de khop ca khi user go khong dau
  const t = (text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
  if (/\bphi\b|mat tien|free|mien phi|ton tien|co tinh phi|tinh phi|co ton/.test(t)) return 'Dạ hoàn toàn MIỄN PHÍ ạ 🥰 Bạn chỉ dán link, mua như bình thường và nhận lại tiền hoàn.';
  if (/bao lau|khi nao|may ngay|bao gio|lau khong|chung nao|luc nao|nhan tien khi/.test(t)) return FAQ.schedule;
  if (/cach mua|lam sao mua|mua the nao|mua sao|huong dan|mua nhu the/.test(t)) return FAQ.howto;
  if (/noi quy|dieu kien|quy dinh|luat le|nhu the nao moi duoc/.test(t)) return FAQ.rules;
  if (/stk|so tai khoan|ngan hang|nhan tien|rut tien|nhan hoan|hoan ve|chuyen khoan|so tk/.test(t)) return 'Bạn gửi giúp shop: SỐ TÀI KHOẢN + NGÂN HÀNG + TÊN chủ TK (kèm ảnh đơn nếu có) để shop chuyển tiền hoàn theo lịch (ngày 20–25 hàng tháng) nhé 💸';
  if (/^(chao|hi|hello|hey|alo|shop oi|e shop|xin chao)/.test(t)) return FAQ.greeting;
  if (/that khong|lua dao|\blua\b|uy tin|tin duoc|co that|scam|co lua/.test(t)) return 'Shop cam kết uy tín 🤝 Bạn mua thẳng trên Shopee (giá & bảo hành theo Shopee), shop hoàn lại % hoa hồng cho bạn. Có mã đơn tra cứu minh bạch nhé!';
  return null;
}

// Realtime: broadcast bao co tin moi (kenh theo thread + kenh admin)
async function broadcastMsg(thread, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return;
  try {
    await fetch(env.SUPABASE_URL + '/realtime/v1/api/broadcast', {
      method: 'POST',
      headers: { apikey: env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ topic: 'thread:' + thread, event: 'msg', payload: {} }, { topic: 'admin', event: 'msg', payload: { thread } }] })
    });
  } catch (e) { /* ignore */ }
}

async function chatInsert(row, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return;
  try {
    await fetch(env.SUPABASE_URL + '/rest/v1/messages', {
      method: 'POST',
      headers: { apikey: env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify(row)
    });
  } catch (e) { /* ignore */ }
}

async function chatHistory(thread, afterId, env) {
  if (!thread || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return [];
  let q = 'thread=eq.' + encodeURIComponent(thread) + '&order=id.asc&limit=200';
  if (afterId) q += '&id=gt.' + encodeURIComponent(afterId);
  try {
    const r = await fetch(env.SUPABASE_URL + '/rest/v1/messages?' + q, { headers: { apikey: env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY } });
    if (!r.ok) return [];
    return await r.json().catch(() => []);
  } catch (e) { return []; }
}

// Push khi shop tra loi chat (hoac 'paid') den cac thiet bi cua thread do
async function notifyThreadPush(thread, title, bodyText, env) {
  try {
    const uid = thread.indexOf('dev:') === 0 ? thread.slice(4) : '';
    const filter = uid ? ('uid=eq.' + encodeURIComponent(uid)) : ('contact=eq.' + encodeURIComponent(thread));
    const r = await fetch(env.SUPABASE_URL + '/rest/v1/push_subs?' + filter, { headers: { apikey: env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY } });
    const subs = await r.json().catch(() => []);
    const payload = JSON.stringify({ title: title, body: (bodyText || '').slice(0, 90), url: '/' });
    for (const s of subs) { if (s.sub) { try { await sendWebPush(s.sub, payload, VAPID_PUBLIC, env.VAPID_PRIVATE, env.VAPID_SUBJECT); } catch (e) { } } }
  } catch (e) { /* ignore */ }
}

function statusLabel(s) {
  const m = { notified: '🟡 Đã tạo link — chờ bạn mua', web: '🟡 Đã tạo link — chờ bạn mua',
    purchased: '🟢 Đã ghi nhận mua', confirmed: '🔵 Sàn đã đối soát', paid: '✅ Đã hoàn tiền' };
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
    const code = genOrderCode();
    const [, mk] = await Promise.all([sendTyping(psid, env), makeAffiliate(url, env, code)]);
    const { platform, aff } = mk;
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
<meta property="og:title" content="Mushoplaho — Mua Shopee, nhận lại đến 50% hoa hồng 💸">
<meta property="og:description" content="Dán link Shopee → nhận link hoàn tiền. Miễn phí, không cần cài app. Hoàn 50% hoa hồng về tài khoản bạn!">
<meta property="og:type" content="website">
<meta property="og:image" content="https://mushoplaho.kientlt59.workers.dev/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/icon-192.png">
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<style>
  :root{--o1:#FF9F45;--o2:#FF5C7A;--g1:#12b76a;--g2:#039855;--bg:#fff6f1;--ink:#2b2b2b;--mut:#8a8a8a}
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
  body{font-family:-apple-system,"Segoe UI",Roboto,Arial,sans-serif;background:var(--bg);color:var(--ink);line-height:1.5}
  .wrap{max-width:600px;margin:0 auto;padding:0 15px 96px}
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
  .hero-box{background:#fff;border-radius:18px;padding:14px;margin-top:16px;box-shadow:0 10px 28px rgba(0,0,0,.20);text-align:left}
  .hero-box .btn{margin-top:10px}
  .hero-box input{color:#2b2b2b}
  .deals{display:flex;gap:10px;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch}
  .deal{flex:0 0 148px;background:#fff;border:1px solid #ffe1d4;border-radius:14px;overflow:hidden;text-decoration:none;color:var(--ink)}
  .deal img{width:100%;height:148px;object-fit:cover;display:block;background:#f4f4f4}
  .deal .dbody{padding:8px}
  .deal .dname{font-size:12px;line-height:1.3;height:31px;overflow:hidden;font-weight:600}
  .deal .dprice{color:#FF4E73;font-weight:800;font-size:14px;margin-top:4px}
  .deal .ddisc{display:inline-block;background:#ffeaf0;color:#FF4E73;font-size:11px;font-weight:700;border-radius:6px;padding:1px 6px;margin-top:4px}
  .fab{position:fixed;right:16px;bottom:20px;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--o1),var(--o2));color:#fff;font-size:26px;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(255,90,110,.45);cursor:pointer;z-index:20}
  .sheet-bg{position:fixed;inset:0;background:rgba(0,0,0,.45);opacity:0;pointer-events:none;transition:.25s;z-index:21}
  .sheet-bg.open{opacity:1;pointer-events:auto}
  .sheet{position:fixed;left:0;right:0;bottom:0;max-height:82vh;overflow-y:auto;background:#fff;border-radius:22px 22px 0 0;padding:18px 16px 34px;transform:translateY(101%);transition:transform .28s ease;z-index:22;max-width:600px;margin:0 auto}
  .sheet.open{transform:translateY(0)}
  .sheet-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;font-size:17px}
  .sheet-h span{cursor:pointer;font-size:20px;color:var(--mut);padding:4px 8px}
  .sheet h3{font-size:15px;margin:16px 0 6px}
  .msg{max-width:82%;padding:8px 12px;border-radius:14px;margin:6px 0;font-size:14px;line-height:1.4;word-break:break-word}
  .msg.user{background:linear-gradient(135deg,var(--o1),var(--o2));color:#fff;margin-left:auto;border-bottom-right-radius:4px}
  .msg.shop{background:#f1f3f7;color:#222;margin-right:auto;border-bottom-left-radius:4px}
  .msg .t{display:block;font-size:10px;opacity:.7;margin-top:2px}
  .qchip{background:#fff3ec;color:#FF6B3D;border:1px solid #ffd9c9;border-radius:999px;padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer}
  /* CRO: CTA chinh mau XANH tuong phan vs header cam (tang tach biet thi giac) */
  #go{background:linear-gradient(135deg,#12b76a,#00a15a);box-shadow:0 8px 22px rgba(3,152,85,.42);font-size:18px;padding:16px;min-height:54px}
  .flabel{font-size:13px;font-weight:800;color:#fff;margin:0 0 7px;display:flex;align-items:center;gap:7px}
  .req{background:#fff;color:#FF4E73;border-radius:6px;font-size:11px;padding:2px 8px;font-weight:800}
  .hero-box input#url{border:2px solid #ffd9c9;font-weight:600}
  .hero-box input#url:focus{border-color:#12b76a;box-shadow:0 0 0 4px rgba(18,183,106,.16)}
  .trow{display:flex;gap:7px;justify-content:center;flex-wrap:wrap;margin-top:13px}
  .trow span{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.4);color:#fff;border-radius:999px;padding:6px 12px;font-size:12.5px;font-weight:700}
  .optbox{margin-top:12px;padding-top:12px;border-top:1px dashed #ffe3d6;text-align:left}
  .optbox .lb{font-size:13px;font-weight:700;margin-bottom:6px}
  .optbox .lb i{color:var(--mut);font-weight:400;font-style:normal}
  .sticky{position:fixed;left:0;right:0;bottom:0;z-index:18;background:#fff;box-shadow:0 -4px 18px rgba(0,0,0,.13);padding:10px 14px calc(10px + env(safe-area-inset-bottom));transform:translateY(130%);transition:transform .25s;max-width:600px;margin:0 auto}
  .sticky.show{transform:translateY(0)}
  .sticky button{width:100%;border:none;cursor:pointer;font-size:17px;font-weight:800;color:#fff;background:linear-gradient(135deg,#12b76a,#00a15a);padding:15px;border-radius:14px;box-shadow:0 6px 16px rgba(3,152,85,.3)}
</style>
</head>
<body>
<header>
  <div class="logo">M</div>
  <h1>Mushoplaho</h1>
  <div class="sub"><b>Mua Shopee &amp; TikTok Shop — nhận lại 50% hoa hồng</b><br>⚡ Ưu tiên TikTok: hoàn tới ~100k/đơn &amp; nhận nhanh ~30 ngày · Shopee tới ~15k · Miễn phí</div>
  <div class="hero-box">
    <div class="flabel">① Dán link sản phẩm <span class="req">BẮT BUỘC</span></div>
    <div class="inrow">
      <input id="url" type="url" inputmode="url" placeholder="Dán link Shopee / TikTok Shop vào đây..." autocomplete="off">
      <button class="paste" id="paste" type="button">📋 Dán</button>
    </div>
    <button class="btn" id="go">🎁 Nhận tiền hoàn ngay →</button>
    <div id="err"></div>
  </div>
  <div class="trow"><span>🔒 An toàn</span><span>🆓 Miễn phí</span><span id="proof">🔥 Đang tải...</span></div>
</header>

<div class="wrap">
  <div class="card" id="dealcard" style="display:none">
    <h2>🔥 Deal hot hôm nay</h2>
    <div class="deals" id="deals"></div>
    <p class="muted" id="dealmore" style="display:none;text-align:left;margin-top:8px"><a class="link" href="/deals-all">Xem tất cả deal →</a></p>
  </div>

  <div class="card" id="convcard">
    <div id="err2" style="display:none"></div>
    <div id="result">
      <div class="ok">
        <p style="font-weight:800;margin-bottom:6px">🎉 Xong! Link hoàn tiền đã sẵn sàng</p>
        <p class="muted" style="margin:0 0 10px">🧾 Mã đơn: <span class="code" id="ocode"></span> — lưu để tra cứu tiền hoàn</p>
        <a class="btn buy" id="buy" target="_blank" rel="noopener">🛒 Mở &amp; mua ngay để nhận hoàn</a>
        <button class="btn ghost" id="copy" type="button">📄 Sao chép link</button>
        <div class="optbox">
          <div class="lb">📱 Nhận nhắc khi tiền về <i>(không bắt buộc)</i></div>
          <input id="contact" type="text" placeholder="SĐT / Zalo của bạn..." autocomplete="off" style="margin-top:0">
          <span class="muted" id="csaved" style="display:none">✅ Đã lưu</span>
        </div>
        <p class="muted" style="margin-top:10px"><a class="link" href="/track" id="tolink">🔎 Tra cứu đơn của tôi</a></p>
      </div>
    </div>
  </div>

  <div class="card" id="wallet" style="display:none">
    <h2>💰 Ví hoàn tiền của bạn <span class="mut" id="wcount" style="font-weight:400"></span></h2>
    <div id="wsummary" style="display:flex;gap:8px;margin-bottom:12px"></div>
    <div id="walletlist"></div>
    <p class="muted" style="text-align:left;margin-top:6px">💸 Tiền hoàn tự cập nhật sau khi sàn đối soát (TikTok ~30–45 ngày · Shopee ~2–3 tháng). <a class="link" href="/track">Xem tất cả</a></p>
  </div>

  <div class="card">
    <div style="display:flex;gap:8px">
      <button class="btn ghost" id="installbtn" style="display:none;flex:1;margin-top:0">📲 Cài app về máy</button>
      <button class="btn ghost" id="notifybtn" style="flex:1;margin-top:0">🔔 Báo khi tiền về</button>
    </div>
  </div>

  <div class="card refer">
    <h2>🎁 Mời bạn bè cùng nhận hoàn tiền</h2>
    <p class="muted" style="text-align:left;margin:0 0 8px">Gửi link này cho bạn bè — ai vào mua qua bạn, cộng đồng deal càng mạnh <span id="refcount"></span></p>
    <div class="inrow"><input id="reflink" readonly style="margin-top:0;font-size:13px" value=""><button class="paste" id="refcopy">Copy</button></div>
  </div>

  <footer>
    <a class="link" href="/how" style="font-size:13px">💡 Cách hoạt động &amp; An toàn</a> · <a class="link" href="/track" style="font-size:13px">🔎 Tra cứu đơn</a><br>
    Mushoplaho · Mua Là Hoàn · Hàng chính hãng từ Shopee &amp; TikTok Shop<br>
    Mọi giao dịch &amp; bảo hành theo chính sách của sàn &amp; người bán. Chúng tôi không giữ thẻ/không thu tiền của bạn.
  </footer>
</div>
<div class="toast" id="toast"></div>
<div class="sticky" id="stickycta"><button id="stickygo">🎁 Nhận tiền hoàn ngay →</button></div>

<div class="fab" id="fab" title="Chat với shop">💬</div>
<div class="sheet-bg" id="chatbg"></div>
<div class="sheet" id="chat">
  <div class="sheet-h"><b>💬 Chat với shop</b><span><a class="link" id="helplink" style="font-size:13px;margin-right:14px">Hướng dẫn</a><span id="chatx" style="cursor:pointer">✕</span></span></div>
  <div id="chatlist" style="min-height:160px;max-height:46vh;overflow-y:auto;padding:6px 0"></div>
  <div id="qchips" style="display:flex;gap:6px;flex-wrap:wrap;margin:4px 0"></div>
  <div class="inrow" style="margin-top:8px">
    <input id="chatinput" placeholder="Nhập STK / nick Zalo / câu hỏi..." style="margin-top:0">
    <button class="paste" id="chatsend" style="color:#fff;background:linear-gradient(135deg,var(--o1),var(--o2));border-color:transparent">Gửi</button>
  </div>
  <p class="muted" style="text-align:left;margin-top:6px">Bật "🔔 Báo khi tiền về" để nhận thông báo khi shop trả lời.</p>
</div>
<div class="sheet-bg" id="sheetbg"></div>
<div class="sheet" id="sheet">
  <div class="sheet-h"><b>Hướng dẫn &amp; hỗ trợ</b><span id="sheetx">✕</span></div>
  <h3>💡 Cách hoạt động</h3>
  <ol class="steps">
    <li>Dán link Shopee, bấm "Nhận link hoàn tiền".</li>
    <li>Bấm "Mở Shopee &amp; mua ngay" → mua như bình thường.</li>
    <li>Vào Nhóm → gửi ảnh đơn + STK → nhận hoàn 50% hoa hồng.</li>
  </ol>
  <h3>💸 Lịch nhận tiền hoàn</h3>
  <ul class="tl">
    <li><b>Ngày 18</b> — chốt báo cáo &amp; xin STK (nếu lần đầu)</li>
    <li><b>Ngày 20–25</b> — chuyển tiền hoàn vào tài khoản bạn</li>
    <li><b>Ngày 26</b> — thông báo hoàn tất</li>
    <li>Nhận sau đối soát: <b>TikTok ~30–45 ngày</b>, <b>Shopee ~2–3 tháng</b></li>
  </ul>
  <h3>❓ Câu hỏi thường gặp</h3>
  <div class="faq">
    <details><summary>Có mất phí không?</summary><p>Hoàn toàn miễn phí. Bạn chỉ dán link, mua như bình thường và nhận lại tiền.</p></details>
    <details><summary>Bao lâu nhận được tiền?</summary><p>TikTok ~30–45 ngày, Shopee ~2–3 tháng (sau khi sàn đối soát đơn). Sau đó tiền chuyển vào ngày 20–25 hàng tháng.</p></details>
    <details><summary>Vì sao phải bấm link trước khi mua?</summary><p>Link đó ghi nhận đơn để tính hoa hồng. Mua không qua link sẽ không được hoàn.</p></details>
    <details><summary>Hàng có chính hãng không?</summary><p>Bạn mua thẳng trên Shopee — sản phẩm, giá, bảo hành đều theo Shopee &amp; người bán.</p></details>
    <details><summary>Làm sao nhận tiền hoàn?</summary><p>Vào Nhóm Facebook, gửi ảnh đơn + STK. Shop đối chiếu và chuyển theo lịch.</p></details>
  </div>
  <a class="btn group" id="grp" href="${FB_GROUP}" target="_blank" rel="noopener">👥 Tham gia Nhóm nhận hoàn tiền</a>
  <button class="btn ghost" id="share" type="button" style="margin-top:10px">🔗 Chia sẻ Mushoplaho cho bạn bè</button>
</div>

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
     var sm=(d&&d.summary)||{expected:0,paid:0,pending:0};
     $('wcount').textContent='('+o.length+' đơn)';
     $('wsummary').innerHTML=wtile('Tổng hoàn dự kiến',sm.expected,'#FF4E73')+wtile('Đang chờ về',sm.pending,'#e6a700')+wtile('Đã hoàn',sm.paid,'#039855');
     $('walletlist').innerHTML=o.slice(0,6).map(function(r){return '<div style="border-bottom:1px dashed #ffe3d6;padding:9px 0;font-size:14px;display:flex;justify-content:space-between;gap:8px"><div><b>'+(r.order_code||'')+'</b> — '+(r.status_label||'')+'<div class="mut">'+(r.platform||'')+' · '+(r.when||'')+'</div></div><div style="font-weight:800;color:#FF4E73;white-space:nowrap">'+(r.cashback>0?('+'+fmt(r.cashback)):'—')+'</div></div>'}).join('');
     $('wallet').style.display='block';}).catch(function(){});
}
function wtile(l,v,c){return '<div style="flex:1;min-width:92px;background:#fff7f3;border:1px solid #ffe1d4;border-radius:12px;padding:10px;text-align:center"><div style="font-size:17px;font-weight:800;color:'+c+'">'+fmt(v||0)+'</div><div class="mut" style="font-size:11px">'+l+'</div></div>'}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fmt(n){n=parseInt(n,10)||0;return n.toLocaleString('vi-VN')+'đ'}
function loadDeals(){
  fetch('/deals').then(function(r){return r.json()}).then(function(d){var a=(d&&d.deals)||[];if(!a.length)return;
    $('deals').innerHTML=a.slice(0,12).map(function(p){var go='/deal-go?u='+encodeURIComponent(p.ori||p.aff||'')+'&uid='+encodeURIComponent(UID);return '<a class="deal" href="'+go+'" target="_blank" rel="noopener">'+(p.image?'<img src="'+encodeURI(p.image)+'" loading="lazy" alt="">':'')+'<div class="dbody"><div class="dname">'+esc(p.name)+'</div><div class="dprice">'+fmt(p.price)+'</div>'+(p.discount_rate>0?'<span class="ddisc">-'+p.discount_rate+'%</span>':'')+'</div></a>'}).join('');
    var m=$('dealmore');if(m)m.style.display='block';
    $('dealcard').style.display='block';}).catch(function(){});
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
  var refv='';try{refv=localStorage.getItem('mlh_ref')||''}catch(e){}
  fetch(API+'shop-convert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:u,contact:c,uid:UID,ref:refv})})
   .then(function(r){return r.json()})
   .then(function(d){go.textContent=old;go.disabled=false;
     if(d&&d.buy_url){buy.href=d.buy_url;buy.dataset.link=d.buy_url;$('ocode').textContent=d.order_code||'';window._lastCode=d.order_code||'';
       if(d.order_code)$('tolink').href='/track?q='+encodeURIComponent(d.order_code);
       if(c)try{localStorage.setItem('mlh_contact',c)}catch(e){}
       res.style.display='block';res.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(loadWallet,1000)}
     else fail((d&&d.error)||'Chưa tạo được link, bạn thử lại nhé.')})
   .catch(function(){go.textContent=old;go.disabled=false;fail('Lỗi mạng, thử lại sau nhé.')});
});
$('copy').addEventListener('click',function(){var l=buy.dataset.link||buy.href;
  if(navigator.clipboard){navigator.clipboard.writeText(l).then(function(){tst('Đã sao chép link ✅')}).catch(function(){tst(l)})}else tst(l);});
buy.addEventListener('click',function(){try{fetch('/ev',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'buy_click',uid:UID})})}catch(e){}});
url.addEventListener('keydown',function(e){if(e.key==='Enter')go.click()});
if(contact)contact.addEventListener('keydown',function(e){if(e.key==='Enter')contact.blur()});
var sh=$('share');
if(sh)sh.addEventListener('click',function(){var u=location.origin;
  if(navigator.share){navigator.share({title:'Mushoplaho — Mua Là Hoàn',text:'Mua Shopee nhận lại tiền!',url:u}).catch(function(){})}
  else if(navigator.clipboard){navigator.clipboard.writeText(u).then(function(){tst('Đã sao chép link ✅')})}else tst(u);});
fetch(API+'shop-stats').then(function(r){return r.json()}).then(function(d){var n=(d&&d.count!=null)?d.count:0;if(n<50)n=50+n;
  $('proof').textContent='🔥 Đã tạo '+n.toLocaleString('vi-VN')+' link hoàn tiền cho khách';})
 .catch(function(){$('proof').textContent='🔥 Cộng đồng hoàn tiền đang lớn mỗi ngày'});
if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(function(){})}
(function(){var p=new URLSearchParams(location.search);var sr=p.get('url')||p.get('text')||p.get('shared')||'';var m=sr.match(/https?:\\/\\/[^\\s]+/);if(m){url.value=m[0];setTimeout(function(){go.click()},500)}})();
var deferredPrompt=null;
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferredPrompt=e;var b=$('installbtn');if(b)b.style.display='block'});
var ib=$('installbtn');if(ib)ib.addEventListener('click',function(){if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null;ib.style.display='none'}else tst('Mở menu trình duyệt → Thêm vào Màn hình chính')});
function u8(b){b=b.replace(/-/g,'+').replace(/_/g,'/');while(b.length%4)b+='=';var r=atob(b),a=new Uint8Array(r.length);for(var i=0;i<r.length;i++)a[i]=r.charCodeAt(i);return a}
var VAPID='BGNY3uTCFDGgY6g5UyFMrLmwnRXmWWXAroYoqYrIypZbJ-87xho81HsRNHE9NsQvwY96ADXiAtRPSVIAGyJJfFQ';
var nb=$('notifybtn');if(nb)nb.addEventListener('click',function(){
  if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window)){tst('Trình duyệt không hỗ trợ thông báo (thử Chrome trên Android)');return}
  if(Notification.permission==='denied'){tst('Đang bị chặn: bấm khoá 🔒 cạnh địa chỉ → Cho phép Thông báo → thử lại');return}
  nb.textContent='...';
  Notification.requestPermission().then(function(perm){
    if(perm!=='granted'){nb.textContent='🔔 Báo khi tiền về';tst(perm==='denied'?'Bạn đã từ chối. Mở khoá 🔒 → Thông báo → Cho phép':'Bạn chưa bấm "Cho phép" ở hộp thoại của trình duyệt');return}
    navigator.serviceWorker.ready.then(function(reg){return reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:u8(VAPID)})})
     .then(function(sub){var c='';try{c=localStorage.getItem('mlh_contact')||''}catch(e){}
       return fetch('/push-subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sub:sub,uid:UID,contact:c})})})
     .then(function(){nb.textContent='✅ Đã bật thông báo';tst('Sẽ báo khi tiền hoàn về 💸')})
     .catch(function(){nb.textContent='🔔 Báo khi tiền về';tst('Không bật được, thử lại')});
  });
});
var fab=$('fab'),sheet=$('sheet'),sbg=$('sheetbg');
function openSheet(o){if(sheet){sheet.classList.toggle('open',o);sbg.classList.toggle('open',o)}}
if(sbg)sbg.addEventListener('click',function(){openSheet(false)});
var sx=$('sheetx');if(sx)sx.addEventListener('click',function(){openSheet(false)});
var chat=$('chat'),chatbg=$('chatbg'),chatLastId=0,chatTimer=null;
function chatThread(){var c='';try{c=localStorage.getItem('mlh_contact')||''}catch(e){}return (c&&c.length>=4)?c:('dev:'+UID)}
function renderMsgs(ms,append){var box=$('chatlist');if(!append)box.innerHTML='';ms.forEach(function(m){if(m.id>chatLastId)chatLastId=m.id;var d=document.createElement('div');d.className='msg '+(m.sender==='user'?'user':'shop');d.innerHTML=esc(m.text).replace(/\\n/g,'<br>')+'<span class="t">'+(m.when||'')+'</span>';box.appendChild(d)});box.scrollTop=box.scrollHeight}
var QCHIPS=['Có mất phí không?','Bao lâu nhận được tiền?','Cách nhận tiền hoàn?','Cách mua để được hoàn?'];
function renderChips(){var el=$('qchips');if(!el)return;el.innerHTML=QCHIPS.map(function(q){return '<span class="qchip">'+esc(q)+'</span>'}).join('');Array.prototype.forEach.call(el.querySelectorAll('.qchip'),function(c){c.onclick=function(){$('chatinput').value=c.textContent;chatSend()}})}
function chatLoad(){fetch('/chat-history?thread='+encodeURIComponent(chatThread())+(chatLastId?('&after='+chatLastId):'')).then(function(r){return r.json()}).then(function(d){var ms=(d&&d.messages)||[];if(chatLastId===0&&!ms.length){$('chatlist').innerHTML='<div class="msg shop">Chào bạn 👋 Gửi <b>STK ngân hàng</b> hoặc <b>nick Zalo</b> để shop liên hệ trả tiền hoàn. Cần hỗ trợ gì cứ nhắn nhé!</div>'}else if(ms.length){renderMsgs(ms,chatLastId>0)}}).catch(function(){})}
var SB=null,sbChan=null;
function subRealtime(){try{if(!SB&&window.supabase){SB=window.supabase.createClient('https://atuwytlrpogbzwjbatdn.supabase.co','sb_publishable_MO6dUROk1mMHykOP1QVryQ_vBJYkJq9')}if(!SB)return;if(sbChan){SB.removeChannel(sbChan);sbChan=null}sbChan=SB.channel('thread:'+chatThread(),{config:{broadcast:{self:false}}}).on('broadcast',{event:'msg'},function(){chatLoad()}).subscribe()}catch(e){}}
function openChat(o){if(!chat)return;chat.classList.toggle('open',o);chatbg.classList.toggle('open',o);if(o){renderChips();chatLoad();subRealtime();chatTimer=setInterval(chatLoad,4000)}else if(chatTimer){clearInterval(chatTimer);chatTimer=null}}
if(fab)fab.addEventListener('click',function(){openChat(true)});
if(chatbg)chatbg.addEventListener('click',function(){openChat(false)});
var cx=$('chatx');if(cx)cx.addEventListener('click',function(){openChat(false)});
function chatSend(){var el=$('chatinput'),t=(el.value||'').trim();if(!t)return;el.value='';var c='';try{c=localStorage.getItem('mlh_contact')||''}catch(e){}
  fetch('/chat-send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:t,uid:UID,contact:c})}).then(function(){setTimeout(chatLoad,300)}).catch(function(){});}
var csd=$('chatsend');if(csd)csd.addEventListener('click',chatSend);
var ci=$('chatinput');if(ci)ci.addEventListener('keydown',function(e){if(e.key==='Enter')chatSend()});
var hl=$('helplink');if(hl)hl.addEventListener('click',function(){openChat(false);openSheet(true)});
function tryClip(){if(url.value)return;try{if(navigator.clipboard&&navigator.clipboard.readText){navigator.clipboard.readText().then(function(t){t=(t||'').trim();if(!url.value&&/^https?:\\/\\//.test(t)&&/shopee|shp\\.ee|tiktok/i.test(t)){url.value=t;tst('Đã tự dán link 📋')}}).catch(function(){})}}catch(e){}}
window.addEventListener('focus',tryClip);setTimeout(tryClip,400);
(function(){var rp=new URLSearchParams(location.search).get('ref');if(rp)try{localStorage.setItem('mlh_ref',rp)}catch(e){}})();
var rl=$('reflink');if(rl)rl.value=location.origin+'/?ref='+UID;
var rcp=$('refcopy');if(rcp)rcp.onclick=function(){if(navigator.clipboard&&rl){navigator.clipboard.writeText(rl.value).then(function(){tst('Đã copy link mời ✅')}).catch(function(){tst(rl.value)})}else if(rl)tst(rl.value)};
fetch('/ref-stats?uid='+encodeURIComponent(UID)).then(function(r){return r.json()}).then(function(d){if(d&&d.count>0)$('refcount').textContent='— đã mời '+d.count+' người 🎉'}).catch(function(){});
if(contact)contact.addEventListener('change',function(){var v=(contact.value||'').trim();if(v.length<4)return;try{localStorage.setItem('mlh_contact',v)}catch(e){}
  if(window._lastCode)fetch('/order-contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({order_code:window._lastCode,contact:v})}).then(function(){var cs=$('csaved');if(cs)cs.style.display='inline'}).catch(function(){});});
var scta=$('stickycta'),sgo=$('stickygo'),herob=document.querySelector('.hero-box');
function stickyChk(){if(!scta||!herob)return;var show=herob.getBoundingClientRect().bottom<8;scta.classList.toggle('show',show);var f=$('fab');if(f)f.style.bottom=show?'86px':'20px';}
window.addEventListener('scroll',stickyChk,{passive:true});setTimeout(stickyChk,400);
if(sgo)sgo.onclick=function(){var u=(url.value||'').trim();if(/^https?:\\/\\//.test(u)){window.scrollTo({top:0,behavior:'smooth'});go.click();}else{window.scrollTo({top:0,behavior:'smooth'});setTimeout(function(){url.focus()},350);tst('Dán link sản phẩm vào ô nhé 👆');}};
loadWallet();loadDeals();
try{if(!sessionStorage.getItem('mlh_v')){fetch('/ev',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'visit',uid:UID})});sessionStorage.setItem('mlh_v','1')}}catch(e){}
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
  <div class="card" id="bankcard" style="display:none">
    <div style="font-weight:800;font-size:16px;margin-bottom:6px">💳 Số tài khoản nhận tiền hoàn</div>
    <p class="mut" style="margin-bottom:8px">Chọn <b>Ngân hàng</b> + nhập <b>Số TK</b> + <b>Tên chủ TK</b> để shop chuyển tiền hoàn. Cập nhật bất cứ lúc nào.</p>
    <select id="bankSel" style="width:100%;padding:13px 12px;border:2px solid #ffd9c9;border-radius:14px;font-size:16px;outline:none;background:#fff"></select>
    <input id="bankAcc" inputmode="numeric" placeholder="Số tài khoản" autocomplete="off" style="margin-top:10px">
    <input id="bankHolder" placeholder="Tên chủ TK (VIẾT HOA không dấu)" autocomplete="off" style="margin-top:10px;text-transform:uppercase">
    <button class="btn" id="savebank" style="margin-top:12px">💾 Lưu số tài khoản</button>
    <p class="mut" id="bankmsg" style="margin-top:8px"></p>
  </div>
</div>
<script>
var $=function(i){return document.getElementById(i)};var out=$('out');
function fmt(n){n=parseInt(n,10)||0;return n.toLocaleString('vi-VN')+'đ'}
function wtile(l,v,c){return '<div style="flex:1;min-width:92px;background:#fff7f3;border:1px solid #ffe1d4;border-radius:12px;padding:10px;text-align:center"><div style="font-size:16px;font-weight:800;color:'+c+'">'+fmt(v||0)+'</div><div class="mut" style="font-size:11px">'+l+'</div></div>'}
function render(d){var rows=(d&&d.orders)||[];var sm=(d&&d.summary)||{expected:0,paid:0,pending:0};
  if(!rows.length){out.innerHTML='<p class="mut" style="margin-top:12px">Không tìm thấy đơn. Kiểm tra lại mã/SĐT nhé.</p>';return}
  var tiles='<div style="display:flex;gap:8px;margin:12px 0">'+wtile('Tổng dự kiến',sm.expected,'#FF4E73')+wtile('Đang chờ',sm.pending,'#e6a700')+wtile('Đã hoàn',sm.paid,'#039855')+'</div>';
  out.innerHTML=tiles+rows.map(function(r){return '<div class="row" style="display:flex;justify-content:space-between;gap:8px"><div><div class="st">'+(r.order_code||'(chưa có mã)')+' — '+r.status_label+'</div><div class="mut">'+(r.platform||'')+' · '+(r.when||'')+'</div></div><div style="font-weight:800;color:#FF4E73;white-space:nowrap">'+(r.cashback>0?('+'+fmt(r.cashback)):'—')+'</div></div>';}).join('')
   +'<p class="mut" style="margin-top:12px">💸 Tiền hoàn = 50% hoa hồng. Nhận sau đối soát: TikTok ~30–45 ngày · Shopee ~2–3 tháng; shop chuyển ngày 20–25 hàng tháng.</p>';
  var bc=document.getElementById('bankcard');if(bc){bc.style.display='block';
    if(d.bank){try{var o=JSON.parse(d.bank);if(o&&o.bin){var s=document.getElementById('bankSel');if(s&&!s.value)s.value=o.bin;var a=document.getElementById('bankAcc');if(a&&!a.value)a.value=o.acc||'';var h=document.getElementById('bankHolder');if(h&&!h.value)h.value=o.name||'';}}catch(e){}}
  }
}
function look(){var q=($('q').value||'').trim();if(q.length<4){out.innerHTML='<p class="mut" style="margin-top:12px">Nhập mã đơn hoặc SĐT nhé.</p>';return}
  out.innerHTML='<p class="mut" style="margin-top:12px">Đang tra...</p>';
  fetch('/track-lookup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q:q})})
   .then(function(r){return r.json()}).then(function(d){render(d||{})})
   .catch(function(){out.innerHTML='<p class="mut">Lỗi, thử lại sau.</p>'});}
$('go').addEventListener('click',look);$('q').addEventListener('keydown',function(e){if(e.key==='Enter')look()});
var BANKS=[['970436','Vietcombank'],['970415','VietinBank'],['970418','BIDV'],['970405','Agribank'],['970407','Techcombank'],['970422','MB Bank'],['970416','ACB'],['970432','VPBank'],['970423','TPBank'],['970403','Sacombank'],['970437','HDBank'],['970441','VIB'],['970443','SHB'],['970431','Eximbank'],['970426','MSB'],['970448','OCB'],['970440','SeABank'],['970454','BVBank'],['546034','Cake by VPBank'],['963388','Timo']];
(function(){var s=document.getElementById('bankSel');if(s)s.innerHTML='<option value="">— Chọn ngân hàng —</option>'+BANKS.map(function(b){return '<option value="'+b[0]+'">'+b[1]+'</option>'}).join('');})();
var sbk=document.getElementById('savebank');if(sbk)sbk.onclick=function(){var q=($('q').value||'').trim();var msg=document.getElementById('bankmsg');
  var sel=document.getElementById('bankSel'),acc=(document.getElementById('bankAcc').value||'').trim(),nm=(document.getElementById('bankHolder').value||'').trim().toUpperCase();
  var bin=sel.value,bankName=sel.options[sel.selectedIndex]?sel.options[sel.selectedIndex].text:'';
  if(q.length<4){msg.textContent='Hãy tra cứu đơn của bạn trước nhé.';return}
  if(!bin){msg.textContent='Chọn ngân hàng nhé.';return}
  if(!/^[0-9]{6,19}$/.test(acc)){msg.textContent='Số tài khoản chưa đúng (chỉ gồm chữ số).';return}
  if(nm.length<3){msg.textContent='Nhập tên chủ tài khoản.';return}
  sbk.textContent='Đang lưu...';
  fetch('/track-bank',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q:q,bank_bin:bin,bank_acc:acc,bank_name:nm,bank_display:bankName})}).then(function(r){return r.json()}).then(function(d){sbk.textContent='💾 Lưu số tài khoản';msg.textContent=d.ok?'✅ Đã lưu! Shop sẽ chuyển tiền hoàn vào STK này 💸':('❌ '+(d.error||'Lỗi, thử lại'));}).catch(function(){sbk.textContent='💾 Lưu số tài khoản';msg.textContent='❌ Lỗi mạng, thử lại';});};
var qs=new URLSearchParams(location.search).get('q');if(qs){$('q').value=qs;look()}
<\/script>
</body></html>`;

const HOW_HTML = `<!doctype html>
<html lang="vi"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#FF6B4A"><title>Cách hoạt động & An toàn - Mushoplaho</title>
<meta property="og:title" content="Mushoplaho hoạt động thế nào? Có an toàn không?">
<meta property="og:description" content="Bạn mua thẳng trên Shopee/TikTok Shop — chúng tôi KHÔNG giữ thẻ, KHÔNG thu tiền. Chỉ hoàn lại 50% hoa hồng về cho bạn.">
<meta property="og:image" content="https://mushoplaho.kientlt59.workers.dev/og.png">
<style>
  :root{--o1:#FF9F45;--o2:#FF5C7A;--g1:#12b76a;--g2:#039855;--bg:#fff6f1;--ink:#2b2b2b;--mut:#7d7d7d}
  *{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,"Segoe UI",Roboto,Arial,sans-serif;background:var(--bg);color:var(--ink);line-height:1.6}
  .wrap{max-width:620px;margin:0 auto;padding:0 15px 48px}
  header{background:linear-gradient(135deg,var(--o1),var(--o2));color:#fff;text-align:center;padding:34px 16px 28px;border-radius:0 0 30px 30px}
  header h1{font-size:23px;font-weight:800}header .sub{opacity:.96;margin-top:6px;font-size:14px}
  .card{background:#fff;border-radius:20px;box-shadow:0 6px 22px rgba(255,110,80,.13);padding:20px;margin-top:18px}
  .card h2{font-size:18px;margin-bottom:12px;display:flex;align-items:center;gap:8px}
  .steps{list-style:none;counter-reset:s}
  .steps li{counter-increment:s;position:relative;padding:12px 0 12px 48px;border-bottom:1px dashed #ffe3d6;font-size:15px}
  .steps li:last-child{border:none}
  .steps li b{color:#FF4E73}
  .steps li::before{content:counter(s);position:absolute;left:0;top:11px;width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--o1),var(--o2));color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center}
  .safe{background:#eafff3;border:1px solid #b7f0cf}
  .safe li{list-style:none;padding:8px 0;font-size:15px;display:flex;gap:10px;align-items:flex-start}
  .safe li .ic{font-size:18px}
  .tl{list-style:none;margin-top:4px}
  .tl li{position:relative;padding:0 0 16px 26px;border-left:2px solid #ffd9c9;margin-left:6px;font-size:14px}
  .tl li:last-child{border-left-color:transparent;padding-bottom:0}
  .tl li::before{content:'';position:absolute;left:-8px;top:3px;width:14px;height:14px;border-radius:50%;background:linear-gradient(135deg,var(--o1),var(--o2))}
  .tl b{color:#FF4E73}
  .faq details{border-bottom:1px solid #ffe3d6;padding:12px 0}.faq details:last-child{border:none}
  .faq summary{font-weight:700;cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:10px}
  .faq summary::-webkit-details-marker{display:none}.faq summary::after{content:'+';color:var(--o2);font-weight:800}
  .faq details[open] summary::after{content:'\\2212'}.faq p{color:#555;font-size:14px;margin-top:8px}
  .btn{display:block;width:100%;text-align:center;border:none;cursor:pointer;font-size:17px;font-weight:800;color:#fff;background:linear-gradient(135deg,var(--o1),var(--o2));padding:15px;border-radius:14px;margin-top:14px;text-decoration:none}
  a.link{color:#FF6B3D;font-weight:700;text-decoration:none;display:inline-block;margin-top:14px}
  .mut{color:var(--mut);font-size:13px}
  .trust{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:14px}
  .trust span{background:#fff;border:1px solid #ffe1d4;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:700;color:#FF6B3D}
</style></head><body>
<header>
  <h1>Mushoplaho hoạt động thế nào?</h1>
  <div class="sub">Minh bạch — an toàn — miễn phí 💸</div>
</header>
<div class="wrap">
  <div class="card">
    <h2>🛒 3 bước để được hoàn tiền</h2>
    <ol class="steps">
      <li><b>Dán link</b> sản phẩm Shopee hoặc TikTok Shop vào Mushoplaho → nhận <b>link hoàn tiền</b> + <b>mã đơn</b>.</li>
      <li><b>Bấm link đó</b> → mua như bình thường, thanh toán ngay trong phiên (giá & hàng y hệt trên sàn).</li>
      <li>Sau khi sàn đối soát, <b>50% hoa hồng</b> của đơn được <b>hoàn về tài khoản bạn</b>.</li>
    </ol>
  </div>

  <div class="card safe">
    <h2>🔒 An toàn & riêng tư</h2>
    <ul>
      <li><span class="ic">✅</span><div>Bạn mua <b>thẳng trên Shopee / TikTok Shop</b> — sản phẩm, giá, bảo hành, đổi trả đều theo chính sách của sàn & người bán.</div></li>
      <li><span class="ic">🚫</span><div>Mushoplaho <b>KHÔNG giữ thẻ, KHÔNG thu tiền, KHÔNG yêu cầu mật khẩu</b> của bạn. Bạn thanh toán trực tiếp cho sàn.</div></li>
      <li><span class="ic">🧾</span><div>Mỗi đơn có <b>mã riêng (MLH-…)</b> để bạn <b>tra cứu tiền hoàn minh bạch</b> bất cứ lúc nào.</div></li>
      <li><span class="ic">🆓</span><div><b>Miễn phí 100%</b> — không cài app, không đăng ký tài khoản, không phí ẩn.</div></li>
    </ul>
  </div>

  <div class="card">
    <h2>💰 Tiền hoàn từ đâu ra?</h2>
    <p style="font-size:15px">Khi bạn mua qua link tiếp thị liên kết, <b>sàn trả hoa hồng</b> cho người giới thiệu. Mushoplaho <b>chia lại 50% khoản hoa hồng đó cho chính bạn</b> — nên bạn mua đúng giá mà vẫn được nhận tiền về. Đôi bên cùng có lợi 🤝</p>
    <p class="mut" style="margin-top:8px">Vì thế: <b>bắt buộc bấm link Mushoplaho gửi TRƯỚC khi mua</b> — mua không qua link thì sàn không ghi nhận, sẽ không có tiền hoàn.</p>
  </div>

  <div class="card">
    <h2>💸 Bao lâu nhận được tiền hoàn?</h2>
    <p style="font-size:15px;margin-bottom:10px">Tiền hoàn về <b>sau khi sàn đối soát đơn</b> (chờ bạn nhận hàng &amp; hết hạn đổi/trả — để tránh đơn huỷ). Thời gian tuỳ sàn:</p>
    <ul class="tl">
      <li><b>⚡ TikTok Shop: ~30–45 ngày</b> — đối soát 30 ngày, nhận nhanh.</li>
      <li><b>Shopee: ~2–3 tháng</b> — Shopee đối soát lâu hơn.</li>
      <li>Sau đối soát, shop chuyển tiền vào STK của bạn ở kỳ gần nhất (<b>ngày 20–25 hàng tháng</b>).</li>
    </ul>
    <p class="mut" style="margin-top:8px">👉 Nhớ vào mục <b>Tra cứu</b> nhập STK để shop chuyển tiền hoàn cho bạn.</p>
  </div>

  <div class="card faq">
    <h2>❓ Câu hỏi thường gặp</h2>
    <details><summary>Có phải trả thêm phí gì không?</summary><p>Không. Bạn mua đúng giá trên sàn, Mushoplaho chỉ hoàn lại % tiền cho bạn — hoàn toàn miễn phí.</p></details>
    <details><summary>Hàng có chính hãng, có bảo hành không?</summary><p>Có. Bạn mua trực tiếp trên Shopee/TikTok Shop nên sản phẩm, bảo hành, đổi trả đều theo sàn & người bán.</p></details>
    <details><summary>Vì sao phải bấm link trước khi mua?</summary><p>Link đó giúp sàn ghi nhận đơn để tính hoa hồng. Mua không qua link sẽ không được hoàn.</p></details>
    <details><summary>Làm sao biết mình được bao nhiêu tiền hoàn?</summary><p>Mỗi đơn có mã MLH-… — vào mục tra cứu để xem tiền hoàn (đang chờ / đã hoàn) minh bạch theo thời gian thực.</p></details>
    <details><summary>Nhận tiền hoàn bằng cách nào?</summary><p>Bạn gửi số tài khoản ngân hàng (hoặc nick Zalo) cho shop; shop chuyển tiền theo lịch ngày 20–25 hàng tháng.</p></details>
  </div>

  <div class="trust"><span>✅ Chính hãng</span><span>🔒 Không giữ thẻ</span><span>🆓 Miễn phí</span><span>🧾 Tra cứu minh bạch</span></div>
  <a class="btn" href="/">🎁 Bắt đầu — dán link nhận hoàn tiền</a>
  <p style="text-align:center"><a class="link" href="/track">🔎 Tra cứu đơn của tôi</a></p>
</div>
</body></html>`;

const DEALS_HTML = `<!doctype html>
<html lang="vi"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#FF6B4A"><title>Deal hot - Mushoplaho</title>
<style>
  :root{--o1:#FF9F45;--o2:#FF5C7A;--bg:#fff6f1;--ink:#2b2b2b;--mut:#8a8a8a}
  *{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,"Segoe UI",Roboto,Arial,sans-serif;background:var(--bg);color:var(--ink);line-height:1.5}
  .wrap{max-width:760px;margin:0 auto;padding:0 12px 44px}
  header{background:linear-gradient(135deg,var(--o1),var(--o2));color:#fff;text-align:center;padding:28px 16px;border-radius:0 0 26px 26px}
  header h1{font-size:21px;font-weight:800}header .sub{opacity:.95;font-size:13px;margin-top:5px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-top:18px}
  .deal{background:#fff;border:1px solid #ffe1d4;border-radius:14px;overflow:hidden;display:flex;flex-direction:column}
  .deal img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block;background:#f4f4f4}
  .dbody{padding:9px}
  .dname{font-size:12.5px;line-height:1.35;height:34px;overflow:hidden;font-weight:600}
  .dprice{color:#FF4E73;font-weight:800;font-size:15px;margin-top:5px}
  .ddisc{display:inline-block;background:#ffeaf0;color:#FF4E73;font-size:11px;font-weight:700;border-radius:6px;padding:1px 6px;margin-top:4px}
  .cta{display:block;text-align:center;background:linear-gradient(135deg,#12b76a,#039855);color:#fff;font-weight:700;font-size:12.5px;padding:8px;margin:6px 9px 10px;border-radius:9px;text-decoration:none}
  a.link{color:#FF6B3D;font-weight:700;text-decoration:none;display:inline-block;margin:14px 0}
  .mut{color:var(--mut);font-size:13px;text-align:center;margin-top:14px}
</style></head><body>
<header><h1>🔥 Deal hot — Mua Là Hoàn</h1><div class="sub">Mua qua đây được hoàn 50% hoa hồng 💸</div></header>
<div class="wrap">
  <a class="link" href="/">← Trang chủ</a> · <a class="link" href="/how">Cách hoạt động</a>
  <div class="grid" id="grid"><p class="mut" style="grid-column:1/-1">Đang tải deal...</p></div>
  <p class="mut">Giá &amp; sản phẩm theo Shopee. Bấm "Mua &amp; hoàn tiền" để được ghi nhận hoàn.</p>
</div>
<script>
var UID=(function(){try{var u=localStorage.getItem('mlh_uid');if(!u){u='d'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);localStorage.setItem('mlh_uid',u)}return u}catch(e){return 'd0'}})();
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fmt(n){n=parseInt(n,10)||0;return n.toLocaleString('vi-VN')+'đ'}
fetch('/deals').then(function(r){return r.json()}).then(function(d){var a=(d&&d.deals)||[];var g=document.getElementById('grid');
  if(!a.length){g.innerHTML='<p class="mut" style="grid-column:1/-1">Chưa có deal, quay lại sau nhé.</p>';return}
  g.innerHTML=a.map(function(p){var go='/deal-go?u='+encodeURIComponent(p.ori||p.aff)+'&uid='+encodeURIComponent(UID);
    return '<div class="deal">'+(p.image?'<img src="'+encodeURI(p.image)+'" loading="lazy" alt="">':'')+'<div class="dbody"><div class="dname">'+esc(p.name)+'</div><div class="dprice">'+fmt(p.price)+'</div>'+(p.discount_rate>0?'<span class="ddisc">-'+p.discount_rate+'%</span>':'')+'</div><a class="cta" href="'+go+'" target="_blank" rel="noopener">🛒 Mua &amp; hoàn tiền</a></div>';
  }).join('');}).catch(function(){document.getElementById('grid').innerHTML='<p class="mut" style="grid-column:1/-1">Lỗi tải deal.</p>'});
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
  <div class="card" id="dash" style="display:none">
    <b>📊 Tổng quan</b>
    <div id="stattiles" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px"></div>
  </div>
  <div class="card" id="funnelcard" style="display:none">
    <b>📈 Phễu chuyển đổi</b> <span class="mut">(tỉ lệ so với bước trước)</span>
    <div id="funneltiles" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px"></div>
  </div>
  <div class="card" id="panel" style="display:none">
    <div class="bar" style="justify-content:space-between">
      <div><b id="cnt">0</b> đơn · <span class="mut">mới nhất trước</span></div>
      <div class="bar"><input id="filter" placeholder="Lọc mã/SĐT/sàn" style="width:170px"><button class="sm" id="syncbtn">🔄 Sync AccessTrade</button><button class="sm" id="reload">Tải lại</button></div>
    </div>
    <p class="mut" style="margin-top:6px">Trạng thái <b>Đã mua/Đối soát/Huỷ</b> tự đồng bộ từ AccessTrade (6h/lần hoặc bấm Sync). Bạn chỉ cần chọn <b>"Đã hoàn"</b> khi đã chuyển tiền cho khách.</p>
    <div class="ov"><table id="tbl"><thead><tr>
      <th>Mã đơn</th><th>Liên hệ</th><th>STK ngân hàng</th><th>Sàn</th><th>Hoàn</th><th>Trạng thái</th><th>Ghi chú</th><th></th><th>Link</th>
    </tr></thead><tbody></tbody></table></div>
  </div>
  <div class="card" id="chatpanel" style="display:none">
    <b>💬 Tin nhắn khách</b>
    <div style="display:flex;gap:12px;margin-top:10px;flex-wrap:wrap">
      <div id="threads" style="flex:1;min-width:170px;max-height:340px;overflow-y:auto"></div>
      <div style="flex:2;min-width:220px">
        <div id="cmsgs" style="max-height:280px;overflow-y:auto;border:1px solid #eef1f6;border-radius:8px;padding:8px;min-height:110px"></div>
        <div id="cannedchips" style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0"></div>
        <div class="bar" style="margin-top:8px"><input id="creply" placeholder="Trả lời khách..." style="flex:1"><button class="sm" id="csend">Gửi</button></div>
      </div>
    </div>
  </div>
  <div class="card" id="fbpanel">
    <b>📤 Đăng bài lên Page Facebook</b>
    <textarea id="fbmsg" style="width:100%;height:130px;margin-top:8px;padding:10px;border:1px solid #d7dce5;border-radius:8px;font-size:14px" placeholder="Nội dung bài đăng..."></textarea>
    <div class="bar" style="margin-top:8px;gap:14px">Ảnh:
      <label><input type="radio" name="fbimg" value="1" checked> Mẫu 1</label>
      <label><input type="radio" name="fbimg" value="2"> Mẫu 2</label>
      <label><input type="radio" name="fbimg" value="3"> Mẫu 3</label>
      <a href="/og.png" target="_blank" style="font-size:12px">1</a><a href="/og2.png" target="_blank" style="font-size:12px">2</a><a href="/og3.png" target="_blank" style="font-size:12px">3</a>
    </div>
    <button class="sm" id="fbpost" style="margin-top:8px">📤 Đăng bài này lên Page</button>
    <button class="sm" id="autopost" style="margin-top:8px;background:#039855">📅 Đăng nội dung hôm nay</button>
    <button class="sm" id="dealpost" style="margin-top:8px;background:#FF4E73">🔥 Đăng DEAL HOT lên Page</button>
    <button class="sm" id="pushdeal" style="margin-top:8px;background:#1f6feb">🔔 Đẩy thông báo Deal</button>
    <span class="mut" id="fbresult" style="margin-left:10px"></span>
    <p class="mut" style="margin-top:6px">🤖 Hệ thống <b>tự đăng 1 bài xoay vòng (15 mẫu)</b> lên Page mỗi ngày ~10h sáng. Nút xanh để đăng tay ngay.</p>
  </div>
  <div class="card" id="testpanel">
    <b>🧪 Kiểm thử đường tiền (cashback)</b>
    <p class="mut" style="margin-top:4px">Tạo 1 đơn giả → đặt <b>đối soát + hoàn 50.000đ</b> → đẩy push nhắc STK → đọc lại DB. Dùng để chắc chắn ví/tiền/thông báo chạy đúng trước khi có khách thật.</p>
    <div class="bar" style="margin-top:8px"><button class="sm" id="testmoney" style="background:#1f6feb">🧪 Chạy test đường tiền</button><button class="sm" id="testclean" style="background:#888">🧹 Xoá đơn test</button><span class="mut" id="testresult" style="margin-left:6px"></span></div>
  </div>
</div>
<script>
var $=function(i){return document.getElementById(i)};var PASS='';
var STATUSES=[['notified','Chờ mua'],['purchased','Đã mua'],['confirmed','Đối soát'],['paid','Đã hoàn'],['cancelled','Huỷ']];
function opts(cur){return STATUSES.map(function(s){return '<option value="'+s[0]+'"'+((s[0]===cur||(cur==='web'&&s[0]==='notified'))?' selected':'')+'>'+s[1]+'</option>'}).join('')}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function parseBank(bi){try{var o=JSON.parse(bi);if(o&&o.bin&&o.acc)return o;}catch(e){}return null;}
function vietqr(o,amt,code){return 'https://img.vietqr.io/image/'+o.bin+'-'+o.acc+'-compact2.png?amount='+Math.round(amt||0)+'&addInfo='+encodeURIComponent('MLH '+code)+'&accountName='+encodeURIComponent(o.name||'');}
function login(){PASS=$('pass').value;$('lerr').textContent='';load(true)}
function load(first){
  fetch('/admin-list',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pass:PASS})})
   .then(function(r){if(r.status===401){throw new Error('Sai mật khẩu')}return r.json()})
   .then(function(d){$('login').style.display='none';$('dash').style.display='block';$('panel').style.display='block';$('chatpanel').style.display='block';render(d.orders||[]);loadStats();loadFunnel();loadThreads();renderCanned();if(!window._thPoll)window._thPoll=setInterval(loadThreads,8000)})
   .catch(function(e){if(first)$('lerr').textContent=e.message||'Lỗi'});
}
function render(rows){
  window._rows=rows;var f=($('filter').value||'').toLowerCase();
  var list=rows.filter(function(r){return !f||((r.order_code||'')+ (r.contact||'')+(r.platform||'')).toLowerCase().indexOf(f)>=0});
  $('cnt').textContent=list.length;
  $('tbl').tBodies[0].innerHTML=list.map(function(r){
    var d=r.created_at?String(r.created_at).slice(0,10):'';
    var bo=parseBank(r.bank_info);
    var stk=bo?('<div style="font-size:12px;line-height:1.35"><b>'+esc(bo.acc)+'</b> · '+esc(bo.bankName||bo.bin)+'<br>'+esc(bo.name||'')+'</div><a href="'+vietqr(bo,r.cashback,r.order_code)+'" target="_blank" style="display:inline-block;margin-top:5px;padding:5px 9px;background:#12b76a;color:#fff;border-radius:6px;text-decoration:none;font-size:12px;font-weight:700">📲 QR chuyển tiền</a>'+(r.status==='paid'?'<span style="color:#039855;font-weight:700;font-size:12px;margin-left:6px">✓ Đã hoàn</span>':'<button class="sm markpaid" data-c="'+esc(r.order_code)+'" style="margin-top:5px;margin-left:5px;padding:5px 9px;background:#039855;font-size:12px">✓ Đã chuyển</button>')):('<input class="stk" data-c="'+esc(r.order_code)+'" value="'+esc(r.bank_info)+'" placeholder="STK / NH / tên" style="width:150px">');
    return '<tr><td><b>'+esc(r.order_code)+'</b><div class="mut">'+d+'</div></td><td>'+esc(r.contact)+'</td>'
      +'<td>'+stk+'</td>'
      +'<td>'+esc(r.platform)+'</td>'
      +'<td style="white-space:nowrap;font-weight:700;color:#FF4E73">'+(r.cashback>0?(Number(r.cashback).toLocaleString('vi-VN')+'đ'):'')+'</td>'
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
  Array.prototype.forEach.call(document.querySelectorAll('.markpaid'),function(b){b.onclick=function(){
    var code=b.getAttribute('data-c');
    if(!confirm('Xác nhận ĐÃ CHUYỂN tiền hoàn cho đơn '+code+'?\\n\\n⚠️ CHỈ bấm khi đơn đã qua đối soát / hết hạn đổi-trả. Trả sớm mà khách đổi/trả hàng → bạn MẤT tiền (không đòi lại được).')) return;
    b.textContent='...';
    fetch('/admin-update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pass:PASS,order_code:code,status:'paid'})})
     .then(function(r){return r.json()}).then(function(d){if(d.ok){load(false)}else{b.textContent='✓ Đã chuyển';alert('Lỗi, thử lại')}}).catch(function(){b.textContent='✓ Đã chuyển'});
  }});
}
$('btnLogin').onclick=login;$('pass').addEventListener('keydown',function(e){if(e.key==='Enter')login()});
$('reload').onclick=function(){load(false)};$('filter').addEventListener('input',function(){render(window._rows||[])});
var curThread=null;
function loadThreads(){fetch('/admin-threads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pass:PASS})}).then(function(r){return r.json()}).then(function(d){var t=(d.threads)||[];
  $('threads').innerHTML=t.length?t.map(function(x){return '<div class="row" style="cursor:pointer" data-th="'+esc(x.thread)+'"><b style="font-size:13px">'+esc(x.thread)+'</b><div class="mut">'+(x.sender==='admin'?'Bạn: ':'')+esc((x.last||'').slice(0,36))+'</div></div>'}).join(''):'<p class="mut">Chưa có tin nhắn</p>';
  Array.prototype.forEach.call(document.querySelectorAll('[data-th]'),function(el){el.onclick=function(){curThread=el.getAttribute('data-th');openThread()}})}).catch(function(){})}
function openThread(){if(!curThread)return;fetch('/admin-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pass:PASS,thread:curThread})}).then(function(r){return r.json()}).then(function(d){var ms=(d.messages)||[];
  $('cmsgs').innerHTML=ms.map(function(m){return '<div style="text-align:'+(m.sender==='admin'?'right':'left')+';margin:4px 0"><span style="display:inline-block;'+(m.sender==='admin'?'background:#1f6feb;color:#fff':'background:#f1f3f7')+';padding:6px 10px;border-radius:10px;font-size:13px;max-width:85%">'+esc(m.text)+'</span></div>'}).join('');$('cmsgs').scrollTop=$('cmsgs').scrollHeight}).catch(function(){})}
$('csend').onclick=function(){var t=($('creply').value||'').trim();if(!t||!curThread)return;$('creply').value='';fetch('/admin-chat-reply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pass:PASS,thread:curThread,text:t})}).then(function(){setTimeout(openThread,300);setTimeout(loadThreads,400)})};
$('creply').addEventListener('keydown',function(e){if(e.key==='Enter')$('csend').click()});
var syncb=$('syncbtn');if(syncb)syncb.onclick=function(){syncb.textContent='...';fetch('/admin-sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pass:PASS})}).then(function(r){return r.json()}).then(function(d){syncb.textContent='🔄 Sync AccessTrade';alert('Đồng bộ xong: cập nhật '+(d.updated||0)+' đơn (khớp '+(d.seen||0)+' giao dịch có mã).');load(false)}).catch(function(){syncb.textContent='🔄 Sync AccessTrade';alert('Lỗi sync')})};
function loadStats(){fetch('/admin-stats',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pass:PASS})}).then(function(r){return r.json()}).then(function(d){var by=d.by||{};
  function tile(l,v,c){return '<div style="flex:1;min-width:88px;background:#f7f9fc;border-radius:10px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:800;color:'+c+'">'+v+'</div><div class="mut">'+l+'</div></div>'}
  function money(n){return (Math.round(n||0)).toLocaleString('vi-VN')+'đ'}
  $('stattiles').innerHTML=tile('Tổng đơn',d.total||0,'#222')+tile('Chờ mua',by.notified||0,'#e6a700')+tile('Đã mua',by.purchased||0,'#12b76a')+tile('Đối soát',by.confirmed||0,'#1f6feb')+tile('Chờ hoàn',d.pending||0,'#FF4E73')+tile('Đã hoàn',d.paid||0,'#039855')
    +tile('Tiền hoàn phải trả',money(d.cbPending),'#FF4E73')+tile('Đã trả (tiền)',money(d.cbPaid),'#039855')}).catch(function(){})}
function loadFunnel(){fetch('/admin-funnel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pass:PASS})}).then(function(r){return r.json()}).then(function(d){
  function pct(a,b){b=b||0;return b>0?Math.round((a||0)/b*100)+'%':'—'}
  function ft(l,v,sub){return '<div style="flex:1;min-width:108px;background:#f7f9fc;border-radius:10px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:800">'+(v||0)+'</div><div class="mut">'+l+'</div>'+(sub?'<div style="color:#039855;font-weight:700;font-size:12px">'+sub+'</div>':'<div style="height:16px"></div>')+'</div>'}
  $('funneltiles').innerHTML=ft('Ghé thăm',d.visits,'')+ft('Tạo link',d.links,pct(d.links,d.visits))+ft('Bấm mua',d.clicks,pct(d.clicks,d.links))+ft('Đã mua',d.purchased,pct(d.purchased,d.clicks));
  $('funnelcard').style.display='block';}).catch(function(){})}
var CANNED=['Đã nhận STK, cảm ơn bạn nhé! 💸','Đơn đang đối soát (TikTok ~30–45 ngày, Shopee ~2–3 tháng), có tiền shop chuyển ngay ạ.','Bạn gửi giúp shop: STK + Ngân hàng + Tên chủ TK nhé.','Bạn nhớ bấm link shop gửi TRƯỚC khi mua để được ghi nhận nha.'];
function renderCanned(){var el=$('cannedchips');if(!el)return;el.innerHTML=CANNED.map(function(q,i){return '<span data-ci="'+i+'" style="background:#eef4ff;color:#1f6feb;border:1px solid #cdddff;border-radius:999px;padding:5px 10px;font-size:12px;cursor:pointer">'+esc(q.slice(0,20))+'…</span>'}).join('');Array.prototype.forEach.call(el.querySelectorAll('[data-ci]'),function(c){c.onclick=function(){$('creply').value=CANNED[+c.getAttribute('data-ci')];if(curThread)$('csend').click()}})}
var FBSAMPLE='🔥 MẸO MUA SHOPEE ĐƯỢC HOÀN LẠI TIỀN\\n\\nMua đồ Shopee như bình thường, qua 1 bước nhỏ là được HOÀN tới 50% hoa hồng của đơn về tài khoản 💸\\n\\n👉 Dán link sản phẩm vào: mushoplaho.kientlt59.workers.dev\\nMiễn phí, không cần cài app. Ai hay mua Shopee lưu lại nhé!';
if($('fbmsg')&&!$('fbmsg').value)$('fbmsg').value=FBSAMPLE;
var fbp=$('fbpost');if(fbp)fbp.onclick=function(){var img='1',rs=document.getElementsByName('fbimg');for(var i=0;i<rs.length;i++)if(rs[i].checked)img=rs[i].value;
  fbp.textContent='Đang đăng...';$('fbresult').textContent='';
  fetch('/admin-fb-post',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pass:PASS,message:$('fbmsg').value,img:img})}).then(function(r){return r.json()}).then(function(d){fbp.textContent='📤 Đăng bài này lên Page';$('fbresult').textContent=d.ok?('✅ Đã đăng! id '+d.id):('❌ '+(d.error||'lỗi'))}).catch(function(){fbp.textContent='📤 Đăng bài này lên Page';$('fbresult').textContent='❌ lỗi mạng'})};
var apb=$('autopost');if(apb)apb.onclick=function(){apb.textContent='...';$('fbresult').textContent='';fetch('/admin-autopost',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pass:PASS})}).then(function(r){return r.json()}).then(function(d){apb.textContent='📅 Đăng nội dung hôm nay';$('fbresult').textContent=d.ok?('✅ Đã đăng nội dung hôm nay! id '+d.id):('❌ '+(d.error||'lỗi'))}).catch(function(){apb.textContent='📅 Đăng nội dung hôm nay';$('fbresult').textContent='❌ lỗi mạng'})};
var dpb=$('dealpost');if(dpb)dpb.onclick=function(){dpb.textContent='...';$('fbresult').textContent='';fetch('/admin-postdeal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pass:PASS})}).then(function(r){return r.json()}).then(function(d){dpb.textContent='🔥 Đăng DEAL HOT lên Page';$('fbresult').textContent=d.ok?('✅ Đã đăng deal: '+(d.product||'').slice(0,26)+'… id '+d.id+' · đẩy '+(d.pushed||0)+' push'):('❌ '+(d.error||'lỗi'))}).catch(function(){dpb.textContent='🔥 Đăng DEAL HOT lên Page';$('fbresult').textContent='❌ lỗi mạng'})};
var pdb=$('pushdeal');if(pdb)pdb.onclick=function(){pdb.textContent='...';$('fbresult').textContent='';fetch('/admin-pushdeal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pass:PASS})}).then(function(r){return r.json()}).then(function(d){pdb.textContent='🔔 Đẩy thông báo Deal';$('fbresult').textContent=d.ok?('✅ Đã đẩy '+(d.pushed||0)+' thông báo — '+(d.product||'').slice(0,26)):('❌ '+(d.error||'lỗi'))}).catch(function(){pdb.textContent='🔔 Đẩy thông báo Deal';$('fbresult').textContent='❌ lỗi mạng'})};
var tmb=$('testmoney');if(tmb)tmb.onclick=function(){tmb.textContent='...';$('testresult').textContent='';fetch('/admin-testmoney',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pass:PASS})}).then(function(r){return r.json()}).then(function(d){tmb.textContent='🧪 Chạy test đường tiền';if(d.ok&&d.saved){$('testresult').innerHTML='✅ '+d.code+' → status='+d.saved.status+', cashback='+(d.saved.cashback||0).toLocaleString('vi-VN')+'đ, commission='+(d.saved.commission||0).toLocaleString('vi-VN')+'đ · <a href="'+d.track+'" target="_blank">mở ví</a>';load(false)}else{$('testresult').textContent='❌ '+(d.error||'lỗi (đường tiền có vấn đề!)')}}).catch(function(){tmb.textContent='🧪 Chạy test đường tiền';$('testresult').textContent='❌ lỗi mạng'})};
var tcb=$('testclean');if(tcb)tcb.onclick=function(){tcb.textContent='...';fetch('/admin-testmoney-clean',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pass:PASS})}).then(function(r){return r.json()}).then(function(d){tcb.textContent='🧹 Xoá đơn test';$('testresult').textContent='🧹 Đã xoá '+(d.deleted||0)+' đơn test';load(false)}).catch(function(){tcb.textContent='🧹 Xoá đơn test'})};
<\/script>
</body></html>`;

function html(body) { return new Response(body, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }); }
function json(obj, status) { return new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }); }

const SW_JS = `self.addEventListener('install',function(e){self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim())});
self.addEventListener('push',function(e){var d={};try{d=e.data.json()}catch(x){d={title:'Mushoplaho',body:(e.data&&e.data.text())||''}}
e.waitUntil(self.registration.showNotification(d.title||'Mushoplaho',{body:d.body||'',icon:'/icon-192.png',badge:'/icon-192.png',data:{url:d.url||'/'}}));});
self.addEventListener('notificationclick',function(e){e.notification.close();e.waitUntil(clients.openWindow((e.notification.data&&e.notification.data.url)||'/'))});`;

const MANIFEST = JSON.stringify({
  name: 'Mushoplaho — Mua Là Hoàn', short_name: 'Mushoplaho',
  start_url: '/', scope: '/', display: 'standalone',
  background_color: '#fff6f1', theme_color: '#FF6B4A', lang: 'vi',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
  ],
  share_target: { action: '/', method: 'GET', params: { url: 'url', text: 'text', title: 'title' } }
});

function iconResponse(b64) {
  const bin = atob(b64); const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Response(arr, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' } });
}

async function pushSubUpsert(row, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return;
  try {
    await fetch(env.SUPABASE_URL + '/rest/v1/push_subs?on_conflict=endpoint', {
      method: 'POST',
      headers: { apikey: env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(row)
    });
  } catch (e) { /* ignore */ }
}

// Day push den cac thiet bi cua khach so huu don (theo contact hoac dev:uid)
async function notifyOrderRow(order, title, bodyText, urlPath, env) {
  try {
    const contact = (order && order.contact) || '';
    const uid = contact.indexOf('dev:') === 0 ? contact.slice(4) : '';
    const filter = uid ? ('uid=eq.' + encodeURIComponent(uid)) : ('contact=eq.' + encodeURIComponent(contact));
    const r = await fetch(env.SUPABASE_URL + '/rest/v1/push_subs?' + filter, {
      headers: { apikey: env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY }
    });
    const subs = await r.json().catch(() => []);
    const payload = JSON.stringify({ title, body: (bodyText || '').slice(0, 120), url: urlPath || '/' });
    for (const s of (Array.isArray(subs) ? subs : [])) { if (s.sub) { try { await sendWebPush(s.sub, payload, VAPID_PUBLIC, env.VAPID_PRIVATE, env.VAPID_SUBJECT); } catch (e) { } } }
  } catch (e) { /* ignore */ }
}

// Khi admin danh dau 'paid' -> day push den khach
async function notifyPaid(orderCode, env) {
  const rows = await supabaseFind(orderCode, env);
  const order = rows && rows[0]; if (!order) return;
  await notifyOrderRow(order, '💸 Tiền hoàn đã về!', 'Đơn ' + orderCode + ' đã được hoàn tiền — bấm để xem.', '/track?q=' + orderCode, env);
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      try { await fetch((env.SUPABASE_URL || '') + '/rest/v1/submissions?select=id&limit=1', { headers: { apikey: env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY } }); } catch (e) {}  // keep-alive Supabase (chong auto-pause)
      try { await syncAccessTrade(env); } catch (e) {}  // auto-sync trang thai don tu AccessTrade
      const _h = new Date(event && event.scheduledTime ? event.scheduledTime : Date.now()).getUTCHours();
      if (_h === 6 || _h === 12) { try { await postHotDeal(env); } catch (e) {} }  // dang DEAL HOT 2 lan/ngay (13h & 19h VN) tren cung 1 cron 6h
    })());
  },

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
    if (request.method === 'GET' && (path === '/how' || path === '/how-it-works' || path === '/an-toan')) return html(HOW_HTML);
    if (request.method === 'GET' && (path === '/deals-all' || path === '/deal')) return html(DEALS_HTML);

    // Web tạo link: BẮT BUỘC contact + sinh mã đơn
    if (request.method === 'POST' && path === '/shop-convert') {
      const body = await request.json().catch(() => ({}));
      const u = (body.url || '').trim();
      const contactRaw = (body.contact || '').trim();
      const uid = (body.uid || '').trim().slice(0, 40);
      if (!/^https?:\/\//.test(u)) return json({ error: 'Link không hợp lệ' }, 400);
      // Lien he tuy chon: neu khong nhap thi gan theo device-id (van tra cuu duoc)
      const contact = contactRaw.length >= 4 ? contactRaw : (uid ? 'dev:' + uid : 'web');
      const code = genOrderCode();
      const { platform, aff } = await makeAffiliate(u, env, code);
      const ref = (body.ref || '').trim().slice(0, 40);
      const row = { buyer_psid: 'web', buyer_text: 'web', contact, order_code: code, original_url: u, platform, affiliate_url: aff, status: 'web' };
      if (ref && ref !== uid) row.ref_by = ref;   // ai gioi thieu don nay
      await supabaseInsert(row, env);
      return json({ buy_url: aff, order_code: code });
    }

    // Bam mua tu trang Deal -> tao ma don + affiliate co utm (track cashback) roi chuyen huong sang san
    if (request.method === 'GET' && path === '/deal-go') {
      const u = url.searchParams.get('u') || '';
      const uid = (url.searchParams.get('uid') || '').trim().slice(0, 40);
      if (!/^https?:\/\//.test(u)) return Response.redirect(url.origin, 302);
      const code = genOrderCode();
      const { platform, aff } = await makeAffiliate(u, env, code);
      const contact = uid ? 'dev:' + uid : 'web';
      ctx.waitUntil(supabaseInsert({ buyer_psid: 'web', buyer_text: 'deal', contact, order_code: code, original_url: u, platform, affiliate_url: aff, status: 'web' }, env));
      ctx.waitUntil(evInsert('buy_click', uid, env));
      return Response.redirect(aff, 302);
    }

    // Ghi su kien pheu (visit / buy_click)
    if (request.method === 'POST' && path === '/ev') {
      const body = await request.json().catch(() => ({}));
      const type = (body.type || '').slice(0, 20);
      if (type !== 'visit' && type !== 'buy_click') return json({ error: 'bad' }, 400);
      ctx.waitUntil(evInsert(type, body.uid, env));
      return json({ ok: true });
    }

    // Tra cứu đơn + tong tien hoan (vi cashback)
    if (request.method === 'POST' && path === '/track-lookup') {
      const body = await request.json().catch(() => ({}));
      const rows = await supabaseFind((body.q || ''), env);
      const orders = rows.map(r => ({
        order_code: r.order_code, platform: r.platform, status: r.status, status_label: statusLabel(r.status),
        cashback: Math.round(r.cashback || 0),
        when: r.created_at ? String(r.created_at).slice(0, 10) : ''
      }));
      let expected = 0, paid = 0, pending = 0;
      rows.forEach(r => { const cb = Math.round(r.cashback || 0); if (r.status === 'cancelled') return; expected += cb; if (r.status === 'paid') paid += cb; else pending += cb; });
      const bank = (rows[0] && rows[0].bank_info) || '';
      return json({ orders, summary: { expected, paid, pending }, bank });
    }

    // Khach nhap SDT/Zalo SAU khi tao link -> gan contact cho don do
    if (request.method === 'POST' && path === '/order-contact') {
      const body = await request.json().catch(() => ({}));
      const code = (body.order_code || '').trim();
      const contact = (body.contact || '').trim().slice(0, 80);
      if (!code || contact.length < 4) return json({ error: 'bad' }, 400);
      try {
        const r = await fetch(env.SUPABASE_URL + '/rest/v1/submissions?order_code=eq.' + encodeURIComponent(code), {
          method: 'PATCH', headers: { apikey: env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }, body: JSON.stringify({ contact })
        });
        return json({ ok: r.ok });
      } catch (e) { return json({ ok: false }, 500); }
    }

    // Khach tu nhap STK nhan tien -> luu bank_info cho TAT CA don cua khach do
    if (request.method === 'POST' && path === '/track-bank') {
      const body = await request.json().catch(() => ({}));
      const q = (body.q || '').trim();
      if (!q || q.length < 4) return json({ error: 'Thiếu mã đơn/SĐT' }, 400);
      let bankInfo = '';
      const bin = (body.bank_bin || '').trim(), acc = (body.bank_acc || '').trim();
      if (bin && /^\d{6,19}$/.test(acc)) {   // structured -> luu JSON (de sinh VietQR)
        bankInfo = JSON.stringify({ bin, acc, name: (body.bank_name || '').trim().slice(0, 60), bankName: (body.bank_display || '').trim().slice(0, 40) });
      } else if ((body.bank_info || '').trim().length >= 6) {   // legacy text
        bankInfo = (body.bank_info || '').trim().slice(0, 200);
      } else return json({ error: 'Chọn ngân hàng + nhập đủ số TK và tên' }, 400);
      const safe = encodeURIComponent(q);
      const filter = `or=(order_code.eq.${safe},contact.eq.${safe},buyer_psid.eq.${safe})`;
      try {
        const r = await fetch(env.SUPABASE_URL + '/rest/v1/submissions?' + filter, {
          method: 'PATCH',
          headers: { apikey: env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({ bank_info: bankInfo })
        });
        return json({ ok: r.ok });
      } catch (e) { return json({ ok: false }, 500); }
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
      const okU = await supabaseUpdate(body.order_code, body, env);
      if (okU && body.status === 'paid') ctx.waitUntil(notifyPaid(body.order_code, env));
      return json({ ok: okU });
    }
    if (request.method === 'POST' && path === '/admin-sync') {
      const body = await request.json().catch(() => ({}));
      if (!checkAdmin(body.pass, env)) return json({ error: 'unauthorized' }, 401);
      const res = await syncAccessTrade(env);
      return json({ ok: true, updated: res.updated, seen: res.seen });
    }
    if (request.method === 'POST' && path === '/admin-stats') {
      const body = await request.json().catch(() => ({}));
      if (!checkAdmin(body.pass, env)) return json({ error: 'unauthorized' }, 401);
      let rows = [];
      const hdr = { apikey: env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY };
      try { let r = await fetch(env.SUPABASE_URL + '/rest/v1/submissions?select=status,cashback&limit=10000', { headers: hdr });
        if (!r.ok) r = await fetch(env.SUPABASE_URL + '/rest/v1/submissions?select=status&limit=10000', { headers: hdr });  // fallback neu cot cashback chua tao
        rows = await r.json().catch(() => []); } catch (e) { }
      if (!Array.isArray(rows)) rows = [];
      const by = {}; let cbExpected = 0, cbPaid = 0;
      rows.forEach(x => { const s = x.status === 'web' ? 'notified' : x.status; by[s] = (by[s] || 0) + 1; const cb = Math.round(x.cashback || 0); if (s !== 'cancelled') { cbExpected += cb; if (s === 'paid') cbPaid += cb; } });
      return json({ total: rows.length, by, pending: by.confirmed || 0, paid: by.paid || 0, cbExpected, cbPaid, cbPending: cbExpected - cbPaid });
    }
    if (request.method === 'POST' && path === '/admin-funnel') {
      const body = await request.json().catch(() => ({}));
      if (!checkAdmin(body.pass, env)) return json({ error: 'unauthorized' }, 401);
      const [visits, clicks, links, purchased] = await Promise.all([
        supabaseCount('/rest/v1/events?select=id&type=eq.visit', env),
        supabaseCount('/rest/v1/events?select=id&type=eq.buy_click', env),
        supabaseCount('/rest/v1/submissions?select=id', env),
        supabaseCount('/rest/v1/submissions?select=id&status=in.(purchased,confirmed,paid)', env)
      ]);
      return json({ visits, clicks, links, purchased });
    }
    // Test end-to-end DUONG TIEN: tao don gia -> confirmed + cashback -> push nhac -> doc lai (khong dung du lieu that)
    if (request.method === 'POST' && path === '/admin-testmoney') {
      const body = await request.json().catch(() => ({}));
      if (!checkAdmin(body.pass, env)) return json({ error: 'unauthorized' }, 401);
      const code = genOrderCode();
      const contact = 'dev:admintest';
      await supabaseInsert({ buyer_psid: 'web', buyer_text: 'test-money', contact, order_code: code, original_url: 'https://shopee.vn/test', platform: 'shopee', affiliate_url: 'https://shopee.vn/test', status: 'purchased' }, env);
      const cashback = 50000, commission = 100000;
      const okPatch = await syncSetStatusCashback(code, 'confirmed', cashback, commission, env);
      await notifyOrderRow({ contact }, '🎉 Đơn đã đối soát — tiền hoàn sắp về!', 'Đơn ' + code + ' đã được sàn đối soát. Gửi STK để shop chuyển ~50.000đ 💸', '/track?q=' + code, env);
      const rows = await supabaseFind(code, env);
      const r0 = (rows && rows[0]) || null;
      return json({ ok: !!okPatch, code, track: '/track?q=' + code, saved: r0 ? { status: r0.status, cashback: r0.cashback, commission: r0.commission } : null });
    }
    if (request.method === 'POST' && path === '/admin-testmoney-clean') {
      const body = await request.json().catch(() => ({}));
      if (!checkAdmin(body.pass, env)) return json({ error: 'unauthorized' }, 401);
      let n = 0;
      try {
        const r = await fetch(env.SUPABASE_URL + '/rest/v1/submissions?contact=eq.' + encodeURIComponent('dev:admintest'), {
          method: 'DELETE', headers: { apikey: env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY, 'Prefer': 'return=representation' }
        });
        const del = await r.json().catch(() => []); n = Array.isArray(del) ? del.length : 0;
      } catch (e) { }
      return json({ ok: true, deleted: n });
    }
    if (request.method === 'POST' && path === '/admin-fb-post') {
      const body = await request.json().catch(() => ({}));
      if (!checkAdmin(body.pass, env)) return json({ error: 'unauthorized' }, 401);
      const token = env.FB_PAGE_POST_TOKEN || '';
      if (!token) return json({ ok: false, error: 'Chưa có FB_PAGE_POST_TOKEN (token quyền pages_manage_posts). Xem hướng dẫn.' }, 400);
      const msg = (body.message || '').slice(0, 5000);
      const imgMap = { '1': '/og.png', '2': '/og2.png', '3': '/og3.png' };
      const imgUrl = 'https://mushoplaho.kientlt59.workers.dev' + (imgMap[String(body.img)] || '/og.png');
      try {
        const form = new URLSearchParams({ url: imgUrl, caption: msg, access_token: token });
        const r = await fetch('https://graph.facebook.com/v19.0/1240334605834446/photos', { method: 'POST', body: form });
        const j = await r.json().catch(() => ({}));
        if (j && j.id) return json({ ok: true, id: j.id });
        return json({ ok: false, error: (j.error && j.error.message) || 'Lỗi đăng' }, 400);
      } catch (e) { return json({ ok: false, error: String(e) }, 500); }
    }
    if (request.method === 'POST' && path === '/admin-autopost') {
      const body = await request.json().catch(() => ({}));
      if (!checkAdmin(body.pass, env)) return json({ error: 'unauthorized' }, 401);
      return json(await autoPostToday(env));
    }
    if (request.method === 'POST' && path === '/admin-postdeal') {
      const body = await request.json().catch(() => ({}));
      if (!checkAdmin(body.pass, env)) return json({ error: 'unauthorized' }, 401);
      return json(await postHotDeal(env));
    }
    // Chi DAY PUSH deal (khong dang Page) - dung khi flash-sale, bao nhanh nguoi da bat thong bao
    if (request.method === 'POST' && path === '/admin-pushdeal') {
      const body = await request.json().catch(() => ({}));
      if (!checkAdmin(body.pass, env)) return json({ error: 'unauthorized' }, 401);
      let product = null;
      try {
        const r = await fetch('https://api.accesstrade.vn/v1/datafeeds?merchant=shopee&limit=50', { headers: { 'Authorization': 'Token ' + (env.ACCESSTRADE_TOKEN || '') } });
        const j = await r.json().catch(() => ({}));
        let items = ((j && j.data) || []).filter(p => p && p.name);
        items.sort((a, b) => (b.discount_rate || 0) - (a.discount_rate || 0));
        product = items[0] || null;
      } catch (e) { }
      const pushed = await pushAllDeal(env, product);
      return json({ ok: true, pushed, product: product ? product.name : '' });
    }

    // PWA: manifest, service worker, icons, push subscribe
    if (request.method === 'GET' && path === '/robots.txt') return new Response('User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /webhook\nSitemap: https://mushoplaho.kientlt59.workers.dev/sitemap.xml\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' } });
    if (request.method === 'GET' && path === '/sitemap.xml') {
      const urls = ['/', '/how', '/deals-all', '/track'];
      const body = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.map(u => '<url><loc>https://mushoplaho.kientlt59.workers.dev' + u + '</loc><changefreq>daily</changefreq></url>').join('') + '</urlset>';
      return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=86400' } });
    }
    if (request.method === 'GET' && path === '/manifest.json') return new Response(MANIFEST, { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=3600' } });
    if (request.method === 'GET' && path === '/sw.js') return new Response(SW_JS, { headers: { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-cache', 'Service-Worker-Allowed': '/' } });
    if (request.method === 'GET' && path === '/icon-192.png') return iconResponse(ICON192);
    if (request.method === 'GET' && path === '/icon-512.png') return iconResponse(ICON512);
    if (request.method === 'GET' && path === '/og.png') return iconResponse(OG);
    if (request.method === 'GET' && path === '/og2.png') return iconResponse(OG2);
    if (request.method === 'GET' && path === '/og3.png') return iconResponse(OG3);
    if (request.method === 'POST' && path === '/push-subscribe') {
      const body = await request.json().catch(() => ({}));
      const sub = body.sub;
      if (!sub || !sub.endpoint) return json({ error: 'no sub' }, 400);
      await pushSubUpsert({ uid: (body.uid || '').slice(0, 40), contact: (body.contact || '').slice(0, 80), endpoint: sub.endpoint, sub }, env);
      return json({ ok: true });
    }

    // Chat khach <-> shop
    if (request.method === 'POST' && path === '/chat-send') {
      const body = await request.json().catch(() => ({}));
      const text = (body.text || '').trim().slice(0, 1000);
      const uid = (body.uid || '').slice(0, 40);
      const contact = (body.contact || '').trim().slice(0, 80);
      if (!text) return json({ error: 'empty' }, 400);
      const thread = (contact && contact.length >= 4) ? contact : ('dev:' + uid);
      await chatInsert({ thread, sender: 'user', text }, env);
      const br = botReply(text);
      if (br) await chatInsert({ thread, sender: 'bot', text: br }, env);
      ctx.waitUntil(broadcastMsg(thread, env));
      return json({ ok: true, thread, bot: br || '' });
    }
    if (request.method === 'GET' && path === '/chat-history') {
      const msgs = await chatHistory(url.searchParams.get('thread'), url.searchParams.get('after'), env);
      return json({ messages: msgs.map(m => ({ id: m.id, sender: m.sender, text: m.text, when: m.created_at ? String(m.created_at).slice(11, 16) : '' })) });
    }
    if (request.method === 'POST' && path === '/admin-threads') {
      const body = await request.json().catch(() => ({}));
      if (!checkAdmin(body.pass, env)) return json({ error: 'unauthorized' }, 401);
      let rows = [];
      try { const r = await fetch(env.SUPABASE_URL + '/rest/v1/messages?order=id.desc&limit=300', { headers: { apikey: env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY } }); rows = await r.json().catch(() => []); } catch (e) { }
      const seen = {}; const threads = [];
      for (const m of rows) { if (!seen[m.thread]) { seen[m.thread] = 1; threads.push({ thread: m.thread, last: m.text, sender: m.sender, when: m.created_at ? String(m.created_at).slice(5, 16) : '' }); } }
      return json({ threads });
    }
    if (request.method === 'POST' && path === '/admin-chat') {
      const body = await request.json().catch(() => ({}));
      if (!checkAdmin(body.pass, env)) return json({ error: 'unauthorized' }, 401);
      const msgs = await chatHistory(body.thread, null, env);
      return json({ messages: msgs.map(m => ({ id: m.id, sender: m.sender, text: m.text, when: m.created_at ? String(m.created_at).slice(5, 16) : '' })) });
    }
    if (request.method === 'POST' && path === '/admin-chat-reply') {
      const body = await request.json().catch(() => ({}));
      if (!checkAdmin(body.pass, env)) return json({ error: 'unauthorized' }, 401);
      const text = (body.text || '').trim().slice(0, 1000);
      if (!text || !body.thread) return json({ error: 'empty' }, 400);
      await chatInsert({ thread: body.thread, sender: 'admin', text }, env);
      ctx.waitUntil(broadcastMsg(body.thread, env));
      ctx.waitUntil(notifyThreadPush(body.thread, '💬 Shop trả lời bạn', text, env));
      return json({ ok: true });
    }

    // Deal hot (auto tu AccessTrade)
    if (request.method === 'GET' && path === '/deals') return dealsResponse(env, ctx);

    // Dem so nguoi da moi (referral)
    if (request.method === 'GET' && path === '/ref-stats') {
      const rid = url.searchParams.get('uid'); let count = 0;
      if (rid) try {
        const r = await fetch(env.SUPABASE_URL + '/rest/v1/submissions?select=id&ref_by=eq.' + encodeURIComponent(rid), { headers: { apikey: env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY, 'Prefer': 'count=exact', 'Range': '0-0' } });
        const cr = r.headers.get('content-range') || ''; const m = cr.match(/\/(\d+)/); if (m) count = parseInt(m[1], 10);
      } catch (e) { }
      return json({ count });
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
