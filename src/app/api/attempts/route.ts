import { NextResponse } from 'next/server';
import { saveAttempt, getUserAttempts } from '@/lib/firebase/models';

export const dynamic = 'force-dynamic';

// GET /api/attempts?uid=XYZ
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ success: false, error: 'User uid required' }, { status: 400 });
    }

    const attempts = await getUserAttempts(uid);
    return NextResponse.json({ success: true, count: attempts.length, attempts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/attempts (Submit test attempt)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.uid || !body.paper_id) {
      return NextResponse.json({ success: false, error: 'uid and paper_id are required' }, { status: 400 });
    }

    const result = await saveAttempt(body);
    return NextResponse.json({ success: true, attempt: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
