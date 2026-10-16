# Quy trình làm thiệp cưới online — Next.js + SQLite + Ant Design

Oct 16, 2026 · @Long Ho

## Tổng quan

Toàn bộ trang thiệp chạy trong một app Next.js, gồm ba phần: trang thiệp cho khách xem, API ghi xác nhận tham dự và lời chúc vào một file SQLite, và trang quản trị dựng bằng Ant Design. Bố cục và tính năng lấy theo [bản demo Nhật Bình Đỏ](https://chungdoi.com/vi/mau-thiep/nhat-binh-do/demo). Hoạ tiết và hình ảnh phải tự thiết kế hoặc mua bản có license, không lấy lại của họ.

| Phần | Đường dẫn | Người dùng | Nội dung |
| --- | --- | --- | --- |
| Thiệp chung | `/` | Ai có link | Thiệp không ghi tên khách |
| Thiệp riêng | `/k/[code]` | Từng khách | Bìa ghi "Thân mời \<tên khách>", RSVP gắn với khách |
| API công khai | `/api/rsvp`, `/api/wishes` | Trang thiệp gọi | Ghi xác nhận tham dự, lời chúc |
| Quản trị | `/admin/*` | Cô dâu, chú rể | Sửa thông tin, quản lý khách, xem RSVP, duyệt lời chúc, upload ảnh |
| API quản trị | `/api/admin/*` | Trang quản trị gọi | CRUD, có kiểm tra đăng nhập |

**Stack:**

| Thư viện | Dùng để |
| --- | --- |
| Next.js 15 (App Router, TypeScript) | Trang thiệp render phía server, API route, middleware |
| Ant Design 5 + `@ant-design/nextjs-registry` | Toàn bộ trang quản trị; trên trang thiệp dùng cho form RSVP, lời chúc, modal, xem ảnh |
| SQLite + Prisma | Lưu dữ liệu trong một file, không cần cài DB server |
| `dayjs` | Định dạng ngày giờ |
| `lunar-javascript` | Đổi ngày dương sang âm lịch |
| `qrcode` | Tạo mã VietQR cho hộp quà mừng |
| `framer-motion` | Hiệu ứng mở phong bì, các section hiện dần khi cuộn |
| `zod`, `jose`, `sharp` | Kiểm tra dữ liệu, cookie đăng nhập admin, nén ảnh sang WebP |

Phần trang trí của thiệp (phong bì, khung góc, chữ 囍 rơi, mây) viết bằng CSS Modules. Ant Design không có sẵn các kiểu này, và nếu ép theme antd vào phần này thì thiệp sẽ trông giống một trang quản trị.

## Bước 1: Khởi tạo dự án

Tạo dự án, cài thư viện, khởi tạo Prisma với SQLite và bọc antd vào layout gốc.

```bash
npx create-next-app@latest thiep-cuoi --ts --eslint --app --src-dir --import-alias "@/*" --no-tailwind
cd thiep-cuoi

npm i antd @ant-design/nextjs-registry @ant-design/icons dayjs
npm i @prisma/client zod jose sharp qrcode lunar-javascript framer-motion
npm i -D prisma tsx @types/qrcode

npx prisma init --datasource-provider sqlite
```

File `.env`:

```bash
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="doi-mat-khau-manh"
SESSION_SECRET="chuoi-ngau-nhien-it-nhat-32-ky-tu"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
UPLOAD_DIR="./data/uploads"
```

`lunar-javascript` không có kiểu TypeScript, nên thêm file `src/types/lunar.d.ts` chứa một dòng `declare module 'lunar-javascript';`.

Layout gốc `src/app/layout.tsx`. Font lấy qua `next/font` với subset `vietnamese` để dấu tiếng Việt hiển thị đúng:

```tsx
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { Be_Vietnam_Pro, Playfair_Display, Dancing_Script } from 'next/font/google';
import './globals.css';

const body = Be_Vietnam_Pro({ subsets: ['vietnamese'], weight: ['400', '500', '600'], variable: '--font-body' });
const serif = Playfair_Display({ subsets: ['vietnamese'], variable: '--font-serif' });
const script = Dancing_Script({ subsets: ['vietnamese'], variable: '--font-script' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${body.variable} ${serif.variable} ${script.variable}`}>
      <body>
        <AntdRegistry>
          <ConfigProvider
            locale={viVN}
            theme={{ token: { colorPrimary: '#9e1b1f', fontFamily: 'var(--font-body)', borderRadius: 8 } }}
          >
            {children}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
