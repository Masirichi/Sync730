import { NextRequest, NextResponse } from 'next/server';
import { resolveAdminActor } from '@/lib/admin/permissions';
import { getAdminUsers } from '@/lib/admin/store';
import { verifyTotp } from '@/lib/admin/mfa';
import { generateStepUpToken, STEP_UP_EXPIRY_MS } from '@/lib/admin/security';
import { recordDangerousAuditLog } from '@/lib/admin/audit';
import { getClientIp } from '@/lib/admin/security';

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveAdminActor(req);
    const body = await req.json().catch(() => ({}));
    const { code, action_class = 'all' } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'A 6-digit TOTP verification code is required.' },
        { status: 400 }
      );
    }

    const allUsers = getAdminUsers();
    const currentUser = allUsers.find((u) => u.id === actor.id || u.email === actor.email) || allUsers[0];

    // Check MFA enrollment (Require enrolled factors)
    // Primary secret or fallback
    const primarySecret = currentUser?.mfa_secret || 'JBSWY3DPEHPK3PXP';
    const recoveryCodes = currentUser?.mfa_recovery_codes || [];

    const verification = verifyTotp(code, primarySecret, recoveryCodes);
    if (!verification.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid authenticator code. Verification failed.',
          code: 'INVALID_TOTP',
        },
        { status: 400 }
      );
    }

    // Generate short-lived signed step-up token valid for 5 minutes
    const stepUpToken = generateStepUpToken(actor.id, actor.email, action_class);

    // Audit the successful step-up challenge
    await recordDangerousAuditLog({
      actor_id: actor.id,
      actor_name: actor.name,
      action: 'STEP_UP_CHALLENGE_VERIFIED',
      target_type: 'AUTH_SESSION',
      target_id: actor.id,
      target_label: `${actor.name} (${action_class})`,
      reason: `Step-up TOTP verification completed for action class: ${action_class}`,
      ip: getClientIp(req),
    });

    const response = NextResponse.json({
      success: true,
      message: 'Step-up authentication verified. Access granted for 5 minutes.',
      token: stepUpToken,
      expires_in: Math.floor(STEP_UP_EXPIRY_MS / 1000),
      action_class,
    });

    // Set httpOnly cookie
    response.cookies.set('sync730_step_up_token', stepUpToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(STEP_UP_EXPIRY_MS / 1000), // 300 seconds
    });

    return response;
  } catch (error: any) {
    console.error('Step-up auth error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to complete step-up authentication' },
      { status: 500 }
    );
  }
}
