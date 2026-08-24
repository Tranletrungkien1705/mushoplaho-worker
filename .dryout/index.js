var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var FB_GROUP = "https://www.facebook.com/groups/1693634255519569";
var PAYOUT = "L\u1ECBch ho\xE0n: ng\xE0y 20\u201325 h\xE0ng th\xE1ng, sau khi Shopee \u0111\u1ED1i so\xE1t (~75\u2013105 ng\xE0y).";
var FAQ = {
  greeting: `\u{1F44B} Ch\xE0o b\u1EA1n \u0111\u1EBFn v\u1EDBi MUSHOPLAHO \u2014 Mua L\xE0 Ho\xE0n!
G\u1EEDi LINK s\u1EA3n ph\u1EA9m Shopee/TikTok/Lazada v\xE0o \u0111\xE2y, shop g\u1EEDi l\u1EA1i link ho\xE0n ti\u1EC1n \u2014 b\u1EA1n mua qua link \u0111\xF3 \u0111\u01B0\u1EE3c HO\xC0N 50% hoa h\u1ED3ng c\u1EE7a \u0111\u01A1n \u{1F381}
G\xF5 "menu" \u0111\u1EC3 xem h\u01B0\u1EDBng d\u1EABn.`,
  howto: `\u{1F6D2} C\xC1CH MUA \u0110\u1EC2 \u0110\u01AF\u1EE2C HO\xC0N
1. G\u1EEDi link s\u1EA3n ph\u1EA9m (Shopee/TikTok/Lazada) v\xE0o \u0111\xE2y
2. Shop g\u1EEDi l\u1EA1i LINK HO\xC0N TI\u1EC0N + M\xC3 \u0110\u01A0N
3. B\u1EA5m link \u0111\xF3 \u2192 ch\u1ECDn h\xE0ng \u2192 thanh to\xE1n ngay trong phi\xEAn
\u{1F449} Ho\xE0n 50% hoa h\u1ED3ng c\u1EE7a \u0111\u01A1n h\xE0ng.`,
  schedule: `\u{1F4B8} L\u1ECACH X\u1EEC L\xDD HO\xC0N TI\u1EC0N
\u2705 Ng\xE0y 18 h\xE0ng th\xE1ng: ch\u1ED1t b\xE1o c\xE1o & xin s\u1ED1 t\xE0i kho\u1EA3n (n\u1EBFu l\u1EA7n \u0111\u1EA7u)
\u2705 Ng\xE0y 20\u201325: chuy\u1EC3n ti\u1EC1n ho\xE0n v\xE0o STK c\u1EE7a b\u1EA1n
\u2705 Ng\xE0y 26: th\xF4ng b\xE1o ho\xE0n t\u1EA5t
L\u01B0u \xFD: \u0111\u01A1n ch\u1EC9 \u0111\u01B0\u1EE3c ho\xE0n sau khi Shopee \u0111\u1ED1i so\xE1t (~75\u2013105 ng\xE0y).`,
  rules: `\u{1F4CB} N\u1ED8I QUY HO\xC0N TI\u1EC0N
\u2705 Ph\u1EA3i b\u1EA5m link shop g\u1EEDi TR\u01AF\u1EDAC khi mua
\u2705 B\u1EA5m link r\u1ED3i ch\u1ECDn h\xE0ng & thanh to\xE1n ngay trong phi\xEAn (\u0111\u1EEBng \u0111\u1EC3 s\u1EB5n h\xE0ng trong gi\u1ECF)
\u2705 \u0110\u01A1n kh\xF4ng h\u1EE7y/ho\xE0n trong 7 ng\xE0y
\u274C Kh\xF4ng t\u1EF1 mua gian l\u1EADn, kh\xF4ng \u0111\u1EB7t h\u1ED9
\u23F1 Ho\xE0n sau khi Shopee \u0111\u1ED1i so\xE1t (~75\u2013105 ng\xE0y)`,
  support: `\u{1F4AC} Shop \u0111\xE3 nh\u1EADn y\xEAu c\u1EA7u h\u1ED7 tr\u1EE3 c\u1EE7a b\u1EA1n v\xE0 s\u1EBD ph\u1EA3n h\u1ED3i tr\u1EF1c ti\u1EBFp trong gi\u1EDD l\xE0m vi\u1EC7c.
B\u1EA1n c\u1EE9 \u0111\u1EC3 l\u1EA1i c\xE2u h\u1ECFi \u1EDF \u0111\xE2y nh\xE9 \u{1F970}`,
  menu: `\u{1F4CB} MENU MUSHOPLAHO
\u2022 G\xF5 "c\xE1ch mua" \u2014 h\u01B0\u1EDBng d\u1EABn mua & ho\xE0n
\u2022 G\xF5 "ho\xE0n ti\u1EC1n" \u2014 l\u1ECBch ho\xE0n ti\u1EC1n
\u2022 G\xF5 "n\u1ED9i quy" \u2014 \u0111i\u1EC1u ki\u1EC7n ho\xE0n
\u2022 G\xF5 "check \u0111\u01A1n" \u2014 tra c\u1EE9u \u0111\u01A1n c\u1EE7a b\u1EA1n
\u2022 G\xF5 "h\u1ED7 tr\u1EE3" \u2014 g\u1EB7p CSKH
\u2022 Ho\u1EB7c g\u1EEDi th\u1EB3ng LINK s\u1EA3n ph\u1EA9m \u0111\u1EC3 nh\u1EADn link ho\xE0n ti\u1EC1n!`
};
function detectPlatform(url) {
  if (/shopee/i.test(url)) return "shopee";
  if (/tiktok|douyin|vt\.tiktok/i.test(url)) return "tiktok";
  if (/lazada/i.test(url)) return "lazada";
  return "unknown";
}
__name(detectPlatform, "detectPlatform");
function genOrderCode() {
  const a = Date.now().toString(36).slice(-4).toUpperCase();
  const b = Math.floor(Math.random() * 46656).toString(36).toUpperCase().padStart(3, "0");
  return "MLH-" + a + b;
}
__name(genOrderCode, "genOrderCode");
async function makeAffiliate(url, env) {
  const platform = detectPlatform(url);
  const TOKEN = env.ACCESSTRADE_TOKEN || "";
  const CAMP = { shopee: env.AT_CAMPAIGN_SHOPEE || "", tiktok: env.AT_CAMPAIGN_TIKTOK || "", lazada: env.AT_CAMPAIGN_LAZADA || "" };
  const cid = CAMP[platform];
  let aff = url;
  if (TOKEN && cid && /^https?:/.test(url)) {
    try {
      const r = await fetch("https://api.accesstrade.vn/v1/product_link/create", {
        method: "POST",
        headers: { "Authorization": "Token " + TOKEN, "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: cid, urls: [url] })
      });
      const j = await r.json().catch(() => ({}));
      const d = j && j.data;
      if (d && Array.isArray(d.success_link) && d.success_link[0]) aff = d.success_link[0].short_link || d.success_link[0].aff_link || url;
      else if (Array.isArray(d) && d[0]) aff = d[0].short_link || d[0].aff_link || url;
    } catch (e) {
    }
  }
  return { platform, aff };
}
__name(makeAffiliate, "makeAffiliate");
async function supabaseInsert(row, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return;
  try {
    await fetch(env.SUPABASE_URL + "/rest/v1/submissions", {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_KEY,
        "Authorization": "Bearer " + env.SUPABASE_SERVICE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(row)
    });
  } catch (e) {
  }
}
__name(supabaseInsert, "supabaseInsert");
async function supabaseFind(q, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY || !q) return [];
  const safe = encodeURIComponent(q.trim());
  const filter = `or=(order_code.eq.${safe},contact.eq.${safe},buyer_psid.eq.${safe})`;
  try {
    const r = await fetch(env.SUPABASE_URL + `/rest/v1/submissions?${filter}&order=id.desc&limit=10`, {
      headers: { apikey: env.SUPABASE_SERVICE_KEY, "Authorization": "Bearer " + env.SUPABASE_SERVICE_KEY }
    });
    if (!r.ok) return [];
    return await r.json().catch(() => []);
  } catch (e) {
    return [];
  }
}
__name(supabaseFind, "supabaseFind");
async function supabaseList(env, limit) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return [];
  try {
    const r = await fetch(env.SUPABASE_URL + `/rest/v1/submissions?select=order_code,contact,bank_info,admin_note,platform,status,original_url,created_at&order=id.desc&limit=${limit || 50}`, {
      headers: { apikey: env.SUPABASE_SERVICE_KEY, "Authorization": "Bearer " + env.SUPABASE_SERVICE_KEY }
    });
    if (!r.ok) return [];
    return await r.json().catch(() => []);
  } catch (e) {
    return [];
  }
}
__name(supabaseList, "supabaseList");
async function supabaseUpdate(orderCode, patch, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY || !orderCode) return false;
  const clean = {};
  ["status", "bank_info", "admin_note"].forEach((k) => {
    if (patch && patch[k] !== void 0) clean[k] = patch[k];
  });
  if (!Object.keys(clean).length) return false;
  try {
    const r = await fetch(env.SUPABASE_URL + `/rest/v1/submissions?order_code=eq.${encodeURIComponent(orderCode)}`, {
      method: "PATCH",
      headers: { apikey: env.SUPABASE_SERVICE_KEY, "Authorization": "Bearer " + env.SUPABASE_SERVICE_KEY, "Content-Type": "application/json", "Prefer": "return=minimal" },
      body: JSON.stringify(clean)
    });
    return r.ok;
  } catch (e) {
    return false;
  }
}
__name(supabaseUpdate, "supabaseUpdate");
function checkAdmin(pass, env) {
  return !!(pass && env.ADMIN_TOKEN && pass === env.ADMIN_TOKEN);
}
__name(checkAdmin, "checkAdmin");
function statusLabel(s) {
  const m = {
    notified: "\u{1F7E1} \u0110\xE3 t\u1EA1o link \u2014 ch\u1EDD b\u1EA1n mua",
    web: "\u{1F7E1} \u0110\xE3 t\u1EA1o link \u2014 ch\u1EDD b\u1EA1n mua",
    purchased: "\u{1F7E2} \u0110\xE3 ghi nh\u1EADn mua",
    confirmed: "\u{1F535} Shopee \u0111\xE3 \u0111\u1ED1i so\xE1t",
    paid: "\u2705 \u0110\xE3 ho\xE0n ti\u1EC1n"
  };
  return m[s] || "\u{1F7E1} \u0110ang x\u1EED l\xFD";
}
__name(statusLabel, "statusLabel");
async function sendMessenger(psid, text, env) {
  try {
    await fetch("https://graph.facebook.com/v19.0/me/messages?access_token=" + encodeURIComponent(env.FB_PAGE_TOKEN), {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ recipient: { id: psid }, messaging_type: "RESPONSE", message: { text } })
    });
  } catch (e) {
  }
}
__name(sendMessenger, "sendMessenger");
async function sendTyping(psid, env) {
  try {
    await fetch("https://graph.facebook.com/v19.0/me/messages?access_token=" + encodeURIComponent(env.FB_PAGE_TOKEN), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: { id: psid }, sender_action: "typing_on" })
    });
  } catch (e) {
  }
}
__name(sendTyping, "sendTyping");
async function buildReply(msg, env) {
  const psid = msg.sender && msg.sender.id || "";
  const text = msg.message && msg.message.text || "";
  const payload = msg.postback && msg.postback.payload || msg.message && msg.message.quick_reply && msg.message.quick_reply.payload || "";
  const isEcho = !!(msg.message && msg.message.is_echo);
  if (!psid || isEcho || !text && !payload) return null;
  const t = (text || "").toLowerCase().trim();
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  if (urlMatch) {
    const url = urlMatch[0];
    const [, mk] = await Promise.all([sendTyping(psid, env), makeAffiliate(url, env)]);
    const { platform, aff } = mk;
    const code = genOrderCode();
    await supabaseInsert({ buyer_psid: psid, buyer_text: text, original_url: url, platform, affiliate_url: aff, order_code: code, status: "notified" }, env);
    return { psid, reply: `\u{1F381} Link Mua-L\xE0-Ho\xE0n c\u1EE7a b\u1EA1n:
${aff}

\u{1F9FE} M\xE3 \u0111\u01A1n: ${code}
\u{1F449} B\u1EA5m link tr\xEAn r\u1ED3i mua nh\u01B0 b\xECnh th\u01B0\u1EDDng \u0111\u1EC3 \u0111\u01B0\u1EE3c ho\xE0n 50% hoa h\u1ED3ng.
G\xF5 "check \u0111\u01A1n" \u0111\u1EC3 tra c\u1EE9u, "ho\xE0n ti\u1EC1n" \u0111\u1EC3 xem l\u1ECBch ho\xE0n \u{1F4B8}` };
  }
  if (payload === "FAQ_CHECK" || /mlh-/i.test(t) || t.includes("check \u0111\u01A1n") || t.includes("check don") || t.includes("ki\u1EC3m tra") || t.includes("kiem tra") || t.includes("tra c\u1EE9u") || t.includes("tra cuu") || t.includes("\u0111\u01A1n c\u1EE7a")) {
    await sendTyping(psid, env);
    const codeInText = (text.match(/MLH-[A-Z0-9]+/i) || [])[0];
    const rows = await supabaseFind(codeInText || psid, env);
    if (!rows.length) return { psid, reply: "\u{1F50E} Ch\u01B0a th\u1EA5y \u0111\u01A1n n\xE0o. B\u1EA1n g\u1EEDi LINK s\u1EA3n ph\u1EA9m \u0111\u1EC3 t\u1EA1o \u0111\u01A1n m\u1EDBi, ho\u1EB7c nh\u1EAFn \u0111\xFAng M\xC3 \u0110\u01A0N (MLH-...) nh\xE9!" };
    const lines = rows.slice(0, 5).map((r) => `\u2022 ${r.order_code || "(ch\u01B0a c\xF3 m\xE3)"} \u2014 ${statusLabel(r.status)}`).join("\n");
    return { psid, reply: `\u{1F9FE} \u0110\u01A1n c\u1EE7a b\u1EA1n:
${lines}

${PAYOUT}` };
  }
  let reply;
  if (payload === "FAQ_HOWTO" || t.includes("c\xE1ch mua") || t.includes("cach mua")) reply = FAQ.howto;
  else if (payload === "FAQ_SCHEDULE" || t.includes("ho\xE0n ti\u1EC1n") || t.includes("hoan tien") || t.includes("l\u1ECBch") || t.includes("khi n\xE0o")) reply = FAQ.schedule;
  else if (payload === "FAQ_RULES" || t.includes("n\u1ED9i quy") || t.includes("noi quy") || t.includes("\u0111i\u1EC1u ki\u1EC7n") || t.includes("quy \u0111\u1ECBnh")) reply = FAQ.rules;
  else if (payload === "FAQ_SUPPORT" || t.includes("h\u1ED7 tr\u1EE3") || t.includes("ho tro") || t.includes("cskh") || t.includes("support")) reply = FAQ.support;
  else if (payload === "GET_STARTED" || /^(hi|hello|hey|chào|chao|alo|menu|start)/.test(t)) reply = FAQ.greeting;
  else reply = FAQ.menu;
  return { psid, reply };
}
__name(buildReply, "buildReply");
var SHOP_HTML = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#FF6B4A">
<title>Mushoplaho - Mua L\xE0 Ho\xE0n</title>
<meta property="og:title" content="Mushoplaho \u2014 Mua L\xE0 Ho\xE0n">
<meta property="og:description" content="D\xE1n link Shopee, nh\u1EADn l\u1EA1i \u0111\u1EBFn 50% hoa h\u1ED3ng. Mi\u1EC5n ph\xED, kh\xF4ng c\u1EA7n c\xE0i app.">
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
  <div class="sub">Mua L\xE0 Ho\xE0n \u2014 mua Shopee, nh\u1EADn l\u1EA1i ti\u1EC1n \u{1F4B8}</div>
  <div class="badge">Ho\xE0n \u0111\u1EBFn 50% hoa h\u1ED3ng</div>
  <div class="proof" id="proof">\u{1F525} \u0110ang t\u1EA3i...</div>
