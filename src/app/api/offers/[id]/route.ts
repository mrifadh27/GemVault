// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/offers/[id] — respond to an offer
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, counter_price, counter_message } = await req.json();
    // action: 'accept' | 'decline' | 'counter'

    const { data: offer, error: fetchErr } = await supabase
      .from('gem_offers')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchErr || !offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    if (offer.seller_id !== user.id) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    if (offer.status !== 'pending') return NextResponse.json({ error: 'Offer is no longer pending' }, { status: 400 });

    const updates: Record<string, unknown> = {
      responded_at: new Date().toISOString(),
    };

    if (action === 'accept') {
      updates.status = 'accepted';
    } else if (action === 'decline') {
      updates.status = 'declined';
    } else if (action === 'counter') {
      if (!counter_price || counter_price <= 0) {
        return NextResponse.json({ error: 'counter_price required' }, { status: 400 });
      }
      updates.status = 'countered';
      updates.counter_price = parseFloat(counter_price);
      updates.counter_message = counter_message?.trim() || null;
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('gem_offers')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/offers/[id] — buyer withdraws offer
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('gem_offers')
      .delete()
      .eq('id', params.id)
      .eq('buyer_id', user.id)
      .eq('status', 'pending');

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
