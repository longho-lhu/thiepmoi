import { prisma } from '@/lib/db';
import { icsFile } from '@/lib/calendar';
import { coupleTitle } from '@/lib/invitation';

export const dynamic = 'force-dynamic';

// File .ics cho người dùng iPhone (Apple Calendar)
export async function GET() {
  const w = await prisma.wedding.findUnique({ where: { id: 1 } });
  if (!w) return new Response('Not found', { status: 404 });

  const title = coupleTitle(w);
  const body = icsFile({
    uid: `tiec-cuoi-${w.partyAt.getTime()}@thiep-cuoi`,
    title: `Tiệc cưới ${title}`,
    start: w.receptionAt,
    end: new Date(w.partyAt.getTime() + 3 * 3600_000),
    location: `${w.venueName}, ${w.venueAddress}`,
    details: `Trân trọng kính mời bạn đến dự tiệc cưới ${title}.`,
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="tiec-cuoi.ics"',
    },
  });
}