```

`AntdRegistry` gom CSS của antd khi render phía server. Không có nó, trang sẽ chớp một khoảnh khắc không có style khi tải.

## Bước 2: Cơ sở dữ liệu SQLite

CSDL có 5 bảng. `Wedding` chỉ có đúng một dòng (id = 1) vì app chỉ phục vụ một đám cưới. Các danh sách nhỏ như lịch trình hay màu dress code lưu thành chuỗi JSON, nên không cần tách bảng.

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Wedding {
  id               Int      @id @default(1)
  groomName        String
  groomRole        String   // "Trưởng Nam"
  groomFather      String
  groomMother      String
  groomAddress     String
  brideName        String
  brideRole        String   // "Út Nữ"
  brideFather      String
  brideMother      String
  brideAddress     String
  ceremonyAt       DateTime // giờ làm lễ
  ceremonyPlace    String   // "Tư gia"
  receptionAt      DateTime // giờ đón khách
  partyAt          DateTime // giờ khai tiệc
  venueName        String
  venueAddress     String
  dressCodeNote    String?
  dressCodeColors  String   @default("[]") // JSON: ["#9e1b1f","#f3e9d2"]
  schedule         String   @default("[]") // JSON: [{"time":"17:30","title":"Đón khách"}]
  groomBankBin     String?  // mã BIN ngân hàng, VD 970436 = Vietcombank
  groomBankName    String?
  groomAccountNo   String?
  groomAccountName String?
  brideBankBin     String?
  brideBankName    String?
  brideAccountNo   String?
  brideAccountName String?
  musicFile        String?
  coverImage       String?
  closingMessage   String   @default("Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!")
  updatedAt        DateTime @updatedAt
}

model Photo {
  id        Int      @id @default(autoincrement())
  file      String
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
}

model Guest {
  id          Int      @id @default(autoincrement())
  code        String   @unique // mã trong link /k/[code]
  displayName String   // "Gia đình em Tính & Tuyết"
  side        String   @default("chung") // "trai" | "gai" | "chung"
  note        String?
  createdAt   DateTime @default(now())
  rsvps       Rsvp[]
}

model Rsvp {
  id        Int      @id @default(autoincrement())
  guestId   Int?
  guest     Guest?   @relation(fields: [guestId], references: [id], onDelete: SetNull)
  name      String
  phone     String?
  attending Boolean
  headcount Int      @default(1)
  note      String?
  createdAt DateTime @default(now())
}

model Wish {
  id        Int      @id @default(autoincrement())
  name      String
  content   String
  approved  Boolean  @default(true)
  createdAt DateTime @default(now())
}
```

Tạo DB và kết nối:

1. Chạy `npx prisma migrate dev --name init` để tạo file `dev.db` và Prisma Client.
2. Viết `prisma/seed.ts` để tạo dòng `Wedding` với dữ liệu mẫu, vài khách và vài lời chúc. Thêm `"prisma": { "seed": "tsx prisma/seed.ts" }` vào `package.json`, rồi chạy `npx prisma db seed`.
3. Tạo `src/lib/db.ts` để dùng chung một Prisma Client. Nếu không, mỗi lần hot reload khi dev sẽ mở thêm kết nối mới:

```ts
import { PrismaClient } from '@prisma/client';

const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') g.prisma = prisma;
```

