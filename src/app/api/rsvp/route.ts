import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { clientIp, hit, tooSoon } from '@/lib/rateLimit';

const schema = z.object({
  guestCode: z.string().optional(),
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(20).optional(),
  attending: z.boolean(),
  headcount: z.number().int().min(1).max(10),
  note: z.string().trim().max(300).optional(),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (tooSoon('rsvp', ip, 15_000)) {
    return NextResponse.json({ error: 'Bạn gửi hơi nhanh, đợi một chút nhé' }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });

  const { guestCode, ...data } = parsed.data;
  const guest = guestCode ? await prisma.guest.findUnique({ where: { code: guestCode } }) : null;

  // Khách gửi lại lần hai thì cập nhật bản ghi cũ, tránh đếm trùng
  const existing = guest
    ? await prisma.rsvp.findFirst({ where: { guestId: guest.id }, orderBy: { id: 'desc' } })
    : data.phone
      ? await prisma.rsvp.findFirst({ where: { guestId: null, phone: data.phone, name: data.name } })
      : null;

  hit('rsvp', ip);
  const rsvp = existing
    ? await prisma.rsvp.update({ where: { id: existing.id }, data: { ...data, createdAt: new Date() } })
    : await prisma.rsvp.create({ data: { ...data, guestId: guest?.id ?? null } });

  return NextResponse.json({ ok: true, id: rsvp.id, updated: Boolean(existing) }, { status: existing ? 200 : 201 });
}
