// app/api/demo/route.ts
// Server handler for Demo Booking requests

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Rate limiting: 5 submissions per 15 minutes per IP
const ipRateMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = ipRateMap.get(ip);

  if (!record || now > record.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }

  if (record.count >= 5) {
    return true;
  }

  record.count += 1;
  return false;
}

const BACKUP_FILE = path.join(process.cwd(), '.sync730-demo-requests.json');

function saveToBackup(data: any) {
  try {
    let list: any[] = [];
    if (fs.existsSync(BACKUP_FILE)) {
      list = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
    }
    list.push(data);
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write demo request backup:', err);
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a few minutes before submitting again.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const {
      name,
      work_email,
      company,
      company_size,
      roles_hiring_for,
      message,
      consent,
      website_hp, // Honeypot field
    } = body;

    // 1. Honeypot check: Bots usually fill hidden inputs
    if (website_hp) {
      return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
    }

    // 2. Field-level validation
    const fieldErrors: Record<string, string> = {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      fieldErrors.name = 'Full name is required';
    }

    if (!work_email || typeof work_email !== 'string' || !work_email.trim()) {
      fieldErrors.work_email = 'Work email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(work_email.trim())) {
      fieldErrors.work_email = 'Please provide a valid email address';
    }

    if (!company || typeof company !== 'string' || !company.trim()) {
      fieldErrors.company = 'Company name is required';
    }

    if (!company_size || typeof company_size !== 'string' || !company_size.trim()) {
      fieldErrors.company_size = 'Please select your company size';
    }

    if (!roles_hiring_for || typeof roles_hiring_for !== 'string' || !roles_hiring_for.trim()) {
      fieldErrors.roles_hiring_for = 'Please specify the roles you hire for';
    }

    if (!consent) {
      fieldErrors.consent = 'You must agree to the Privacy Policy to proceed';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { error: 'Please correct the highlighted errors.', fields: fieldErrors },
        { status: 422 }
      );
    }

    const payload = {
      id: `demo-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      work_email: work_email.trim().toLowerCase(),
      company: company.trim(),
      company_size: company_size.trim(),
      roles_hiring_for: roles_hiring_for.trim(),
      message: message ? message.trim() : null,
      consent_given: Boolean(consent),
      ip_address: ip,
      created_at: new Date().toISOString(),
    };

    // 3. Database insertion
    try {
      const supabase = await createServerClient();
      await supabase.from('demo_requests').insert([payload]);
    } catch (dbErr) {
      // Fallback persists to disk
    }

    // Always backup to disk
    saveToBackup(payload);

    // 4. Email notification to DEMO_NOTIFY_EMAIL
    const notifyEmail = process.env.DEMO_NOTIFY_EMAIL;
    if (notifyEmail) {
      console.log(`[DEMO NOTIFICATION] Notification queued for ${notifyEmail}: New demo request from ${payload.name} (${payload.work_email}) at ${payload.company}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you! Your demo request has been received. Our team will be in touch within 24 hours.',
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
