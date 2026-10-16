import type { Metadata } from 'next';
import AdminShell from './AdminShell';

export const metadata: Metadata = { title: 'Quản trị thiệp cưới', robots: { index: false, follow: false } };

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
