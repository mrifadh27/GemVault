import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendShipmentEmail } from '@/lib/resend';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*, product_images (*)),
          seller_profiles (id, store_name, store_logo_url)
        ),
        profiles (id, full_name, email, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error || !data) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Ensure user owns the order or is a seller/admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const isOwner = (data as any).buyer_id === user.id;
    const isSeller = (data as any).order_items?.some((item: any) => item.seller_id === user.id);
    const isAdmin = profile?.role === 'admin';

    if (!isOwner && !isSeller && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

    // Updating order item (seller action)
    if (body.item_id) {
      const { data: item } = await supabase
        .from('order_items')
        .select('seller_id, order_id')
        .eq('id', body.item_id)
        .single();

      if (!item) return NextResponse.json({ error: 'Order item not found' }, { status: 404 });
      if (item.seller_id !== user.id && profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const updates: Record<string, unknown> = { status: body.status };
      if (body.tracking_number) updates.tracking_number = body.tracking_number;
      if (body.tracking_carrier) updates.tracking_carrier = body.tracking_carrier;
      if (body.status === 'shipped') updates.shipped_at = new Date().toISOString();
      if (body.status === 'delivered') updates.delivered_at = new Date().toISOString();

      await supabase.from('order_items').update(updates).eq('id', body.item_id);

      // If shipped, send email to buyer
      if (body.status === 'shipped' && body.tracking_number) {
        const { data: order } = await supabase
          .from('orders')
          .select('buyer_id, profiles (email, full_name)')
          .eq('id', id)
          .single();

        const buyerProfile = (order as any)?.profiles;
        if (buyerProfile?.email) {
          await sendShipmentEmail(
            buyerProfile.email,
            buyerProfile.full_name ?? 'Customer',
            id,
            body.tracking_number,
            body.tracking_carrier ?? 'Carrier'
          ).catch(console.error);
        }

        // Notify buyer
        await supabase.from('notifications').insert({
          user_id: (order as any).buyer_id,
          type: 'order_update',
          title: 'Your order has shipped!',
          message: `Tracking: ${body.tracking_number} via ${body.tracking_carrier ?? 'carrier'}`,
          data: { order_id: id, tracking_number: body.tracking_number },
        });
      }

      // Update parent order status based on all items
      const { data: allItems } = await supabase
        .from('order_items')
        .select('status')
        .eq('order_id', id);

      if (allItems) {
        const statuses = allItems.map((i) => i.status);
        let orderStatus: string | null = null;

        if (statuses.every((s) => s === 'delivered')) orderStatus = 'delivered';
        else if (statuses.every((s) => s === 'shipped' || s === 'delivered')) orderStatus = 'shipped';
        else if (statuses.some((s) => s === 'confirmed')) orderStatus = 'confirmed';

        if (orderStatus) {
          await supabase.from('orders').update({ status: orderStatus }).eq('id', id);
        }
      }

      return NextResponse.json({ message: 'Updated successfully' });
    }

    // Admin order status update
    if (profile?.role === 'admin' && body.status) {
      await supabase.from('orders').update({ status: body.status }).eq('id', id);
      return NextResponse.json({ message: 'Order updated' });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (err) {
    console.error('PATCH /api/orders/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
