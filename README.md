# Thiệp cưới online

Next.js 15 + SQLite (Prisma) + Ant Design 5, làm theo tài liệu "Quy trình làm thiệp cưới online".

## Chạy lần đầu

```bash
npm install
npx prisma migrate dev     # tạo prisma/dev.db
npx prisma db seed         # dữ liệu mẫu + 10 ảnh giữ chỗ
npm run dev                # http://localhost:3000
```

- Thiệp chung: `/`
- Thiệp riêng: `/k/<mã khách>` (lấy link trong trang quản trị → Khách mời)
- Quản trị: `/admin` — mật khẩu là `ADMIN_PASSWORD` trong `.env`

Đổi `ADMIN_PASSWORD` và `SESSION_SECRET` trong `.env` trước khi đưa lên mạng.

## Việc cần làm với dữ liệu thật

1. Vào **Thông tin cưới**: sửa tên và **tên gọi trên thiệp** (VD "Khang", "Vân Anh"), gia đình, giờ lễ/tiệc, địa điểm, tài khoản ngân hàng, tải nhạc nền và ảnh bìa.
   Tiêu đề trang, mô tả và ảnh xem trước khi chia sẻ link Zalo/Facebook tự cập nhật theo tên gọi và ngày tiệc.
2. Vào **Album ảnh**: xoá ảnh giữ chỗ, tải ảnh cưới (tự nén sang WebP 1600px).
3. Vào **Khách mời** → **Nhập nhiều**: dán danh sách tên, mỗi dòng một khách.
4. Đổi hoạ tiết: thay file trong `source-img/` (giữ nguyên tên) rồi chạy `npm run theme` để nén vào `public/theme/`.
5. Quét thử mã VietQR bằng 2–3 app ngân hàng; đối chiếu ngày âm lịch với lịch vạn niên Việt Nam.

## Chạy bằng PM2 (cổng 3001)

```bash
npm i -g pm2                  # nếu máy chưa có pm2
npm run build
pm2 start ecosystem.config.js
pm2 save && pm2 startup       # tự chạy lại khi khởi động máy
```

Cập nhật code: `git pull && npm ci && npx prisma migrate deploy && npm run build && pm2 restart thiep-moi`.
Xem log: `pm2 logs thiep-moi`. Nhớ đặt `NEXT_PUBLIC_SITE_URL` trong `.env` đúng tên miền thật trước khi build.

## Ghi chú kỹ thuật

- Ảnh và nhạc upload nằm ở `UPLOAD_DIR` (mặc định `data/uploads`), phục vụ qua `/api/media/[file]`.
- Middleware chạy ở Node runtime (`runtime: 'nodejs'`, ổn định từ Next 15.5).
- Giờ trong form quản trị theo múi giờ của trình duyệt — hãy sửa trên máy đặt giờ Việt Nam.
- Triển khai VPS, nginx, backup: xem Bước 8 trong file tài liệu.
