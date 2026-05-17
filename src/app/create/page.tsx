'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload, X, Plus, Loader2, ChevronDown, Info,
  Camera, Tag, MapPin, Award, DollarSign
} from 'lucide-react';
import { cn, getImageUrl } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { toast, ToastContainer } from '@/components/common/Toast';

const GEMSTONE_TYPES = [
  'Ruby', 'Sapphire', 'Emerald', 'Diamond', 'Amethyst', 'Opal',
  'Garnet', 'Topaz', 'Aquamarine', 'Tourmaline', 'Tanzanite', 'Spinel',
  'Alexandrite', 'Morganite', 'Peridot', 'Citrine', 'Zircon', 'Other',
];

const CATEGORIES = [
  { slug: 'natural', name: 'Natural', icon: '🌿' },
  { slug: 'ruby', name: 'Ruby', icon: '🔴' },
  { slug: 'sapphire', name: 'Sapphire', icon: '🔵' },
  { slug: 'emerald', name: 'Emerald', icon: '💚' },
  { slug: 'diamond', name: 'Diamond', icon: '🤍' },
  { slug: 'amethyst', name: 'Amethyst', icon: '🟣' },
  { slug: 'opal', name: 'Opal', icon: '🌈' },
  { slug: 'rough', name: 'Rough/Uncut', icon: '🪨' },
  { slug: 'lab-grown', name: 'Lab Grown', icon: '🔬' },
  { slug: 'certified', name: 'Certified', icon: '📜' },
  { slug: 'jewelry', name: 'Jewelry', icon: '📿' },
  { slug: 'other', name: 'Other', icon: '✨' },
];

const TREATMENTS = ['None', 'Heated', 'Oiled', 'Beryllium', 'Fracture Filled', 'Irradiated', 'Coated'];
const CERTIFICATIONS = ['None', 'GIA', 'IGI', 'AGL', 'GRS', 'Gübelin', 'SSEF', 'Lotus', 'GIT'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'THB', 'SGD', 'AUD', 'CAD', 'JPY', 'INR'];

interface ImagePreview { file: File; url: string; uploading?: boolean; uploadedUrl?: string; }

