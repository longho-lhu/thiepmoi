import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '100dvh', display: 'grid', placeItems: 'center', textAlign: 'center',
        background: '#fbf6ec', padding: 24,
      }}
    >
      <div>
        <div style={{ fontSize: 64, color: '#9e1b1f', lineHeight: 1 }}>囍</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', color: '#9e1b1f', fontWeight: 500 }}>Không tìm thấy thiệp</h1>
        <p>Đường dẫn có thể đã bị gõ sai. Vui lòng kiểm tra lại link bạn nhận được.</p>
        <Link href="/" style={{ color: '#9e1b1f' }}>Xem thiệp chung</Link>
      </div>
    </main>
  );
}