**Lưu ý về múi giờ:** Prisma lưu `DateTime` theo UTC. Khi hiển thị luôn truyền `timeZone: 'Asia/Ho_Chi_Minh'`, vì VPS có thể đặt múi giờ khác và giờ cưới sẽ lệch 7 tiếng.

## Bước 3: Cấu trúc thư mục và routing

Trang thiệp là server component: nó đọc dữ liệu từ SQLite rồi truyền xuống một client component `Invitation`, nơi chứa toàn bộ hiệu ứng và tương tác. `/` và `/k/[code]` dùng chung component này, chỉ khác là có hoặc không có tên khách.

```text
src/
  app/
    layout.tsx
    page.tsx                      # thiệp chung
    k/[code]/page.tsx             # thiệp riêng theo khách
    api/
      rsvp/route.ts
      wishes/route.ts
      media/[file]/route.ts       # phục vụ ảnh đã upload
      admin/
        login/route.ts
        wedding/route.ts
        guests/route.ts
        rsvps/route.ts
        wishes/route.ts
        photos/route.ts
    admin/
      login/page.tsx
      (panel)/
        layout.tsx                # antd Layout + Sider + Menu
        page.tsx                  # tổng quan
        wedding/page.tsx
        guests/page.tsx
        rsvps/page.tsx
        wishes/page.tsx
        photos/page.tsx
  components/invitation/
    Invitation.tsx                # 'use client', ghép các section
    Envelope.tsx                  # bìa + nút Mở thiệp
    Ceremony.tsx  Gallery.tsx  Party.tsx  Countdown.tsx
    MapSection.tsx  DressCode.tsx  Schedule.tsx
    Guestbook.tsx  GiftBox.tsx  RsvpModal.tsx  MusicToggle.tsx
    invitation.module.css
  lib/
    db.ts  lunar.ts  vietqr.ts  calendar.ts  auth.ts  format.ts
  middleware.ts                   # chặn /admin khi chưa đăng nhập
prisma/
  schema.prisma  seed.ts
public/theme/                     # hoạ tiết tự thiết kế (WebP)
data/uploads/                     # ảnh album, nằm ngoài public
```

Trang `src/app/k/[code]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import Invitation from '@/components/invitation/Invitation';

export const dynamic = 'force-dynamic';

export default async function GuestPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [guest, wedding, photos, wishes] = await Promise.all([
    prisma.guest.findUnique({ where: { code } }),
    prisma.wedding.findUnique({ where: { id: 1 } }),
    prisma.photo.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.wish.findMany({ where: { approved: true }, orderBy: { createdAt: 'desc' }, take: 50 }),
  ]);
  if (!guest || !wedding) notFound();

  return <Invitation wedding={wedding} photos={photos} wishes={wishes} guest={{ code, name: guest.displayName }} />;
}
```

`src/app/page.tsx` làm tương tự nhưng truyền `guest={null}`. Khi đó bìa ghi "Trân trọng kính mời" thay cho tên khách.

**Vì sao ảnh không để trong `public/`:** khi chạy `next start`, Next.js chỉ phục vụ những file đã có trong `public/` lúc build. Ảnh upload sau đó sẽ báo 404. Vì vậy ảnh được lưu vào `data/uploads/` và trả về qua route `api/media/[file]` (hoặc qua alias của nginx ở Bước 8).

## Bước 4: Dựng giao diện thiệp

Nên dựng từng section theo thứ tự trong bảng, mỗi section một component, và xem trên khung điện thoại (rộng 390px) ngay từ đầu. Toàn bộ thiệp nằm trong một cột rộng tối đa 480px, căn giữa, nền giấy kem. Bốn góc khung dùng chung một ảnh hoạ tiết, lật bằng `transform: scale(-1, 1)` và các biến thể tương tự.

