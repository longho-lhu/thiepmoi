import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { parseJson } from '@/lib/format';
import { isGoogleMapsUrl, resolveMapsUrl } from '@/lib/maps';

const text = (max: number) => z.string().trim().min(1).max(max);
const optional = (max: number) =>
  z.string().trim().max(max).nullish().transform((v) => (v ? v : null));

const schema = z.object({
  groomName: text(80),
  groomRole: text(40),
  groomFather: text(80),
  groomMother: text(80),
  groomAddress: text(200),
  brideName: text(80),
  brideRole: text(40),
  brideFather: text(80),
  brideMother: text(80),
  brideAddress: text(200),
  ceremonyAt: z.coerce.date(),
  ceremonyPlace: text(200),
  receptionAt: z.coerce.date(),
  partyAt: z.coerce.date(),
  venueName: text(120),
  venueAddress: text(250),
  mapUrl: optional(500).refine((v) => !v || isGoogleMapsUrl(v), 'Link phải là link chia sẻ của Google Maps'),
  showDressCode: z.boolean().default(true),
  dressCodeNote: optional(300),
  dressCodeColors: z.array(z.string().regex(/^#[0-9a-fA-F]{6,8}$/)).max(8),
  schedule: z.array(z.object({ time: text(10), title: text(100) })).max(20),
  groomBankBin: optional(10),
  groomBankName: optional(80),
  groomAccountNo: optional(30),
  groomAccountName: optional(80),
  brideBankBin: optional(10),
  brideBankName: optional(80),
  brideAccountNo: optional(30),
  brideAccountName: optional(80),
  closingMessage: text(300),
});

export async function GET() {
  const w = await prisma.wedding.findUnique({ where: { id: 1 } });
  if (!w) return NextResponse.json({ error: 'Chưa có dữ liệu, hãy chạy seed' }, { status: 404 });
  return NextResponse.json({
    ...w,
    dressCodeColors: parseJson<string[]>(w.dressCodeColors, []),
    schedule: parseJson<{ time: string; title: string }[]>(w.schedule, []),
  });
}

export async function PUT(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const custom = parsed.error.issues.find((i) => i.path[0] === 'mapUrl')?.message;
    return NextResponse.json({ error: custom ?? 'Dữ liệu không hợp lệ', issues: parsed.error.issues }, { status: 400 });
  }
  const { dressCodeColors, schedule, mapUrl, ...rest } = parsed.data;

  // Chỉ đọc lại vị trí khi link Google Maps đổi (hoặc lần trước chưa đọc được)
  const old = await prisma.wedding.findUnique({ where: { id: 1 }, select: { mapUrl: true, mapQuery: true } });
  const mapQuery = !mapUrl
    ? null
    : mapUrl === old?.mapUrl && old.mapQuery
      ? old.mapQuery
      : await resolveMapsUrl(mapUrl);

  const data = {
    ...rest,
    mapUrl,
    mapQuery,
    dressCodeColors: JSON.stringify(dressCodeColors),
    schedule: JSON.stringify(schedule),
  };
  const w = await prisma.wedding.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  return NextResponse.json({ ok: true, updatedAt: w.updatedAt, mapQuery: w.mapQuery });
}
