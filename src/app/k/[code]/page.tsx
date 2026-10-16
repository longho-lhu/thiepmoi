import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import Invitation from '@/components/invitation/Invitation';
import { invitationMetadata, loadInvitation, toInvitationData } from '@/lib/invitation';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const [guest, wedding] = await Promise.all([
    prisma.guest.findUnique({ where: { code } }),
    prisma.wedding.findUnique({ where: { id: 1 } }),
  ]);
  return invitationMetadata(wedding, guest?.displayName ?? null);
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
