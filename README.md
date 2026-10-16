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

1. Vào **Thông tin cưới**: sửa tên, gia đình, giờ lễ/tiệc, địa điểm, tài khoản ngân hàng, tải nhạc nền và ảnh bìa.
2. Vào **Album ảnh**: xoá ảnh giữ chỗ, tải ảnh cưới (tự nén sang WebP 1600px).
3. Vào **Khách mời** → **Nhập nhiều**: dán danh sách tên, mỗi dòng một khách.
4. Nén lại hoạ tiết và tạo lại ảnh xem trước khi chia sẻ Zalo/Facebook:
   `npm run theme -- "Khang & Diệu Anh" "20.12.2026"`
   Lệnh này đọc ảnh gốc trong `source-img/`, xuất bản nén vào `public/theme/` và tạo `public/theme/og-cover.jpg`.
   Đổi hoạ tiết thì thay file trong `source-img/` (giữ nguyên tên) rồi chạy lại lệnh.
5. Quét thử mã VietQR bằng 2–3 app ngân hàng; đối chiếu ngày âm lịch với lịch vạn niên Việt Nam.

## Ghi chú kỹ thuật

- Ảnh và nhạc upload nằm ở `UPLOAD_DIR` (mặc định `data/uploads`), phục vụ qua `/api/media/[file]`.
- Middleware chạy ở Node runtime (`runtime: 'nodejs'`, ổn định từ Next 15.5).
- Giờ trong form quản trị theo múi giờ của trình duyệt — hãy sửa trên máy đặt giờ Việt Nam.
- Triển khai VPS, nginx, backup: xem Bước 8 trong file tài liệu.
