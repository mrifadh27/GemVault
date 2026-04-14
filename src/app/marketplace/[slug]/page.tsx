import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductSpecsTable } from '@/components/product/ProductSpecsTable';
import { CertificationBadge } from '@/components/product/CertificationBadge';
import { SellerCard } from '@/components/product/SellerCard';
import { ReviewsList } from '@/components/product/ReviewsList';
import { AddToCartButton } from '@/components/product/AddToCartButton';
import { WishlistButton } from '@/components/product/WishlistButton';
import { LiveViewerCount } from '@/components/marketplace/LiveViewerCount';
import { GemBadge, StarRating, PriceDisplay, LowStockBadge, VerifiedBadge } from '@/components/common/index';
import { ProductGrid } from '@/components/marketplace/ProductGrid';
import type { ProductWithImages } from '@/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string): Promise<ProductWithImages | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('products')
    .select(`
      *,
      product_images (*),
      seller_profiles (
        id, store_name, store_description, store_logo_url,
        rating, review_count, total_orders, verification_status,
        profiles (full_name, avatar_url)
      )
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!data) return null;

  // Increment view count
  await supabase
    .from('products')
    .update({ views_count: (data as any).views_count + 1 })
    .eq('id', (data as any).id);

  return data as unknown as ProductWithImages;
}

async function getRelatedProducts(
  productId: string,
  gemstoneType: string
): Promise<ProductWithImages[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('products')
    .select('*, product_images(*)')
    .eq('gemstone_type', gemstoneType)
    .eq('is_active', true)
    .neq('id', productId)
    .limit(4);
  return (data as unknown as ProductWithImages[]) ?? [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('products')
    .select('name, description, gemstone_type, carat_weight, price')
    .eq('slug', slug)
    .single();

  if (!data) return { title: 'Product Not Found' };

  return {
    title: `${data.name} — ${data.carat_weight}ct ${data.gemstone_type}`,
    description: data.description ?? `Buy ${data.name}, a ${data.carat_weight}ct ${data.gemstone_type} on GemVault.`,
    openGraph: {
      title: data.name,
      description: `${data.carat_weight}ct ${data.gemstone_type} — $${data.price.toFixed(2)}`,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [product, relatedProducts] = await Promise.all([
    getProduct(slug),
    getProduct(slug).then((p) =>
      p ? getRelatedProducts(p.id, p.gemstone_type) : []
    ),
  ]);

  if (!product) notFound();

  const seller = (product as any).seller_profiles;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-ivory-subtle mb-8">
        <a href="/marketplace" className="hover:text-gold transition-colors">Marketplace</a>
        <span>/</span>
        <a href={`/marketplace?gemstone_type=${product.gemstone_type}`} className="hover:text-gold transition-colors">
          {product.gemstone_type}
        </a>
        <span>/</span>
        <span className="text-ivory-muted truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Left: Gallery */}
        <ProductGallery images={product.product_images ?? []} productName={product.name} />

        {/* Right: Details */}
        <div className="flex flex-col gap-6">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <GemBadge type={product.gemstone_type} size="md" />
            {product.is_certified && (
              <CertificationBadge body={product.certification_body} number={product.certification_number ?? undefined} />
            )}
            {seller?.verification_status === 'approved' && <VerifiedBadge label="Verified Seller" />}
          </div>

          {/* Title */}
          <div>
            <h1 className="font-serif text-4xl text-ivory font-light leading-tight mb-2">
              {product.name}
            </h1>
            {product.review_count > 0 && (
              <StarRating rating={product.rating} count={product.review_count} size="md" />
            )}
          </div>

          {/* Price */}
          <div className="flex items-center gap-4">
            <PriceDisplay
              price={product.price}
              comparePrice={product.compare_price}
              size="xl"
            />
            <LowStockBadge
              quantity={product.stock_quantity}
              threshold={product.low_stock_threshold}
            />
          </div>

          {/* Live viewers */}
          <LiveViewerCount productId={product.id} />

          {/* Quick specs */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Carat', value: `${product.carat_weight}ct` },
              { label: 'Cut', value: product.cut ?? 'N/A' },
              { label: 'Origin', value: product.origin_country ?? 'Unknown' },
            ].map((spec) => (
              <div key={spec.label} className="card p-3 text-center">
                <p className="text-xs text-ivory-subtle uppercase tracking-wider mb-1">{spec.label}</p>
                <p className="text-sm font-semibold text-ivory">{spec.value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-ivory-muted leading-relaxed border-t border-obsidian-border pt-4">
              {product.description}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <AddToCartButton product={product} className="flex-1" />
            <WishlistButton productId={product.id} />
          </div>

          {/* Certificate download */}
          {product.certificate_url && (
            <a
              href={product.certificate_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline text-sm justify-center"
            >
              📄 Download Certificate ({product.certification_body})
            </a>
          )}

          {/* Seller card */}
          {seller && <SellerCard seller={seller} />}
        </div>
      </div>

      {/* Full specs table */}
      <section className="mb-16">
        <h2 className="font-serif text-3xl text-ivory font-light mb-6">Gemstone Specifications</h2>
        <ProductSpecsTable product={product} />
      </section>

      {/* Reviews */}
      <section className="mb-16">
        <ReviewsList productId={product.id} />
      </section>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-serif text-3xl text-ivory font-light">
              More {product.gemstone_type}s
            </h2>
            <a
              href={`/marketplace?gemstone_type=${product.gemstone_type}`}
              className="text-sm text-gold hover:text-gold-light transition-colors"
            >
              View all →
            </a>
          </div>
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
}
