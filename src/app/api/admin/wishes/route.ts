import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAdmin } from '@/lib/auth';

async function handleGET() {
  const wishes = await prisma.wish.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(wishes);
}

// Ẩn / hiện lời chúc
async function handlePATCH(req: Request) {
  const parsed = z.object({ id: z.number().int(), approved: z.boolean() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  const wish = await prisma.wish.update({ where: { id: parsed.data.id }, data: { approved: parsed.data.approved } });
  return NextResponse.json(wish);
}

async function handleDELETE(req: Request) {
  const id = Number(new URL(req.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Thiếu id' }, { status: 400 });
  await prisma.wish.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}

export const GET = withAdmin(handleGET);
export const PATCH = withAdmin(handlePATCH);
export const DELETE = withAdmin(handleDELETE);
