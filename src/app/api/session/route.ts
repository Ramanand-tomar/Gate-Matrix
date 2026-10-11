import { NextResponse } from 'next/server';
import { getUserProfile, updateUserActiveSession } from '@/lib/firebase/models';

export const dynamic = 'force-dynamic';

// GET /api/session?uid=XYZ - Check user's current active session ID
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ success: false, error: 'User UID is required' }, { status: 400 });
    }

    const user = await getUserProfile(uid);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      uid: user.uid,
      activeSessionId: user.activeSessionId || null,
      lastLoginAt: user.lastLoginAt,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/session - Register a new device session for user (invalidates other devices)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, sessionId } = body;

    if (!uid || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'Both uid and sessionId are required' },
        { status: 400 }
      );
    }

    const updatedUser = await updateUserActiveSession(uid, sessionId);
    if (!updatedUser) {
      return NextResponse.json({ success: false, error: 'User profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Active device session registered successfully',
      activeSessionId: updatedUser.activeSessionId,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
