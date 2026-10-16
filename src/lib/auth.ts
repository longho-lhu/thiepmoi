import { SignJWT, jwtVerify } from 'jose';

export const ADMIN_COOKIE = 'admin';
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET);

export const signAdminToken = () =>
  new SignJWT({ role: 'admin' }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('7d').sign(secret());

export async function isAdminToken(token: string | undefined) {
  if (!token) return false;
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}
