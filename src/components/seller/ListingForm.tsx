'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { Save, Loader2 } from 'lucide-react';
import { ImageUploader } from './index';
import { useUIStore } from '@/stores/ui.store';
import type { ProductWithImages } from '@/types';
import { GEMSTONE_TYPES, CUT_TYPES, CLARITY_GRADES, TREATMENT_TYPES, CERTIFICATION_BODIES } from '@/lib/validations';

interface ListingFormProps {
  product?: ProductWithImages;
  mode?: 'create' | 'edit';
}

export function ListingForm({ product, mode = 'create' }: ListingFormProps) {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    name: product?.name ?? '',
    gemstone_type: product?.gemstone_type ?? '',
    cut: product?.cut ?? '',
    clarity: product?.clarity ?? '',
    color_grade: product?.color_grade ?? '',
    carat_weight: product?.carat_weight ?? '',
    origin_country: product?.origin_country ?? '',
    treatment: product?.treatment ?? 'None',
    certification_body: product?.certification_body ?? 'None',
    certification_number: product?.certification_number ?? '',
    price: product?.price ?? '',
    compare_price: product?.compare_price ?? '',
    cost_price: product?.cost_price ?? '',
    stock_quantity: product?.stock_quantity ?? 1,
    low_stock_threshold: product?.low_stock_threshold ?? 3,
    description: product?.description ?? '',
    tags: product?.tags?.join(', ') ?? '',
    dimensions_mm: product?.dimensions_mm ?? '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const imageUrls: string[] = [];
      if (product?.product_images?.length && images.length === 0) {
        imageUrls.push(...product.product_images.map(i => i.url));
      }
      for (const file of images) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('bucket', 'product-images');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Image upload failed');
        const { url } = await res.json();
        imageUrls.push(url);
      }

      const payload = { ...formData, image_urls: imageUrls };
      const url = mode === 'edit' && product ? `/api/products/${product.id}` : '/api/products';
      const method = mode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const { error } = await res.json(); throw new Error(error); }

      addToast({ title: mode === 'edit' ? 'Listing updated!' : 'Listing created!', variant: 'success' });
      router.push('/seller/listings');
    } catch (err: any) {
      addToast({ title: err.message ?? 'Failed to save', variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const F = ({ label, req, err, children }: { label: string; req?: boolean; err?: string; children: React.ReactNode }) => (
    <div>
      <label className="label">{label}{req && <span className="text-red-400 ml-1">*</span>}</label>
      {children}
      {err && <p className="error-text">{err}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="card p-6">
        <h3 className="font-serif text-xl text-ivory font-light mb-4">Product Images</h3>
        <ImageUploader value={images} onChange={setImages} maxFiles={8} />
      </div>

      <div className="card p-6 space-y-5">
        <h3 className="font-serif text-xl text-ivory font-light">Basic Information</h3>
        <F label="Product Name" req><input name="name" value={formData.name} onChange={handleChange} className="input" placeholder="e.g. Pigeon Blood Ruby, Unheated" required /></F>
        <div className="grid grid-cols-2 gap-4">
          <F label="Gemstone Type" req>
            <select name="gemstone_type" value={formData.gemstone_type} onChange={handleChange} className="select" required>
              <option value="">Select type</option>
              {GEMSTONE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </F>
          <F label="Cut" req>
            <select name="cut" value={formData.cut} onChange={handleChange} className="select" required>
              <option value="">Select cut</option>
              {CUT_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </F>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <F label="Clarity" req>
            <select name="clarity" value={formData.clarity} onChange={handleChange} className="select" required>
              <option value="">Select clarity</option>
              {CLARITY_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </F>
          <F label="Color Grade"><input name="color_grade" value={formData.color_grade} onChange={handleChange} className="input" placeholder="e.g. Vivid Red" /></F>
          <F label="Carat Weight" req><input name="carat_weight" value={formData.carat_weight} onChange={handleChange} type="number" step="0.001" className="input" placeholder="0.000" required /></F>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <F label="Origin Country"><input name="origin_country" value={formData.origin_country} onChange={handleChange} className="input" placeholder="e.g. Burma (Myanmar)" /></F>
          <F label="Treatment" req>
            <select name="treatment" value={formData.treatment} onChange={handleChange} className="select">
              {TREATMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </F>
        </div>
        <F label="Dimensions (LxWxH mm)"><input name="dimensions_mm" value={formData.dimensions_mm} onChange={handleChange} className="input" placeholder="e.g. 7.2 x 5.1 x 3.8" /></F>
        <F label="Description" req><textarea name="description" value={formData.description} onChange={handleChange} rows={5} className="input resize-none" placeholder="Describe the gemstone in detail…" required /></F>
        <F label="Tags (comma-separated)"><input name="tags" value={formData.tags} onChange={handleChange} className="input" placeholder="e.g. pigeon blood, unheated, GIA certified" /></F>
      </div>

      <div className="card p-6 space-y-5">
        <h3 className="font-serif text-xl text-ivory font-light">Certification</h3>
        <div className="grid grid-cols-2 gap-4">
          <F label="Certification Body" req>
            <select name="certification_body" value={formData.certification_body} onChange={handleChange} className="select">
              {CERTIFICATION_BODIES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </F>
          {formData.certification_body !== 'None' && (
            <F label="Certificate Number" req><input name="certification_number" value={formData.certification_number} onChange={handleChange} className="input" placeholder="e.g. 1234567890" /></F>
          )}
        </div>
      </div>

      <div className="card p-6 space-y-5">
        <h3 className="font-serif text-xl text-ivory font-light">Pricing & Inventory</h3>
        <div className="grid grid-cols-3 gap-4">
          <F label="Selling Price ($)" req><input name="price" value={formData.price} onChange={handleChange} type="number" step="0.01" className="input" placeholder="0.00" required /></F>
          <F label="Compare Price ($)"><input name="compare_price" value={formData.compare_price} onChange={handleChange} type="number" step="0.01" className="input" placeholder="0.00" /></F>
          <F label="Cost Price ($)"><input name="cost_price" value={formData.cost_price} onChange={handleChange} type="number" step="0.01" className="input" placeholder="0.00" /></F>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <F label="Stock Quantity" req><input name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} type="number" min="1" className="input" required /></F>
          <F label="Low Stock Alert"><input name="low_stock_threshold" value={formData.low_stock_threshold} onChange={handleChange} type="number" min="0" className="input" /></F>
        </div>
      </div>

      <div className="flex gap-4">
        <button type="submit" disabled={isSubmitting} className="btn-gold gap-2">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSubmitting ? 'Saving…' : mode === 'edit' ? 'Update Listing' : 'Create Listing'}
        </button>
        <button type="button" onClick={() => router.push('/seller/listings')} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}