export default function CreatePage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<ImagePreview[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gemstoneType, setGemstoneType] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [caratWeight, setCaratWeight] = useState('');
  const [originCountry, setOriginCountry] = useState('');
  const [treatment, setTreatment] = useState('None');
  const [certification, setCertification] = useState('None');
  const [certNumber, setCertNumber] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [isPriceNegotiable, setIsPriceNegotiable] = useState(false);
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).slice(0, 10 - images.length);
    const newPreviews: ImagePreview[] = arr.map(file => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setImages(prev => [...prev, ...newPreviews]);
  }, [images.length]);

  const removeImage = (i: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const uploadImage = async (preview: ImagePreview): Promise<string> => {
    const formData = new FormData();
    formData.append('file', preview.file);
    formData.append('bucket', 'gem-images');
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || 'Upload failed');
    }
    const { url } = await res.json();
    return url;
  };

  const handleSubmit = async () => {
    if (!user) { toast('Please sign in first', 'error'); return; }
    if (images.length === 0) { toast('Add at least one photo', 'error'); return; }
    if (!title.trim()) { toast('Title is required', 'error'); return; }
    if (!gemstoneType) { toast('Select a gemstone type', 'error'); return; }
    if (!categorySlug) { toast('Select a category', 'error'); return; }

    setSubmitting(true);
    try {
      // Upload images
      toast('Uploading images...', 'info');
      const uploadedUrls: string[] = [];
      for (const img of images) {
        if (img.uploadedUrl) { uploadedUrls.push(img.uploadedUrl); continue; }
        const url = await uploadImage(img);
        uploadedUrls.push(url);
      }

      // Create post
      const tagList = tags.split(/[,\s]+/).map(t => t.trim().toLowerCase().replace('#', '')).filter(Boolean);
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          gemstone_type: gemstoneType,
          category_slug: categorySlug,
          carat_weight: caratWeight ? parseFloat(caratWeight) : undefined,
          origin_country: originCountry.trim() || undefined,
          treatment,
          certification,
          certification_number: certNumber.trim() || undefined,
          price: price ? parseFloat(price) : undefined,
          currency,
          is_price_negotiable: isPriceNegotiable,
          tags: tagList,
          image_urls: uploadedUrls,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to create post');
      }

      toast('Post published! 💎', 'success');
      setTimeout(() => router.push('/'), 500);
    } catch (err: unknown) {
      toast((err as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian">
      <Navbar />
      <ToastContainer />

      <main className="pt-14 pb-20 sm:pb-8">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-serif text-2xl text-ivory font-light">New Post</h1>
            <button
              onClick={handleSubmit}
              disabled={submitting || images.length === 0 || !title || !gemstoneType || !categorySlug}
              className="btn-gold px-5 py-2 rounded-full text-sm"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish 💎'}
            </button>
          </div>

          {/* ── Image Upload ── */}
          <section className="mb-6">
            <div
              className={cn(
                'relative border-2 border-dashed rounded-2xl transition-all duration-200 overflow-hidden',
                dragOver ? 'border-gold bg-gold/5' : 'border-[#2a2a2a] hover:border-[#3a3a3a]',
                images.length === 0 ? 'h-56' : 'min-h-0'
              )}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            >
              {images.length === 0 ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-ivory-muted hover:text-ivory transition-colors"
                >
                  <Camera className="w-10 h-10 opacity-40" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Add Photos</p>
                    <p className="text-xs opacity-60 mt-0.5">Tap or drag & drop · Up to 10 images</p>
                  </div>
                </button>
              ) : (
                <div className="p-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[#1a1a1a]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <div className="absolute top-1 left-1 text-[9px] font-bold bg-gold text-obsidian px-1.5 py-0.5 rounded-full">
                          COVER
                        </div>
                      )}
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center hover:bg-red-500/80 transition-colors"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {images.length < 10 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-[#2a2a2a] hover:border-gold/50 flex items-center justify-center text-ivory-subtle hover:text-gold transition-colors"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => e.target.files && addFiles(e.target.files)}
            />
          </section>

          {/* ── Details ── */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="label">Title *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. 5.2ct Unheated Burma Ruby – Vivid Red"
                className="input"
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div>
              <label className="label">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Details about origin, treatment history, cut quality, inclusions..."
                rows={3}
                className="input resize-none"
                maxLength={1000}
              />
            </div>

            {/* Gemstone Type + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Gemstone Type *</label>
                <div className="relative">
                  <select
                    value={gemstoneType}
                    onChange={e => setGemstoneType(e.target.value)}
                    className="input appearance-none pr-8"
                  >
                    <option value="">Select type</option>
                    {GEMSTONE_TYPES.map(g => <option key={g}>{g}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="label">Category *</label>
                <div className="relative">
                  <select
                    value={categorySlug}
                    onChange={e => setCategorySlug(e.target.value)}
                    className="input appearance-none pr-8"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Carat + Origin */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Carat Weight</label>
                <input
                  type="number"
                  value={caratWeight}
                  onChange={e => setCaratWeight(e.target.value)}
                  placeholder="e.g. 2.35"
                  step="0.01"
                  min="0"
                  className="input"
                />
              </div>
              <div>
                <label className="label">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Origin Country
                </label>
                <input
                  value={originCountry}
                  onChange={e => setOriginCountry(e.target.value)}
                  placeholder="e.g. Burma, Ceylon"
                  className="input"
                />
              </div>
            </div>

            {/* Treatment + Certification */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Treatment</label>
                <div className="relative">
                  <select
                    value={treatment}
                    onChange={e => setTreatment(e.target.value)}
                    className="input appearance-none pr-8"
                  >
                    {TREATMENTS.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="label">
                  <Award className="w-3 h-3 inline mr-1" />
                  Certification
                </label>
                <div className="relative">
                  <select
                    value={certification}
                    onChange={e => setCertification(e.target.value)}
                    className="input appearance-none pr-8"
                  >
                    {CERTIFICATIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Cert number */}
            {certification !== 'None' && (
              <div>
                <label className="label">Certification Number</label>
                <input
                  value={certNumber}
                  onChange={e => setCertNumber(e.target.value)}
                  placeholder="e.g. GIA 1234567890"
                  className="input"
                />
              </div>
            )}

            {/* Price (OPTIONAL) */}
            <div className="p-4 rounded-xl bg-[#0f0f0f] border border-[#1e1e1e]">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-gold" />
                <label className="label mb-0">Price <span className="text-ivory-subtle font-normal normal-case text-[10px]">(optional — leave empty for "DM for price")</span></label>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="Leave empty for DM"
                    min="0"
                    step="1"
                    className="input"
                  />
                </div>
                <div className="relative w-24">
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="input appearance-none pr-6 text-center"
                  >
                    {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ivory-subtle pointer-events-none" />
                </div>
              </div>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPriceNegotiable}
                  onChange={e => setIsPriceNegotiable(e.target.checked)}
                  className="w-3.5 h-3.5 accent-gold"
                />
                <span className="text-xs text-ivory-muted">Price is negotiable</span>
              </label>
            </div>

            {/* Tags */}
            <div>
              <label className="label">
                <Tag className="w-3 h-3 inline mr-1" />
                Tags
              </label>
              <input
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="ruby, unheated, burma, natural (comma separated)"
                className="input"
              />
            </div>

            {/* Info notice */}
            <div className="flex gap-2 p-3 rounded-xl bg-gold/5 border border-gold/20">
              <Info className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
              <p className="text-xs text-ivory-muted leading-relaxed">
                Buyers will contact you via DM. Make sure your profile has your WhatsApp or Instagram so they can reach you directly.
              </p>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting || images.length === 0 || !title || !gemstoneType || !categorySlug}
              className="btn-gold w-full justify-center py-4 rounded-2xl text-base"
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Publishing...</>
              ) : (
                '💎 Publish Gem Post'
              )}
            </button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
