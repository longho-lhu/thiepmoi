import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, signAdminToken } from '@/lib/auth';
import { clientIp, hit, tooSoon } from '@/lib/rateLimit';

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (tooSoon('login', ip, 2_000)) {
    return NextResponse.json({ error: 'Thử lại sau giây lát' }, { status: 429 });
  }
  hit('login', ip);

  const { password } = await req.json().catch(() => ({}));
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Sai mật khẩu' }, { status: 401 });
  }
  const token = await signAdminToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}

// Đăng xuất
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
