import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: [] });
  const { data } = await supabase.from('cart_items').select('*, products(*, product_images(*))').eq('user_id', user.id);
  return NextResponse.json({ data: data ?? [] });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await supabase.from('cart_items').delete().eq('user_id', user.id);
  return NextResponse.json({ message: 'Cart cleared' });
}
