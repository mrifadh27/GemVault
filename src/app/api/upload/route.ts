// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string) || 'gem-images';

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    // Allowed types — images for gems, images+video for DM
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif'];
    const videoTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
    const isDmBucket = bucket === 'dm-media';
    const allowedTypes = isDmBucket ? [...imageTypes, ...videoTypes] : imageTypes;

    if (!allowedTypes.includes(file.type)) {
      const allowed = isDmBucket ? 'JPEG, PNG, WebP, GIF, MP4, MOV, WebM' : 'JPEG, PNG, WebP, or HEIC';
      return NextResponse.json({ error: `Only ${allowed} files are allowed` }, { status: 400 });
    }

    // Max size: 50MB for videos, 10MB for images
    const isVideo = videoTypes.includes(file.type);
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: `File too large (max ${isVideo ? '50MB' : '10MB'})` }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
    const filename = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, file, { contentType: file.type, upsert: false });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return NextResponse.json({ url: publicUrl, path: data.path, media_type: isVideo ? 'video' : 'image' });
  } catch (err: unknown) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