</header>

<div class="wrap">
  <div class="card">
    <h2>\u{1F6D2} D\xE1n link s\u1EA3n ph\u1EA9m Shopee</h2>
    <div class="inrow">
      <input id="url" type="url" inputmode="url" placeholder="D\xE1n link Shopee v\xE0o \u0111\xE2y..." autocomplete="off">
      <button class="paste" id="paste" type="button">\u{1F4CB} D\xE1n</button>
    </div>
    <input id="contact" type="text" placeholder="S\u0110T ho\u1EB7c Facebook \u0111\u1EC3 nh\u1EADn ti\u1EC1n ho\xE0n *" autocomplete="off">
    <button class="btn" id="go">Nh\u1EADn link mua &amp; ho\xE0n ti\u1EC1n</button>
    <div id="err"></div>
    <div id="result">
      <div class="ok">
        <p style="font-weight:800;margin-bottom:6px">\u{1F381} Link c\u1EE7a b\u1EA1n \u0111\xE3 s\u1EB5n s\xE0ng!</p>
        <p class="muted" style="margin:0 0 10px">\u{1F9FE} M\xE3 \u0111\u01A1n: <span class="code" id="ocode"></span> \u2014 l\u01B0u l\u1EA1i \u0111\u1EC3 tra c\u1EE9u</p>
        <a class="btn buy" id="buy" target="_blank" rel="noopener">\u{1F6D2} M\u1EDF Shopee &amp; mua ngay</a>
        <button class="btn ghost" id="copy" type="button">\u{1F4C4} Sao ch\xE9p link</button>
        <p class="muted">B\u1EA5m n\xFAt m\u1EDF th\u1EB3ng Shopee. Mua nh\u01B0 b\xECnh th\u01B0\u1EDDng \u0111\u1EC3 \u0111\u01B0\u1EE3c ho\xE0n 50% nh\xE9!</p>
        <p class="muted"><a class="link" href="/track" id="tolink">\u{1F50E} Tra c\u1EE9u \u0111\u01A1n c\u1EE7a t\xF4i</a></p>
      </div>
    </div>
    <div class="trust"><span>\u2705 Ch\xEDnh h\xE3ng Shopee</span><span>\u{1F512} An to\xE0n</span><span>\u{1F193} Mi\u1EC5n ph\xED</span><span>\u{1F4F1} Kh\xF4ng c\u1EA7n c\xE0i app</span></div>
  </div>

  <div class="card">
    <h2>\u{1F9EE} \u01AF\u1EDBc t\xEDnh ti\u1EC1n ho\xE0n</h2>
    <input id="calcv" type="number" inputmode="numeric" placeholder="Nh\u1EADp gi\xE1 tr\u1ECB \u0111\u01A1n (\u0111) \u2014 vd 500000">
    <div class="calc-out" id="calcout">Nh\u1EADp gi\xE1 \u0111\u01A1n \u0111\u1EC3 xem s\u1ED1 ti\u1EC1n c\xF3 th\u1EC3 ho\xE0n \u{1F4B8}</div>
    <p class="muted">\u01AF\u1EDBc t\xEDnh ~2\u20137% gi\xE1 tr\u1ECB \u0111\u01A1n (tu\u1EF3 ng\xE0nh h\xE0ng). S\u1ED1 th\u1EF1c nh\u1EADn theo hoa h\u1ED3ng Shopee \u0111\u1ED1i so\xE1t.</p>
  </div>

  <div class="card">
    <h2>\u{1F4A1} C\xE1ch ho\u1EA1t \u0111\u1ED9ng</h2>
    <ol class="steps">
      <li>D\xE1n link Shopee + S\u0110T/Facebook, b\u1EA5m n\xFAt ph\xEDa tr\xEAn.</li>
      <li>B\u1EA5m <b>\u201CM\u1EDF Shopee &amp; mua ngay\u201D</b> \u2192 mua nh\u01B0 b\xECnh th\u01B0\u1EDDng.</li>
      <li>Tham gia Nh\xF3m \u2192 g\u1EEDi \u1EA3nh \u0111\u01A1n \u2192 <b>nh\u1EADn ho\xE0n 50%</b> hoa h\u1ED3ng.</li>
    </ol>
    <p class="muted"><a class="link" href="/track">\u{1F50E} \u0110\xE3 c\xF3 m\xE3 \u0111\u01A1n? Tra c\u1EE9u t\u1EA1i \u0111\xE2y</a></p>
  </div>

  <div class="card">
    <h2>\u{1F4B8} L\u1ECBch nh\u1EADn ti\u1EC1n ho\xE0n</h2>
    <ul class="tl">
      <li><b>Ng\xE0y 18</b> h\xE0ng th\xE1ng \u2014 ch\u1ED1t b\xE1o c\xE1o &amp; xin STK (n\u1EBFu l\u1EA7n \u0111\u1EA7u)</li>
      <li><b>Ng\xE0y 20\u201325</b> \u2014 chuy\u1EC3n ti\u1EC1n ho\xE0n v\xE0o t\xE0i kho\u1EA3n b\u1EA1n</li>
      <li><b>Ng\xE0y 26</b> \u2014 th\xF4ng b\xE1o ho\xE0n t\u1EA5t</li>
      <li>\u0110\u01A1n \u0111\u01B0\u1EE3c ho\xE0n sau khi Shopee \u0111\u1ED1i so\xE1t (~75\u2013105 ng\xE0y)</li>
    </ul>
  </div>

  <div class="card refer">
    <h2>\u{1F381} Gi\u1EDBi thi\u1EC7u b\u1EA1n b\xE8</h2>
    <p class="muted" style="margin:0 0 10px;text-align:left">R\u1EE7 b\u1EA1n c\xF9ng mua ho\xE0n ti\u1EC1n \u2014 c\u1ED9ng \u0111\u1ED3ng deal c\xE0ng m\u1EA1nh, \u01B0u \u0111\xE3i c\xE0ng nhi\u1EC1u.</p>
    <button class="btn ghost" id="share" type="button">\u{1F517} Chia s\u1EBB Mushoplaho</button>
  </div>

  <div class="card faq">
    <h2>\u2753 C\xE2u h\u1ECFi th\u01B0\u1EDDng g\u1EB7p</h2>
    <details><summary>C\xF3 m\u1EA5t ph\xED kh\xF4ng?</summary><p>Ho\xE0n to\xE0n mi\u1EC5n ph\xED. B\u1EA1n ch\u1EC9 d\xE1n link, mua nh\u01B0 b\xECnh th\u01B0\u1EDDng v\xE0 nh\u1EADn l\u1EA1i ti\u1EC1n.</p></details>
    <details><summary>Bao l\xE2u th\xEC nh\u1EADn \u0111\u01B0\u1EE3c ti\u1EC1n?</summary><p>Sau khi Shopee \u0111\u1ED1i so\xE1t (~75\u2013105 ng\xE0y), ti\u1EC1n ho\xE0n chuy\u1EC3n v\xE0o ng\xE0y 20\u201325 h\xE0ng th\xE1ng.</p></details>
    <details><summary>V\xEC sao ph\u1EA3i b\u1EA5m link shop g\u1EEDi tr\u01B0\u1EDBc khi mua?</summary><p>Link \u0111\xF3 ghi nh\u1EADn \u0111\u01A1n c\u1EE7a b\u1EA1n \u0111\u1EC3 t\xEDnh hoa h\u1ED3ng. Mua kh\xF4ng qua link s\u1EBD kh\xF4ng \u0111\u01B0\u1EE3c ho\xE0n.</p></details>
    <details><summary>H\xE0ng c\xF3 ch\xEDnh h\xE3ng kh\xF4ng?</summary><p>B\u1EA1n mua th\u1EB3ng tr\xEAn Shopee \u2014 s\u1EA3n ph\u1EA9m, gi\xE1, b\u1EA3o h\xE0nh \u0111\u1EC1u theo Shopee &amp; ng\u01B0\u1EDDi b\xE1n.</p></details>
    <details><summary>L\xE0m sao nh\u1EADn ti\u1EC1n ho\xE0n?</summary><p>Tham gia Nh\xF3m Facebook, g\u1EEDi \u1EA3nh \u0111\u01A1n + STK ng\xE2n h\xE0ng. Shop \u0111\u1ED1i chi\u1EBFu v\xE0 chuy\u1EC3n theo l\u1ECBch.</p></details>
  </div>

  <div class="card" style="text-align:center">
    <h2 style="justify-content:center">\u{1F465} Nh\u1EADn ti\u1EC1n ho\xE0n c\u1EE7a b\u1EA1n</h2>
    <p class="muted" style="margin:0 0 14px">Tham gia Nh\xF3m \u0111\u1EC3 g\u1EEDi \u0111\u01A1n &amp; nh\u1EADn ti\u1EC1n ho\xE0n. C\u1ED9ng \u0111\u1ED3ng c\u1EADp nh\u1EADt deal hot m\u1ED7i ng\xE0y!</p>
    <a class="btn group" id="grp" href="${FB_GROUP}" target="_blank" rel="noopener">Tham gia Nh\xF3m nh\u1EADn ho\xE0n ti\u1EC1n</a>
  </div>

  <footer>
    Mushoplaho \xB7 Mua L\xE0 Ho\xE0n \xB7 S\u1EA3n ph\u1EA9m ch\xEDnh h\xE3ng t\u1EEB Shopee<br>
    M\u1ECDi giao d\u1ECBch &amp; b\u1EA3o h\xE0nh theo ch\xEDnh s\xE1ch c\u1EE7a Shopee &amp; ng\u01B0\u1EDDi b\xE1n.
  </footer>
