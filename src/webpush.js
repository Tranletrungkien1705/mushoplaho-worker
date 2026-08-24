// Web Push (VAPID RFC8292 + aes128gcm RFC8291) bang WebCrypto — chay tren Cloudflare Worker.
function b64urlToBytes(s) {
  s = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s); const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return a;
}
function bytesToB64url(a) {
  const b = new Uint8Array(a); let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function concat() {
  let len = 0; for (let i = 0; i < arguments.length; i++) len += arguments[i].length;
  const out = new Uint8Array(len); let o = 0;
  for (let i = 0; i < arguments.length; i++) { out.set(arguments[i], o); o += arguments[i].length; }
  return out;
}
async function hkdf(salt, ikm, info, len) {
  const key = await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, len * 8);
  return new Uint8Array(bits);
}
async function vapidJWT(endpoint, pub, priv, subject) {
  const aud = new URL(endpoint).origin;
  const enc = o => bytesToB64url(new TextEncoder().encode(JSON.stringify(o)));
  const header = { typ: 'JWT', alg: 'ES256' };
  const claims = { aud, exp: Math.floor(Date.now() / 1000) + 43200, sub: subject || 'mailto:admin@mushoplaho' };
  const signingInput = enc(header) + '.' + enc(claims);
  const pubBytes = b64urlToBytes(pub);
  const jwk = { kty: 'EC', crv: 'P-256', x: bytesToB64url(pubBytes.slice(1, 33)), y: bytesToB64url(pubBytes.slice(33, 65)), d: priv, ext: true };
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(signingInput));
  return signingInput + '.' + bytesToB64url(new Uint8Array(sig));
}
async function encryptPayload(payloadStr, p256dh, authSecret) {
  const clientPub = b64urlToBytes(p256dh);
  const auth = b64urlToBytes(authSecret);
  const eph = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const ephPub = new Uint8Array(await crypto.subtle.exportKey('raw', eph.publicKey));
  const clientKey = await crypto.subtle.importKey('raw', clientPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: clientKey }, eph.privateKey, 256));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const ikm = await hkdf(auth, shared, concat(enc.encode('WebPush: info\0'), clientPub, ephPub), 32);
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);
  const pt = concat(enc.encode(payloadStr), new Uint8Array([2]));
  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, pt));
  const rs = new Uint8Array([0, 0, 0x10, 0]);          // record size 4096
  const idlen = new Uint8Array([ephPub.length]);        // 65
  return concat(salt, rs, idlen, ephPub, ct);
}
export async function sendWebPush(sub, payloadStr, pub, priv, subject) {
  if (!sub || !sub.endpoint || !sub.keys) return 0;
  const jwt = await vapidJWT(sub.endpoint, pub, priv, subject);
  const body = await encryptPayload(payloadStr, sub.keys.p256dh, sub.keys.auth);
  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': 'vapid t=' + jwt + ', k=' + pub,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      'TTL': '86400'
    },
    body
  });
  return res.status;
}