| Section | Component | Cách làm |
| --- | --- | --- |
| Bìa phong bì | `Envelope` | Phong bì và lá thư dựng bằng CSS. Chữ 囍 rơi bằng `@keyframes`, vị trí và độ trễ ngẫu nhiên. Bấm "Mở thiệp" thì framer-motion lật nắp (`rotateX`) và trượt thư lên, đồng thời bật nhạc |
| Thông tin lễ cưới | `Ceremony` | Hai cột nhà trai, nhà gái; tên và vai vế cô dâu chú rể; giờ làm lễ kèm ngày âm lịch |
| Album ảnh | `Gallery` | `Image.PreviewGroup` của antd: hiện 4 ảnh, ảnh thứ tư phủ chữ "+6", bấm vào xem cả album |
| Tiệc cưới | `Party` | Giờ đón khách, giờ khai tiệc, ngày âm lịch, nút Thêm vào lịch |
| Đếm ngược + lịch tháng | `Countdown` | Hook tự viết, lịch 7 cột tự dựng, khoanh tròn ngày cưới |
| Xác nhận tham dự | `RsvpModal` | `Modal` + `Form` (`Input`, `Radio`, `InputNumber`), gửi lên `/api/rsvp` |
| Bản đồ | `MapSection` | Iframe Google Maps nhúng (không cần API key) và nút Chỉ đường |
| Dress code | `DressCode` | Các vòng tròn màu lấy từ `dressCodeColors` |
| Lịch trình | `Schedule` | `Timeline` của antd, chỉnh màu cho hợp tông đỏ |
| Sổ lưu bút | `Guestbook` | `Form` + `List`; lời chúc mới hiện lên đầu danh sách ngay khi gửi |
| Hộp quà mừng | `GiftBox` | `Modal` với hai `Card` chú rể và cô dâu, mã VietQR, nút Lưu QR |
| Nhạc nền | `MusicToggle` | Nút nổi ở góc màn hình để bật, tắt nhạc |

Mỗi section bọc trong `motion.section` với `whileInView`, để hiện dần khi khách cuộn tới.

### Ngày âm lịch — `src/lib/lunar.ts`

```ts
import { Solar } from 'lunar-javascript';

const CAN = ['Canh', 'Tân', 'Nhâm', 'Quý', 'Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ'];
const CHI = ['Thân', 'Dậu', 'Tuất', 'Hợi', 'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi'];

export function lunarText(date: Date) {
  const vn = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const l = Solar.fromYmd(vn.getFullYear(), vn.getMonth() + 1, vn.getDate()).getLunar();
  const m = l.getMonth(); // số âm = tháng nhuận
  const y = l.getYear();
  return `Tức ngày ${l.getDay()} tháng ${Math.abs(m)}${m < 0 ? ' nhuận' : ''} năm ${CAN[y % 10]} ${CHI[y % 12]}`;
}
```

`lunar-javascript` tính theo lịch Trung Quốc (múi giờ UTC+8). Lịch này thỉnh thoảng lệch một ngày so với âm lịch Việt Nam, nên hãy đối chiếu ngày cưới với lịch vạn niên Việt Nam một lần.

### Đếm ngược — `Countdown.tsx`

```tsx
'use client';
import { useEffect, useState } from 'react';
import styles from './invitation.module.css';

export default function Countdown({ target }: { target: string }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const t = new Date(target).getTime();
    const tick = () => setLeft(Math.max(0, t - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (left === null) return null; // chỉ render ở client, tránh lỗi hydration
  const parts: [number, string][] = [
    [Math.floor(left / 864e5), 'Ngày'],
    [Math.floor(left / 36e5) % 24, 'Giờ'],
    [Math.floor(left / 6e4) % 60, 'Phút'],
    [Math.floor(left / 1e3) % 60, 'Giây'],
  ];
  return (
    <div className={styles.countdown}>
      {parts.map(([v, label]) => (
        <div key={label}><b>{v}</b><span>{label}</span></div>
      ))}
    </div>
  );
}
```

