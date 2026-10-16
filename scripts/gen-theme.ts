// 1. Nén hoạ tiết trong source-img/ sang public/theme/ (WebP, mỗi file nên dưới 100KB)
// 2. Tạo ảnh xem trước khi chia sẻ (Open Graph) 1200x630: public/theme/og-cover.jpg
// Chạy: npm run theme -- "Khang & Diệu Anh" "20.12.2026"
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const [names = 'Khang & Diệu Anh', date = '20.12.2026'] = process.argv.slice(2);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const root = path.resolve(__dirname, '..');
const src = (f: string) => path.join(root, 'source-img', f);
const theme = (f: string) => path.join(root, 'public/theme', f);

// Chiều rộng tối đa khi xuất, đủ nét cho màn hình điện thoại 2x
const WIDTHS: Record<string, number> = {
  'chu-hy.webp': 480,
  'dau-re.webp': 720,
  'hoa.webp': 480,
  'long-den.webp': 160,
  'may-to.webp': 900,
  'may.webp': 900,
  'quat.webp': 480,
};

async function optimizeDecorations() {
  for (const [file, width] of Object.entries(WIDTHS)) {
    const info = await sharp(src(file))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78, alphaQuality: 80, effort: 6 })
      .toFile(theme(file));
    console.log(`${file.padEnd(14)} ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB`);
  }
}

async function ogCover() {
  const corner = (await readFile(theme('corner.svg'), 'utf8')).replace(/<svg[^>]*>/, '').replace('</svg>', '');

  // Bốn góc dùng chung một hoạ tiết, lật bằng scale
  const place = (x: number, y: number, sx: number, sy: number) =>
    `<g transform="translate(${x} ${y}) scale(${sx * 1.4} ${sy * 1.4})" fill="none">${corner}</g>`;

  const cx = 450; // tâm cột chữ bên trái
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
    <text x="${cx}" y="398" font-family="Georgia, serif" font-style="italic" font-size="76" text-anchor="middle" fill="#9e1b1f">${esc(names)}</text>
    <line x1="${cx - 120}" y1="440" x2="${cx + 120}" y2="440" stroke="#b8893a" stroke-width="1.5"/>
    <text x="${cx}" y="496" font-family="Georgia, serif" font-size="36" letter-spacing="8" text-anchor="middle" fill="#3a2a22">${esc(date)}</text>
  </svg>`;

  const layer = async (file: string, opts: { width?: number; height?: number }) =>
    sharp(src(file)).resize(opts).png().toBuffer();

  const out = theme('og-cover.jpg');
  await sharp(Buffer.from(svg))
    .composite([
      { input: await layer('chu-hy.webp', { width: 230 }), left: cx - 115, top: 70 },
      { input: await layer('long-den.webp', { height: 230 }), left: 210, top: 0 },
      { input: await layer('dau-re.webp', { height: 540 }), left: 790, top: 40 },
      { input: await layer('may.webp', { width: 460 }), left: 720, top: 470 },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out);
  console.log('Đã tạo', out);
}

optimizeDecorations().then(ogCover);
