export const TZ = 'Asia/Ho_Chi_Minh';

export const timeText = (d: Date) =>
  new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ }).format(d);

export const weekdayText = (d: Date) =>
  new Intl.DateTimeFormat('vi-VN', { weekday: 'long', timeZone: TZ }).format(d);

// Năm, tháng, ngày theo giờ Việt Nam
export function vnParts(d: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'numeric', day: 'numeric', timeZone: TZ,
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

export const dateText = (d: Date) => {
  const { year, month, day } = vnParts(d);
  return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
};

export const dateTimeText = (d: Date) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: TZ }).format(d);

export function parseJson<T>(s: string | null | undefined, fallback: T): T {
  try {
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
}

// "Nguyễn Minh Khang" -> "Khang"
export const lastWord = (full: string) => full.trim().split(/\s+/).at(-1) ?? full;

export const mediaUrl =(file: string) => `/api/media/${encodeURIComponent(file)}`;
