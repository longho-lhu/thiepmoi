'use client';
import { useEffect } from 'react';

const SPEED = 40; // px mỗi giây
const START_DELAY = 1200; // đợi hiệu ứng mở thiệp xong

// Tự cuộn chậm xuống sau khi mở thiệp. Dừng hẳn khi khách tự thao tác
// (chạm, cuộn chuột, bấm phím) hoặc khi tới cuối trang.
// Phần tử có data-keep-autoscroll (VD nút nhạc) không làm dừng cuộn.
export function useAutoScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let last = 0;
    let y = window.scrollY;
    let stopped = false;

    const stop = (e?: Event) => {
      const target = e?.target;
      if (target instanceof Element && target.closest('[data-keep-autoscroll]')) return;
      stopped = true;
      cancelAnimationFrame(raf);
      cleanup();
    };

    const step = (now: number) => {
      if (stopped) return;
      if (last) {
        // khách tự kéo thanh cuộn (không phát sinh sự kiện chạm/chuột) -> dừng
        if (Math.abs(window.scrollY - Math.round(y)) > 4) return stop();
        y += (SPEED * (now - last)) / 1000;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (y >= max) {
          window.scrollTo(0, max);
          return stop();
        }
        window.scrollTo(0, y);
      }
      last = now;
      raf = requestAnimationFrame(step);
    };

    const events = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
    const cleanup = () => events.forEach((ev) => window.removeEventListener(ev, stop));
    events.forEach((ev) => window.addEventListener(ev, stop, { passive: true }));

    const timer = setTimeout(() => {
      y = window.scrollY;
      raf = requestAnimationFrame(step);
    }, START_DELAY);

    return () => {
      stopped = true;
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      cleanup();
    };
  }, [enabled]);
}
