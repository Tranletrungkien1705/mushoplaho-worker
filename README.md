# Mulaho-lite — Cloudflare Worker

Bot hoàn tiền Messenger (thay n8n): webhook → detect sàn → AccessTrade (fallback link gốc) → Supabase → reply + FAQ. Always-on, free, không cần thẻ.

## Deploy (1 lần)
```bash
npm i -g wrangler         # nếu chưa có
wrangler login            # đăng nhập Cloudflare (mở trình duyệt)
# --- set secrets (lấy giá trị từ D:\mulaho\secrets.ps1) ---
wrangler secret put FB_PAGE_TOKEN
wrangler secret put FB_VERIFY_TOKEN
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put ACCESSTRADE_TOKEN        # nếu chưa có publisher, để trống -> tự fallback link gốc
wrangler secret put AT_CAMPAIGN_SHOPEE        # (tùy chọn)
wrangler secret put AT_CAMPAIGN_TIKTOK        # (tùy chọn)
wrangler secret put AT_CAMPAIGN_LAZADA        # (tùy chọn)
wrangler deploy
```
→ Được URL: `https://mulaho.<subdomain>.workers.dev`

## Trỏ webhook Messenger sang Worker (thay ngrok)
Facebook App → Messenger → Webhooks → Edit Callback URL:
- Callback URL: `https://mulaho.<subdomain>.workers.dev/webhook`
- Verify Token: đúng giá trị `FB_VERIFY_TOKEN`
- Subscribe: `messages`, `messaging_postbacks`

## Endpoint
- `GET/POST /webhook` — Messenger
- `GET /shop` — trang web dán link
- `POST /shop-convert` — API convert (JSON `{url}` → `{buy_url}`)

## Sau khi chạy OK → tắt trên 150
- Dừng n8n + ngrok (task `MulahoAutostart`), gỡ `D:\mulaho` khỏi autostart.
- Supabase giữ nguyên (đã external).
