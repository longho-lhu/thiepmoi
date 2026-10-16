'use client';
import { useEffect, useState } from 'react';
import Section from './Section';
import Deco from './Deco';
import styles from './invitation.module.css';

function Timer({ target }: { target: string }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const t = new Date(target).getTime();
    const tick = () => setLeft(Math.max(0, t - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  // chỉ render số ở client, tránh lỗi hydration; giữ chỗ để trang không bị nhảy
  if (left === null) return <div className={styles.countdown} style={{ height: 82 }} />;
  const parts: [number, string][] = [
    [Math.floor(left / 864e5), 'Ngày'],
    [Math.floor(left / 36e5) % 24, 'Giờ'],
    [Math.floor(left / 6e4) % 60, 'Phút'],
    [Math.floor(left / 1e3) % 60, 'Giây'],
  ];
  return (
    <div className={styles.countdown}>
      {parts.map(([v, label]) => (
        <div key={label}>
          <b>{String(v).padStart(2, '0')}</b>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function MonthCalendar({ year, month, day }: { year: number; month: number; day: number }) {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0 = Chủ nhật
  const offset = (first + 6) % 7; // tuần bắt đầu từ thứ Hai
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];

  return (
    <div className={styles.calendar}>
      <h3 className={styles.calendarTitle}>
        Tháng {month} / {year}
      </h3>
      <div className={styles.calendarGrid}>
        {DOW.map((d) => (
          <div key={d} className={styles.dow}>{d}</div>
        ))}
        {cells.map((d, i) => (
          <div key={i} className={`${styles.day} ${d === day ? styles.wedding : ''}`}>
            {d && <span>{d}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

type Props = { target: string; calendar: { year: number; month: number; day: number } };

export default function Countdown({ target, calendar }: Props) {
  return (
    <Section
      eyebrow="Save the date"
      title="Đếm ngược ngày vui"
      alt
      deco={<Deco name="may" className={`${styles.deco} ${styles.cloudTopRight}`} sizes="240px" />}
    >
      <Timer target={target} />
      <MonthCalendar {...calendar} />
    </Section>
  );
}
