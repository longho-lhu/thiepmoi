'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import type { InvitationData } from './types';
import Deco from './Deco';
import styles from './invitation.module.css';

// Vị trí "ngẫu nhiên" nhưng cố định theo chỉ số, để server và client render giống nhau
const HY = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  delay: (i * 1.7) % 9,
  duration: 7 + ((i * 13) % 6),
  size: 14 + ((i * 7) % 18),
}));

type Props = {
  data: InvitationData;
  onOpen: () => void; // gọi ngay trong click để trình duyệt cho phép phát nhạc
  onDone: () => void;
};

export default function Envelope({ data, onOpen, onDone }: Props) {
  const [stage, setStage] = useState<'closed' | 'flap' | 'letter'>('closed');

  const open = () => {
    if (stage !== 'closed') return;
    onOpen();
    setStage('flap');
    setTimeout(() => setStage('letter'), 650);
    setTimeout(onDone, 2300);
  };

  return (
    <motion.div className={styles.envelopeScreen} exit={{ opacity: 0, transition: { duration: 0.7 } }}>
      {HY.map((h, i) => (
        <span
          key={i}
          className={styles.fallingHy}
          style={{
            left: `${h.left}%`,
            fontSize: h.size,
            animationDelay: `${h.delay}s`,
            animationDuration: `${h.duration}s`,
          }}
          aria-hidden
        >
          囍
        </span>
      ))}

      <Deco name="longDen" className={`${styles.lantern} ${styles.lanternLeft}`} sizes="80px" priority />
      <Deco name="longDen" className={`${styles.lantern} ${styles.lanternRight}`} sizes="80px" priority />
      <Deco name="may" className={`${styles.envCloud} ${styles.envCloudLeft}`} sizes="70vw" priority />
      <Deco name="may" className={`${styles.envCloud} ${styles.envCloudRight}`} sizes="70vw" priority />

      <motion.div className={styles.envelopeHead} animate={{ opacity: stage === 'closed' ? 1 : 0 }} transition={{ duration: 0.4 }}>
        <p>{data.guest ? 'Thân mời' : 'Trân trọng kính mời'}</p>
        <h1 className={styles.guestName}>{data.guest ? data.guest.name : 'Quý khách'}</h1>
        <p>đến dự lễ thành hôn của chúng tôi</p>
      </motion.div>

      <div className={styles.envelope}>
        <div className={styles.envBack} />
        <motion.div
          className={styles.letter}
          animate={{ y: stage === 'letter' ? '-58%' : '0%' }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          <Deco name="chuHy" className={styles.letterHy} sizes="90px" priority />
          <div className={styles.letterNames}>{data.title}</div>
          <div className={styles.letterDate}>{data.party.date}</div>
        </motion.div>
        <div className={styles.envPocket}>
          <span className={styles.pocketNames}>{data.title}</span>
        </div>
        <motion.div
          className={styles.envFlap}
          style={{ zIndex: stage === 'letter' ? 1 : 4 }}
          animate={{ rotateX: stage === 'closed' ? 0 : 180 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
        <motion.button
          type="button"
          className={styles.seal}
          style={{ x: '-50%', y: '-50%' }}
          animate={{ opacity: stage === 'closed' ? 1 : 0, scale: stage === 'closed' ? 1 : 0.6 }}
          onClick={open}
          aria-label="Mở thiệp"
        >
          囍
        </motion.button>
      </div>

      <button type="button" className={`${styles.btn} ${styles.openBtn} ${styles.pulse}`} onClick={open}>
        Mở thiệp
      </button>
    </motion.div>
  );
}
