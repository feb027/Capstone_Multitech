import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

function getSigningKey(): Uint8Array | null {
  const envSecret = process.env.AUTH_SECRET?.trim();
  if (envSecret) {
    return new TextEncoder().encode(envSecret);
  }
  if (process.env.NODE_ENV !== 'production') {
    return new TextEncoder().encode('multitech_dev_local_secret_2026');
  }
  return null;
}

export const ADMIN_COOKIE_NAME = 'multitech_admin_session';

export interface AdminSessionPayload {
  id: string;
  name: string;
  email: string;
}

export async function signAdminSession(payload: AdminSessionPayload): Promise<string> {
  const key = getSigningKey();
  if (!key) {
    throw new Error('AUTH_SECRET wajib dikonfigurasi pada environment production.');
  }
  return await new SignJWT({ ...payload, scope: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function verifyAdminSessionToken(token: string): Promise<AdminSessionPayload | null> {
  const key = getSigningKey();
  if (!key) return null;
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    if (payload.scope && payload.scope !== 'admin') return null;
    return payload as unknown as AdminSessionPayload;
  } catch {
    return null;
  }
}

export async function signTrackSessionToken(publicId: string): Promise<string> {
  const key = getSigningKey();
  if (!key) {
    throw new Error('AUTH_SECRET wajib dikonfigurasi pada environment production.');
  }
  return await new SignJWT({ publicId, scope: 'track' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function verifyTrackSessionToken(
  token: string | undefined,
  expectedPublicId: string
): Promise<boolean> {
  if (!token) return false;
  const key = getSigningKey();
  if (!key) return false;
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload.scope === 'track' && payload.publicId === expectedPublicId;
  } catch {
    return false;
  }
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyAdminSessionToken(token);
}

export async function setAdminSessionCookie(payload: AdminSessionPayload): Promise<void> {
  const token = await signAdminSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

export async function deleteAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
