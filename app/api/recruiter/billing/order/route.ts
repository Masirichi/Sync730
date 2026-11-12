import { NextRequest, NextResponse } from 'next/server';
import { getRecruiterSession, enforceRecruiterRole } from '@/lib/recruiter/auth';
import {
  TOKEN_PACKS,
  createBillingOrder,
  findOrderByReference,
  calculateLedgerBalance,
} from '@/lib/recruiter/billing';
import { TokenPackId } from '@/lib/recruiter/types';

/**
 * POST /api/recruiter/billing/order
 * Creates a PENDING billing order with server-controlled pricing.
 * Security: Strictly restricted to OWNER and ADMIN.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getRecruiterSession(req);
    const roleError = enforceRecruiterRole(session, ['OWNER', 'ADMIN']);
    if (roleError) {
      return roleError;
    }

    const body = await req.json();
    const { pack_id, payment_method = 'card', return_url } = body;

    if (!pack_id || !TOKEN_PACKS[pack_id as TokenPackId]) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid pack_id. Available options: starter, growth, enterprise.`,
        },
        { status: 400 }
      );
    }

    const pack = TOKEN_PACKS[pack_id as TokenPackId];
    const targetWsId = session!.workspaceId;
    const userEmail = session!.email || 'recruiter@sync730.com';

    // Create server-side order with exact config prices
    const order = createBillingOrder({
      workspaceId: targetWsId,
      packId: pack_id as TokenPackId,
      createdBy: userEmail,
      paymentMethod: payment_method === 'bank_transfer' ? 'bank_transfer' : 'card',
    });

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const origin = `${protocol}://${host}`;

    const defaultCallback = `${origin}/console/billing?order_ref=${order.payment_reference}&status=confirming`;
    const callbackUrl = return_url || defaultCallback;

    // Bank transfer returns virtual account directly
    if (payment_method === 'bank_transfer') {
      return NextResponse.json({
        success: true,
        order,
        reference: order.payment_reference,
        bank_details: order.bank_details,
        message: 'Order created in PENDING_CONFIRMATION status. Complete transfer to the account details provided.',
      });
    }

    // Card Payment: Paystack integration
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const isPlaceholderKey =
      !secretKey || secretKey.includes('your_secret_key') || secretKey.startsWith('sk_test_your');

    if (!isPlaceholderKey) {
      try {
        const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userEmail,
            amount: pack.amount_kobo,
            currency: 'NGN',
            reference: order.payment_reference,
            callback_url: callbackUrl,
            metadata: {
              order_id: order.id,
              workspace_id: targetWsId,
              pack_id: pack.id,
              tokens: pack.tokens,
              custom_fields: [
                { display_name: 'Product', variable_name: 'product', value: `Sync730 ${pack.name}` },
                { display_name: 'Tokens', variable_name: 'tokens', value: `${pack.tokens} Tokens` },
                { display_name: 'Organization', variable_name: 'workspace_id', value: targetWsId },
              ],
            },
          }),
        });

        const paystackData = await paystackRes.json();
        if (paystackData.status && paystackData.data?.authorization_url) {
          return NextResponse.json({
            success: true,
            order,
            reference: order.payment_reference,
            authorization_url: paystackData.data.authorization_url,
            access_code: paystackData.data.access_code,
          });
        }
      } catch (paystackErr) {
        console.warn('Paystack live initialize failed, falling back to simulated checkout:', paystackErr);
      }
    }

    // Dev/Test Simulation URL (triggers server-side verify on return)
    const simulatedAuthUrl = `${origin}/console/billing?order_ref=${order.payment_reference}&status=confirming&simulated_pay=true`;

    return NextResponse.json({
      success: true,
      dev_mode: true,
      order,
      reference: order.payment_reference,
      authorization_url: simulatedAuthUrl,
      message: 'Order initialized in test mode. Redirecting to confirmation handler.',
    });
  } catch (error: any) {
    console.error('Billing order error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error creating order' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recruiter/billing/order?reference=SYNC730-ORD-...
 * Returns order details and current status.
 * Used for polling during the "Payment received, confirming..." state.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getRecruiterSession(req);
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Reference query parameter is required' },
        { status: 400 }
      );
    }

    const order = findOrderByReference(reference);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // RBAC: Verify organization match
    if (session && order.workspace_id !== session.workspaceId && !session.isPlatformAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Access to another organization order is not permitted.' },
        { status: 403 }
      );
    }

    const currentBalance = calculateLedgerBalance(order.workspace_id);

    return NextResponse.json({
      success: true,
      order,
      token_balance: currentBalance,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch order status' },
      { status: 500 }
    );
  }
}
