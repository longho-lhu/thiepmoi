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

const cookieRe = new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`);

// Bọc API /api/admin/*: kiểm tra cookie ngay trong route thay vì ở middleware.
// Request đi qua middleware bị Next.js sao chép body (tối đa 10MB và lỗi với file lớn),
// nên upload ảnh/nhạc phải tránh middleware.
export function withAdmin<A extends unknown[]>(handler: (req: Request, ...args: A) => Promise<Response>) {
  return async (req: Request, ...args: A) => {
    const token = req.headers.get('cookie')?.match(cookieRe)?.[1];
    if (!(await isAdminToken(token))) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(req, ...args);
  };
}
