import { NextResponse } from 'next/server';
import { createOrder, updateOrderStatus, getUserOrders } from '@/lib/firebase/models';

export const dynamic = 'force-dynamic';

// GET /api/orders?uid=XYZ
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ success: false, error: 'User uid required' }, { status: 400 });
    }

    const orders = await getUserOrders(uid);
    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/orders (Create order record)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.order_id || !body.uid || !body.amount) {
      return NextResponse.json({ success: false, error: 'order_id, uid, and amount are required' }, { status: 400 });
    }

    const order = await createOrder(body);
    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/orders (Update order status e.g. payment verified)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { order_id, status, razorpay_payment_id, razorpay_signature } = body;

    if (!order_id || !status) {
      return NextResponse.json({ success: false, error: 'order_id and status are required' }, { status: 400 });
    }

    const ok = await updateOrderStatus(order_id, status, { razorpay_payment_id, razorpay_signature });
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Failed to update order status' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Order ${order_id} updated to ${status}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
