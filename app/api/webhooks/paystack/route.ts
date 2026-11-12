import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerClient } from '@/lib/supabase/server';
import {
  findOrderByReference,
  verifyAndConfirmPayment,
} from '@/lib/recruiter/billing';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const secretKey = process.env.PAYSTACK_SECRET_KEY || '';

    // If secret key is configured and not placeholder, verify HMAC signature
    const signature = req.headers.get('x-paystack-signature');
    const isPlaceholderKey =
      !secretKey || secretKey.includes('your_secret_key') || secretKey.startsWith('sk_test_your');

    if (secretKey && !isPlaceholderKey && signature) {
      const hash = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');
      if (hash !== signature) {
        console.warn('Paystack webhook: invalid HMAC signature rejected.');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody || '{}');
    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.success' && data?.reference) {
      const reference = String(data.reference);
      const paidAmountKobo = Number(data.amount || 0);
      const paidCurrency = String(data.currency || 'NGN').toUpperCase();

      // Case 1: Recruiter Token Billing Order
      const billingOrder = findOrderByReference(reference);
      if (billingOrder || reference.startsWith('SYNC730-ORD-')) {
        const confirmResult = verifyAndConfirmPayment({
          reference,
          paidAmountKobo,
          currency: paidCurrency,
          confirmedBy: 'paystack-webhook',
        });

        if (!confirmResult.success) {
          console.error(
            `Paystack webhook order confirmation failed for ${reference}: ${confirmResult.error}`
          );
        } else {
          console.log(
            `Paystack webhook confirmed order ${reference}: ${confirmResult.tokensIssued} tokens issued (alreadyConfirmed: ${confirmResult.alreadyConfirmed}).`
          );
        }

        return NextResponse.json({
          received: true,
          type: 'recruiter_token_order',
          order_id: billingOrder?.id,
          already_confirmed: confirmResult.alreadyConfirmed,
        });
      }

      // Case 2: Candidate Mock Interview Prep Session
      try {
        const supabase = await createServerClient();
        await supabase
          .from('mock_prep_sessions')
          .update({
            payment_status: 'COMPLETED',
            updated_at: new Date().toISOString(),
          })
          .eq('payment_reference', reference);
      } catch (dbErr) {
        console.warn('Webhook DB update notice for mock prep session:', dbErr);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Paystack webhook processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 400 }
    );
  }
}
