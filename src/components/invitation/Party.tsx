import { CalendarOutlined, AppleOutlined } from '@ant-design/icons';
import type { InvitationData } from './types';
import Section from './Section';
import styles from './invitation.module.css';

export default function Party({ data }: { data: InvitationData }) {
  const { party, calendar } = data;
  return (
    <Section eyebrow="Trân trọng kính mời" title="Tiệc Cưới" framed>
      <p className={styles.lead}>Đến dự bữa tiệc chung vui cùng gia đình chúng tôi tại</p>
      <h3 className={styles.venue}>{party.venueName}</h3>
      <p className={styles.address}>{party.venueAddress}</p>

      <div className={styles.times}>
        <div className={styles.timeBox}>
          <span>Đón khách</span>
          <b>{party.receptionTime}</b>
        </div>
        <div className={styles.timeBox}>
          <span>Khai tiệc</span>
          <b>{party.partyTime}</b>
        </div>
      </div>

      <div className={styles.when}>
        <div className={styles.whenSide}>{party.weekday}</div>
        <div className={styles.whenDay}>{String(calendar.day).padStart(2, '0')}</div>
        <div className={styles.whenSide}>
          Tháng {calendar.month}
          <br />
          {calendar.year}
        </div>
      </div>
      <p className={styles.lunar}>({party.lunar})</p>

      <div className={styles.btnRow}>
        <a className={styles.btnGhost} href={party.googleCalendarUrl} target="_blank" rel="noopener noreferrer">
          <CalendarOutlined /> Google Calendar
        </a>
        <a className={styles.btnGhost} href={party.icsUrl}>
          <AppleOutlined /> Lịch iPhone
        </a>
      </div>
    </Section>
  );
}
