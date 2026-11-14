// PUB-01: validates the Cloudflare Access token (header Cf-Access-Jwt-Assertion) with the public keys of the Access
// team: RS256 signature, audience of the Rumbo application, issuer, expiry and not-before. Returns the email (the
// person) or null. Throws only when the keys cannot be fetched, so the caller answers 503 instead of 401.
import {createPublicKey, verify} from 'node:crypto';

const MARGEN_S = 60; // clock skew allowed between Cloudflare and the VPS
const REFRESCO_MS = 60 * 60 * 1000; // keys are refetched every hour, or on an unknown kid at most once a minute
const ESPERA_KID_MS = 60 * 1000;

const b64url = s => Buffer.from(s, 'base64url');
const json = s => { try { return JSON.parse(b64url(s).toString('utf8')); } catch { return null; } };

export function crearVerificador({equipo, aud, certsUrl, fetchFn = fetch, ahora = () => Date.now()}) {
  if (!equipo || !aud) throw new Error('Faltan ACCESS_TEAM y ACCESS_AUD');
  const emisor = `https://${equipo}.cloudflareaccess.com`;
  const url = certsUrl || `${emisor}/cdn-cgi/access/certs`;
  let llaves = new Map(), cargadas = -Infinity, intento = -Infinity;

  async function cargar() {
    intento = ahora();
    const r = await fetchFn(url);
    if (!r.ok) throw new Error(`No se pudieron leer las llaves de Access (${r.status})`);
    const {keys} = await r.json();
    const nuevas = new Map();
    for (const k of keys || []) if (k.kid && k.kty === 'RSA') nuevas.set(k.kid, createPublicKey({key: k, format: 'jwk'}));
    llaves = nuevas; cargadas = ahora();
  }

  async function llave(kid) {
    if (ahora() - cargadas > REFRESCO_MS) await cargar();
    else if (!llaves.has(kid) && ahora() - intento > ESPERA_KID_MS) await cargar();
    return llaves.get(kid);
  }

  return async function verificar(token) {
    if (typeof token !== 'string' || token.length > 8192) return null;
    const partes = token.split('.');
    if (partes.length !== 3) return null;
    const [h, p, firma] = partes;
    const cab = json(h), datos = json(p);
    if (!cab || !datos || cab.alg !== 'RS256' || typeof cab.kid !== 'string') return null;
    const k = await llave(cab.kid);
    if (!k) return null;
    if (!verify('RSA-SHA256', Buffer.from(`${h}.${p}`), k, b64url(firma))) return null;
    const s = ahora() / 1000;
    const auds = Array.isArray(datos.aud) ? datos.aud : [datos.aud];
    if (datos.iss !== emisor || !auds.includes(aud)) return null;
    if (typeof datos.exp !== 'number' || datos.exp + MARGEN_S < s) return null;
    if (typeof datos.nbf === 'number' && datos.nbf - MARGEN_S > s) return null;
    if (typeof datos.email !== 'string' || !datos.email.includes('@')) return null;
    return datos.email.trim().toLowerCase();
  };
}
