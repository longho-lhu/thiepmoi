'use client';
import { useEffect, useState } from 'react';
import { Button, Card, Modal, Typography } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import QRCode from 'qrcode';
import { vietQrPayload, stripVietnamese } from '@/lib/vietqr';
import type { GiftAccount } from './types';
import styles from './invitation.module.css';

function GiftCard({ g, note }: { g: GiftAccount; note: string }) {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(vietQrPayload(g.bin, g.accountNo, note), { width: 512, margin: 1 })
      .then(setQr)
      .catch(() => setQr(null));
  }, [g.bin, g.accountNo, note]);

  const fileName = `qr-${stripVietnamese(g.who).toLowerCase().replace(/\s+/g, '-')}.png`;

  return (
    <Card title={`Mừng cưới ${g.who.toLowerCase()}`} size="small" styles={{ body: { textAlign: 'center' } }}>
      {qr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.qr} src={qr} alt={`Mã VietQR ${g.who}`} />
      ) : (
        <div className={styles.qr} />
      )}
      <div style={{ fontWeight: 600 }}>{g.bankName}</div>
      <Typography.Text copyable={{ text: g.accountNo, tooltips: ['Sao chép số tài khoản', 'Đã sao chép'] }} strong style={{ fontSize: 18 }}>
        {g.accountNo}
      </Typography.Text>
      <div style={{ color: '#7d6a5c', marginBottom: 12 }}>{g.accountName}</div>
      {qr && (
        <Button icon={<DownloadOutlined />} href={qr} download={fileName}>
          Lưu mã QR
        </Button>
      )}
    </Card>
  );
}

type Props = { open: boolean; onClose: () => void; gifts: GiftAccount[]; note: string };

export default function GiftBox({ open, onClose, gifts, note }: Props) {
  return (
    <Modal open={open} onCancel={onClose} footer={null} title="Hộp quà mừng cưới" centered destroyOnHidden>
      <p style={{ marginTop: 0, color: '#7d6a5c' }}>
        Mở app ngân hàng và quét mã QR, hoặc sao chép số tài khoản. Cảm ơn tấm lòng của bạn!
      </p>
      <div className={styles.gifts}>
        {gifts.map((g) => (
          <GiftCard key={g.who} g={g} note={note} />
        ))}
      </div>
    </Modal>
  );
}
