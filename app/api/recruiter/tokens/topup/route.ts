import { NextRequest, NextResponse } from 'next/server';

/**
 * TOKEN TOP-UP ENDPOINT (LOCKED)
 * Security Policy: No client-callable endpoint may arbitrarily add tokens.
 * Token credits may only be issued by server-side webhooks after verified Paystack/Stripe payment confirmation.
 * Until Batch R3 payment webhooks ship, direct top-ups are strictly disabled.
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Top-ups are temporarily unavailable. Contact support.',
      code: 'TOPUP_DISABLED',
    },
    { status: 503 }
  );
}

export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Top-ups are temporarily unavailable. Contact support.',
      code: 'TOPUP_DISABLED',
    },
    { status: 503 }
  );
}
