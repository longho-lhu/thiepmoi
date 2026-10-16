import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const rsvps = await prisma.rsvp.findMany({
    orderBy: { createdAt: 'desc' },
    include: { guest: { select: { displayName: true, side: true, code: true } } },
  });
  return NextResponse.json(rsvps);
}

export async function DELETE(req: Request) {
  const id = Number(new URL(req.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Thiếu id' }, { status: 400 });
  await prisma.rsvp.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
