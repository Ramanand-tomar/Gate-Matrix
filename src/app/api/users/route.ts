import { NextResponse } from 'next/server';
import { getUserProfile, saveUserProfile, updateUserRole } from '@/lib/firebase/models';

export const dynamic = 'force-dynamic';

// GET /api/users?uid=XYZ
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ success: false, error: 'User UID is required' }, { status: 400 });
    }

    const user = await getUserProfile(uid);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/users (Create / Update user details)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.uid) {
      return NextResponse.json({ success: false, error: 'Missing user uid' }, { status: 400 });
    }

    const updatedUser = await saveUserProfile(body);
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/users (Update user role)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { uid, role } = body;

    if (!uid || !role) {
      return NextResponse.json({ success: false, error: 'uid and role are required' }, { status: 400 });
    }

    const ok = await updateUserRole(uid, role);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Failed to update user role' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `User role updated to ${role}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
