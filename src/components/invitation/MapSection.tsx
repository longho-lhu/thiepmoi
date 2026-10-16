import { EnvironmentOutlined } from '@ant-design/icons';
import { directionsUrl, mapEmbedUrl } from '@/lib/calendar';
import Section from './Section';
import styles from './invitation.module.css';

type Props = {
  name: string;
  address: string;
  mapUrl: string | null; // link chia sẻ Google Maps do cô dâu chú rể dán vào
  mapQuery: string | null; // vị trí đọc từ link đó
};

export default function MapSection({ name, address, mapUrl, mapQuery }: Props) {
  const fallback = `${name}, ${address}`;
  return (
    <Section eyebrow="Địa điểm" title="Bản đồ chỉ đường">
      <iframe
        className={styles.map}
        src={mapEmbedUrl(mapQuery ?? fallback)}
        loading="lazy"
        title={`Bản đồ ${name}`}
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className={styles.btnRow}>
        <a className={styles.btn} href={mapUrl ?? directionsUrl(fallback)} target="_blank" rel="noopener noreferrer">
          <EnvironmentOutlined /> Chỉ đường
        </a>
      </div>
    </Section>
  );
}
