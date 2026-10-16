// Gọi API từ trang quản trị (client), ném lỗi kèm thông báo tiếng Việt
export async function api<T = unknown>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    headers: json !== undefined ? { 'Content-Type': 'application/json', ...rest.headers } : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (res.status === 401 && typeof window !== 'undefined' && url.startsWith('/api/admin')) {
    window.location.href = '/admin/login';
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Lỗi ${res.status}`);
  return data as T;
}

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

export const SIDE_LABEL: Record<string, string> = { trai: 'Nhà trai', gai: 'Nhà gái', chung: 'Bạn chung' };
export const SIDE_COLOR: Record<string, string> = { trai: 'blue', gai: 'magenta', chung: 'gold' };
