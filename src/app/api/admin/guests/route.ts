import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAdmin } from '@/lib/auth';
import { CODE_PATTERN, slugify } from '@/lib/slug';

// Link mời lấy theo tên hiển thị: "Gia đình em Tính & Tuyết" -> /k/gia-dinh-em-tinh-tuyet.
// Trùng thì thêm số: gia-dinh-em-tinh-tuyet-2. Bỏ qua khách excludeId khi đang sửa chính họ.
async function uniqueCode(base: string, excludeId?: number) {
  const slug = slugify(base) || randomBytes(4).toString('hex');
  for (let n = 1; ; n++) {
    const code = n === 1 ? slug : `${slug}-${n}`;
    const found = await prisma.guest.findUnique({ where: { code } });
    if (!found || found.id === excludeId) return code;
  }
}

const side = z.enum(['trai', 'gai', 'chung']);
const guestSchema = z.object({
  displayName: z.string().trim().min(1).max(100),
  side: side.default('chung'),
  note: z.string().trim().max(300).nullish(),
});
const bulkSchema = z.object({
  names: z.array(z.string().trim().min(1).max(100)).min(1).max(500),
  side: side.default('chung'),
});

async function handleGET() {
  const guests = await prisma.guest.findMany({
    orderBy: { createdAt: 'desc' },
    include: { rsvps: { orderBy: { id: 'desc' }, take: 1 } },
  });
  return NextResponse.json(
    guests.map(({ rsvps, ...g }) => ({ ...g, rsvp: rsvps[0] ?? null })),
  );
}

// Thêm 1 khách ({displayName, side, note}) hoặc nhiều khách ({names: [...], side})
async function handlePOST(req: Request) {
  const body = await req.json().catch(() => null);

  const bulk = bulkSchema.safeParse(body);
  if (bulk.success) {
    const names = [...new Set(bulk.data.names)];
    for (const displayName of names) {
      await prisma.guest.create({ data: { displayName, side: bulk.data.side, code: await uniqueCode(displayName) } });
    }
    return NextResponse.json({ ok: true, created: names.length }, { status: 201 });
  }

  const one = guestSchema.safeParse(body);
  if (!one.success) return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  const guest = await prisma.guest.create({ data: { ...one.data, code: await uniqueCode(one.data.displayName) } });
  return NextResponse.json(guest, { status: 201 });
}

// Sửa khách. code: để trống = giữ link cũ; nhập giá trị = đổi link (kiểm tra trùng)
async function handlePUT(req: Request) {
  const parsed = guestSchema
    .extend({
      id: z.number().int(),
      code: z.string().trim().max(70).regex(CODE_PATTERN, 'Link chỉ gồm chữ thường không dấu, số và dấu -').optional(),
    })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' }, { status: 400 });
  }
  const { id, code, ...data } = parsed.data;

  if (code) {
    const taken = await prisma.guest.findUnique({ where: { code } });
    if (taken && taken.id !== id) {
      return NextResponse.json({ error: `Link /k/${code} đã dùng cho "${taken.displayName}"` }, { status: 409 });
    }
  }
  const guest = await prisma.guest.update({ where: { id }, data: code ? { ...data, code } : data });
  return NextResponse.json(guest);
}

async function handleDELETE(req: Request) {
  const id = Number(new URL(req.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Thiếu id' }, { status: 400 });
  await prisma.guest.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}

export const GET = withAdmin(handleGET);
export const POST = withAdmin(handlePOST);
export const PUT = withAdmin(handlePUT);
export const DELETE = withAdmin(handleDELETE);
