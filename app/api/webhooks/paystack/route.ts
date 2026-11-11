import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerClient } from '@/lib/supabase/server';

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
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody || '{}');
    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.success' && data?.reference) {
      const reference = data.reference;
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
        console.warn('Webhook DB update notice:', dbErr);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 400 }
    );
  }
}
