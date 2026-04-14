import { createClient } from '@/lib/supabase/server';
import { ListingForm } from '@/components/seller/ListingForm';
import { notFound } from 'next/navigation';

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('products')
    .select('*, product_images(*)')
    .eq('id', id)
    .single();

  if (!data) notFound();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-ivory font-light">Edit Listing</h1>
        <p className="text-ivory-muted text-sm mt-1">{(data as any).name}</p>
      </div>
      <ListingForm product={data as any} mode="edit" />
    </div>
  );
}