### Thêm vào lịch và bản đồ — `src/lib/calendar.ts`

```ts
const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');

export const googleCalendarUrl = (o: { title: string; start: Date; end: Date; location: string; details: string }) =>
  'https://www.google.com/calendar/render?action=TEMPLATE' +
  `&text=${encodeURIComponent(o.title)}&dates=${fmt(o.start)}/${fmt(o.end)}` +
  `&location=${encodeURIComponent(o.location)}&details=${encodeURIComponent(o.details)}&ctz=Asia/Ho_Chi_Minh`;

export const mapEmbedUrl = (q: string) => `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
export const directionsUrl = (q: string) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
```

Người dùng iPhone hay dùng Apple Calendar. Có thể thêm một route trả về file `.ics` cho họ (không bắt buộc).

### Mã VietQR — `src/lib/vietqr.ts`

Chuỗi QR theo chuẩn EMVCo mà mọi app ngân hàng Việt Nam đều quét được. Hàm dưới đây tự tạo chuỗi nên không phụ thuộc dịch vụ ngoài:

```ts
const tlv = (id: string, v: string) => id + String(v.length).padStart(2, '0') + v;

function crc16(s: string) {
  let crc = 0xffff;
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// note: viết không dấu, VD "Mung cuoi Khang Dieu Anh"
export function vietQrPayload(bin: string, accountNo: string, note = 'Mung cuoi') {
  const merchant = tlv('00', 'A000000727') + tlv('01', tlv('00', bin) + tlv('01', accountNo)) + tlv('02', 'QRIBFTTA');
  const body = tlv('00', '01') + tlv('01', '11') + tlv('38', merchant) + tlv('53', '704') + tlv('58', 'VN') + tlv('62', tlv('08', note));
  return body + '6304' + crc16(body + '6304');
}
```

Trong `GiftBox`, gọi `QRCode.toDataURL(vietQrPayload(bin, stk), { width: 512, margin: 1 })` để có ảnh QR. Nút Lưu QR chỉ là một thẻ `<a href={dataUrl} download="qr-chu-re.png">`. Sau khi làm xong, quét thử bằng 2–3 app ngân hàng để chắc tên và số tài khoản hiện đúng.

### Mở thiệp và bật nhạc

Trình duyệt chặn tự phát nhạc khi trang vừa tải. Vì vậy hãy gọi `audioRef.current?.play().catch(() => {})` ngay trong hàm xử lý click của nút "Mở thiệp": cú bấm đó được tính là thao tác của người dùng, nên nhạc được phép phát.

## Bước 5: API công khai

Trang thiệp chỉ cần hai API ghi dữ liệu. Cả hai đều kiểm tra đầu vào bằng zod và giới hạn tần suất gửi theo IP, vì link thiệp sẽ được chia sẻ rộng qua Zalo.

`src/app/api/wishes/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const schema = z.object({
  name: z.string().trim().min(1).max(60),
  content: z.string().trim().min(1).max(500),
});
const lastHit = new Map<string, number>();

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (Date.now() - (lastHit.get(ip) ?? 0) < 30_000) {
    return NextResponse.json({ error: 'Bạn gửi hơi nhanh, đợi một chút nhé' }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });

  lastHit.set(ip, Date.now());
  const wish = await prisma.wish.create({ data: parsed.data });
  return NextResponse.json(wish, { status: 201 });
}
```

`src/app/api/rsvp/route.ts` viết theo cùng mẫu, với schema:

```ts
const schema = z.object({
  guestCode: z.string().optional(),
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(20).optional(),
  attending: z.boolean(),
  headcount: z.number().int().min(1).max(10),
  note: z.string().trim().max(300).optional(),
});
```

Nếu có `guestCode`, tìm `Guest` theo mã đó rồi gắn `guestId` vào RSVP. Khi một khách gửi lại lần hai, nên cập nhật bản ghi cũ thay vì tạo bản mới, để số liệu không bị đếm trùng. Ở trang thiệp riêng, tên khách được điền sẵn vào form để họ chỉ cần bấm chọn.

`src/app/api/media/[file]/route.ts` đọc file từ `UPLOAD_DIR` rồi trả về kèm header `Cache-Control: public, max-age=31536000, immutable`. Nhớ chặn tên file có `..` hoặc `/` để không ai đọc được file ngoài thư mục.

**Lựa chọn khác:** có thể dùng Server Actions thay cho API route. Cách đó ngắn hơn, nhưng API route dễ thử bằng Postman và dễ đặt rate limit hơn.

## Bước 6: Trang quản trị bằng Ant Design

Trang quản trị đăng nhập bằng một mật khẩu duy nhất lưu trong `.env`. Sau khi đăng nhập, server cấp một cookie JWT, và `middleware.ts` chặn mọi đường dẫn `/admin` và `/api/admin` nếu không có cookie hợp lệ. Một đám cưới không cần hệ thống tài khoản phức tạp hơn thế.

`src/app/api/admin/login/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const secret = new TextEncoder().encode(process.env.SESSION_SECRET);

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}));
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Sai mật khẩu' }, { status: 401 });
  }
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin', token, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
```

`src/middleware.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.SESSION_SECRET);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === '/admin/login' || pathname === '/api/admin/login') return NextResponse.next();
  try {
    await jwtVerify(req.cookies.get('admin')?.value ?? '', secret);
    return NextResponse.next();
  } catch {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
```

`admin/(panel)/layout.tsx` dùng `Layout`, `Sider` và `Menu` của antd. Trên điện thoại, đặt `breakpoint="lg"` và `collapsedWidth={0}` để menu tự thu gọn. Các trang trong panel:

| Trang | Component antd chính | Chức năng |
| --- | --- | --- |
| Tổng quan | `Statistic`, `Card`, `Row`/`Col` | Số khách, số đã xác nhận, tổng người dự, số lời chúc |
| Thông tin cưới | `Form`, `DatePicker showTime`, `Form.List`, `ColorPicker`, `Input.TextArea` | Sửa dòng `Wedding`: gia đình hai bên, giờ lễ và tiệc, địa điểm, lịch trình, màu dress code, tài khoản ngân hàng, nhạc |
| Khách mời | `Table`, `Modal` + `Form`, `Typography.Text copyable`, `QRCode` | Thêm, sửa, xoá khách; tạo mã link; sao chép link `/k/[code]`; hiện QR của link để in |
| Xác nhận tham dự | `Table` có filter, `Tag`, `Button` | Lọc theo dự/không dự, nhà trai/nhà gái; tổng số người; xuất CSV |
| Lời chúc | `Table`, `Switch`, `Popconfirm` | Ẩn, hiện hoặc xoá lời chúc |
| Album | `Upload listType="picture-card"`, `InputNumber` | Upload ảnh, chỉnh thứ tự, xoá ảnh |

Một số điểm khi làm:

- **Mã link khách:** dùng `crypto.randomBytes(5).toString('base64url')` để có mã 7 ký tự khó đoán. Không dùng id tự tăng, vì người khác có thể đoán ra link của khách khác.
- **Nhập khách hàng loạt:** cách nhanh nhất là một `Input.TextArea`, dán mỗi dòng một tên khách rồi tạo hết một lần. Nhập từ file Excel có thể làm sau nếu cần.
- **Upload ảnh:** `api/admin/photos` nhận `formData`, dùng `sharp` thu ảnh về cạnh dài 1600px, xuất WebP chất lượng 80, lưu vào `UPLOAD_DIR` và tạo bản ghi `Photo`. Ảnh chụp điện thoại 5–8MB sẽ còn khoảng 200–400KB.
- **Tải lại dữ liệu:** các trang admin có thể là client component gọi `/api/admin/*`. Sau mỗi lần lưu, gọi `message.success()` rồi tải lại bảng.

## Bước 7: Hoàn thiện

Việc quan trọng nhất ở bước này là ảnh xem trước khi gửi link qua Zalo và Messenger, vì đó là thứ khách nhìn thấy đầu tiên, trước cả khi mở thiệp.

**Ảnh xem trước khi chia sẻ (Open Graph):** dùng `generateMetadata` trong `page.tsx`:

```tsx
export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const guest = await prisma.guest.findUnique({ where: { code } });
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  return {
    title: 'Thiệp cưới Khang & Diệu Anh',
    description: guest ? `Thân mời ${guest.displayName}` : 'Trân trọng kính mời',
    openGraph: { images: [{ url: `${site}/theme/og-cover.jpg`, width: 1200, height: 630 }] },
    robots: { index: false, follow: false },
  };
}
```

Ảnh OG nên là file JPG 1200×630, dung lượng dưới 300KB. Zalo lưu cache ảnh xem trước khá lâu. Nếu đổi ảnh mà Zalo vẫn hiện ảnh cũ, thêm một tham số như `?v=2` vào link để Zalo đọc lại. Có thể kiểm tra trước bằng Facebook Sharing Debugger.

**Các việc còn lại:**

- **Không cho Google index:** đặt `robots: noindex` như trong đoạn code trên, vì thiệp có tên, địa chỉ nhà và số tài khoản của gia đình.
- **Ảnh:** dùng `next/image` cho hoạ tiết, có `sizes` phù hợp. Ảnh album đặt `loading="lazy"`. Hoạ tiết xuất sang WebP, mỗi file nên dưới 100KB.
- **Hiển thị trên điện thoại:** dùng `100dvh` thay `100vh`, vì trên Safari iOS thanh địa chỉ làm `100vh` bị dư. Test trên Safari iOS và trên trình duyệt trong app Zalo, vì phần lớn khách sẽ mở thiệp ở đó.
- **Nhạc:** file MP3 128kbps, dài khoảng 2–3 phút, đặt `loop`. Cần có nút tắt nhạc dễ thấy.
- **Hiển thị ngày giờ:** mọi hàm định dạng đều truyền `timeZone: 'Asia/Ho_Chi_Minh'`. Thứ trong tuần lấy bằng `Intl.DateTimeFormat('vi-VN', { weekday: 'long', timeZone: 'Asia/Ho_Chi_Minh' })`.
- **Bảo mật:** dùng mật khẩu admin mạnh và `SESSION_SECRET` dài ngẫu nhiên. Không commit file `.env`. Giới hạn độ dài mọi trường nhập liệu. React đã tự escape nội dung lời chúc, nên tuyệt đối không dùng `dangerouslySetInnerHTML` để hiển thị chúng.
- **SQLite:** chạy `PRAGMA journal_mode=WAL;` một lần (qua `prisma.$executeRawUnsafe`) để việc đọc không bị chặn khi có người đang ghi lời chúc.
- **Kiểm tra cuối:** chạy Lighthouse ở chế độ mobile, mục tiêu Performance trên 85. Bấm thử tất cả các nút trên một điện thoại thật.

## Bước 8: Triển khai lên VPS

App chạy dưới dạng một tiến trình PM2 ở chế độ fork, phía trước là reverse proxy có HTTPS. File SQLite và thư mục ảnh đặt ngoài thư mục code, để những lần deploy sau không ghi đè lên dữ liệu.

```bash
# thư mục dữ liệu, tách khỏi code
sudo mkdir -p /srv/thiep/data/uploads && sudo chown -R $USER /srv/thiep

git clone <repo> /srv/thiep/app && cd /srv/thiep/app
npm ci
cp .env.example .env
# sửa .env:
#   DATABASE_URL="file:/srv/thiep/data/prod.db"
#   UPLOAD_DIR="/srv/thiep/data/uploads"
#   NEXT_PUBLIC_SITE_URL="https://thiep.tenmien.vn"
#   ADMIN_PASSWORD, SESSION_SECRET

npx prisma migrate deploy
npx prisma db seed        # chỉ chạy lần đầu
npm run build

pm2 start npm --name thiep -- start -- -p 3005
pm2 save && pm2 startup
```

Chỉ chạy **1 instance** (fork mode, không dùng cluster). SQLite chỉ cho một tiến trình ghi tại một thời điểm, và bộ đếm rate limit đang nằm trong bộ nhớ của tiến trình.

Nếu dùng nginx (chứng chỉ SSL lấy bằng `certbot --nginx`):

```nginx
server {
  server_name thiep.tenmien.vn;
  client_max_body_size 20m;

  location / {
    proxy_pass http://127.0.0.1:3005;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Nếu chạy sau IIS thì dùng URL Rewrite + ARR proxy về `localhost:3005`, bật giữ nguyên header Host, và tăng `maxAllowedContentLength` để upload được ảnh lớn.

**Cập nhật code:** `git pull && npm ci && npx prisma migrate deploy && npm run build && pm2 restart thiep`.

**Sao lưu:** đặt cron chạy mỗi đêm. Dùng lệnh `.backup` của sqlite3 thay vì `cp`, vì nó an toàn kể cả khi có người đang ghi:

```bash
0 2 * * * sqlite3 /srv/thiep/data/prod.db ".backup '/srv/thiep/backup/prod-$(date +\%F).db'" && rsync -a /srv/thiep/data/uploads/ /srv/thiep/backup/uploads/
```

Nên chép bản backup ra một máy khác vào tuần trước ngày cưới, vì lúc đó RSVP và lời chúc đổ về nhiều nhất.

## Checklist và tiến độ

Nếu một người làm vào buổi tối, toàn bộ mất khoảng 9–12 buổi. Nên xong trước ngày gửi thiệp ít nhất 3 tuần, để còn thời gian sửa thông tin và test trên điện thoại của người thân.

**Buổi 1 — Nền tảng**

- [ ] Khởi tạo Next.js, cài antd, Prisma, SQLite (Bước 1)
- [ ] Viết schema, migrate, seed dữ liệu mẫu (Bước 2)
- [ ] Tạo cấu trúc thư mục, trang `/` và `/k/[code]` đọc được dữ liệu (Bước 3)

**Buổi 2–5 — Trang thiệp**

- [ ] Chuẩn bị hoạ tiết (tự vẽ hoặc mua), ảnh cưới, nhạc nền
- [ ] Bìa phong bì, hiệu ứng mở thiệp, chữ 囍 rơi, nhạc
- [ ] Thông tin lễ cưới kèm ngày âm lịch, album ảnh
- [ ] Tiệc cưới, đếm ngược, lịch tháng, nút Thêm vào lịch
- [ ] Bản đồ, dress code, lịch trình
- [ ] Hộp quà mừng VietQR, quét thử bằng app ngân hàng

**Buổi 6 — Tương tác**

- [ ] API lời chúc và form sổ lưu bút
- [ ] API RSVP và modal xác nhận tham dự (Bước 5)

**Buổi 7–9 — Quản trị**

- [ ] Đăng nhập admin và middleware
- [ ] Trang sửa thông tin cưới
- [ ] Quản lý khách, tạo và sao chép link riêng
- [ ] Xem RSVP, duyệt lời chúc, upload album (Bước 6)

**Buổi 10–12 — Hoàn thiện và đưa lên mạng**

- [ ] Ảnh xem trước Zalo/Facebook, noindex, tối ưu ảnh (Bước 7)
- [ ] Test trên Safari iOS, Chrome Android và trình duyệt trong app Zalo
- [ ] Deploy lên VPS, cài HTTPS, cron backup (Bước 8)
- [ ] Nhập danh sách khách thật, gửi thử link cho 2–3 người thân trước khi gửi hàng loạt
