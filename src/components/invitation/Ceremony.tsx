import type { InvitationData, Person } from './types';
import Section from './Section';
import styles from './invitation.module.css';

function Family({ label, p }: { label: string; p: Person }) {
  return (
    <div className={styles.family}>
      <h3>{label}</h3>
      <p>Ông {p.father}</p>
      <p>Bà {p.mother}</p>
      <small>{p.address}</small>
    </div>
  );
}

export default function Ceremony({ data }: { data: InvitationData }) {
  const { groom, bride, ceremony } = data;
  return (
    <Section eyebrow="Trân trọng báo tin" title="Lễ Thành Hôn" framed>
      <div className={styles.families}>
        <Family label="Nhà trai" p={groom} />
        <Family label="Nhà gái" p={bride} />
      </div>

      <p className={styles.lead}>Trân trọng báo tin lễ thành hôn của con chúng tôi</p>

      <div className={styles.couple}>
        <div className={styles.role}>{groom.role}</div>
        <div className={styles.personName}>{groom.name}</div>
        <div className={styles.amp}>&amp;</div>
        <div className={styles.role}>{bride.role}</div>
        <div className={styles.personName}>{bride.name}</div>
      </div>

      <p className={styles.lead} style={{ marginBottom: 6 }}>Hôn lễ được cử hành vào lúc</p>
      <div className={styles.bigTime}>{ceremony.time}</div>
      <div style={{ textTransform: 'capitalize' }}>
        {ceremony.weekday}, ngày {ceremony.date}
      </div>
      <p className={styles.lunar}>({ceremony.lunar})</p>
      <div className={styles.place}>Tại {ceremony.place}</div>
    </Section>
  );
}
