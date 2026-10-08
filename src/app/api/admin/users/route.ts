import { NextResponse } from 'next/server';
import { getAllUserProfiles, updateUserProfileAdmin, UserModel } from '@/lib/firebase/models';
import { UserRole } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

// GET /api/admin/users - Roster overview and candidate user metrics
export async function GET() {
  try {
    const users = await getAllUserProfiles();

    const totalUsers = users.length;
    const learnersCount = users.filter((u) => u.role === 'LEARNER').length;
    const instructorsCount = users.filter((u) => u.role === 'INSTRUCTOR').length;
    const editorsCount = users.filter((u) => u.role === 'EDITOR').length;
    const adminsCount = users.filter((u) => u.role === 'ADMIN').length;
    const activePassHoldersCount = users.filter((u) => u.activePasses && u.activePasses.length > 0).length;
    const suspendedCount = users.filter((u) => u.status === 'SUSPENDED').length;

    // Sort by createdAt descending
    const sortedUsers = [...users].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    return NextResponse.json({
      success: true,
      totalUsers,
      learnersCount,
      instructorsCount,
      editorsCount,
      adminsCount,
      activePassHoldersCount,
      suspendedCount,
      users: sortedUsers,
    });
  } catch (error: any) {
    console.error('Error fetching admin user roster:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch user roster' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users - Admin update role, status, or branch passes for a candidate
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { uid, email, role, status, activePasses, displayName } = body as {
      uid?: string;
      email?: string;
      role?: UserRole;
      status?: 'ACTIVE' | 'SUSPENDED';
      activePasses?: string[];
      displayName?: string;
    };

    const targetIdentifier = uid || email;
    if (!targetIdentifier) {
      return NextResponse.json(
        { success: false, error: 'Candidate UID or email is required' },
        { status: 400 }
      );
    }

    const updatedUser = await updateUserProfileAdmin(targetIdentifier, {
      role,
      status,
      activePasses,
      displayName,
      email,
    });

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: 'Candidate profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `Updated profile for ${updatedUser.displayName || updatedUser.uid}`,
    });
  } catch (error: any) {
    console.error('Error updating user profile via admin API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update user profile' },
      { status: 500 }
    );
  }
}
