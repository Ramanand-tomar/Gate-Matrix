import { NextResponse } from 'next/server';
import { createOrder, updateOrderStatus, getUserOrders, getUserProfile, saveUserProfile } from '@/lib/firebase/models';
import { getOfficialPriceINR, verifyRazorpaySignature } from '@/lib/commerce/entitlements';

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

// POST /api/orders (Create server-priced order record with PENDING status - GM-03/R4)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, product_id, product_title } = body;

    if (!uid || !product_id) {
      return NextResponse.json({ success: false, error: 'uid and product_id are required' }, { status: 400 });
    }

    // Server-enforced pricing (Do NOT trust client-sent amount)
    const serverPrice = getOfficialPriceINR(product_id);
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    let razorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(5)}`;

    // Generate official Razorpay Order ID if API credentials are standard
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret && keyId.startsWith('rzp_')) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: serverPrice * 100, // Amount in paise
            currency: 'INR',
            receipt: orderId.substring(0, 40),
            notes: { uid, product_id },
          }),
        });

        if (rzpRes.ok) {
          const rzpData = await rzpRes.json();
          if (rzpData.id) {
            razorpayOrderId = rzpData.id;
          }
        }
      } catch (err) {
        console.warn('Could not generate Razorpay order ID via REST API:', err);
      }
    }

    const orderPayload = {
      order_id: orderId,
      uid,
      product_id,
      product_title: product_title || 'GATE Test Series Product',
      amount: serverPrice,
      currency: 'INR',
      razorpay_order_id: razorpayOrderId,
      status: 'PENDING' as const,
    };

    const order = await createOrder(orderPayload);
    return NextResponse.json({
      success: true,
      order,
      key_id: keyId || 'rzp_test_TjuE9etFswwAfn',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/orders (Verify payment signature & grant entitlement - GM-03/GM-21)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { order_id, razorpay_payment_id, razorpay_signature, status } = body;

    if (!order_id) {
      return NextResponse.json({ success: false, error: 'order_id is required' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    let isValidPayment = false;

    if (secret && razorpay_payment_id && razorpay_signature) {
      isValidPayment = verifyRazorpaySignature(order_id, razorpay_payment_id, razorpay_signature, secret);
    } else {
      // Test environment validation: Require valid payment token format
      isValidPayment = Boolean(razorpay_payment_id && status === 'GRANTED');
    }

    if (!isValidPayment) {
      return NextResponse.json(
        { success: false, error: 'Payment verification failed: Invalid signature or payment details' },
        { status: 400 }
      );
    }

    const ok = await updateOrderStatus(order_id, 'GRANTED', {
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!ok) {
      return NextResponse.json({ success: false, error: 'Failed to update order status' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Order ${order_id} verified and entitlement granted`,
      status: 'GRANTED',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
