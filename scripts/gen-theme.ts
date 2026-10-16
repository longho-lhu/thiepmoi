// Nén hoạ tiết trong source-img/ sang public/theme/ (WebP, mỗi file nên dưới 100KB)
// Chạy: npm run theme
// Ảnh xem trước khi chia sẻ link (Open Graph) không tạo ở đây nữa: server tự vẽ từ tên và ngày
// cưới trong database (src/lib/og.ts), nên đổi tên trong trang quản trị là ảnh tự đổi theo.
import path from 'node:path';
import sharp from 'sharp';

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

optimizeDecorations();
