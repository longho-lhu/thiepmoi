import Section from './Section';
import styles from './invitation.module.css';

export default function DressCode({ note, colors }: { note: string | null; colors: string[] }) {
  if (!note && colors.length === 0) return null;
  return (
    <Section eyebrow="Trang phục" title="Dress code" alt>
      {note && <p className={styles.lead}>{note}</p>}
      <div className={styles.swatches}>
        {colors.map((c) => (
          <span key={c} className={styles.swatch} style={{ background: c }} title={c} />
        ))}
      </div>
    </Section>
  );
}
