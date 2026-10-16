import 'server-only';
import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { access, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { ensureUploadDir } from './uploads';

// Tăng khi đổi bố cục ảnh để các ảnh cũ được tạo lại
const TEMPLATE_VERSION = 1;
const THEME = path.join(process.cwd(), 'public', 'theme');
const OG_FILE = /^og-[0-9a-f]+\.jpg$/;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Ảnh xem trước khi chia sẻ link (Zalo, Facebook) 1200x630, vẽ từ tên và ngày cưới hiện tại
async function render(names: string, date: string) {
  const corner = (await readFile(path.join(THEME, 'corner.svg'), 'utf8')).replace(/<svg[^>]*>/, '').replace('</svg>', '');
  const place = (x: number, y: number, sx: number, sy: number) =>
    `<g transform="translate(${x} ${y}) scale(${sx * 1.4} ${sy * 1.4})" fill="none">${corner}</g>`;

  const cx = 450; // tâm cột chữ bên trái
  const nameSize = Math.round(Math.min(76, (76 * 16) / Math.max(names.length, 1))); // tên dài thì chữ nhỏ lại
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <defs>
      <radialGradient id="bg" cx="40%" cy="45%" r="75%">
        <stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#efe1c6"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    ${place(14, 14, 1, 1)}
    ${place(14, 616, 1, -1)}
    <text x="${cx}" y="300" font-family="Arial, sans-serif" font-size="22" letter-spacing="10" text-anchor="middle" fill="#b8893a">THIỆP MỜI CƯỚI</text>
    <text x="${cx}" y="398" font-family="Georgia, serif" font-style="italic" font-size="${nameSize}" text-anchor="middle" fill="#9e1b1f">${esc(names)}</text>
    <line x1="${cx - 120}" y1="440" x2="${cx + 120}" y2="440" stroke="#b8893a" stroke-width="1.5"/>
    <text x="${cx}" y="496" font-family="Georgia, serif" font-size="36" letter-spacing="8" text-anchor="middle" fill="#3a2a22">${esc(date)}</text>
  </svg>`;

  const layer = (file: string, size: { width?: number; height?: number }) =>
    sharp(path.join(THEME, file)).resize(size).png().toBuffer();

  return sharp(Buffer.from(svg))
    .composite([
      { input: await layer('chu-hy.webp', { width: 230 }), left: cx - 115, top: 70 },
      { input: await layer('long-den.webp', { height: 230 }), left: 210, top: 0 },
      { input: await layer('dau-re.webp', { height: 540 }), left: 790, top: 40 },
      { input: await layer('may.webp', { width: 460 }), left: 720, top: 470 },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

/**
 * Trả về tên file ảnh OG (nằm trong UPLOAD_DIR, phục vụ qua /api/media).
 * Tên file chứa mã băm của tên + ngày: đổi tên cô dâu chú rể hay ngày cưới sẽ ra file mới,
 * đường dẫn mới, nên Zalo/Facebook buộc phải tải lại ảnh thay vì dùng ảnh cũ trong cache.
 */
export async function ensureOgCover(names: string, date: string) {
  const key = createHash('sha1').update(`${TEMPLATE_VERSION}|${names}|${date}`).digest('hex').slice(0, 12);
  const file = `og-${key}.jpg`;
  const dir = await ensureUploadDir();
  const full = path.join(dir, file);

  const exists = await access(full).then(() => true, () => false);
  if (exists) return file;

  // Ghi ra file tạm rồi đổi tên, để request khác không đọc phải ảnh đang ghi dở
  const tmp = `${full}.${randomBytes(4).toString('hex')}.tmp`;
  await writeFile(tmp, await render(names, date));
  await rename(tmp, full);

  // Xoá ảnh OG cũ (tên/ngày trước đó)
  for (const f of await readdir(dir)) {
    if (OG_FILE.test(f) && f !== file) await unlink(path.join(dir, f)).catch(() => {});
  }
  return file;
}
