import 'server-only';
import type { Metadata } from 'next';
import type { Photo, Wedding, Wish } from '@prisma/client';
import { ensureOgCover } from './og';
import type { GiftAccount, InvitationData } from '@/components/invitation/types';
import { prisma } from './db';
import { lunarText } from './lunar';
import { googleCalendarUrl } from './calendar';
import { dateText, lastWord, mediaUrl, parseJson, timeText, vnParts, weekdayText } from './format';
import { stripVietnamese } from './vietqr';

export async function loadInvitation() {
  const [wedding, photos, wishes] = await Promise.all([
    prisma.wedding.findUnique({ where: { id: 1 } }),
    prisma.photo.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }),
    prisma.wish.findMany({ where: { approved: true }, orderBy: { createdAt: 'desc' }, take: 50 }),
  ]);
  return { wedding, photos, wishes };
}

// Tên gọi trên thiệp: lấy ô "tên gọi" nếu có, không thì chữ cuối của họ tên
const shortName = (short: string | null, full: string) => short?.trim() || lastWord(full);

// "Khang & Vân Anh": dùng cho tiêu đề trang, phong bì, ảnh chia sẻ, lịch, VietQR
export const coupleTitle = (w: Wedding) =>
  `${shortName(w.groomShortName, w.groomName)} & ${shortName(w.brideShortName, w.brideName)}`;

// Metadata của trang thiệp: tiêu đề, mô tả và ảnh xem trước khi chia sẻ đều lấy từ dữ liệu hiện tại,
// nên đổi tên cô dâu chú rể hay ngày cưới trong trang quản trị là tự cập nhật theo
export async function invitationMetadata(w: Wedding | null, guestName: string | null): Promise<Metadata> {
  const robots = { index: false, follow: false };
  if (!w) return { title: 'Thiệp cưới', robots };

  const couple = coupleTitle(w);
  const date = dateText(w.partyAt);
  const title = `Thiệp cưới ${couple}`;
  const description = guestName
    ? `Thân mời ${guestName} đến dự lễ thành hôn của ${couple} – ${date}`
    : `Trân trọng kính mời bạn đến dự lễ thành hôn của ${couple} – ${date}`;

  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  const ogFile = await ensureOgCover(couple, date).catch((e) => {
    console.error('Không tạo được ảnh OG', e);
    return null;
  });
  const images = ogFile ? [{ url: `${site}${mediaUrl(ogFile)}`, width: 1200, height: 630, alt: title }] : [];

  return {
    title,
    description,
    openGraph: { type: 'website', locale: 'vi_VN', siteName: title, title, description, images },
    twitter: { card: 'summary_large_image', title, description, images: images.map((i) => i.url) },
    robots,
  };
}

export function toInvitationData(
  w: Wedding,
  photos: Photo[],
  wishes: Wish[],
  guest: { code: string; name: string } | null,
): InvitationData {
  const title = coupleTitle(w);
  const venue = `${w.venueName}, ${w.venueAddress}`;
  const partyEnd = new Date(w.partyAt.getTime() + 3 * 3600_000);

  const gifts: GiftAccount[] = [];
  if (w.groomBankBin && w.groomAccountNo) {
    gifts.push({
      who: 'Chú rể', bin: w.groomBankBin, bankName: w.groomBankName ?? '',
      accountNo: w.groomAccountNo, accountName: w.groomAccountName ?? '',
    });
  }
  if (w.brideBankBin && w.brideAccountNo) {
    gifts.push({
      who: 'Cô dâu', bin: w.brideBankBin, bankName: w.brideBankName ?? '',
      accountNo: w.brideAccountNo, accountName: w.brideAccountName ?? '',
    });
  }

  return {
    title,
    guest,
    groom: { name: w.groomName, role: w.groomRole, father: w.groomFather, mother: w.groomMother, address: w.groomAddress },
    bride: { name: w.brideName, role: w.brideRole, father: w.brideFather, mother: w.brideMother, address: w.brideAddress },
    ceremony: {
      time: timeText(w.ceremonyAt),
      weekday: weekdayText(w.ceremonyAt),
      date: dateText(w.ceremonyAt),
      lunar: lunarText(w.ceremonyAt),
      place: w.ceremonyPlace,
    },
    party: {
      iso: w.partyAt.toISOString(),
      receptionTime: timeText(w.receptionAt),
      partyTime: timeText(w.partyAt),
      weekday: weekdayText(w.partyAt),
      date: dateText(w.partyAt),
      lunar: lunarText(w.partyAt),
      venueName: w.venueName,
      venueAddress: w.venueAddress,
      mapUrl: w.mapUrl,
      mapQuery: w.mapQuery,
      googleCalendarUrl: googleCalendarUrl({
        title: `Tiệc cưới ${title}`,
        start: w.receptionAt,
        end: partyEnd,
        location: venue,
        details: `Trân trọng kính mời bạn đến dự tiệc cưới ${title}.`,
      }),
      icsUrl: '/api/ics',
    },
    calendar: vnParts(w.partyAt),
    dressCode: w.showDressCode
      ? { note: w.dressCodeNote, colors: parseJson<string[]>(w.dressCodeColors, []) }
      : null,
    schedule: parseJson<{ time: string; title: string }[]>(w.schedule, []),
    gifts,
    qrNote: stripVietnamese(`Mung cuoi ${title.replace('&', '')}`).replace(/\s+/g, ' ').slice(0, 25),
    musicUrl: w.musicFile ? mediaUrl(w.musicFile) : null,
    coverUrl: w.coverImage ? mediaUrl(w.coverImage) : null,
    closingMessage: w.closingMessage,
    photos: photos.map((p) => mediaUrl(p.file)),
    wishes: wishes.map((x) => ({ id: x.id, name: x.name, content: x.content, createdAt: x.createdAt.toISOString() })),
  };
}
