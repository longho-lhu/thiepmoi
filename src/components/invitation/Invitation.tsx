'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CheckCircleOutlined, GiftOutlined } from '@ant-design/icons';
import type { InvitationData } from './types';
import Envelope from './Envelope';
import Hero from './Hero';
import Ceremony from './Ceremony';
import Gallery from './Gallery';
import Party from './Party';
import Countdown from './Countdown';
import MapSection from './MapSection';
import DressCode from './DressCode';
import Schedule from './Schedule';
import Guestbook from './Guestbook';
import GiftBox from './GiftBox';
import RsvpModal from './RsvpModal';
import MusicToggle from './MusicToggle';
import Section from './Section';
import Deco from './Deco';
import { useAutoScroll } from './useAutoScroll';
import styles from './invitation.module.css';

export default function Invitation({ data }: { data: InvitationData }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [opened, setOpened] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);

  // Khoá cuộn khi còn đang ở bìa phong bì
  useEffect(() => {
    document.body.style.overflow = opened ? '' : 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [opened]);

  useAutoScroll(opened);

  // Gọi trong hàm xử lý click "Mở thiệp" nên trình duyệt cho phép phát nhạc
  const playMusic = () => {
    audioRef.current?.play().catch(() => {});
  };

  const toggleMusic = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  };

  return (
    <div className={styles.page}>
      {data.musicUrl && (
        <audio
          ref={audioRef}
          src={data.musicUrl}
          loop
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      )}

      <AnimatePresence>
        {!opened && <Envelope key="envelope" data={data} onOpen={playMusic} onDone={() => setOpened(true)} />}
      </AnimatePresence>

      <main className={styles.card}>
        <Hero data={data} />
        <Ceremony data={data} />
        <Gallery photos={data.photos} />
        <Party data={data} />
        <Countdown target={data.party.iso} calendar={data.calendar} />

        <Section eyebrow="RSVP" title="Xác nhận tham dự">
          <Deco name="quat" className={styles.fan} sizes="180px" />
          <p className={styles.lead}>
            Sự có mặt của bạn là niềm vui của chúng tôi. Vui lòng xác nhận để gia đình chuẩn bị chu đáo nhất.
          </p>
          <button type="button" className={styles.btn} onClick={() => setRsvpOpen(true)}>
            <CheckCircleOutlined /> Xác nhận tham dự
          </button>
        </Section>

        <MapSection
          name={data.party.venueName}
          address={data.party.venueAddress}
          mapUrl={data.party.mapUrl}
          mapQuery={data.party.mapQuery}
        />
        {data.dressCode && <DressCode note={data.dressCode.note} colors={data.dressCode.colors} />}
        <Schedule items={data.schedule} />
        <Guestbook initial={data.wishes} guestName={data.guest?.name} />

        {data.gifts.length > 0 && (
          <Section eyebrow="Gửi quà" title="Hộp quà mừng cưới">
            <Deco name="chuHy" className={styles.giftHy} sizes="130px" />
            <p className={styles.lead}>
              Nếu không thể đến chung vui, bạn có thể gửi lời chúc và quà mừng qua hộp quà dưới đây.
            </p>
            <button type="button" className={styles.btn} onClick={() => setGiftOpen(true)}>
              <GiftOutlined /> Mở hộp quà
            </button>
          </Section>
        )}

        <footer className={styles.closing}>
          <Deco name="longDen" className={`${styles.lantern} ${styles.heroLanternLeft}`} sizes="70px" />
          <Deco name="longDen" className={`${styles.lantern} ${styles.heroLanternRight}`} sizes="70px" />
          <Deco name="may" className={`${styles.deco} ${styles.closingCloudLeft}`} sizes="260px" />
          <Deco name="may" className={`${styles.deco} ${styles.closingCloudRight}`} sizes="260px" />
          <p>{data.closingMessage}</p>
          <div className={styles.thanks}>Trân trọng cảm ơn!</div>
          <div className={styles.eyebrow}>{data.title}</div>
        </footer>
      </main>

      {data.musicUrl && opened && <MusicToggle playing={playing} onToggle={toggleMusic} />}
      <RsvpModal open={rsvpOpen} onClose={() => setRsvpOpen(false)} guest={data.guest} />
      {data.gifts.length > 0 && (
        <GiftBox open={giftOpen} onClose={() => setGiftOpen(false)} gifts={data.gifts} note={data.qrNote} />
      )}
    </div>
  );
}
