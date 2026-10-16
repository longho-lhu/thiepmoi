import 'server-only';
import type { Photo, Wedding, Wish } from '@prisma/client';
import type { GiftAccount, InvitationData } from '@/components/invitation/types';
import { prisma } from './db';
import { lunarText } from './lunar';
import { googleCalendarUrl } from './calendar';
import { dateText, mediaUrl, parseJson, timeText, vnParts, weekdayText } from './format';
import { stripVietnamese } from './vietqr';

export async function loadInvitation() {
  const [wedding, photos, wishes] = await Promise.all([
    prisma.wedding.findUnique({ where: { id: 1 } }),
    prisma.photo.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }),
    prisma.wish.findMany({ where: { approved: true }, orderBy: { createdAt: 'desc' }, take: 50 }),
  ]);
  return { wedding, photos, wishes };
}

export const coupleTitle = (w: Wedding) => `${shortName(w.groomName)} & ${shortName(w.brideName)}`;

// "Nguyễn Minh Khang" -> "Khang", "Trần Diệu Anh" -> "Diệu Anh" (giữ 2 chữ cuối nếu tên đệm ngắn)
function shortName(full: string) {
  const parts = full.trim().split(/\s+/);
  if (parts.length >= 3 && parts.at(-2)!.length <= 4 && parts.at(-1)!.length <= 3) return parts.slice(-2).join(' ');
  return parts.at(-1) ?? full;
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
