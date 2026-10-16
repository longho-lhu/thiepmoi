import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { clientIp, hit, tooSoon } from '@/lib/rateLimit';

const schema = z.object({
  name: z.string().trim().min(1).max(60),
  content: z.string().trim().min(1).max(500),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (tooSoon('wishes', ip, 30_000)) {
    return NextResponse.json({ error: 'Bạn gửi hơi nhanh, đợi một chút nhé' }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });

  hit('wishes', ip);
  const wish = await prisma.wish.create({ data: parsed.data });
  return NextResponse.json(wish, { status: 201 });
}
