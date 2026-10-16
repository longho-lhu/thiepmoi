import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import Invitation from '@/components/invitation/Invitation';
import { coupleTitle, loadInvitation, toInvitationData } from '@/lib/invitation';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const [guest, wedding] = await Promise.all([
    prisma.guest.findUnique({ where: { code } }),
    prisma.wedding.findUnique({ where: { id: 1 } }),
  ]);
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  return {
    title: wedding ? `Thiệp cưới ${coupleTitle(wedding)}` : 'Thiệp cưới',
    description: guest ? `Thân mời ${guest.displayName}` : 'Trân trọng kính mời',
    openGraph: { images: [{ url: `${site}/theme/og-cover.jpg`, width: 1200, height: 630 }] },
    robots: { index: false, follow: false },
  };
}

export default async function GuestPage({ params }: Props) {
  const { code } = await params;
  const [guest, { wedding, photos, wishes }] = await Promise.all([
    prisma.guest.findUnique({ where: { code } }),
    loadInvitation(),
  ]);
  if (!guest || !wedding) notFound();

  return <Invitation data={toInvitationData(wedding, photos, wishes, { code, name: guest.displayName })} />;
}
