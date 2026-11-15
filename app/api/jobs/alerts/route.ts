// app/api/jobs/alerts/route.ts
// Handles candidate job alert subscriptions.
// Requires explicit consent checkbox linking to Privacy Policy.

import { NextRequest, NextResponse } from 'next/server';
import { createAlertSubscription } from '@/lib/jobs/reports-and-alerts';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, modalities, locations, role_types, consent } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    if (!consent) {
      return NextResponse.json(
        { error: 'You must consent to receiving job alerts in accordance with our Privacy Policy.' },
        { status: 400 }
      );
    }

    const cleanModalities = Array.isArray(modalities) ? modalities : ['remote'];
    const cleanLocations = Array.isArray(locations) ? locations : [];
    const cleanRoleTypes = Array.isArray(role_types) ? role_types : [];

    const result = createAlertSubscription({
      email,
      modalities: cleanModalities,
      locations: cleanLocations,
      role_types: cleanRoleTypes,
      consent: Boolean(consent),
    });

    return NextResponse.json({
      success: true,
      message: 'You have been subscribed to job alerts. A confirmation has been sent to your email.',
      subscriptionId: result.subscription.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process job alert subscription' },
      { status: 500 }
    );
  }
}
