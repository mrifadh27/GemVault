import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CollectionPageClient from './CollectionPageClient';

export const metadata = { title: 'My Collection · GemGram' };

export default async function CollectionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <CollectionPageClient userId={user.id} />;
}
