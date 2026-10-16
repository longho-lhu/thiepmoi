// Giới hạn tần suất theo IP, lưu trong bộ nhớ tiến trình (chỉ chạy 1 instance)
const buckets = new Map<string, Map<string, number>>();

export const clientIp = (req: Request) =>
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';

export function tooSoon(bucket: string, ip: string, ms: number) {
  const last = buckets.get(bucket)?.get(ip) ?? 0;
  return Date.now() - last < ms;
}

export function hit(bucket: string, ip: string) {
  if (!buckets.has(bucket)) buckets.set(bucket, new Map());
  buckets.get(bucket)!.set(ip, Date.now());
}
