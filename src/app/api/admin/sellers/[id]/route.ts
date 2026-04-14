import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function checkAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return p?.role === 'admin' ? user : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  if (!await checkAdmin(supabase)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { verification_status, platform_fee_rate } = body;

  const updates: Record<string, unknown> = {};
  if (verification_status) updates.verification_status = verification_status;
  if (platform_fee_rate !== undefined) updates.platform_fee_rate = platform_fee_rate;

  const { error } = await supabase
    .from('seller_profiles')
    .update(updates)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update profile role if approving
  if (verification_status === 'approved') {
    await supabase.from('profiles').update({ role: 'seller' }).eq('id', id);
    await supabase.from('notifications').insert({
      user_id: id,
      type: 'system',
      title: 'Seller account approved!',
      message: 'Your seller account has been approved. You can now list your gemstones.',
      data: {},
    });
  } else if (verification_status === 'rejected') {
    await supabase.from('notifications').insert({
      user_id: id,
      type: 'system',
      title: 'Seller application update',
      message: 'Your seller application requires additional information. Please contact support.',
      data: {},
    });
  }

  return NextResponse.json({ message: 'Seller updated' });
}
