import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateRoleQuestions } from '@/lib/sandbox';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target_role, company_name, email, return_url } = body;

    if (!target_role) {
      return NextResponse.json(
        { success: false, error: 'target_role is required' },
        { status: 400 }
      );
    }

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const origin = `${protocol}://${host}`;

    const candidateEmail = email || 'candidate@sync730.com';
    const reference = `SYNC730-PREP-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const questions = generateRoleQuestions(target_role, company_name);

    // Initialize in Supabase or fallback
    let candidateId = null;
    try {
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      candidateId = user?.id || null;

      await supabase.from('mock_prep_sessions').insert({
        target_role,
        company_name: company_name || null,
        candidate_id: candidateId,
        amount: 250000, // ₦2,500
        currency: 'NGN',
        payment_reference: reference,
        payment_status: 'PENDING',
        interview_questions: questions,
        candidate_answers: [],
        feedback_payload: {},
      });
    } catch (err) {
      console.warn('Supabase DB notice on payment init:', err);
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const isPlaceholderKey = !secretKey || secretKey.includes('your_secret_key') || secretKey.startsWith('sk_test_your');

    // If real Paystack key exists, call Paystack initialize
    if (!isPlaceholderKey) {
      try {
        const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: candidateEmail,
            amount: 250000, // ₦2,500 in kobo
            reference,
            callback_url: return_url || `${origin}/dashboard/sandbox?reference=${reference}`,
            metadata: {
              target_role,
              company_name,
              custom_fields: [
                { display_name: 'Service', variable_name: 'service', value: 'AI Mock Video Interview Sandbox' },
                { display_name: 'Target Role', variable_name: 'target_role', value: target_role },
              ],
            },
          }),
        });

        const paystackData = await paystackRes.json();
        if (paystackData.status && paystackData.data?.authorization_url) {
          return NextResponse.json({
            success: true,
            authorization_url: paystackData.data.authorization_url,
            reference,
            access_code: paystackData.data.access_code,
          });
        }
      } catch (paystackErr) {
        console.warn('Paystack API call failed, falling back to local simulation:', paystackErr);
      }
    }

    // Dev / Test simulation fallback
    const mockAuthUrl = `${origin}/dashboard/sandbox?reference=${reference}&simulated_pay=true`;
    return NextResponse.json({
      success: true,
      dev_mode: true,
      authorization_url: mockAuthUrl,
      reference,
      message: 'Initialized in test mode with automated verification endpoint.',
    });
  } catch (error: any) {
    console.error('Paystack initialization error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
