'use client';
import { useState } from 'react';
import { Image } from 'antd';
import Section from './Section';
import Deco from './Deco';
import styles from './invitation.module.css';

export default function Gallery({ photos }: { photos: string[] }) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  if (photos.length === 0) return null;

  const shown = photos.slice(0, 4);
  const rest = photos.length - shown.length;
  const open = (i: number) => {
    setCurrent(i);
    setVisible(true);
  };

  return (
    <Section
      eyebrow="Khoảnh khắc"
      title="Album ảnh cưới"
      alt
      deco={<Deco name="hoa" className={`${styles.deco} ${styles.branchTopLeft}`} sizes="170px" />}
    >
      <div className={styles.gallery}>
        {shown.map((src, i) => (
          <button key={src} type="button" className={styles.thumb} onClick={() => open(i)} aria-label={`Xem ảnh ${i + 1}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" loading="lazy" />
            {i === shown.length - 1 && rest > 0 && <span className={styles.more}>+{rest}</span>}
          </button>
        ))}
      </div>
      <Image.PreviewGroup
        items={photos}
        preview={{
          visible,
          current,
          onVisibleChange: (v) => setVisible(v),
          onChange: (c) => setCurrent(c),
        }}
      />
    </Section>
  );
}
