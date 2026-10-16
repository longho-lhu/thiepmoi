import { Card, Col, Row, Statistic } from 'antd';
import { prisma } from '@/lib/db';
import { dateTimeText } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const [guests, wishes, rsvps, wedding] = await Promise.all([
    prisma.guest.count(),
    prisma.wish.count(),
    prisma.rsvp.findMany({ select: { attending: true, headcount: true } }),
    prisma.wedding.findUnique({ where: { id: 1 } }),
  ]);
  const yes = rsvps.filter((r) => r.attending);
  const people = yes.reduce((s, r) => s + r.headcount, 0);
  const daysLeft = wedding ? Math.ceil((wedding.partyAt.getTime() - Date.now()) / 864e5) : null;

  const stats = [
    { title: 'Khách mời (link riêng)', value: guests },
    { title: 'Đã phản hồi', value: rsvps.length },
    { title: 'Sẽ tham dự', value: yes.length, suffix: `/ ${people} người` },
    { title: 'Không tham dự', value: rsvps.length - yes.length },
    { title: 'Lời chúc', value: wishes },
    { title: 'Còn lại đến ngày cưới', value: daysLeft ?? '—', suffix: daysLeft !== null ? 'ngày' : '' },
  ];

  return (
    <>
      <Row gutter={[16, 16]}>
        {stats.map((s) => (
          <Col key={s.title} xs={12} md={8}>
            <Card>
              <Statistic title={s.title} value={s.value} suffix={s.suffix} valueStyle={{ color: '#9e1b1f' }} />
            </Card>
          </Col>
        ))}
      </Row>
      {wedding && (
        <Card style={{ marginTop: 16 }} title="Thông tin nhanh">
          <p><b>{wedding.groomName}</b> &amp; <b>{wedding.brideName}</b></p>
          <p>Khai tiệc: {dateTimeText(wedding.partyAt)} — {wedding.venueName}</p>
          <p style={{ color: '#888', marginBottom: 0 }}>Cập nhật lần cuối: {dateTimeText(wedding.updatedAt)}</p>
        </Card>
      )}
    </>
  );
}
