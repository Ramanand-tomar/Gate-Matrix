import { NextResponse } from 'next/server';
import { getAllOrders, createOrder, OrderModel } from '@/lib/firebase/models';

export const dynamic = 'force-dynamic';

function isAuthorizedAdminCall(request: Request): boolean {
  const secret = request.headers.get('x-admin-secret');
  return secret === (process.env.ADMIN_SECRET_KEY || 'GATE_MATRIX_SECURE_ADMIN_2026');
}

// GET /api/admin/orders - Fetch all orders & revenue statistics for admin dashboard
export async function GET(request: Request) {
  if (!isAuthorizedAdminCall(request)) {
    return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
  }
  try {
    const orders = await getAllOrders();
    
    // Compute total revenue (only from GRANTED or CAPTURED orders)
    const paidOrders = orders.filter((o) => o.status === 'GRANTED' || o.status === 'CAPTURED');
    const totalGrossRevenue = paidOrders.reduce((sum, o) => sum + (o.amount || 500), 0);

    // Compute stream-wise breakdown
    const streamBreakdown: Record<string, { count: number; revenue: number }> = {
      CS: { count: 0, revenue: 0 },
      DA: { count: 0, revenue: 0 },
      EE: { count: 0, revenue: 0 },
      EC: { count: 0, revenue: 0 },
      ME: { count: 0, revenue: 0 },
      CE: { count: 0, revenue: 0 },
    };

    paidOrders.forEach((o) => {
      const prodId = (o.product_id || '').toLowerCase();
      let stream = 'CS';
      if (prodId.includes('da')) stream = 'DA';
      else if (prodId.includes('ee')) stream = 'EE';
      else if (prodId.includes('ec')) stream = 'EC';
      else if (prodId.includes('me')) stream = 'ME';
      else if (prodId.includes('ce')) stream = 'CE';

      if (!streamBreakdown[stream]) {
        streamBreakdown[stream] = { count: 0, revenue: 0 };
      }
      streamBreakdown[stream].count += 1;
      streamBreakdown[stream].revenue += (o.amount || 500);
    });

    return NextResponse.json({
      success: true,
      totalOrders: orders.length,
      paidOrdersCount: paidOrders.length,
      totalGrossRevenue,
      streamBreakdown,
      orders,
    });
  } catch (error: any) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/orders - Admin Manual Pass Granting
export async function POST(request: Request) {
  if (!isAuthorizedAdminCall(request)) {
    return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
  }
  try {
    const body = await request.json();
    const { uid, branch, product_title, amount } = body;

    if (!uid || !branch) {
      return NextResponse.json({ success: false, error: 'Candidate UID and Branch code are required' }, { status: 400 });
    }

    const branchCode = branch.toUpperCase();
    const productId = `${branchCode.toLowerCase()}_pass`;
    const title = product_title || `GATE ${branchCode} All-Access Branch Pass (Admin Granted)`;

    const newOrder: Omit<OrderModel, 'created_at'> = {
      order_id: `ord_admin_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      uid,
      product_id: productId,
      product_title: title,
      amount: amount || 500,
      currency: 'INR',
      razorpay_payment_id: `pay_admin_manual_${Date.now()}`,
      status: 'GRANTED',
    };

    const created = await createOrder(newOrder);
    return NextResponse.json({
      success: true,
      message: `Pass for GATE ${branchCode} granted to user ${uid} successfully.`,
      order: created,
    });
  } catch (error: any) {
    console.error('Error granting manual pass:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
