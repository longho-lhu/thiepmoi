'use client';
import { motion } from 'framer-motion';
import type { InvitationData } from './types';
import Deco from './Deco';
import styles from './invitation.module.css';

export default function Hero({ data }: { data: InvitationData }) {
  return (
    <motion.header
      className={styles.hero}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <Deco name="longDen" className={`${styles.lantern} ${styles.heroLanternLeft}`} sizes="70px" priority />
      <Deco name="longDen" className={`${styles.lantern} ${styles.heroLanternRight}`} sizes="70px" priority />

      <Deco name="chuHy" className={styles.heroHyImg} sizes="170px" priority />
      <p className={styles.eyebrow}>Lễ Thành Hôn</p>
      <h1 className={styles.heroNames}>{data.title}</h1>
      <div className={styles.heroDate}>{data.party.date}</div>

      <div className={styles.coupleWrap}>
        {data.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.cover} src={data.coverUrl} alt={data.title} />
        ) : (
          <Deco name="dauRe" className={styles.coupleImg} sizes="(max-width: 624px) 80vw, 480px" priority alt={data.title} />
        )}
        <Deco name="mayTo" className={styles.coupleCloud} sizes="(max-width: 624px) 100vw, 624px" />
      </div>
    </motion.header>
  );
}