</div>
<div class="toast" id="toast"></div>

<script>
var API=location.origin+'/';var $=function(id){return document.getElementById(id)};
var go=$('go'),url=$('url'),contact=$('contact'),res=$('result'),buy=$('buy'),err=$('err'),toast=$('toast');
function tst(m){toast.textContent=m;toast.classList.add('show');setTimeout(function(){toast.classList.remove('show')},1800)}
function fail(m){err.textContent=m;err.style.display='block'}
$('paste').addEventListener('click',function(){
  if(navigator.clipboard&&navigator.clipboard.readText){navigator.clipboard.readText().then(function(t){url.value=(t||'').trim();url.focus()}).catch(function(){tst('H\xE3y d\xE1n tay v\xE0o \xF4 nh\xE9')});}
  else tst('H\xE3y d\xE1n tay v\xE0o \xF4 nh\xE9');
});
go.addEventListener('click',function(){
  err.style.display='none';res.style.display='none';
  var u=(url.value||'').trim(),c=(contact.value||'').trim();
  if(!/^https?:\\/\\//.test(u)){fail('B\u1EA1n h\xE3y d\xE1n 1 link s\u1EA3n ph\u1EA9m Shopee h\u1EE3p l\u1EC7 nh\xE9.');return}
  if(c.length<6){fail('Nh\u1EADp S\u0110T ho\u1EB7c Facebook \u0111\u1EC3 shop tr\u1EA3 ti\u1EC1n ho\xE0n cho b\u1EA1n nh\xE9.');contact.focus();return}
  var old=go.textContent;go.innerHTML='<span class="spin"></span> \u0110ang t\u1EA1o link...';go.disabled=true;
  fetch(API+'shop-convert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:u,contact:c})})
   .then(function(r){return r.json()})
   .then(function(d){go.textContent=old;go.disabled=false;
     if(d&&d.buy_url){buy.href=d.buy_url;buy.dataset.link=d.buy_url;$('ocode').textContent=d.order_code||'';
       if(d.order_code)$('tolink').href='/track?q='+encodeURIComponent(d.order_code);
       res.style.display='block';res.scrollIntoView({behavior:'smooth',block:'center'})}
     else fail((d&&d.error)||'Ch\u01B0a t\u1EA1o \u0111\u01B0\u1EE3c link, b\u1EA1n th\u1EED l\u1EA1i nh\xE9.')})
   .catch(function(){go.textContent=old;go.disabled=false;fail('L\u1ED7i m\u1EA1ng, th\u1EED l\u1EA1i sau nh\xE9.')});
});
$('copy').addEventListener('click',function(){var l=buy.dataset.link||buy.href;
  if(navigator.clipboard){navigator.clipboard.writeText(l).then(function(){tst('\u0110\xE3 sao ch\xE9p link \u2705')}).catch(function(){tst(l)})}else tst(l);});
url.addEventListener('keydown',function(e){if(e.key==='Enter')contact.focus()});
contact.addEventListener('keydown',function(e){if(e.key==='Enter')go.click()});
var cv=$('calcv');
if(cv)cv.addEventListener('input',function(){var v=parseInt((cv.value||'').replace(/\\D/g,''),10)||0;
  if(v<1000){$('calcout').textContent='Nh\u1EADp gi\xE1 \u0111\u01A1n \u0111\u1EC3 xem s\u1ED1 ti\u1EC1n c\xF3 th\u1EC3 ho\xE0n \u{1F4B8}';return}
  var lo=Math.round(v*0.02),hi=Math.round(v*0.07);
  $('calcout').innerHTML='C\xF3 th\u1EC3 ho\xE0n \u2248 <b>'+lo.toLocaleString('vi-VN')+'\u0111 \u2013 '+hi.toLocaleString('vi-VN')+'\u0111</b>';});
var sh=$('share');
if(sh)sh.addEventListener('click',function(){var u=location.origin;
  if(navigator.share){navigator.share({title:'Mushoplaho \u2014 Mua L\xE0 Ho\xE0n',text:'Mua Shopee nh\u1EADn l\u1EA1i ti\u1EC1n!',url:u}).catch(function(){})}
  else if(navigator.clipboard){navigator.clipboard.writeText(u).then(function(){tst('\u0110\xE3 sao ch\xE9p link \u2705')})}else tst(u);});
fetch(API+'shop-stats').then(function(r){return r.json()}).then(function(d){var n=(d&&d.count!=null)?d.count:0;if(n<50)n=50+n;
  $('proof').textContent='\u{1F525} \u0110\xE3 t\u1EA1o '+n.toLocaleString('vi-VN')+' link ho\xE0n ti\u1EC1n cho kh\xE1ch';})
 .catch(function(){$('proof').textContent='\u{1F525} C\u1ED9ng \u0111\u1ED3ng ho\xE0n ti\u1EC1n \u0111ang l\u1EDBn m\u1ED7i ng\xE0y'});
<\/script>
</body>
</html>`;
var TRACK_HTML = `<!doctype html>
<html lang="vi"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#FF6B4A"><title>Tra c\u1EE9u \u0111\u01A1n - Mushoplaho</title>
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
<header><h1>\u{1F50E} Tra c\u1EE9u \u0111\u01A1n ho\xE0n ti\u1EC1n</h1></header>
<div class="wrap">
  <div class="card">
    <input id="q" placeholder="Nh\u1EADp M\xC3 \u0110\u01A0N (MLH-...) ho\u1EB7c S\u0110T/Facebook" autocomplete="off">
    <button class="btn" id="go">Tra c\u1EE9u</button>
    <div id="out" style="margin-top:8px"></div>
    <a class="link" href="/">\u2190 V\u1EC1 trang t\u1EA1o link</a>
  </div>
</div>
<script>
var $=function(i){return document.getElementById(i)};var out=$('out');
function render(rows){
  if(!rows.length){out.innerHTML='<p class="mut" style="margin-top:12px">Kh\xF4ng t\xECm th\u1EA5y \u0111\u01A1n. Ki\u1EC3m tra l\u1EA1i m\xE3/S\u0110T nh\xE9.</p>';return}
  out.innerHTML=rows.map(function(r){return '<div class="row"><div class="st">'+(r.order_code||'(ch\u01B0a c\xF3 m\xE3)')+' \u2014 '+r.status_label+'</div><div class="mut">'+(r.platform||'')+' \xB7 '+(r.when||'')+'</div></div>';}).join('')
   +'<p class="mut" style="margin-top:12px">\u{1F4B8} L\u1ECBch ho\xE0n: ng\xE0y 20\u201325 h\xE0ng th\xE1ng, sau khi Shopee \u0111\u1ED1i so\xE1t (~75\u2013105 ng\xE0y).</p>';
}
function look(){var q=($('q').value||'').trim();if(q.length<4){out.innerHTML='<p class="mut" style="margin-top:12px">Nh\u1EADp m\xE3 \u0111\u01A1n ho\u1EB7c S\u0110T nh\xE9.</p>';return}
  out.innerHTML='<p class="mut" style="margin-top:12px">\u0110ang tra...</p>';
  fetch('/track-lookup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q:q})})
   .then(function(r){return r.json()}).then(function(d){render((d&&d.orders)||[])})
   .catch(function(){out.innerHTML='<p class="mut">L\u1ED7i, th\u1EED l\u1EA1i sau.</p>'});}
$('go').addEventListener('click',look);$('q').addEventListener('keydown',function(e){if(e.key==='Enter')look()});
var qs=new URLSearchParams(location.search).get('q');if(qs){$('q').value=qs;look()}
<\/script>
</body></html>`;
var ADMIN_HTML = `<!doctype html>
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
<header>\u{1F510} Mushoplaho Admin</header>
<div class="wrap">
  <div class="card" id="login">
    <div class="bar"><input id="pass" type="password" placeholder="M\u1EADt kh\u1EA9u admin" style="flex:1;min-width:200px">
    <button id="btnLogin">\u0110\u0103ng nh\u1EADp</button></div>
    <p class="mut" id="lerr" style="margin-top:8px;color:#d92d20"></p>
  </div>
  <div class="card" id="panel" style="display:none">
    <div class="bar" style="justify-content:space-between">
      <div><b id="cnt">0</b> \u0111\u01A1n \xB7 <span class="mut">m\u1EDBi nh\u1EA5t tr\u01B0\u1EDBc</span></div>
      <div class="bar"><input id="filter" placeholder="L\u1ECDc m\xE3/S\u0110T/s\xE0n" style="width:200px"><button class="sm" id="reload">T\u1EA3i l\u1EA1i</button></div>
    </div>
    <div class="ov"><table id="tbl"><thead><tr>
      <th>M\xE3 \u0111\u01A1n</th><th>Li\xEAn h\u1EC7</th><th>STK ng\xE2n h\xE0ng</th><th>S\xE0n</th><th>Tr\u1EA1ng th\xE1i</th><th>Ghi ch\xFA</th><th></th><th>Link</th>
    </tr></thead><tbody></tbody></table></div>
  </div>
</div>
<script>
var $=function(i){return document.getElementById(i)};var PASS='';
var STATUSES=[['notified','Ch\u1EDD mua'],['purchased','\u0110\xE3 mua'],['confirmed','\u0110\u1ED1i so\xE1t'],['paid','\u0110\xE3 ho\xE0n'],['cancelled','Hu\u1EF7']];
function opts(cur){return STATUSES.map(function(s){return '<option value="'+s[0]+'"'+((s[0]===cur||(cur==='web'&&s[0]==='notified'))?' selected':'')+'>'+s[1]+'</option>'}).join('')}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function login(){PASS=$('pass').value;$('lerr').textContent='';load(true)}
function load(first){
  fetch('/admin-list',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pass:PASS})})
   .then(function(r){if(r.status===401){throw new Error('Sai m\u1EADt kh\u1EA9u')}return r.json()})
   .then(function(d){$('login').style.display='none';$('panel').style.display='block';render(d.orders||[])})
   .catch(function(e){if(first)$('lerr').textContent=e.message||'L\u1ED7i'});
}
function render(rows){
  window._rows=rows;var f=($('filter').value||'').toLowerCase();
  var list=rows.filter(function(r){return !f||((r.order_code||'')+ (r.contact||'')+(r.platform||'')).toLowerCase().indexOf(f)>=0});
  $('cnt').textContent=list.length;
  $('tbl').tBodies[0].innerHTML=list.map(function(r){
    var d=r.created_at?String(r.created_at).slice(0,10):'';
    return '<tr><td><b>'+esc(r.order_code)+'</b><div class="mut">'+d+'</div></td><td>'+esc(r.contact)+'</td>'
      +'<td><input class="stk" data-c="'+esc(r.order_code)+'" value="'+esc(r.bank_info)+'" placeholder="STK / NH / t\xEAn" style="width:160px"></td>'
      +'<td>'+esc(r.platform)+'</td>'
      +'<td><select data-c="'+esc(r.order_code)+'">'+opts(r.status)+'</select></td>'
      +'<td><input class="note" data-c="'+esc(r.order_code)+'" value="'+esc(r.admin_note)+'" placeholder="ghi ch\xFA" style="width:120px"></td>'
      +'<td><button class="sm" data-save="'+esc(r.order_code)+'">L\u01B0u</button></td>'
      +'<td><a href="'+esc(r.original_url)+'" target="_blank">xem</a></td></tr>';
  }).join('');
  Array.prototype.forEach.call(document.querySelectorAll('[data-save]'),function(b){b.onclick=function(){
    var code=b.getAttribute('data-save');var sel=document.querySelector('select[data-c="'+code+'"]');
    var stk=document.querySelector('input.stk[data-c="'+code+'"]');var note=document.querySelector('input.note[data-c="'+code+'"]');
    b.textContent='...';fetch('/admin-update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pass:PASS,order_code:code,status:sel.value,bank_info:stk?stk.value:undefined,admin_note:note?note.value:undefined})})
     .then(function(r){return r.json()}).then(function(d){b.textContent=d.ok?'\u2713':'l\u1ED7i';setTimeout(function(){b.textContent='L\u01B0u'},1200)});
  }});
}
$('btnLogin').onclick=login;$('pass').addEventListener('keydown',function(e){if(e.key==='Enter')login()});
$('reload').onclick=function(){load(false)};$('filter').addEventListener('input',function(){render(window._rows||[])});
<\/script>
</body></html>`;
function html(body) {
  return new Response(body, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
__name(html, "html");
function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
__name(json, "json");
var index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "GET" && (path === "/webhook" || path === "/")) {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");
      if (mode === "subscribe" && token && token === env.FB_VERIFY_TOKEN) return new Response(challenge, { status: 200 });
      if (path === "/") return html(SHOP_HTML);
      return new Response("Forbidden", { status: 403 });
    }
    if (request.method === "POST" && (path === "/webhook" || path === "/")) {
      const body = await request.json().catch(() => ({}));
      const entries = body && body.entry || [];
      ctx.waitUntil((async () => {
        for (const entry of entries) {
          const messaging = entry && entry.messaging || [];
          for (const msg of messaging) {
            const res = await buildReply(msg, env);
            if (res && res.reply) await sendMessenger(res.psid, res.reply, env);
          }
        }
      })());
      return new Response("EVENT_RECEIVED", { status: 200 });
    }
    if (request.method === "GET" && path === "/shop") return html(SHOP_HTML);
    if (request.method === "GET" && path === "/track") return html(TRACK_HTML);
    if (request.method === "POST" && path === "/shop-convert") {
      const body = await request.json().catch(() => ({}));
      const u = (body.url || "").trim();
      const contact = (body.contact || "").trim();
      if (!/^https?:\/\//.test(u)) return json({ error: "Link kh\xF4ng h\u1EE3p l\u1EC7" }, 400);
      if (contact.length < 6) return json({ error: "Vui l\xF2ng nh\u1EADp S\u0110T/Facebook \u0111\u1EC3 nh\u1EADn ti\u1EC1n ho\xE0n" }, 400);
      const { platform, aff } = await makeAffiliate(u, env);
      const code = genOrderCode();
      await supabaseInsert({ buyer_psid: "web", buyer_text: "web", contact, order_code: code, original_url: u, platform, affiliate_url: aff, status: "web" }, env);
      return json({ buy_url: aff, order_code: code });
    }
    if (request.method === "POST" && path === "/track-lookup") {
      const body = await request.json().catch(() => ({}));
      const rows = await supabaseFind(body.q || "", env);
      const orders = rows.map((r) => ({
        order_code: r.order_code,
        platform: r.platform,
        status_label: statusLabel(r.status),
        when: r.created_at ? String(r.created_at).slice(0, 10) : ""
      }));
      return json({ orders });
    }
    if (request.method === "GET" && path === "/admin") return html(ADMIN_HTML);
    if (request.method === "POST" && path === "/admin-list") {
      const body = await request.json().catch(() => ({}));
      if (!checkAdmin(body.pass, env)) return json({ error: "unauthorized" }, 401);
      return json({ orders: await supabaseList(env, 100) });
    }
    if (request.method === "POST" && path === "/admin-update") {
      const body = await request.json().catch(() => ({}));
      if (!checkAdmin(body.pass, env)) return json({ error: "unauthorized" }, 401);
      return json({ ok: await supabaseUpdate(body.order_code, body, env) });
    }
    if (request.method === "GET" && path === "/shop-stats") {
      let count = 0;
      try {
        const r = await fetch(env.SUPABASE_URL + "/rest/v1/submissions?select=id", {
          headers: { apikey: env.SUPABASE_SERVICE_KEY, "Authorization": "Bearer " + env.SUPABASE_SERVICE_KEY, "Prefer": "count=exact", "Range": "0-0" }
        });
        const cr = r.headers.get("content-range") || "";
        const m = cr.match(/\/(\d+)/);
        if (m) count = parseInt(m[1], 10);
      } catch (e) {
      }
      return json({ count });
    }
    return new Response("Not found", { status: 404 });
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
