import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, isAdminToken } from '@/lib/auth';

// Chỉ chặn các trang /admin. API /api/admin/* tự kiểm tra bằng withAdmin (src/lib/auth.ts),
// vì request đi qua middleware bị sao chép body và làm hỏng upload file lớn.
export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === '/admin/login') return NextResponse.next();
  if (await isAdminToken(req.cookies.get(ADMIN_COOKIE)?.value)) return NextResponse.next();
  return NextResponse.redirect(new URL('/admin/login', req.url));
}

export const config = { runtime: 'nodejs', matcher: ['/admin/:path*'] };
