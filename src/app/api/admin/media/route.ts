import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { prisma } from '@/lib/db';
import { withAdmin } from '@/lib/auth';
import { ensureUploadDir, safeFileName, uploadDir } from '@/lib/uploads';

export const runtime = 'nodejs';

// Ảnh bìa (coverImage) và nhạc nền (musicFile) của thiệp
const FIELD = { cover: 'coverImage', music: 'musicFile' } as const;
type Kind = keyof typeof FIELD;
const isKind = (k: unknown): k is Kind => k === 'cover' || k === 'music';

async function removeOld(kind: Kind) {
  const w = await prisma.wedding.findUnique({ where: { id: 1 } });
  const old = w?.[FIELD[kind]];
  if (old && safeFileName(old)) await unlink(path.join(uploadDir(), old)).catch(() => {});
}

async function handlePOST(req: Request) {
  const form = await req.formData().catch(() => null);
  const kind = form?.get('kind');
  const file = form?.get('file');
  if (!isKind(kind) || !(file instanceof File)) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  }

  const dir = await ensureUploadDir();
  const id = `${Date.now()}-${randomBytes(3).toString('hex')}`;
  let name: string;

  if (kind === 'cover') {
    if (!file.type.startsWith('image/') || file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'Chỉ nhận ảnh dưới 20MB' }, { status: 400 });
    }
    name = `cover-${id}.webp`;
    await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize(1200, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(dir, name));
  } else {
    const ext = path.extname(file.name).toLowerCase();
    if (!['.mp3', '.m4a'].includes(ext) || file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'Chỉ nhận file MP3/M4A dưới 15MB' }, { status: 400 });
    }
    name = `music-${id}${ext}`;
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  }

  await removeOld(kind);
  await prisma.wedding.update({ where: { id: 1 }, data: { [FIELD[kind]]: name } });
  return NextResponse.json({ ok: true, file: name }, { status: 201 });
}

async function handleDELETE(req: Request) {
  const kind = new URL(req.url).searchParams.get('kind');
  if (!isKind(kind)) return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  await removeOld(kind);
  await prisma.wedding.update({ where: { id: 1 }, data: { [FIELD[kind]]: null } });
  return NextResponse.json({ ok: true });
}

export const POST = withAdmin(handlePOST);
export const DELETE = withAdmin(handleDELETE);
