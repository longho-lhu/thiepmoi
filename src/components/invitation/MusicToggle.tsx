'use client';
import { CaretRightFilled } from '@ant-design/icons';
import styles from './invitation.module.css';

// Đĩa than ở góc màn hình: quay khi đang phát, nhấn để dừng / phát tiếp
export default function MusicToggle({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  const label = playing ? 'Tắt nhạc' : 'Bật nhạc';
  return (
    <button
      type="button"
      className={`${styles.music} ${playing ? '' : styles.musicPaused}`}
      onClick={onToggle}
      aria-label={label}
      aria-pressed={playing}
      title={label}
      data-keep-autoscroll // bật/tắt nhạc không làm dừng tự cuộn
    >
      <span className={styles.disc} aria-hidden>
        <span className={styles.discLabel}>囍</span>
      </span>
      {!playing && (
        <span className={styles.discPlay} aria-hidden>
          <CaretRightFilled />
        </span>
      )}
    </button>
  );
}
