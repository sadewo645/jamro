import crypto from 'node:crypto';
import { JWT_SECRET, TOKEN_TTL_SECONDS } from '../config.js';

function base64UrlEncode(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  const pad = 4 - (str.length % 4 || 4);
  const normalized = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad % 4);
  return Buffer.from(normalized, 'base64').toString('utf8');
}

export function signToken(payload, ttlSeconds = TOKEN_TTL_SECONDS) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const nowSeconds = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: nowSeconds,
    exp: nowSeconds + ttlSeconds,
  };
  const headerSegment = base64UrlEncode(JSON.stringify(header));
  const payloadSegment = base64UrlEncode(JSON.stringify(body));
  const content = `${headerSegment}.${payloadSegment}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(content).digest('base64url');
  return `${content}.${signature}`;
}

export function verifyToken(token) {
  if (!token) {
    throw new Error('Missing token');
  }
  const [headerSegment, payloadSegment, signature] = token.split('.');
  if (!headerSegment || !payloadSegment || !signature) {
    throw new Error('Invalid token');
  }
  const content = `${headerSegment}.${payloadSegment}`;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(content).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error('Invalid signature');
  }
  const payload = JSON.parse(base64UrlDecode(payloadSegment));
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error('Token expired');
  }
  return payload;
}
