import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import { slugify } from '../src/lib/slug';

const prisma = new PrismaClient();
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? './data/uploads');

// Giờ Việt Nam (UTC+7) -> Date
const vn = (s: string) => new Date(`${s}:00+07:00`);

// Ảnh giữ chỗ cho album, thay bằng ảnh cưới thật trong trang quản trị
async function placeholderPhoto(i: number) {
  const hues = ['#9e1b1f', '#b8893a', '#7a1215', '#c46a4a', '#8a5a44', '#a33b3f', '#6f4e37', '#b5651d', '#94342f', '#a8823c'];
  const c = hues[i % hues.length];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f6ecd9"/><stop offset="1" stop-color="${c}" stop-opacity="0.55"/>
        </linearGradient>
      </defs>
      <rect width="900" height="1200" fill="url(#g)"/>
      <circle cx="450" cy="560" r="230" fill="none" stroke="${c}" stroke-width="6" opacity="0.6"/>
      <circle cx="450" cy="560" r="200" fill="none" stroke="#fff" stroke-width="2" opacity="0.8"/>
      <text x="450" y="600" font-family="Georgia, serif" font-size="120" text-anchor="middle" fill="${c}">${i + 1}</text>
      <text x="450" y="1060" font-family="Georgia, serif" font-size="40" letter-spacing="8" text-anchor="middle" fill="#fff">ẢNH CƯỚI</text>
    </svg>`;
  const file = `p-seed-${i + 1}-${randomBytes(3).toString('hex')}.webp`;
  await sharp(Buffer.from(svg)).webp({ quality: 80 }).toFile(path.join(UPLOAD_DIR, file));
  return file;
}

async function main() {
  await prisma.$queryRawUnsafe('PRAGMA journal_mode=WAL;');
  await mkdir(UPLOAD_DIR, { recursive: true });

  const wedding = {
    groomName: 'Nguyễn Minh Khang',
    groomShortName: 'Khang',
    brideShortName: 'Diệu Anh',
    groomRole: 'Trưởng Nam',
    groomFather: 'Nguyễn Văn Hoà',
    groomMother: 'Lê Thị Thu',
    groomAddress: 'Số 12 đường Lê Lợi, P. Bến Thành, Quận 1, TP. Hồ Chí Minh',
    brideName: 'Trần Diệu Anh',
    brideRole: 'Út Nữ',
    brideFather: 'Trần Quốc Bảo',
    brideMother: 'Phạm Thị Lan',
    brideAddress: 'Số 45 đường Nguyễn Trãi, P. 2, Quận 5, TP. Hồ Chí Minh',
    ceremonyAt: vn('2026-12-20T09:00'),
    ceremonyPlace: 'Tư gia nhà trai',
    receptionAt: vn('2026-12-20T17:30'),
    partyAt: vn('2026-12-20T18:30'),
    venueName: 'Trung tâm Hội nghị White Palace',
    venueAddress: '194 Hoàng Văn Thụ, Phường 9, Phú Nhuận, TP. Hồ Chí Minh',
    dressCodeNote: 'Mời bạn diện trang phục tông đỏ, kem hoặc be để cùng hoà vào không khí ngày vui.',
    dressCodeColors: JSON.stringify(['#9e1b1f', '#c9a24a', '#f3e9d2', '#e8c4b8']),
    schedule: JSON.stringify([
      { time: '17:30', title: 'Đón khách, chụp ảnh lưu niệm' },
      { time: '18:30', title: 'Làm lễ trên sân khấu' },
      { time: '19:00', title: 'Khai tiệc' },
      { time: '20:00', title: 'Văn nghệ, giao lưu' },
      { time: '21:00', title: 'Cảm ơn và tiễn khách' },
    ]),
    groomBankBin: '970436',
    groomBankName: 'Vietcombank',
    groomAccountNo: '0123456789',
    groomAccountName: 'NGUYEN MINH KHANG',
    brideBankBin: '970407',
    brideBankName: 'Techcombank',
    brideAccountNo: '19031234567890',
    brideAccountName: 'TRAN DIEU ANH',
  };
  await prisma.wedding.upsert({ where: { id: 1 }, update: {}, create: { id: 1, ...wedding } });

  if ((await prisma.photo.count()) === 0) {
    for (let i = 0; i < 10; i++) {
      await prisma.photo.create({ data: { file: await placeholderPhoto(i), sortOrder: i + 1 } });
    }
  }

  if ((await prisma.guest.count()) === 0) {
    const guests = [
      { displayName: 'Gia đình em Tính & Tuyết', side: 'trai' },
      { displayName: 'Chú Hùng và cô Mai', side: 'trai' },
      { displayName: 'Bạn Thảo Vy', side: 'gai' },
      { displayName: 'Anh Tuấn team Marketing', side: 'chung' },
    ];
    for (const g of guests) {
      await prisma.guest.create({ data: { ...g, code: slugify(g.displayName) } });
    }
    const first = await prisma.guest.findFirst({ orderBy: { id: 'asc' } });
    if (first) {
      await prisma.rsvp.create({ data: { guestId: first.id, name: first.displayName, attending: true, headcount: 2 } });
    }
  }

  if ((await prisma.wish.count()) === 0) {
    await prisma.wish.createMany({
      data: [
        { name: 'Thảo Vy', content: 'Chúc hai bạn trăm năm hạnh phúc, sớm có tin vui nhé!' },
        { name: 'Anh Tuấn', content: 'Chúc mừng Khang & Diệu Anh! Mãi yêu thương nhau như ngày đầu.' },
        { name: 'Gia đình chú Hùng', content: 'Chúc các cháu bách niên giai lão, sắt son trọn đời.' },
      ],
    });
  }

  console.log('Seed xong.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
