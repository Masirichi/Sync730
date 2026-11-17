import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAdminUsers, saveAdminUsers } from '@/lib/admin/store';
import {
  requiresMfa,
  generateBase32Secret,
  generateRecoveryCodes,
  generateTotpUri,
  verifyTotp,
  calculateMfaGraceDays,
} from '@/lib/admin/mfa';
import { recordDangerousAuditLog } from '@/lib/admin/audit';
import { getClientIp } from '@/lib/admin/security';
import { resolveAdminActor } from '@/lib/admin/permissions';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveAdminActor(req);
    const users = getAdminUsers();
    const currentUser = users.find((u) => u.id === actor.id || u.email === actor.email) || users[0];

    const needsMfa = requiresMfa(actor.role);
    const mfaEnabled = Boolean(currentUser?.mfa_enabled);

    const grace = calculateMfaGraceDays(
      currentUser?.created_at || new Date().toISOString(),
      14,
      currentUser?.mfa_grace_expires_at
    );

    return NextResponse.json({
      success: true,
      requires_mfa: needsMfa,
      mfa_enabled: mfaEnabled,
      grace_days_remaining: grace.daysRemaining,
      is_grace_expired: grace.isExpired,
      enrolled_at: currentUser?.mfa_enrolled_at || null,
      user: {
        id: actor.id,
        name: actor.name,
        role: actor.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get MFA status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, token, secret, recovery_codes } = body;
    const actor = await resolveAdminActor(req);

    // 1. Setup flow: Generate secret, TOTP URI, and emergency recovery codes
    if (action === 'SETUP') {
      const newSecret = generateBase32Secret();
      const codes = generateRecoveryCodes(8);
      const uri = generateTotpUri(actor.email, newSecret);

      return NextResponse.json({
        success: true,
        secret: newSecret,
        uri,
        recovery_codes: codes,
      });
    }

    // 2. Verify flow: Verify 6-digit TOTP code or recovery code and enroll
    if (action === 'VERIFY' || action === 'ENROLL') {
      if (!token || !secret) {
        return NextResponse.json(
          { success: false, error: 'Both token and secret are required for MFA verification' },
          { status: 400 }
        );
      }

      const verification = verifyTotp(token, secret, recovery_codes || []);
      if (!verification.valid) {
        return NextResponse.json(
          { success: false, error: 'Invalid verification code. Please check your authenticator app and try again.' },
          { status: 400 }
        );
      }

      // Mark MFA as enabled in admin store
      const allUsers = getAdminUsers();
      const updatedUsers = allUsers.map((u) => {
        if (u.id === actor.id || u.email === actor.email) {
          return {
            ...u,
            mfa_enabled: true,
            mfa_enrolled_at: new Date().toISOString(),
          };
        }
        return u;
      });
      saveAdminUsers(updatedUsers);

      // Audit log enrollment
      await recordDangerousAuditLog({
        actor_id: actor.id,
        actor_name: actor.name,
        action: 'MFA_ENROLLED',
        target_type: 'USER',
        target_id: actor.id,
        target_label: `${actor.name} (${actor.email})`,
        reason: 'Administrator enrolled in mandatory Multi-Factor Authentication (TOTP)',
        ip: getClientIp(req),
      });

      return NextResponse.json({
        success: true,
        message: 'Two-Factor Authentication successfully enrolled.',
        mfa_enabled: true,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('MFA operation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'MFA operation failed' },
      { status: 500 }
    );
  }
}
