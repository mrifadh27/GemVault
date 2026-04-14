import { ListingForm } from '@/components/seller/ListingForm';

export default function NewListingPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-ivory font-light">New Listing</h1>
        <p className="text-ivory-muted text-sm mt-1">Create a new gemstone listing for your store</p>
      </div>
      <ListingForm mode="create" />
    </div>
  );
}
