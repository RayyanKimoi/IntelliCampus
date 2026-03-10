import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/users/[id]
 * Update user status or role
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    let user;
    try {
      user = getAuthUser(req);
      requireRole(user, [UserRole.ADMIN]);
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { isActive, role } = body;

    // Check if user exists and belongs to same institution
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, institutionId: true, role: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.institutionId !== user.institutionId) {
      return NextResponse.json({ error: 'Unauthorized to modify this user' }, { status: 403 });
    }

    // Prevent admin from deactivating themselves
    if (id === user.userId && isActive === false) {
      return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 });
    }

    // Build update data
    const updateData: any = {};
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }
    if (role && ['student', 'teacher', 'admin'].includes(role)) {
      updateData.role = role;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error('[PATCH /api/admin/users/[id]] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    let user;
    try {
      user = getAuthUser(req);
      requireRole(user, [UserRole.ADMIN]);
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if user exists and belongs to same institution
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, institutionId: true, role: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.institutionId !== user.institutionId) {
      return NextResponse.json({ error: 'Unauthorized to delete this user' }, { status: 403 });
    }

    // Prevent admin from deleting themselves
    if (id === user.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Delete user
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('[DELETE /api/admin/users/[id]] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
