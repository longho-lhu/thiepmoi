import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAdmin } from '@/lib/auth';
import { ensureUploadDir, safeFileName, uploadDir } from '@/lib/uploads';

export const runtime = 'nodejs';

const MAX_BYTES = 20 * 1024 * 1024;

async function handleGET() {
  const photos = await prisma.photo.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
  return NextResponse.json(photos);
}

// Nhận ảnh, thu về cạnh dài 1600px, xuất WebP chất lượng 80
async function handlePOST(req: Request) {
  const form = await req.formData().catch(() => null);
  const files = (form?.getAll('file') ?? []).filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: 'Chưa chọn ảnh' }, { status: 400 });

  const dir = await ensureUploadDir();
  const last = await prisma.photo.findFirst({ orderBy: { sortOrder: 'desc' } });
  let order = (last?.sortOrder ?? 0) + 1;
  const created = [];

  for (const f of files) {
    if (f.size > MAX_BYTES || !f.type.startsWith('image/')) {
      return NextResponse.json({ error: `File ${f.name} không hợp lệ (chỉ nhận ảnh dưới 20MB)` }, { status: 400 });
    }
    const name = `p-${Date.now()}-${randomBytes(3).toString('hex')}.webp`;
    await sharp(Buffer.from(await f.arrayBuffer()))
      .rotate() // xoay theo EXIF của điện thoại
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(dir, name));
    created.push(await prisma.photo.create({ data: { file: name, sortOrder: order++ } }));
  }
  return NextResponse.json(created, { status: 201 });
}

// Đổi thứ tự
async function handlePATCH(req: Request) {
  const parsed = z.object({ id: z.number().int(), sortOrder: z.number().int().min(0).max(9999) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  const photo = await prisma.photo.update({ where: { id: parsed.data.id }, data: { sortOrder: parsed.data.sortOrder } });
  return NextResponse.json(photo);
}

async function handleDELETE(req: Request) {
  const id = Number(new URL(req.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Thiếu id' }, { status: 400 });
  const photo = await prisma.photo.delete({ where: { id } }).catch(() => null);
  if (photo && safeFileName(photo.file)) await unlink(path.join(uploadDir(), photo.file)).catch(() => {});
  return NextResponse.json({ ok: true });
}

export const GET = withAdmin(handleGET);
export const POST = withAdmin(handlePOST);
export const PATCH = withAdmin(handlePATCH);
export const DELETE = withAdmin(handleDELETE);
