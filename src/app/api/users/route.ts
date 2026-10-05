import { NextResponse } from 'next/server';
import { getUserProfile, saveUserProfile, updateUserRole } from '@/lib/firebase/models';
import { UserRole } from '@/lib/rbac';

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

// POST /api/users (Create / Update learner profile details - field allowlist enforced)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.uid) {
      return NextResponse.json({ success: false, error: 'Missing user uid' }, { status: 400 });
    }

    // Field Allowlist Enforcement (GM-20): Strip privileged fields
    const safePayload = {
      uid: body.uid,
      email: body.email || null,
      displayName: body.displayName || null,
      photoURL: body.photoURL || null,
      // Do not allow setting role or activePasses directly via public POST
    };

    const updatedUser = await saveUserProfile(safePayload);
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/users (Update user role - Server/Admin authenticated only)
export async function PATCH(request: Request) {
  try {
    const adminSecret = request.headers.get('x-admin-secret');
    const expectedSecret = process.env.ADMIN_SECRET_KEY;

    if (!expectedSecret || adminSecret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin authorization required for role mutation' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { uid, role } = body as { uid: string; role: UserRole };

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
