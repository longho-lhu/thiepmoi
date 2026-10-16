import Image from 'next/image';

// Hoạ tiết trong public/theme (tạo bằng `npm run theme` từ source-img/)
const THEME = {
  chuHy: { src: '/theme/chu-hy.webp', w: 480, h: 332 },
  dauRe: { src: '/theme/dau-re.webp', w: 720, h: 1031 },
  hoa: { src: '/theme/hoa.webp', w: 480, h: 394 },
  longDen: { src: '/theme/long-den.webp', w: 160, h: 451 },
  mayTo: { src: '/theme/may-to.webp', w: 900, h: 525 },
  may: { src: '/theme/may.webp', w: 900, h: 461 },
  quat: { src: '/theme/quat.webp', w: 480, h: 353 },
} as const;

type Props = {
  name: keyof typeof THEME;
  className?: string;
  sizes?: string;
  priority?: boolean;
  alt?: string;
};

export default function Deco({ name, className, sizes = '200px', priority, alt = '' }: Props) {
  const t = THEME[name];
  return (
    <Image
      src={t.src}
      width={t.w}
      height={t.h}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      className={className}
      sizes={sizes}
      priority={priority}
      draggable={false}
    />
  );
}
