import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Invitation from '@/components/invitation/Invitation';
import { coupleTitle, loadInvitation, toInvitationData } from '@/lib/invitation';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const wedding = await prisma.wedding.findUnique({ where: { id: 1 } });
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  return {
    title: wedding ? `Thiệp cưới ${coupleTitle(wedding)}` : 'Thiệp cưới',
    description: 'Trân trọng kính mời',
    openGraph: { images: [{ url: `${site}/theme/og-cover.jpg`, width: 1200, height: 630 }] },
    robots: { index: false, follow: false },
  };
}

export default async function HomePage() {
  const { wedding, photos, wishes } = await loadInvitation();
  if (!wedding) notFound();
  return <Invitation data={toInvitationData(wedding, photos, wishes, null)} />;
}
