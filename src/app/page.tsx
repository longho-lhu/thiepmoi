import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Invitation from '@/components/invitation/Invitation';
import { invitationMetadata, loadInvitation, toInvitationData } from '@/lib/invitation';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return invitationMetadata(await prisma.wedding.findUnique({ where: { id: 1 } }), null);
}

export default async function HomePage() {
  const { wedding, photos, wishes } = await loadInvitation();
  if (!wedding) notFound();
  return <Invitation data={toInvitationData(wedding, photos, wishes, null)} />;
}
