import 'server-only';

// Chỉ nhận link của Google Maps, để server không bị lợi dụng gọi tới địa chỉ khác
// google.com, google.com.vn, google.co.uk, google.de...
const HOSTS = /^(maps\.app\.goo\.gl|goo\.gl|(www\.|maps\.)?google\.(com|[a-z]{2}|com?\.[a-z]{2}))$/;
const SHORT_HOSTS = /^(maps\.app\.goo\.gl|goo\.gl)$/;

export function isGoogleMapsUrl(u: string) {
  try {
    const url = new URL(u);
    return url.protocol === 'https:' && HOSTS.test(url.hostname);
  } catch {
    return false;
  }
}

const safeDecode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

// Lấy vị trí từ link Google Maps đầy đủ: ưu tiên toạ độ chính xác của địa điểm (!3d..!4d..),
// rồi tới tâm bản đồ (@lat,lng), tham số q, cuối cùng là tên trong /place/<tên>
export function queryFromMapsUrl(u: string): string | null {
  const s = safeDecode(u);
  const pin = s.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (pin) return `${pin[1]},${pin[2]}`;
  const center = s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (center) return `${center[1]},${center[2]}`;
  const url = new URL(u);
  const q = url.searchParams.get('q') ?? url.searchParams.get('query') ?? url.searchParams.get('destination');
  if (q) return q;
  const place = url.pathname.match(/\/place\/([^/]+)/);
  if (place) return safeDecode(place[1]).replace(/\+/g, ' ');
  return null;
}

// Link chia sẻ dạng maps.app.goo.gl/xxx: lần theo chuyển hướng để ra link đầy đủ rồi đọc vị trí
export async function resolveMapsUrl(shareUrl: string): Promise<string | null> {
  let current = shareUrl;
  for (let hop = 0; hop < 5; hop++) {
    if (!isGoogleMapsUrl(current)) return null;
    if (!SHORT_HOSTS.test(new URL(current).hostname)) {
      const q = queryFromMapsUrl(current);
      if (q) return q;
    }
    const res = await fetch(current, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0 (thiep-cuoi)' },
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);
    const next = res?.headers.get('location');
    if (!next) return null;
    current = new URL(next, current).toString();
  }
  return null;
}
