import path from 'node:path';
import { stat, readFile } from 'node:fs/promises';
import { safeFileName, uploadDir } from '@/lib/uploads';

const TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
};

export async function GET(req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const ext = path.extname(file).toLowerCase();
  // Chặn "..", "/" và đuôi lạ để không đọc được file ngoài thư mục upload
  if (!safeFileName(file) || !TYPES[ext]) return new Response('Not found', { status: 404 });

  const full = path.join(uploadDir(), file);
  const info = await stat(full).catch(() => null);
  if (!info?.isFile()) return new Response('Not found', { status: 404 });

  const headers: Record<string, string> = {
    'Content-Type': TYPES[ext],
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes',
  };

  // Safari iOS cần Range request để phát nhạc
  const range = req.headers.get('range')?.match(/bytes=(\d*)-(\d*)/);
  const buf = await readFile(full);
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), info.size - 1) : info.size - 1;
    if (start > end || start >= info.size) {
      return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${info.size}` } });
    }
    return new Response(new Uint8Array(buf.subarray(start, end + 1)), {
      status: 206,
      headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${info.size}`, 'Content-Length': String(end - start + 1) },
    });
  }
  return new Response(new Uint8Array(buf), { headers: { ...headers, 'Content-Length': String(info.size) } });
}
