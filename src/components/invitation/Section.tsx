'use client';
import { motion } from 'framer-motion';
import styles from './invitation.module.css';

type Props = {
  eyebrow?: string;
  title?: string;
  alt?: boolean;
  framed?: boolean;
  id?: string;
  deco?: React.ReactNode; // hoạ tiết đặt tuyệt đối, nằm dưới nội dung
  children: React.ReactNode;
};

export function Corners() {
  return (
    <>
      <span className={`${styles.corner} ${styles.tl}`} />
      <span className={`${styles.corner} ${styles.tr}`} />
      <span className={`${styles.corner} ${styles.bl}`} />
      <span className={`${styles.corner} ${styles.br}`} />
    </>
  );
}

export function Divider() {
  return <div className={styles.divider} aria-hidden>❖</div>;
}

// Mỗi section hiện dần khi khách cuộn tới
export default function Section({ eyebrow, title, alt, framed, id, deco, children }: Props) {
  return (
    <motion.section
      id={id}
      className={`${styles.section} ${alt ? styles.sectionAlt : ''} ${framed ? styles.framed : ''}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      {framed && <Corners />}
      {deco}
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      {title && <h2 className={styles.title}>{title}</h2>}
      {(eyebrow || title) && <Divider />}
      {children}
    </motion.section>
  );
}
