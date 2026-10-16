const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');

export const googleCalendarUrl = (o: { title: string; start: Date; end: Date; location: string; details: string }) =>
  'https://www.google.com/calendar/render?action=TEMPLATE' +
  `&text=${encodeURIComponent(o.title)}&dates=${fmt(o.start)}/${fmt(o.end)}` +
  `&location=${encodeURIComponent(o.location)}&details=${encodeURIComponent(o.details)}&ctz=Asia/Ho_Chi_Minh`;

export const mapEmbedUrl = (q: string) => `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
export const directionsUrl = (q: string) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;

// File .ics cho Apple Calendar
const icsEscape = (s: string) => s.replace(/[\\;,]/g, (c) => '\\' + c).replace(/\n/g, '\\n');

export function icsFile(o: { uid: string; title: string; start: Date; end: Date; location: string; details: string }) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//thiep-cuoi//vi',
    'BEGIN:VEVENT',
    `UID:${o.uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(o.start)}`,
    `DTEND:${fmt(o.end)}`,
    `SUMMARY:${icsEscape(o.title)}`,
    `LOCATION:${icsEscape(o.location)}`,
    `DESCRIPTION:${icsEscape(o.details)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
