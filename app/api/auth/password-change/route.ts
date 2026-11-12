import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { invalidateAllSessions } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { new_password } = body;

    if (!new_password || new_password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // 1. Update user password in Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      );
    }

    // 2. Security requirement: Logout everywhere on password change
    // Revokes all active refresh tokens and sessions across all browsers/devices
    await invalidateAllSessions(user.id);

    return NextResponse.json({
      success: true,
      message: 'Password successfully updated. All active sessions across all devices have been signed out.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update password' },
      { status: 500 }
    );
  }
}
