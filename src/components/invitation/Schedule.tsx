'use client';
import { Timeline } from 'antd';
import Section from './Section';
import styles from './invitation.module.css';

export default function Schedule({ items }: { items: { time: string; title: string }[] }) {
  if (items.length === 0) return null;
  return (
    <Section eyebrow="Chương trình" title="Lịch trình buổi tiệc">
      <div className={styles.timeline}>
        <Timeline
          items={items.map((s) => ({
            color: '#9e1b1f',
            children: (
              <span>
                <b>{s.time}</b>
                {s.title}
              </span>
            ),
          }))}
        />
      </div>
    </Section>
  );
}
